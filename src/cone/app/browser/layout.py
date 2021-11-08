from cone.app import cfg
from cone.app import layout_config
from cone.app.browser.actions import get_action_context
from cone.app.browser.actions import LinkAction
from cone.app.browser.ajax import ajax_continue
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.utils import format_date
from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.app.browser.utils import node_icon
from cone.app.interfaces import IApplicationNode
from cone.app.interfaces import ILayout
from cone.app.interfaces import INavigationLeaf
from cone.app.interfaces import IWorkflowState
from cone.app.model import AppRoot
from cone.app.ugm import principal_data
from cone.app.ugm import ugm_backend
from cone.app.utils import node_path
from cone.tile import render_template
from cone.tile import render_tile
from cone.tile import Tile
from cone.tile import tile
from node.utils import LocationIterator
from node.utils import safe_decode
from odict import odict
from pyramid.i18n import get_localizer
from pyramid.i18n import TranslationStringFactory
import warnings


_ = TranslationStringFactory('cone.app')


@tile(name='logo', path='templates/logo.pt', permission='login')
class LogoTile(Tile):
    """Tile rendering the logo.
    """


@tile(name='livesearch', path='templates/livesearch.pt', permission='login')
class LivesearchTile(Tile):
    """Tile rendering the live search.
    """


@tile(name='footer', path='templates/footer.pt', permission='login')
class FooterTile(Tile):
    """Tile rendering the page footer.
    """


@tile(name='insufficient_privileges',
      path='templates/insufficient_privileges.pt',
      permission='login')
class InsufficientPrivilegesTile(Tile):
    """Tile rendering insufficient privileges message.
    """


class ProtectedContentTile(Tile):
    """A tile rendering the loginform instead default if user is not
    authenticated.

    Supposed to be used for 'content' tiles if page should render login form
    instead of throwing Unauthorized. Needs to be registered for permission
    'login'.

    The permission of the tile itself can be defined via ``content_permission``
    """
    content_permission = 'view'

    def __call__(self, model, request):
        if not request.authenticated_userid:
            return render_tile(model, request, 'loginform')
        if not request.has_permission(self.content_permission, model):
            return render_tile(model, request, 'insufficient_privileges')
        return Tile.__call__(self, model, request)


class LayoutConfigTile(Tile):

    @property
    def config(self):
        model = self.model
        props = model.properties
        if props.default_child:
            model = model[props.default_child]
        if hasattr(model, 'layout'):
            warnings.warn(
                '``AppNode.layout`` is deprecated, use ``layout_config``',
                DeprecationWarning
            )
            return model.layout
        layout = self.request.registry.queryAdapter(model, ILayout, default=None)
        if layout:
            warnings.warn(
                '``ILayout`` adapter is deprecated, use ``layout_config``',
                DeprecationWarning
            )
            return layout
        return layout_config.lookup(model=model, request=self.request)


@tile(name='layout', path='templates/layout.pt', permission='login')
class Layout(LayoutConfigTile):
    """Main layout tile.
    """

    @property
    def contenttile(self):
        return get_action_context(self.request).scope


# personal tools action registry
personal_tools = odict()


class personal_tools_action(object):
    """Decorator defining a personaltools dropdown item.
    """

    def __init__(self, name):
        self.name = name

    def __call__(self, factory):
        personal_tools[self.name] = factory()
        return factory


@personal_tools_action(name='settings')
class ViewSettingsAction(LinkAction):
    text = _('settings', default='Settings')
    icon = 'ion-ios7-gear'
    event = 'contextchanged:#layout'
    path = 'href'

    @property
    def settings(self):
        root = self.model.root
        return root and root.get('settings') or None

    @property
    def target(self):
        return make_url(self.request, node=self.settings)

    href = target

    @property
    def display(self):
        settings = self.settings
        if not settings:
            return False
        if not self.request.has_permission('view', settings):
            return False
        if not len(settings):
            return False
        return True


@personal_tools_action(name='logout')
class LogoutAction(LinkAction):
    text = _('logout', default='Logout')
    icon = 'ion-log-out'
    action = 'logout:NONE:NONE'
    path_action = ''
    path_event = ''

    @property
    def href(self):
        return make_url(self.request, resource='logout')

    @property
    def path(self):
        return '/'


@tile(name='personaltools',
      path='templates/personaltools.pt',
      permission='view',
      strict=False)
class PersonalTools(Tile):
    """Personal tool tile.
    """

    @property
    def user(self):
        userid = self.request.authenticated_userid
        data = principal_data(userid)
        display_name = data.get(ugm_backend.user_display_attr)
        return display_name if display_name else userid

    @property
    def items(self):
        return [_(self.model, self.request) for _ in personal_tools.values()]


@tile(name='mainmenu',
      path='templates/mainmenu.pt',
      permission='view',
      strict=False)
class MainMenu(LayoutConfigTile):
    """Main Menu tile.

    * set ``skip_mainmenu`` on ``model.properties`` to ``True`` if node should
      not be displayed in mainmenu.

    * set ``mainmenu_display_children`` on ``model.properties`` to ``True`` if
      child nodes should be rendered as dropdown menu.

    * set ``mainmenu_empty_title`` on ``model.root.properties`` to ``True``
      if you want to render empty links in mainmenu.

    * If ``default_child`` is set on ``model.root.properties``, it is marked
      selected if no other current path is found.

    * If ``default_content_tile`` is set on ``model.root.properties``, it is
      considered in target link creation.
    """

    @property
    def menuitems(self):
        ret = list()
        path = node_path(self.model)
        if path:
            curpath = path[0]
        else:
            curpath = ''
        # work with ``self.model.root.keys()``, ``values()`` propably not works
        # due to the use of factory node.
        root = self.model.root
        root_props = root.properties
        # check for default child id if no curpath
        if not curpath and root_props.default_child:
            curpath = root_props.default_child
        # check whether to render mainmenu item title
        empty_title = root_props.mainmenu_empty_title
        # XXX: icons
        for key in root.keys():
            child = root[key]
            if self.ignore_node(child):
                continue
            selected = curpath == key
            item = self.create_item(child, empty_title, selected)
            if child.properties.mainmenu_display_children:
                item['children'] = self.create_children(child, selected)
            else:
                item['children'] = None
            ret.append(item)
        return ret

    def create_children(self, node, selected):
        children = list()
        path = node_path(self.model)
        if path and len(path) > 1 and path[0] == node.name:
            curpath = path[1]
        else:
            curpath = ''
        for key in node.keys():
            child = node[key]
            if self.ignore_node(child):
                continue
            selected = curpath == key
            item = self.create_item(child, False, selected)
            children.append(item)
        return children

    def ignore_node(self, node):
        if not IApplicationNode.providedBy(node):
            return True
        if node.properties.skip_mainmenu:
            return True
        if not self.request.has_permission('view', node):
            return True
        return False

    def create_item(self, node, empty_title, selected):
        md = node.metadata
        item = dict()
        item['id'] = node.name
        if empty_title:
            item['title'] = ''
            item['description'] = md.title
        else:
            item['title'] = md.title
            item['description'] = md.description
        item['url'] = make_url(self.request, node=node)
        query = make_query(contenttile=node.properties.default_content_tile)
        item['target'] = make_url(self.request, node=node, query=query)
        item['selected'] = selected
        item['icon'] = node_icon(node)
        return item


@tile(name='pathbar',
      path='templates/pathbar.pt',
      permission='view',
      strict=False)
class PathBar(Tile):

    @property
    def items(self):
        return self.items_for(self.model)

    def item_url(self, node):
        return make_url(self.request, node=node)

    def item_target(self, node):
        query = make_query(contenttile=node.properties.default_content_tile)
        return make_url(self.request, node=node, query=query)

    def items_for(self, model, breakpoint=None):
        items = list()
        for node in LocationIterator(model):
            title = node.metadata.title
            title = safe_decode(title) if title else title
            items.append({
                'title': title,
                'url': self.item_url(node),
                'target': self.item_target(node),
                'selected': False,
                'id': node.name,
                'default_child': node.properties.default_child,
            })
            if node is breakpoint:
                break
        items.reverse()
        ret = list()
        count = len(items)
        for i in range(count):
            default_child = items[i]['default_child']
            if default_child \
                    and i < count - 1 \
                    and default_child == items[i + 1]['id']:
                continue
            ret.append(items[i])

        # XXX: this is crap!
        if not breakpoint:
            ret[0]['title'] = 'Home'

        ret[-1]['selected'] = True
        return ret


@tile(name='navtree',
      path='templates/navtree.pt',
      permission='view',
      strict=False)
class NavTree(Tile):
    """Navigation tree tile.
    """

    @property
    def title(self):
        navroot = self.navroot
        default = _('navigation', default='Navigation')
        if self.model.root is navroot:
            return default
        return navroot.metadata.get('title', default)

    @property
    def navroot(self):
        model = self.model
        root = model.root
        while model is not root:
            if model.properties.is_navroot:
                return model
            model = model.parent
        return root

    def navtreeitem(self, title, url, target, path, icon, css=''):
        item = dict()
        item['title'] = title
        item['url'] = url
        item['target'] = target
        item['selected'] = False
        item['path'] = path
        item['icon'] = icon
        item['css'] = css
        item['showchildren'] = False
        item['children'] = list()
        return item

    def fillchildren(self, model, path, tree):
        if INavigationLeaf.providedBy(model):
            return
        curpath = None
        if path:
            curpath = path[0]
        default_child = None
        if model.properties.default_child:
            if not curpath or curpath == model.properties.default_child:
                default_child = model[model.properties.default_child]
        if default_child and default_child.properties.hide_if_default:
            model = default_child
            default_child = None
            if path:
                path = path[1:]
                if path:
                    curpath = path[0]
        if default_child:
            if not curpath:
                curpath = model.properties.default_child
        for key in model:
            node = model[key]
            if not IApplicationNode.providedBy(node):
                continue
            if not self.request.has_permission('view', node):
                continue
            if not node.properties.in_navtree:
                continue
            title = node.metadata.title
            if title:
                title = safe_decode(title)
            url = make_url(self.request, node=node)
            query = make_query(contenttile=node.properties.default_content_tile)
            target = make_url(self.request, node=node, query=query)
            curnode = curpath == safe_decode(key)
            icon = node_icon(node)
            css = ''
            if IWorkflowState.providedBy(node):
                css = 'state-%s' % node.state
            child = self.navtreeitem(
                title, url, target, node_path(node), icon, css)
            child['showchildren'] = curnode
            if curnode:
                child['selected'] = True
                if default_child:
                    self.fillchildren(default_child, path[1:], child)
                else:
                    self.fillchildren(node, path[1:], child)
            else:
                selected_path = node_path(self.model)
                if default_child:
                    selected_path.append(default_child.name)
                selected = False
                # XXX: probably superfluous. keep as of cone.app 1.1
                # if selected_path == node_path(node):
                #     selected = True
                child['selected'] = selected
            tree['children'].append(child)

    def navtree(self):
        root = self.navtreeitem(None, None, None, '', None)
        model = self.navroot
        # XXX: default child
        path = node_path(self.model)[len(node_path(model)):]
        self.fillchildren(model, path, root)
        return root

    def rendertree(self, children, level=1):
        return render_template(
            'cone.app.browser:templates/navtree_recue.pt',
            model=self.model,
            request=self.request,
            context=self,
            children=children,
            level=level)


@tile(name='byline',
      path='templates/byline.pt',
      permission='view',
      strict=False)
class Byline(Tile):
    """Byline tile.
    """

    def format_date(self, dt):
        return format_date(dt)


@tile(name='content', interface=AppRoot, permission='login')
class RootContent(ProtectedContentTile):

    def render(self):
        default_child = self.model.properties.default_child
        if default_child:
            model = self.model[default_child]
            return render_tile(model, self.request, 'content')
        default_content_tile = self.model.properties.default_content_tile
        if default_content_tile:
            return render_tile(self.model, self.request, default_content_tile)
        return render_template(
            'cone.app.browser:templates/default_root.pt',
            model=self.model,
            request=self.request,
            context=self)


class LanguageTile(Tile):
    param_blacklist = [
        '_', '_LOCALE_', 'bdajax.action', 'bdajax.mode', 'bdajax.selector'
    ]

    def make_query(self, lang=None):
        params = dict()
        for k, v in self.request.params.items():
            if k in self.param_blacklist:
                continue
            params[k] = v
        params['lang'] = lang
        return make_query(**params)


language_names = {
    'en': _('lang_en', default='English'),
    'de': _('lang_de', default='German'),
    'fr': _('lang_fr', default='French'),
    'it': _('lang_it', default='Italian')
}


@tile(name='language',
      path='templates/language.pt',
      permission='login',
      strict=False)
class Language(LanguageTile):

    @property
    def show(self):
        return bool(cfg.available_languages)

    @property
    def languages(self):
        languages = list()
        localizer = get_localizer(self.request)
        for lang in cfg.available_languages:
            target = make_url(
                self.request,
                node=self.model,
                query=self.make_query(lang=lang)
            )
            title = localizer.translate(language_names.get(lang, lang.upper()))
            languages.append({
                'target': target,
                'icon': 'icon-lang-{}'.format(lang),
                'title': title
            })
        return languages


@tile(name='change_language', permission='login')
class ChangeLanguage(LanguageTile):

    @property
    def continuation(self):
        url = make_url(self.request, node=self.model, query=self.make_query())
        return [AjaxEvent(url, 'contextchanged', '#layout')]

    def render(self):
        lang = self.request.params['lang']
        response = self.request.response
        response.set_cookie('_LOCALE_', value=lang, max_age=31536000)
        ajax_continue(self.request, self.continuation)
        return u''

from cone.app.browser.actions import LinkAction
from cone.app.browser.actions import get_action_context
from cone.app.browser.utils import format_date
from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.app.browser.utils import node_icon
from cone.app.browser.utils import node_path
from cone.app.interfaces import IWorkflowState
from cone.app.model import AppRoot
from cone.app.utils import principal_data
from cone.app.utils import safe_decode
from cone.tile import Tile
from cone.tile import registerTile
from cone.tile import render_template
from cone.tile import render_tile
from cone.tile import tile
from node.utils import LocationIterator
from odict import odict
from pyramid.i18n import TranslationStringFactory
from pyramid.security import authenticated_userid
from pyramid.security import has_permission


_ = TranslationStringFactory('cone.app')


registerTile('unauthorized', 'templates/unauthorized.pt', permission='login')
registerTile('logo', 'templates/logo.pt', permission='login')
registerTile('livesearch', 'templates/livesearch.pt', permission='login')
registerTile('footer', 'templates/footer.pt', permission='login')


class ProtectedContentTile(Tile):
    """A tile rendering the loginform instead default if user is not
    authenticated.

    Normally used for 'content' tiles if page should render login form in place
    instead of throwing Unauthorized.
    """

    def __call__(self, model, request):
        if not authenticated_userid(request):
            return render_tile(model, request, 'loginform')
        return Tile.__call__(self, model, request)


@tile('layout', 'templates/layout.pt', permission='login')
class Layout(Tile):
    """Main layout tile.
    """

    @property
    def contenttile(self):
        return get_action_context(self.request).scope


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
        if not has_permission('view', settings, self.request):
            return False
        if not len(settings):
            return False
        return True


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


personal_tools = odict()
personal_tools['settings'] = ViewSettingsAction()
personal_tools['logout'] = LogoutAction()


@tile('personaltools', 'templates/personaltools.pt',
      permission='view', strict=False)
class PersonalTools(Tile):
    """Personal tool tile.
    """

    @property
    def user(self):
        userid = authenticated_userid(self.request)
        data = principal_data(userid)
        fullname = data.get('fullname', userid)
        return fullname or userid

    @property
    def items(self):
        return [_(self.model, self.request) for _ in personal_tools.values()]


@tile('mainmenu', 'templates/mainmenu.pt', permission='view', strict=False)
class MainMenu(Tile):
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
        # check wether to render mainmenu item title
        empty_title = root_props.mainmenu_empty_title
        # XXX: icons
        for key in root.keys():
            child = root[key]
            props = child.properties
            if self.ignore_node(child, props):
                continue
            selected = curpath == key
            item = self.create_item(child, props, empty_title, selected)
            if props.mainmenu_display_children:
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
            props = child.properties
            if self.ignore_node(child, props):
                continue
            selected = curpath == key
            item = self.create_item(child, props, False, selected)
            children.append(item)
        return children

    def ignore_node(self, node, props):
        if props.skip_mainmenu:
            return True
        if not has_permission('view', node, self.request):
            return True
        return False

    def create_item(self, node, props, empty_title, selected):
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
        query = make_query(contenttile=props.default_content_tile)
        item['target'] = make_url(self.request, node=node, query=query)
        item['selected'] = selected
        item['icon'] = node_icon(self.request, node)
        return item


@tile('pathbar', 'templates/pathbar.pt', permission='view', strict=False)
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


@tile('navtree', 'templates/navtree.pt', permission='view', strict=False)
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
        """XXX: consider cone.app.interfaces.INavigationLeaf
        """
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
            if not has_permission('view', node, self.request):
                continue
            if not node.properties.get('in_navtree'):
                continue
            title = node.metadata.title
            if title:
                title = safe_decode(title)
            url = make_url(self.request, node=node)
            query = make_query(contenttile=node.properties.default_content_tile)
            target = make_url(self.request, node=node, query=query)
            curnode = curpath == safe_decode(key) and True or False
            icon = node_icon(self.request, node)
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
                if selected_path == node_path(node):
                    selected = True
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


@tile('byline', 'templates/byline.pt', permission='view', strict=False)
class Byline(Tile):
    """Byline tile.
    """

    def format_date(self, dt):
        return format_date(dt)


@tile('content', interface=AppRoot, permission='login')
class RootContent(ProtectedContentTile):

    def render(self):
        if self.model.properties.default_child:
            model = self.model[self.model.properties.default_child]
            return render_tile(model, self.request, 'content')
        if self.model.properties.default_content_tile:
            return render_tile(self.model,
                               self.request,
                               self.model.properties.default_content_tile)
        return render_template(
            'cone.app.browser:templates/default_root.pt',
            model=self.model,
            request=self.request,
            context=self)

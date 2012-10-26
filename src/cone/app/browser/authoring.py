from zope.deprecation import deprecated
from plumber import (
    Behavior,
    default,
    override,
    plumb,
)
from webob.exc import HTTPFound
from pyramid.view import view_config
from pyramid.i18n import (
    TranslationStringFactory,
    get_localizer,
)
from yafowil.base import factory
from cone.tile import (
    Tile,
    tile,
    render_tile,
    render_template,
)
from ..model import (
    getNodeInfo,
    Properties,
    BaseNode,
    AdapterNode,
)
from ..utils import app_config
from . import render_main_template
from .actions import ActionContext
from .ajax import (
    AjaxAction,
    AjaxEvent,
    AjaxOverlay,
    ajax_continue,
    ajax_message,
    ajax_form_fiddle,
    render_ajax_form,
)
from .layout import ProtectedContentTile
from .utils import (
    make_url,
    make_query,
)

_ = TranslationStringFactory('cone.app')


def is_ajax(request):
    return bool(request.params.get('ajax'))


def render_form(model, request, tilename):
    """If form is invoked without hidden ajax field, the main template is
    rendered with tile ``tilename`` as content tile, otherwise
    ``render_ajax_form`` is called, which renders the tile wrapped by some
    javascript calls into a script tag. The ajax response will be rendered into
    the hidden iframe on client side, where ajax continuation is processed.

    XXX: move to cone.app.browser.form
    """
    if is_ajax(request):
        # XXX: ActionContext centralized
        action_context = ActionContext(model, request, tilename)
        request.environ['action_context'] = action_context
        return render_ajax_form(model, request, tilename)
    return render_main_template(model, request, contenttilename=tilename)


class CameFromNext(Behavior):
    """Behavior for form tiles considering 'came_from' parameter on request.
    """

    @plumb
    def prepare(_next, self):
        """Hook after prepare and set 'came_from' as proxy field to
        ``self.form``.
        """
        _next(self)
        self.form['came_from'] = factory(
            'proxy',
            value=self.request.params.get('came_from'),
        )

    @default
    def next(self, request):
        """Read 'came_from' parameter from request and compute next url.

        If came_from is 'parent', URL of node parent is computed.
        If came_from is set but not 'parent', it is considered as URL to use
        If no came_from is set, return URL of node
        """
        if request.get('came_from') == 'parent':
            url = make_url(request.request, node=self.model.parent)
        elif request.get('came_from'):
            url = request.get('came_from')
        else:
            url = make_url(request.request, node=self.model)
        if self.ajax_request:
            return [
                AjaxAction(url, 'content', 'inner', '#content'),
                AjaxEvent(url, 'contextchanged', '.contextsensitiv')
            ]
        return HTTPFound(location=url)


@view_config('add', permission='add')
def add(model, request):
    """Add view.
    """
    return render_form(model, request, 'add')


def default_addmodel_factory(parent, nodeinfo):
    """Default addmodel factory.

    The addmodel factory is responsible to create a model suitable for
    rendering addforms refering to node info.

    parent
        The parent in which the new item should be added
    nodeinfo
        The nodeinfo instance
    """
    if AdapterNode in nodeinfo.node.__bases__:
        addmodel = nodeinfo.node(BaseNode(), None, None)
    else:
        addmodel = nodeinfo.node()
    addmodel.__parent__ = parent
    return addmodel


@tile('add', permission='add')
class AddTile(ProtectedContentTile):
    """The add tile is responsible to render add forms depending on given
    factory name. Factory information is fetched from NodeInfo implementation
    registered by factory name.
    """
    form_tile_name = 'addform'

    def render(self):
        nodeinfo = self.info
        if not nodeinfo:
            return _('unknown_factory', 'Unknown factory')
        factory = nodeinfo.factory
        if not factory:
            factory = default_addmodel_factory
        addmodel = factory(self.model, nodeinfo)
        return render_tile(addmodel, self.request, self.form_tile_name)

    @property
    def info(self):
        factory = self.request.params.get('factory')
        allowed = self.model.nodeinfo.addables
        if not factory or not allowed or not factory in allowed:
            return None
        return getNodeInfo(factory)


class ContentForm(Behavior):
    """Form behavior rendering to content area.
    """

    show_heading = default(True)
    show_contextmenu = default(True)

    @default
    @property
    def form_heading(self):
        return _('content_form_heading', 'Content Form Heading')

    @default
    @property
    def rendered_contextmenu(self):
        return render_tile(self.model, self.request, 'contextmenu')

    @plumb
    def __call__(_next, self, model, request):
        ajax_form_fiddle(request, '#content', 'inner')
        form = _next(self, model, request)
        if form is None:
            form = u''
        self.rendered_form = form
        path = self.path
        if not path:
            path = 'cone.app.browser:templates/content_form.pt'
        return render_template(
            path, request=request, model=model, context=self)


class AddBehavior(CameFromNext, ContentForm):
    """form behavior hooking the hidden field 'factory' to self.form on
    __call__.
    """
    action_resource = override('add')

    @default
    @property
    def form_heading(self):
        localizer = get_localizer(self.request)
        title = localizer.translate(
            getNodeInfo(self.model.node_info_name).title)
        heading = localizer.translate(
            _('add_form_heading',
              default='Add: ${title}',
              mapping={'title': title}))
        return heading

    @default
    @property
    def rendered_contextmenu(self):
        return render_tile(self.model.parent, self.request, 'contextmenu')

    @plumb
    def prepare(_next, self):
        """Hook after prepare and set 'factory' as proxy field to ``self.form``
        """
        _next(self)
        self.form['factory'] = factory(
            'proxy',
            value=self.request.params.get('factory'),
        )


AddPart = AddBehavior  # B/C
deprecated('AddPart', """
``cone.app.browser.authoring.AddPart`` is deprecated as of cone.app 0.9.4 and
will be removed in cone.app 1.0. Use ``cone.app.browser.authoring.AddBehavior``
instead.""")


@view_config('edit', permission='edit')
def edit(model, request):
    """Edit view.
    """
    return render_form(model, request, 'edit')


@tile('edit', permission='edit')
class EditTile(ProtectedContentTile):
    """The edit tile is responsible to render edit forms on given model.
    """
    form_tile_name = 'editform'

    def render(self):
        return render_tile(self.model, self.request, self.form_tile_name)


class EditBehavior(CameFromNext, ContentForm):
    """form behavior hooking the hidden field 'came_from' to self.form on
    __call__.
    """
    action_resource = override('edit')

    @default
    @property
    def form_heading(self):
        info = getNodeInfo(self.model.node_info_name)
        if info is None:
            return _('edit', 'Edit')
        localizer = get_localizer(self.request)
        heading = localizer.translate(
            _('edit_form_heading',
              default='Edit: ${title}',
              mapping={'title': localizer.translate(_(info.title))}))
        return heading


EditPart = EditBehavior  # B/C
deprecated('EditPart', """
``cone.app.browser.authoring.EditPart`` is deprecated as of cone.app 0.9.4 and
will be removed in cone.app 1.0. Use
``cone.app.browser.authoring.EditBehavior`` instead.""")


@view_config('overlayform', permission='view')
def overlayform(model, request):
    """Overlay form.
    """
    return render_form(model, request, 'overlayform')


@tile('overlayform', permission='view')
class OverlayFormTile(ProtectedContentTile):
    """The overlayform tile is responsible to render forms on given model.
    """
    form_tile_name = 'overlayeditform'

    def render(self):
        return render_tile(self.model, self.request, self.form_tile_name)


class OverlayBehavior(Behavior):
    """Form behavior rendering to overlay.
    """
    action_resource = override('overlayform')
    overlay_selector = override('#ajax-form')
    overlay_content_selector = override('.overlay_content')

    @plumb
    def __call__(_next, self, model, request):
        form = _next(self, model, request)
        selector = '%s %s' % (self.overlay_selector,
                              self.overlay_content_selector)
        ajax_form_fiddle(request, selector, 'inner')
        return form

    @default
    def next(self, request):
        return [AjaxOverlay(selector=self.overlay_selector, close=True)]


OverlayPart = OverlayBehavior  # B/C
deprecated('OverlayPart', """
``cone.app.browser.authoring.OverlayPart`` is deprecated as of cone.app 0.9.4
and will be removed in cone.app 1.0. Use
``cone.app.browser.authoring.OverlayBehavior`` instead.""")


@tile('delete', permission="delete")
class DeleteAction(Tile):

    def continuation(self, url, content_tile):
        return [
            AjaxAction(url, content_tile, 'inner', '#content'),
            AjaxEvent(url, 'contextchanged', '.contextsensitiv'),
        ]

    def render(self):
        model = self.model
        title = model.metadata.get('title', model.name)
        if not model.properties.action_delete:
            ts = _('object_not_deletable',
                   default='Object "${title}" not deletable',
                   mapping={'title': title})
            localizer = get_localizer(self.request)
            message = localizer.translate(ts)
            ajax_message(self.request, message, 'error')
            return u''
        content_tile = model.properties.action_delete_tile
        if not content_tile:
            content_tile = 'content'
        parent = model.parent
        del parent[model.name]
        if hasattr(parent, '__call__'):
            parent()
        url = make_url(self.request, node=parent)
        ajax_continue(self.request, self.continuation(url, content_tile))
        ts = _('deleted_object',
               default='Deleted: ${title}',
               mapping={'title': title})
        localizer = get_localizer(self.request)
        message = localizer.translate(ts)
        ajax_message(self.request, message, 'info')
        return u''


@tile('add_dropdown', 'templates/add_dropdown.pt',
      permission='add', strict=False)
class AddDropdown(Tile):

    @property
    def items(self):
        ret = list()
        addables = self.model.nodeinfo.addables
        if not addables:
            return ret
        for addable in addables:
            info = getNodeInfo(addable)
            if not info:
                continue
            query = make_query(factory=addable)
            url = make_url(self.request, node=self.model,
                           resource='add', query=query)
            target = make_url(self.request, node=self.model, query=query)
            props = Properties()
            props.url = url
            props.target = target
            props.title = info.title
            icon = info.icon
            if not icon:
                icon = app_config().default_node_icon
            props.icon = make_url(self.request, resource=icon)
            ret.append(props)
        return ret

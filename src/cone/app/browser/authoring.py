from plumber import (
    plumber,
    Part,
    default,
    extend,
    plumb,
)
from webob.exc import HTTPFound
from pyramid.response import Response
from pyramid.view import view_config
from yafowil.base import factory
from cone.tile import (
    Tile,
    tile,
    render_tile,
)
from cone.app.model import (
    getNodeInfo,
    Properties,
    BaseNode,
    AdapterNode,
)
from cone.app.utils import app_config
from cone.app.browser import render_main_template
from cone.app.browser.ajax import (
    AjaxAction,
    AjaxEvent,
    ajax_continue,
    ajax_message,
    ajax_form_fiddle,
    render_ajax_form,
)
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import (
    make_url,
    make_query,
)


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
        return render_ajax_form(model, request, tilename)
    return render_main_template(model, request, contenttilename=tilename)


class CameFromNext(Part):
    """Part for form tiles considering 'came_from' parameter on request.
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
    
    # tile name of form tile
    form_tile_name = 'addform'
    
    def render(self):
        nodeinfo = self.info
        if not nodeinfo:
            return u'Unknown factory'
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


class AddPart(CameFromNext):
    """form part hooking the hidden field 'factory' to self.form on __call__
    """
    
    action_resource = extend('add')
    show_heading = default(True)
    
    @plumb
    def prepare(_next, self):
        """Hook after prepare and set 'factory' as proxy field to ``self.form``
        """
        _next(self)
        self.form['factory'] = factory(
            'proxy',
            value=self.request.params.get('factory'),
        )
    
    @plumb
    def __call__(_next, self, model, request):
        ajax_form_fiddle(request, '#content', 'inner')
        info = getNodeInfo(model.node_info_name)
        heading = u'<h1>Add %s</h1>' % info.title
        form = _next(self, model, request)
        if form is None:
            form = u''
        rendered = self.show_heading and heading + form or form
        return u'<div class="box">%s</div>' % rendered


@view_config('edit', permission='edit')
def edit(model, request):
    """Edit view.
    """
    return render_form(model, request, 'edit')


@tile('edit', permission='edit')
class EditTile(ProtectedContentTile):
    """The edit tile is responsible to render edit forms on given model.
    """
    
    # tile name of form tile
    form_tile_name = 'editform'
    
    def render(self):
        return render_tile(self.model, self.request, self.form_tile_name)


class EditPart(CameFromNext):
    """form part hooking the hidden field 'came_from' to self.form on __call__
    """
    
    action_resource = extend('edit')
    show_heading = default(True)
    
    @plumb
    def __call__(_next, self, model, request):
        ajax_form_fiddle(request, '#content', 'inner')
        info = getNodeInfo(model.node_info_name)
        if info is not None:
            heading = u'<h1>Edit %s</h1>' % info.title
        else:
            heading = u'<h1>Edit</h1>'                      #pragma NO COVERAGE
        form = _next(self, model, request)
        if form is None:
            form = u''
        rendered = self.show_heading and heading + form or form
        return u'<div class="box">%s</div>' % rendered


@tile('delete', permission="delete")
class DeleteAction(Tile):
    
    def render(self):
        model = self.model
        title = model.metadata.get('title', model.name)
        if not model.properties.deletable:
            message = 'Object "%s" not deletable' % title
            ajax_message(self.request, message, 'error')
            return u''
        parent = model.parent
        del parent[model.name]
        if hasattr(parent, '__call__'):
            parent()
        url = make_url(self.request, node=parent)
        action = AjaxAction(url, 'content', 'inner', '#content')
        event = AjaxEvent(url, 'contextchanged', '.contextsensitiv')
        continuation = [action, event]
        ajax_continue(self.request, continuation)
        message = 'Deleted: %s' % title
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


@tile('contextmenu', 'templates/contextmenu.pt', permission='view')
class ContextMenu(Tile):
    pass
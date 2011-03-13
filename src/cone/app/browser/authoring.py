from plumber import (
    plumber,
    Part,
    default,
    plumb,
)
from pyramid.response import Response
from pyramid.view import view_config
from yafowil.base import factory
from cone.tile import (
    Tile,
    tile,
    registerTile,
    render_tile,
)
from cone.app.model import (
    getNodeInfo,
    Properties,
    BaseNode,
    AdapterNode,
)
from cone.app.browser import render_main_template
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.ajax import render_ajax_form
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
    """
    if is_ajax(request):
        return render_ajax_form(model, request, tilename)
    return render_main_template(model, request, contenttilename=tilename)


@view_config('add', permission='add')
def add(model, request):
    """Add view.
    """
    return render_form(model, request, 'add')


@tile('add', permission='add')
class AddTile(ProtectedContentTile):
    """The add tile is responsible to render add forms depending on given
    factory name. Factory information is fetched from NodeInfo implementation
    registered by factory name.
    
    XXX:form wrapping markup like some title or description goes here.
    """
    
    # tile name under which the form tile is expected
    form_tile_name = 'addform'
    
    def render(self):
        nodeinfo = self.info
        if not nodeinfo:
            return u'Unknown factory'
        if AdapterNode in nodeinfo.node.__bases__:
            addmodel = nodeinfo.node(BaseNode(), None, None)
        else:
            addmodel = nodeinfo.node()
        addmodel.__parent__ = self.model
        return render_tile(addmodel, self.request, self.form_tile_name)
    
    @property
    def info(self):
        factory = self.request.params.get('factory')
        allowed = self.model.nodeinfo.addables
        if not factory or not allowed or not factory in allowed:
            return None
        return getNodeInfo(factory)


class AddPart(Part):
    """form hooking the hidden value 'factory' to self.form on __call__
    """
    
    @plumb
    def prepare(_next, self):
        """Hook after prepare and set factory as proxy field to ``self.form``
        """
        _next(self)
        self.prepare_ajax()
        self.form['factory'] = factory(
            'proxy',
            value=self.request.params.get('factory'),
        )
    
    @default
    def next(self, request):
        url = make_url(request.request, node=self.model.__parent__)
        if self.ajax_request:
            return AjaxAction(url, 'content', 'inner', '#content')
        return HTTPFound(location=url)


@view_config('edit', permission='edit')
def edit(model, request):
    """Edit view.
    """
    return render_form(model, request, 'edit')


@tile('edit', permission='edit')
class EditTile(ProtectedContentTile):
    """The edit tile is responsible to render edit forms on given model.
    
    XXX:form wrapping markup like some title or description goes here.
    """
    
    # tile name under which the form tile is expected
    form_tile_name = 'editform'
    
    def render(self):
        return render_tile(self.model, self.request, self.form_tile_name)


class EditPart(Part):
    """form hooking the hidden value 'from' to self.form on __call__
    """
    
    @plumb
    def prepare(_next, self):
        """Hook after prepare and set came_from as proxy field to ``self.form``
        """
        _next(self)
        self.prepare_ajax()
        self.form['came_from'] = factory(
            'proxy',
            value=self.request.params.get('came_from'),
        )
    
    @default
    def next(self, request):
        if request.get('came_from') == 'parent':
            url = make_url(request.request, node=self.model.__parent__)
        elif request.get('came_from'):
            url = request.get('came_from')
        else:
            url = make_url(request.request, node=self.model)
        if self.ajax_request:
            return AjaxAction(url, 'content', 'inner', '#content')
        return HTTPFound(location=url)


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
            props.icon = info.icon
            ret.append(props)
        return ret


registerTile('contextmenu',
             'cone.app:browser/templates/contextmenu.pt',
             permission='view')
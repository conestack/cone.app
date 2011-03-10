from pyramid.response import Response
from pyramid.view import view_config
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
from cone.app.browser.ajax import ajax_form
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import (
    make_url,
    make_query,
)


@view_config('add', permission='add')
def add(model, request):
    if request.params.get('ajax'):
        return ajax_form(model, request, 'add')
    return render_main_template(model, request, contenttilename='add')


@tile('add', permission='add')
class AddTile(ProtectedContentTile):
    
    def render(self):
        nodeinfo = self.info
        if not nodeinfo:
            return u'Unknown factory'
        if AdapterNode in nodeinfo.node.__bases__:
            addmodel = nodeinfo.node(BaseNode(), None, None)
        else:
            addmodel = nodeinfo.node()
        addmodel.__parent__ = self.model
        return render_tile(addmodel, self.request, 'addform')
    
    @property
    def info(self):
        factory = self.request.params.get('factory')
        allowed = self.model.nodeinfo.addables
        if not factory or not allowed or not factory in allowed:
            return None
        return getNodeInfo(factory)


@view_config('edit', permission='edit')
def edit(model, request):
    if request.params.get('ajax'):
        return ajax_form(model, request, 'edit')
    return render_main_template(model, request, contenttilename='edit')


@tile('edit', permission='edit')
class EditTile(ProtectedContentTile):
    
    def render(self):
        return render_tile(self.model, self.request, 'editform')


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
             permission='view',
             strict=True)
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
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import (
    make_url,
    make_query,
)

@view_config('add', permission='login')
def add(model, request):
    return render_main_template(model, request, contenttilename='add')

@tile('add', 'templates/add.pt', permission='login', strict=False)
class AddTile(ProtectedContentTile):
    
    @property
    def addform(self):
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

@view_config('edit', permission='login')
def edit(model, request):
    return render_main_template(model, request, contenttilename='edit')

registerTile('edit',
             'cone.app:browser/templates/edit.pt',
             class_=ProtectedContentTile,
             permission='login',
             strict=False)

@tile('add_dropdown', 'templates/add_dropdown.pt', strict=False)
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
             permission='login',
             strict=True)
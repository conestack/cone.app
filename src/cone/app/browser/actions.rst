Actions
=======

::

    >>> from cone.app.model import BaseNode
    >>> from cone.app.model import Properties
    >>> from cone.app.browser.actions import get_action_context
    >>> from cone.app.browser.actions import ActionContext
    >>> from cone.app.browser.actions import Toolbar
    >>> from cone.app.browser.actions import Action
    >>> from cone.app.browser.actions import TileAction
    >>> from cone.app.browser.actions import TemplateAction


ActionContext
-------------

::

    >>> model = BaseNode()
    >>> request = layer.new_request()

    >>> ac = ActionContext(model, request, 'tile')
    >>> ac
    <cone.app.browser.actions.ActionContext object at ...>

    >>> request.environ['action_context']
    <cone.app.browser.actions.ActionContext object at ...>

    >>> ac = get_action_context(request)
    >>> ac
    <cone.app.browser.actions.ActionContext object at ...>

    >>> ac.scope
    'tile'

    >>> request.params['bdajax.action'] = 'ajaxaction'
    >>> ac.scope
    'ajaxaction'

    >>> request.params['bdajax.action'] = 'layout'
    >>> ac.scope
    'content'

    >>> request.params['contenttile'] = 'contenttile'
    >>> ac.scope
    'contenttile'

    >>> class PropNode(BaseNode):
    ...     properties = None

    >>> node = PropNode()
    >>> node.properties = Properties()
    >>> node.properties.default_child = 'a'
    >>> node['a'] = PropNode()
    >>> node['a'].properties = Properties()
    >>> node['a'].properties.default_content_tile = 'default'

    >>> request = layer.new_request()
    >>> ac = ActionContext(node, request, 'content')
    >>> ac.scope
    'default'


Abstract actions
----------------

::

    >>> model = BaseNode()
    >>> request = layer.new_request()

    >>> Action()(model, request)
    Traceback (most recent call last):
      ...
    NotImplementedError: Abstract ``Action`` does not implement render.

    >>> TileAction()(model, request)
    u"Tile with name '' not found:..."

    >>> TemplateAction()(model, request)
    Traceback (most recent call last):
      ...
    ValueError: Relative path not supported:


Dummy actions
-------------

::

    >>> class DummyAction(Action):
    ...     def render(self):
    ...         return '<a href="">dummy action</a>'

    >>> DummyAction()(model, request)
    '<a href="">dummy action</a>'

    >>> class DummyTemplateAction(TemplateAction):
    ...     template = u'cone.app.testing:dummy_action.pt'

    >>> DummyTemplateAction()(model, request)
    u'<a href="">dummy template action</a>'

    >>> from cone.tile import registerTile
    >>> registerTile('dummy_action_tile', 'cone.app.testing:dummy_action.pt')
    >>> class DummyTileAction(TileAction):
    ...     tile = u'dummy_action_tile'

    >>> layer.login('viewer')

    >>> DummyTileAction()(model, request)
    u'<a href="">dummy template action</a>'

    >>> layer.logout()


Toolbar
-------

::

    >>> from cone.app.browser.actions import Toolbar
    >>> tb = Toolbar()
    >>> tb['a'] = DummyAction()
    >>> tb['b'] = DummyTemplateAction()
    >>> tb['c'] = DummyTileAction()

    >>> layer.login('viewer')

    >>> tb(model, request).split('\n')
    [u'<div><a href="">dummy action</a>', 
    u'<a href="">dummy template action</a>', 
    u'<a href="">dummy template action</a></div>']

    >>> tb.css = 'someclass'
    >>> tb(model, request).split('\n')
    [u'<div class="someclass"><a href="">dummy action</a>', 
    u'<a href="">dummy template action</a>', 
    u'<a href="">dummy template action</a></div>']

    >>> tb.display = False
    >>> tb(model, request)
    u''

    >>> layer.logout()


Abstract Dropdown
-----------------

::

    >>> from cone.app.browser.actions import DropdownAction
    >>> DropdownAction()(model, request)
    Traceback (most recent call last):
      ...
    NotImplementedError: Abstract ``DropdownAction`` does not implement  ``items``
    ...


LinkAction
----------

::

    >>> from cone.app.browser.actions import LinkAction
    >>> LinkAction()(model, request)
    u'...<a\n...ajax:bind="click"\n...ajax:target="http://example.com/"\n...></a>...'

    >>> action = LinkAction()
    >>> action.id = 'link_id'
    >>> action.href = 'http://example.com/foo'
    >>> action.css = 'link_action'
    >>> action.title = 'Foo'
    >>> action.action = 'actionname:#content:replace'
    >>> action.event = 'contextchanged:.contextsensitiv'
    >>> action.confirm = 'Do you want to perform?'
    >>> action.overlay = 'someaction'
    >>> action.path = '/foo'
    >>> action.path_target = 'target'
    >>> action.path_action = action.action
    >>> action.path_event = action.event
    >>> action.path_overlay = action.overlay
    >>> action.text = 'Foo'
    >>> action(model, request)
    u'...<a\n     
    id="link_id"\n     
    href="http://example.com/foo"\n     
    class="link_action"\n     
    title="Foo"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/"\n     
    ajax:event="contextchanged:.contextsensitiv"\n     
    ajax:action="actionname:#content:replace"\n     
    ajax:confirm="Do you want to perform?"\n     
    ajax:overlay="someaction"\n     
    ajax:path="/foo"\n     
    ajax:path-target="target"\n     
    ajax:path-action="actionname:#content:replace"\n     
    ajax:path-event="contextchanged:.contextsensitiv"\n    
    ajax:path-overlay="someaction"\n    >&nbsp;Foo</a>...'

    >>> action.enabled = False
    >>> action(model, request).find('class="link_action disabled"') > -1
    True

    >>> action.display = False
    >>> action(model, request)
    u''


ActionUp
--------

::

    >>> from cone.app.browser.actions import ActionUp
    >>> parent = BaseNode(name='root')
    >>> model = parent['model'] = BaseNode()

    >>> action = ActionUp()
    >>> action(model, request)
    u''

    >>> model.properties.action_up = True
    >>> action(model, request)
    u''

    >>> layer.login('viewer')
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-up"\n     
    href="http://example.com/root"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root?contenttile=listing"\n     
    ajax:event="contextchanged:#layout"\n     
    ajax:path="href"\n    
    ><span class="glyphicon glyphicon-arrow-up"></span\n    \n    
    >&nbsp;One level up</a>...'

    >>> model.properties.action_up_tile = 'otherparentcontent'
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-up"\n     
    href="http://example.com/root"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root?contenttile=otherparentcontent"\n     
    ajax:event="contextchanged:#layout"\n     
    ajax:path="href"\n    
    ><span class="glyphicon glyphicon-arrow-up"></span\n    \n    
    >&nbsp;One level up</a>...'

    >>> default = model['default'] = BaseNode()
    >>> default.properties.action_up = True
    >>> model.properties.default_child = 'default'
    >>> action(default, request)
    u'...<a\n     
    id="toolbaraction-up"\n     
    href="http://example.com/root"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root?contenttile=listing"\n     
    ajax:event="contextchanged:#layout"\n     
    ajax:path="href"\n    
    ><span class="glyphicon glyphicon-arrow-up"></span\n    \n    
    >&nbsp;One level up</a>...'

    >>> layer.logout()


ActionView
----------

::

    >>> from cone.app.browser.actions import ActionView
    >>> from cone.app.browser.actions import ActionContext

    >>> ac = ActionContext(model, request, 'content')

    >>> action = ActionView()
    >>> action(model, request)
    u''

    >>> model.properties.action_view = True
    >>> action(model, request)
    u''

    >>> layer.login('viewer')
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-view"\n     
    href="http://example.com/root/model"\n     
    class="selected"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="content:#content:inner"\n     
    ajax:path="href"\n    
    ><span class="glyphicon glyphicon-eye-open"></span\n    \n    
    >&nbsp;View</a>...'

    >>> model.properties.default_content_tile = 'otherdefault'
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-view"\n     
    href="http://example.com/root/model"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="view:#content:inner"\n    
    ajax:path="href"\n    
    ><span class="glyphicon glyphicon-eye-open"></span\n    \n    
    >&nbsp;View</a>...'

    >>> model.properties.default_content_tile = None
    >>> layer.logout()


ViewLink
--------

::

    >>> from cone.app.browser.actions import ViewLink
    >>> action = ViewLink()
    >>> action(model, request)
    u''

    >>> model.properties.action_view = True
    >>> action(model, request)
    u''

    >>> layer.login('viewer')
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-view"\n     
    href="http://example.com/root/model"\n     
    class="selected"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="content:#content:inner"\n    
    ajax:path="href"\n    
    >&nbsp;model</a>...'

    >>> layer.logout()


ActionList
----------

::

    >>> from cone.app.browser.actions import ActionList
    >>> action = ActionList()
    >>> action(model, request)
    u''

    >>> model.properties.action_list = True
    >>> action(model, request)
    u''

    >>> layer.login('viewer')
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-list"\n     
    href="http://example.com/root/model/listing"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="listing:#content:inner"\n    
    ajax:path="href"\n    
    ><span class="glyphicon glyphicon-th-list"></span\n    \n    
    >&nbsp;Listing</a>...'

    >>> layer.logout()


ActionSharing
-------------

::

    >>> from pyramid.security import has_permission
    >>> from cone.app.interfaces import IPrincipalACL
    >>> from cone.app.testing.mock import SharingNode
    >>> from cone.app.browser.actions import ActionSharing
    >>> action = ActionSharing()

    >>> IPrincipalACL.providedBy(model)
    False

    >>> action(model, request)
    u''

    >>> sharingmodel = parent['sharingmodel'] = SharingNode()
    >>> IPrincipalACL.providedBy(sharingmodel)
    True

    >>> action(sharingmodel, request)
    u''

    >>> layer.login('editor')
    >>> has_permission('manage_permissions', sharingmodel, request)
    <ACLDenied instance at ... with msg 
    "ACLDenied permission 'manage_permissions' via ACE ...

    >>> action(sharingmodel, request)
    u''

    >>> layer.login('manager')
    >>> has_permission('manage_permissions', sharingmodel, request)
    <ACLAllowed instance at ... with msg 
    "ACLAllowed permission 'manage_permissions' via ACE ...

    >>> action(sharingmodel, request)
    u'...<a\n     
    id="toolbaraction-share"\n     
    href="http://example.com/root/sharingmodel/sharing"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/sharingmodel"\n     
    ajax:action="sharing:#content:inner"\n    
    ajax:path="href"\n    
    ><span class="glyphicon glyphicon-share"></span\n    \n    
    >&nbsp;Sharing</a>...'

    >>> layer.logout()


ActionState
-----------

::

    >>> from cone.app.interfaces import IWorkflowState
    >>> from cone.app.testing.mock import WorkflowNode
    >>> from cone.app.browser.actions import ActionState
    >>> action = ActionState()

    >>> IWorkflowState.providedBy(model)
    False

    >>> action(model, request)
    u''

    >>> wfmodel = parent['wfmodel'] = WorkflowNode()
    >>> IWorkflowState.providedBy(wfmodel)
    True

    >>> action(wfmodel, request)
    u''

    >>> layer.login('editor')
    >>> has_permission('change_state', wfmodel, request)
    <ACLDenied instance at ... with msg 
    "ACLDenied permission 'change_state' via ACE ...

    >>> action(wfmodel, request)
    u''

    >>> layer.login('manager')
    >>> has_permission('change_state', wfmodel, request)
    <ACLAllowed instance at ... with msg 
    "ACLAllowed permission 'change_state' via ACE ...

    >>> action(wfmodel, request)
    u'...<li class="dropdown">...      
    <a href="#"\n             
    ajax:bind="click"\n             
    ajax:target="http://example.com/root/wfmodel?do_transition=initial_2_final"\n             
    ajax:action="wf_dropdown:NONE:NONE">initial_2_final</a>...'

    >>> layer.logout()


ActionAdd
---------

::

    >>> from cone.app.model import NodeInfo
    >>> from cone.app.model import register_node_info

    >>> info = NodeInfo()
    >>> info.title = 'Addable'
    >>> info.addables = ['addable']
    >>> register_node_info('addable', info)

    >>> from cone.app.browser.actions import ActionAdd
    >>> action = ActionAdd()

    >>> addmodel = BaseNode()

    >>> ac = ActionContext(addmodel, request, 'listing')

    >>> action(addmodel, request)
    u''

    >>> layer.login('viewer')
    >>> has_permission('add', addmodel, request)
    <ACLDenied instance at ... with msg 
    "ACLDenied permission 'add' via ACE ...

    >>> action(addmodel, request)
    u''

    >>> layer.login('editor')
    >>> has_permission('add', addmodel, request)
    <ACLAllowed instance at ... with msg 
    "ACLAllowed permission 'add' via ACE ...

    >>> action(addmodel, request)
    u''

    >>> addmodel.node_info_name = 'addable'
    >>> addmodel.nodeinfo
    <cone.app.model.NodeInfo object at ...>

    >>> action(addmodel, request)
    u'...<li class="dropdown">\n\n    
    <a href="#"\n       
    class="dropdown-toggle"\n       
    data-toggle="dropdown">\n      
    <span>Add</span>\n      
    <span class="caret"></span>\n    
    </a>\n\n    
    <ul class="dropdown-menu" role="addmenu">\n      
    <li>\n        
    <a href="http://example.com/add?factory=addable"\n           
    ajax:bind="click"\n           
    ajax:target="http://example.com/?factory=addable"\n           
    ajax:action="add:#content:inner"\n           
    ajax:path="href">\n          
    <span class="glyphicon glyphicon-asterisk"></span>\n          
    Addable\n        </a>\n      </li>\n    </ul>\n\n  </li>...'

    >>> layer.logout()


ActionEdit
----------

::

    >>> ac = ActionContext(model, request, 'listing')

    >>> from cone.app.browser.actions import ActionEdit
    >>> action = ActionEdit()
    >>> action(model, request)
    u''

    >>> model.properties.action_edit = True
    >>> action(model, request)
    u''

    >>> layer.login('viewer')
    >>> action(model, request)
    u''

    >>> layer.login('editor')
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-edit"\n     
    href="http://example.com/root/model/edit"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="edit:#content:inner"\n     
    ajax:path="href"\n    
    ><span class="glyphicon glyphicon-pencil"></span\n    \n    
    >&nbsp;Edit</a>...'

    >>> layer.logout()


ActionDelete
------------

::

    >>> ac = ActionContext(model, request, 'content')

    >>> from cone.app.browser.actions import ActionDelete
    >>> action = ActionDelete()
    >>> action(model, request)
    u''

    >>> model.properties.action_delete = True
    >>> action(model, request)
    u''

    >>> layer.login('editor')
    >>> action(model, request)
    u''

    >>> layer.login('manager')
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-delete"\n     
    href="#"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="delete:NONE:NONE"\n     
    ajax:confirm="Do you really want to delete this Item?"\n    
    ><span class="ion-trash-a"></span\n    \n    
    >&nbsp;Delete</a>...'

    >>> model.properties.default_content_tile = 'othertile'
    >>> action(model, request)
    u''

    >>> layer.logout()


ActionDeleteChildren
--------------------

::

    >>> from cone.app.browser.actions import ActionDeleteChildren
    >>> action = ActionDeleteChildren()
    >>> action(model, request)
    u''

    >>> model.properties.action_delete_children = True
    >>> action(model, request)
    u''

    >>> layer.login('editor')
    >>> action(model, request)
    u''

    >>> layer.login('manager')
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-delete-children"\n     
    href="#"\n     
    class="disabled"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="delete_children:NONE:NONE"\n     
    ajax:confirm="Do you really want to delete selected Items?"\n    
    ><span class="ion-trash-a"></span\n    \n    
    >&nbsp;Delete selected children</a>...'

    >>> request.cookies['cone.app.selected'] = ['foo']
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-delete-children"\n     
    href="#"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="delete_children:NONE:NONE"\n     
    ajax:confirm="Do you really want to delete selected Items?"\n    
    ><span class="ion-trash-a"></span\n    \n    
    >&nbsp;Delete selected children</a>...'

    >>> del request.cookies['cone.app.selected']
    >>> layer.logout()


ActionCut
---------

::

    >>> from cone.app.interfaces import ICopySupport
    >>> from cone.app.testing.mock import CopySupportNode
    >>> model = CopySupportNode('copysupport')

    >>> ac = ActionContext(model, request, 'listing')

    >>> ICopySupport.providedBy(model)
    True

    >>> model.supports_cut
    True

    >>> from cone.app.browser.actions import ActionCut
    >>> action = ActionCut()
    >>> action(model, request)
    u''

    >>> layer.login('editor')
    >>> action(model, request)
    u''

    >>> layer.login('manager')
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-cut"\n     
    href="#"\n     
    ajax:target="http://example.com/copysupport"\n    
    ><span class="ion-scissors"></span\n    \n    
    >&nbsp;Cut</a>...'

    >>> model.supports_cut = False
    >>> action(model, request)
    u''

    >>> layer.logout()


ActionCopy
----------

::

    >>> model.supports_copy
    True

    >>> from cone.app.browser.actions import ActionCopy
    >>> action = ActionCopy()
    >>> action(model, request)
    u''

    >>> layer.login('editor')
    >>> action(model, request)
    u''

    >>> layer.login('manager')
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-copy"\n     
    href="#"\n     
    ajax:target="http://example.com/copysupport"\n    
    ><span class="ion-ios7-copy-outline"></span\n    \n    
    >&nbsp;Copy</a>...'

    >>> model.supports_copy = False
    >>> action(model, request)
    u''

    >>> layer.logout()


ActionPaste
-----------

::

    >>> model.supports_paste
    True

    >>> from cone.app.browser.actions import ActionPaste
    >>> action = ActionPaste()
    >>> action(model, request)
    u''

    >>> layer.login('editor')
    >>> action(model, request)
    u''

    >>> layer.login('manager')
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-paste"\n     
    href="#"\n     
    class="disabled"\n     
    ajax:target="http://example.com/copysupport"\n    
    ><span class="ion-clipboard"></span\n    \n    
    >&nbsp;Paste</a>...'

    >>> request.cookies['cone.app.copysupport.cut'] = ['foo']
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-paste"\n     
    href="#"\n     
    ajax:target="http://example.com/copysupport"\n    
    ><span class="ion-clipboard"></span\n    \n    
    >&nbsp;Paste</a>...'

    >>> del request.cookies['cone.app.copysupport.cut']
    >>> request.cookies['cone.app.copysupport.copy'] = ['foo']
    >>> action(model, request)
    u'...<a\n     
    id="toolbaraction-paste"\n     
    href="#"\n     
    ajax:target="http://example.com/copysupport"\n    
    ><span class="ion-clipboard"></span\n    \n    
    >&nbsp;Paste</a>...'

    >>> del request.cookies['cone.app.copysupport.copy']

    >>> model.supports_paste = False
    >>> action(model, request)
    u''

    >>> layer.logout()

Actions
=======
::
    >>> from cone.app.model import BaseNode
    >>> from cone.app.browser.actions import (
    ...     Action,
    ...     TileAction,
    ...     TemplateAction,
    ... )
    
    >>> model = BaseNode()
    >>> request = layer.new_request()


Abstract actions
----------------
::
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
    [u'<div class="toolbar"><a href="">dummy action</a>', 
    u'<a href="">dummy template action</a>', 
    u'<a href="">dummy template action</a></div>']
    
    >>> tb.display = False
    >>> tb(model, request)
    u''
    
    >>> layer.logout()


LinkAction
----------
::
    >>> from cone.app.browser.actions import LinkAction
    >>> LinkAction()(model, request)
    u'...<a\n     ajax:bind="click"\n     
    ajax:target="http://example.com/">&nbsp;</a>...'
    
    >>> action = LinkAction()
    >>> action.id = 'link_id'
    >>> action.href = 'http://example.com/foo'
    >>> action.css = 'link_action'
    >>> action.title = 'Foo'
    >>> action.action = 'actionname:#content:replace'
    >>> action.event = 'contextchanged:.contextsensitiv'
    >>> action.confirm = 'Do you want to perform?'
    >>> action.overlay = 'someaction'
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
    ajax:overlay="someaction">Foo</a>...'

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
    href="http://example.com/root"\n     
    class="up16_16"\n     
    title="One level up"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root"\n     
    ajax:event="contextchanged:.contextsensitiv"\n     
    ajax:action="listing:#content:inner">&nbsp;</a>...'
    
    >>> model.properties.action_up_tile = 'otherparentcontent'
    >>> action(model, request)
    u'...<a\n     
    href="http://example.com/root"\n     
    class="up16_16"\n     
    title="One level up"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root"\n     
    ajax:event="contextchanged:.contextsensitiv"\n     
    ajax:action="otherparentcontent:#content:inner">&nbsp;</a>...'
    
    >>> default = model['default'] = BaseNode()
    >>> default.properties.action_up = True
    >>> model.properties.default_child = 'default'
    >>> action(default, request)
    u'...<a\n     
    href="http://example.com/root"\n     
    class="up16_16"\n     
    title="One level up"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root"\n     
    ajax:event="contextchanged:.contextsensitiv"\n     
    ajax:action="listing:#content:inner">&nbsp;</a>\n\n'
    
    >>> layer.logout()


ActionView
----------
::
    >>> from cone.app.browser.actions import ActionView
    >>> from cone.app.browser.actions import ActionContext
    
    >>> request.environ['action_context'] = \
    ...     ActionContext(model, request, 'content')
    
    >>> action = ActionView()
    >>> action(model, request)
    u''
    
    >>> model.properties.action_view = True
    >>> action(model, request)
    u''
    
    >>> layer.login('viewer')
    >>> action(model, request)
    u'...<a\n     
    href="http://example.com/root/model"\n     
    class="view16_16 selected"\n     
    title="View"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="content:#content:inner">&nbsp;</a>...'
    
    >>> model.properties.default_content_tile = 'otherdefault'
    >>> action(model, request)
    u'...<a\n     
    href="http://example.com/root/model"\n     
    class="view16_16"\n     
    title="View"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="view:#content:inner">&nbsp;</a>\n\n'
    
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
    href="http://example.com/root/model"\n     
    class="selected"\n     
    title="View"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="content:#content:inner">model</a>...'
    
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
    href="http://example.com/root/model/listing"\n     
    class="listing16_16"\n     
    title="Listing"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="listing:#content:inner">&nbsp;</a>...'
    
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
    
    >>> layer.login('admin')
    >>> has_permission('manage_permissions', sharingmodel, request)
    <ACLAllowed instance at ... with msg 
    "ACLAllowed permission 'manage_permissions' via ACE ...
    
    >>> action(sharingmodel, request)
    u'...<a\n     
    href="http://example.com/root/sharingmodel/sharing"\n     
    class="sharing16_16"\n     
    title="Sharing"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/sharingmodel"\n     
    ajax:action="sharing:#content:inner">&nbsp;</a>...'
    
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
    
    >>> layer.login('admin')
    >>> has_permission('change_state', wfmodel, request)
    <ACLAllowed instance at ... with msg 
    "ACLAllowed permission 'change_state' via ACE ...
    
    >>> action(wfmodel, request)
    u'\n  <div class="transitions_dropdown">\n    
      ...    
    <a href="http://example.com/root/wfmodel/dotransition?do_transition=initial_2_final"\n           
    ajax:bind="click"\n           
    ajax:target="http://example.com/root/wfmodel?do_transition=initial_2_final"\n           
    ajax:action="wf_dropdown:NONE:NONE">Finalize</a>\n      
      ...
    
    >>> layer.logout()


ActionAdd
---------
::
    >>> from cone.app.model import (
    ...     NodeInfo,
    ...     registerNodeInfo,
    ... )
    
    >>> info = NodeInfo()
    >>> info.title = 'Addable'
    >>> info.addables = ['addable']
    >>> registerNodeInfo('addable', info)
    
    >>> from cone.app.browser.actions import ActionAdd
    >>> action = ActionAdd()
    
    >>> addmodel = BaseNode()
    
    >>> request.environ['action_context'] = \
    ...     ActionContext(addmodel, request, 'listing')
    
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
    u'\n\n  <div class="dropdown">\n    
      ...        
    <a href="http://example.com/add?factory=addable"\n           
    ajax:bind="click"\n           
    ajax:target="http://example.com/?factory=addable"\n           
    ajax:action="add:#content:inner">Addable</a>\n      
      ...
    
    >>> layer.logout()


ActionEdit
----------
::
    >>> request.environ['action_context'] = \
    ...     ActionContext(model, request, 'listing')
    
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
    href="http://example.com/root/model/edit"\n     
    class="edit16_16"\n     
    title="Edit"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="edit:#content:inner">&nbsp;</a>...'
    
    >>> layer.logout()


ActionDelete
------------
::
    >>> request.environ['action_context'] = \
    ...     ActionContext(model, request, 'content')
    
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
    
    >>> layer.login('admin')
    >>> action(model, request)
    u'...<a\n     
    href="http://example.com/root/model/delete"\n     
    class="delete16_16"\n     
    title="Delete"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="delete:NONE:NONE"\n     
    ajax:confirm="Do you really want to delete this Item?">&nbsp;</a>...'
    
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
    
    >>> layer.login('admin')
    >>> action(model, request)
    u'...<a\n     
    href="http://example.com/root/model/delete_children"\n     
    class="delete16_16 disabled"\n     
    title="Delete selected children"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="delete_children:NONE:NONE"\n     
    ajax:confirm="Do you really want to delete selected Items?">&nbsp;</a>...'
    
    >>> request.cookies['cone.app.selected'] = ['foo']
    >>> action(model, request)
    u'...<a\n     
    href="http://example.com/root/model/delete_children"\n     
    class="delete16_16"\n     
    title="Delete selected children"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/root/model"\n     
    ajax:action="delete_children:NONE:NONE"\n     
    ajax:confirm="Do you really want to delete selected Items?">&nbsp;</a>...'
    
    >>> del request.cookies['cone.app.selected']
    >>> layer.logout()


ActionCut
---------
::
    >>> from cone.app.interfaces import ICopySupport
    >>> from cone.app.testing.mock import CopySupportNode
    >>> model = CopySupportNode('copysupport')
    
    >>> request.environ['action_context'] = \
    ...     ActionContext(model, request, 'listing')
    
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
    
    >>> layer.login('admin')
    >>> action(model, request)
    u'...<a\n     
    href="http://example.com/copysupport/cut"\n     
    class="cut16_16"\n     
    title="Cut"\n     
    ajax:target="http://example.com/copysupport">&nbsp;</a>...'
    
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
    
    >>> layer.login('admin')
    >>> action(model, request)
    u'...<a\n     
    href="http://example.com/copysupport/copy"\n     
    class="copy16_16"\n     
    title="Copy"\n     
    ajax:target="http://example.com/copysupport">&nbsp;</a>...'
    
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
    
    >>> layer.login('admin')
    >>> action(model, request)
    u'...<a\n     
    href="http://example.com/copysupport/paste"\n     
    class="paste16_16 disabled"\n     
    title="Paste"\n     
    ajax:target="http://example.com/copysupport">&nbsp;</a>...'
    
    >>> request.cookies['cone.app.copysupport.cut'] = ['foo']
    >>> action(model, request)
    u'...<a\n     
    href="http://example.com/copysupport/paste"\n     
    class="paste16_16"\n     
    title="Paste"\n     
    ajax:target="http://example.com/copysupport">&nbsp;</a>...'
    
    >>> del request.cookies['cone.app.copysupport.cut']
    >>> request.cookies['cone.app.copysupport.copy'] = ['foo']
    >>> action(model, request)
    u'...<a\n     
    href="http://example.com/copysupport/paste"\n     
    class="paste16_16"\n     
    title="Paste"\n     
    ajax:target="http://example.com/copysupport">&nbsp;</a>...'
    
    >>> del request.cookies['cone.app.copysupport.copy']
    
    >>> model.supports_paste = False
    >>> action(model, request)
    u''
    
    >>> layer.logout()

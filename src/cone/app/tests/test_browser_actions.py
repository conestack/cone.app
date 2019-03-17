from cone.app import testing
from cone.app.browser.actions import Action
from cone.app.browser.actions import ActionAdd
from cone.app.browser.actions import ActionContext
from cone.app.browser.actions import ActionCopy
from cone.app.browser.actions import ActionCut
from cone.app.browser.actions import ActionDelete
from cone.app.browser.actions import ActionDeleteChildren
from cone.app.browser.actions import ActionEdit
from cone.app.browser.actions import ActionList
from cone.app.browser.actions import ActionPaste
from cone.app.browser.actions import ActionSharing
from cone.app.browser.actions import ActionState
from cone.app.browser.actions import ActionUp
from cone.app.browser.actions import ActionView
from cone.app.browser.actions import DropdownAction
from cone.app.browser.actions import get_action_context
from cone.app.browser.actions import LinkAction
from cone.app.browser.actions import TemplateAction
from cone.app.browser.actions import TileAction
from cone.app.browser.actions import Toolbar
from cone.app.browser.actions import ViewLink
from cone.app.interfaces import ICopySupport
from cone.app.interfaces import IPrincipalACL
from cone.app.interfaces import IWorkflowState
from cone.app.model import BaseNode
from cone.app.model import NodeInfo
from cone.app.model import Properties
from cone.app.model import register_node_info
from cone.app.testing.mock import CopySupportNode
from cone.app.testing.mock import SharingNode
from cone.app.testing.mock import WorkflowNode
from cone.tile import register_tile
from cone.tile.tests import TileTestCase
from pyramid.security import has_permission


class TestBrowserActions(TileTestCase):
    layer = testing.security

    def test_ActionContext(self):
        model = BaseNode()
        request = self.layer.new_request()

        ac = ActionContext(model, request, 'tile')
        self.assertTrue(request.environ['action_context'] is ac)
        self.assertTrue(get_action_context(request) is ac)

        self.assertEqual(ac.scope, 'tile')

        request.params['bdajax.action'] = 'ajaxaction'
        self.assertEqual(ac.scope, 'ajaxaction')

        request.params['bdajax.action'] = 'layout'
        self.assertEqual(ac.scope, 'content')

        request.params['contenttile'] = 'contenttile'
        self.assertEqual(ac.scope, 'contenttile')

        class PropNode(BaseNode):
            properties = None

        node = PropNode()
        node.properties = Properties()
        node.properties.default_child = 'a'
        node['a'] = PropNode()
        node['a'].properties = Properties()
        node['a'].properties.default_content_tile = 'default'

        request = self.layer.new_request()
        ac = ActionContext(node, request, 'content')
        self.assertEqual(ac.scope, 'default')

    def test_Action_and_Toolbar(self):
        model = BaseNode()
        request = self.layer.new_request()

        err = self.expectError(
            NotImplementedError,
            Action(),
            model,
            request
        )
        self.assertEqual(
            str(err),
            'Abstract ``Action`` does not implement render.'
        )

        result = TileAction()(model, request)
        self.checkOutput("""
        Tile with name '' not found:...
        """, result)

        err = self.expectError(
            ValueError,
            TemplateAction(),
            model,
            request
        )
        self.assertEqual(str(err), 'Relative path not supported: ')

        class DummyAction(Action):
            def render(self):
                return '<a href="">dummy action</a>'

        self.assertEqual(
            DummyAction()(model, request),
            '<a href="">dummy action</a>'
        )

        class DummyTemplateAction(TemplateAction):
            template = u'cone.app.testing:dummy_action.pt'

        self.assertEqual(
            DummyTemplateAction()(model, request),
            u'<a href="">dummy template action</a>'
        )

        register_tile(
            name='dummy_action_tile',
            path='cone.app.testing:dummy_action.pt')

        class DummyTileAction(TileAction):
            tile = u'dummy_action_tile'

        with self.layer.authenticated('viewer'):
            self.assertEqual(
                DummyTileAction()(model, request),
                u'<a href="">dummy template action</a>'
            )

    def test_Toolbar(self):
        model = BaseNode()
        request = self.layer.new_request()

        class DummyAction(Action):
            def render(self):
                return '<a href="">dummy action</a>'

        tb = Toolbar()
        tb['a'] = DummyAction()

        with self.layer.authenticated('viewer'):
            self.assertEqual(
                tb(model, request),
                u'<div><a href="">dummy action</a></div>'
            )

            tb.css = 'someclass'
            self.assertEqual(
                tb(model, request),
                u'<div class="someclass"><a href="">dummy action</a></div>'
            )

            tb.display = False
            self.assertEqual(tb(model, request), u'')

    def test_abstract_dropdown(self):
        model = BaseNode()
        request = self.layer.new_request()

        err = self.expectError(
            NotImplementedError,
            DropdownAction(),
            model,
            request
        )
        self.assertEqual(
            err.message,
            'Abstract ``DropdownAction`` does not implement  ``items``'
        )

    def test_LinkAction(self):
        model = BaseNode()
        request = self.layer.new_request()

        rendered = LinkAction()(model, request)
        self.checkOutput("""
        ...<a\n...ajax:bind="click"\n...ajax:target="http://example.com/"\n...></a>...
        """, rendered)

        action = LinkAction()
        action.id = 'link_id'
        action.href = 'http://example.com/foo'
        action.css = 'link_action'
        action.title = 'Foo'
        action.action = 'actionname:#content:replace'
        action.event = 'contextchanged:.contextsensitiv'
        action.confirm = 'Do you want to perform?'
        action.overlay = 'someaction'
        action.path = '/foo'
        action.path_target = 'target'
        action.path_action = action.action
        action.path_event = action.event
        action.path_overlay = action.overlay
        action.text = 'Foo'
        rendered = action(model, request)
        self.checkOutput("""
        ...<a
            id="link_id"
            href="http://example.com/foo"
            class="link_action"
            title="Foo"
            ajax:bind="click"
            ajax:target="http://example.com/"
            ajax:event="contextchanged:.contextsensitiv"
            ajax:action="actionname:#content:replace"
            ajax:confirm="Do you want to perform?"
            ajax:overlay="someaction"
            ajax:path="/foo"
            ajax:path-target="target"
            ajax:path-action="actionname:#content:replace"
            ajax:path-event="contextchanged:.contextsensitiv"
            ajax:path-overlay="someaction"
        >&nbsp;Foo</a>...
        """, rendered)

        action.enabled = False
        self.assertTrue(
            action(model, request).find('class="link_action disabled"') > -1
        )

        action.display = False
        self.assertEqual(action(model, request), u'')

    def test_ActionUp(self):
        parent = BaseNode(name='root')
        model = parent['model'] = BaseNode()
        request = self.layer.new_request()

        action = ActionUp()
        self.assertEqual(action(model, request), u'')

        model.properties.action_up = True
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('viewer'):
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
                id="toolbaraction-up"
                href="http://example.com/root"
                ajax:bind="click"
                ajax:target="http://example.com/root?contenttile=listing"
                ajax:event="contextchanged:#layout"
                ajax:path="href"
                ><span class="glyphicon glyphicon-arrow-up"></span
            >&nbsp;One level up</a>...
            """, rendered)

            model.properties.action_up_tile = 'otherparentcontent'
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
                id="toolbaraction-up"
                href="http://example.com/root"
                ajax:bind="click"
                ajax:target="http://example.com/root?contenttile=otherparentcontent"
                ajax:event="contextchanged:#layout"
                ajax:path="href"
                ><span class="glyphicon glyphicon-arrow-up"></span
            >&nbsp;One level up</a>...
            """, rendered)

            default = model['default'] = BaseNode()
            default.properties.action_up = True
            model.properties.default_child = 'default'
            rendered = action(default, request)
            self.checkOutput("""
            ...<a
                id="toolbaraction-up"
                href="http://example.com/root"
                ajax:bind="click"
                ajax:target="http://example.com/root?contenttile=listing"
                ajax:event="contextchanged:#layout"
                ajax:path="href"
                ><span class="glyphicon glyphicon-arrow-up"></span
            >&nbsp;One level up</a>...
            """, rendered)

    def test_ActionView(self):
        parent = BaseNode(name='root')
        model = parent['model'] = BaseNode()
        request = self.layer.new_request()

        ActionContext(model, request, 'content')

        action = ActionView()
        self.assertEqual(action(model, request), u'')

        model.properties.action_view = True
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('viewer'):
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
                id="toolbaraction-view"
                href="http://example.com/root/model"
                class="selected"
                ajax:bind="click"
                ajax:target="http://example.com/root/model"
                ajax:action="content:#content:inner"
                ajax:path="href"
                ><span class="glyphicon glyphicon-eye-open"></span
            >&nbsp;View</a>...
            """, rendered)

            model.properties.default_content_tile = 'otherdefault'
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
                id="toolbaraction-view"
                href="http://example.com/root/model"
                ajax:bind="click"
                ajax:target="http://example.com/root/model"
                ajax:action="view:#content:inner"
                ajax:path="href"
                ><span class="glyphicon glyphicon-eye-open"></span
            >&nbsp;View</a>...
            """, rendered)

            model.properties.default_content_tile = None

    def test_ViewLink(self):
        parent = BaseNode(name='root')
        model = parent['model'] = BaseNode()
        request = self.layer.new_request()

        ActionContext(model, request, 'content')

        action = ViewLink()
        self.assertEqual(action(model, request), u'')

        model.properties.action_view = True
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('viewer'):
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
                id="toolbaraction-view"
                href="http://example.com/root/model"
                class="selected"
                ajax:bind="click"
                ajax:target="http://example.com/root/model"
                ajax:action="content:#content:inner"
                ajax:path="href"
            >&nbsp;model</a>...
            """, rendered)

    def test_ActionList(self):
        parent = BaseNode(name='root')
        model = parent['model'] = BaseNode()
        request = self.layer.new_request()

        action = ActionList()
        self.assertEqual(action(model, request), u'')

        model.properties.action_list = True
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('viewer'):
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
                id="toolbaraction-list"
                href="http://example.com/root/model/listing"
                ajax:bind="click"
                ajax:target="http://example.com/root/model"
                ajax:action="listing:#content:inner"
                ajax:path="href"
                ><span class="glyphicon glyphicon-th-list"></span
            >&nbsp;Listing</a>...
            """, rendered)

"""
ActionSharing
-------------

::

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

    >>> info = NodeInfo()
    >>> info.title = 'Addable'
    >>> info.addables = ['addable']
    >>> register_node_info('addable', info)

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

    >>> model = CopySupportNode('copysupport')

    >>> ac = ActionContext(model, request, 'listing')

    >>> ICopySupport.providedBy(model)
    True

    >>> model.supports_cut
    True

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

"""
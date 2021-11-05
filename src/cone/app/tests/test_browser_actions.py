from cone.app import testing
from cone.app.browser.actions import _ActionMove
from cone.app.browser.actions import Action
from cone.app.browser.actions import ActionAdd
from cone.app.browser.actions import ActionContext
from cone.app.browser.actions import ActionCopy
from cone.app.browser.actions import ActionCut
from cone.app.browser.actions import ActionDelete
from cone.app.browser.actions import ActionDeleteChildren
from cone.app.browser.actions import ActionEdit
from cone.app.browser.actions import ActionList
from cone.app.browser.actions import ActionMoveDown
from cone.app.browser.actions import ActionMoveUp
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
from cone.tile import tile
from cone.tile import Tile
from cone.tile.tests import TileTestCase
from node.behaviors import Order
from plumber import plumbing
from pyramid.security import ACLAllowed
from pyramid.security import ACLDenied


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

        with self.layer.hook_tile_reg():
            @tile(name='dummy_action_tile',
                  path='cone.app.testing:dummy_action.pt')
            class DummyActionTile(Tile):
                pass

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
        self.checkOutput("""
        ...Abstract ``DropdownAction`` does not implement  ``items``...
        """, str(err))

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

    def test_ActionSharing(self):
        parent = BaseNode(name='root')
        model = parent['model'] = BaseNode()
        request = self.layer.new_request()

        action = ActionSharing()
        self.assertFalse(IPrincipalACL.providedBy(model))
        self.assertEqual(action(model, request), u'')

        sharingmodel = parent['sharingmodel'] = SharingNode()
        self.assertTrue(IPrincipalACL.providedBy(sharingmodel))
        self.assertEqual(action(sharingmodel, request), u'')

        with self.layer.authenticated('editor'):
            rule = request.has_permission('manage_permissions', sharingmodel)
            self.assertTrue(isinstance(rule, ACLDenied))
            self.assertEqual(action(sharingmodel, request), u'')

        with self.layer.authenticated('manager'):
            rule = request.has_permission('manage_permissions', sharingmodel)
            self.assertTrue(isinstance(rule, ACLAllowed))

            rendered = action(sharingmodel, request)
            self.checkOutput("""
            ...<a
            id="toolbaraction-share"
            href="http://example.com/root/sharingmodel/sharing"
            ajax:bind="click"
            ajax:target="http://example.com/root/sharingmodel"
            ajax:action="sharing:#content:inner"
            ajax:path="href"
            ><span class="glyphicon glyphicon-share"></span
            >&nbsp;Sharing</a>...
            """, rendered)

    def test_ActionState(self):
        parent = BaseNode(name='root')
        model = parent['model'] = BaseNode()
        request = self.layer.new_request()

        action = ActionState()
        self.assertFalse(IWorkflowState.providedBy(model))
        self.assertEqual(action(model, request), u'')

        wfmodel = parent['wfmodel'] = WorkflowNode()
        self.assertTrue(IWorkflowState.providedBy(wfmodel))
        self.assertEqual(action(wfmodel, request), u'')

        with self.layer.authenticated('editor'):
            rule = request.has_permission('change_state', wfmodel)
            self.assertTrue(isinstance(rule, ACLDenied))
            self.assertEqual(action(wfmodel, request), u'')

        with self.layer.authenticated('manager'):
            rule = request.has_permission('change_state', wfmodel)
            self.assertTrue(isinstance(rule, ACLAllowed))

            rendered = action(wfmodel, request)
            self.checkOutput("""
            ...<li class="dropdown">...
            <a href="#"
            ajax:bind="click"
            ajax:target="http://example.com/root/wfmodel?do_transition=initial_2_final"
            ajax:action="wf_dropdown:NONE:NONE">initial_2_final</a>...
            """, rendered)

    @testing.reset_node_info_registry
    def test_ActionAdd(self):
        info = NodeInfo()
        info.title = 'Addable'
        info.addables = ['addable']
        register_node_info('addable', info)

        action = ActionAdd()
        addmodel = BaseNode()
        request = self.layer.new_request()
        ActionContext(addmodel, request, 'listing')

        self.assertEqual(action(addmodel, request), u'')

        with self.layer.authenticated('viewer'):
            rule = request.has_permission('add', addmodel)
            self.assertTrue(isinstance(rule, ACLDenied))
            self.assertEqual(action(addmodel, request), u'')

        with self.layer.authenticated('editor'):
            rule = request.has_permission('add', addmodel)
            self.assertTrue(isinstance(rule, ACLAllowed))
            self.assertEqual(action(addmodel, request), u'')

            addmodel.node_info_name = 'addable'
            self.assertTrue(addmodel.nodeinfo is info)

            rendered = action(addmodel, request)
            self.checkOutput("""
            ...<li class="dropdown">
            <a href="#"
            class="dropdown-toggle"
            data-toggle="dropdown">
            <span>Add</span>
            <span class="caret"></span>
            </a>
            <ul class="dropdown-menu" role="addmenu">
            <li>
            <a href="http://example.com/add?factory=addable"
            ajax:bind="click"
            ajax:target="http://example.com/?factory=addable"
            ajax:action="add:#content:inner"
            ajax:path="href">
            <span class="glyphicon glyphicon-asterisk"></span>
            Addable
            </a>
            </li>
            </ul>
            </li>...
            """, rendered)

    def test_ActionEdit(self):
        parent = BaseNode(name='root')
        model = parent['model'] = BaseNode()
        request = self.layer.new_request()

        ActionContext(model, request, 'listing')

        action = ActionEdit()
        self.assertEqual(action(model, request), u'')

        model.properties.action_edit = True
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('viewer'):
            self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('editor'):
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
            id="toolbaraction-edit"
            href="http://example.com/root/model/edit"
            ajax:bind="click"
            ajax:target="http://example.com/root/model"
            ajax:action="edit:#content:inner"
            ajax:path="href"
            ><span class="glyphicon glyphicon-pencil"></span
            >&nbsp;Edit</a>...
            """, rendered)

    def test_ActionDelete(self):
        parent = BaseNode(name='root')
        model = parent['model'] = BaseNode()
        request = self.layer.new_request()

        ActionContext(model, request, 'content')

        action = ActionDelete()
        self.assertEqual(action(model, request), u'')

        model.properties.action_delete = True
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('editor'):
            self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('manager'):
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
            id="toolbaraction-delete"
            href="#"
            ajax:bind="click"
            ajax:target="http://example.com/root/model"
            ajax:action="delete:NONE:NONE"
            ajax:confirm="Do you really want to delete this Item?"
            ><span class="ion-trash-a"></span
            >&nbsp;Delete</a>...
            """, rendered)

            model.properties.default_content_tile = 'othertile'
            self.assertEqual(action(model, request), u'')

    def test_ActionDeleteChildren(self):
        parent = BaseNode(name='root')
        model = parent['model'] = BaseNode()
        request = self.layer.new_request()

        action = ActionDeleteChildren()
        self.assertEqual(action(model, request), u'')

        model.properties.action_delete_children = True
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('editor'):
            self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('manager'):
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
            id="toolbaraction-delete-children"
            href="#"
            class="disabled"
            ajax:bind="click"
            ajax:target="http://example.com/root/model"
            ajax:action="delete_children:NONE:NONE"
            ajax:confirm="Do you really want to delete selected Items?"
            ><span class="ion-trash-a"></span
            >&nbsp;Delete selected children</a>...
            """, rendered)

            request.cookies['cone.app.selected'] = ['foo']
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
            id="toolbaraction-delete-children"
            href="#"
            ajax:bind="click"
            ajax:target="http://example.com/root/model"
            ajax:action="delete_children:NONE:NONE"
            ajax:confirm="Do you really want to delete selected Items?"
            ><span class="ion-trash-a"></span
            >&nbsp;Delete selected children</a>...
            """, rendered)

            del request.cookies['cone.app.selected']

    def test_ActionCut(self):
        model = CopySupportNode('copysupport')
        request = self.layer.new_request()

        ActionContext(model, request, 'listing')
        self.assertTrue(ICopySupport.providedBy(model))
        self.assertTrue(model.supports_cut)

        action = ActionCut()
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('editor'):
            self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('manager'):
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
            id="toolbaraction-cut"
            href="#"
            ajax:target="http://example.com/copysupport"
            ><span class="ion-scissors"></span
            >&nbsp;Cut</a>...
            """, rendered)

            model.supports_cut = False
            self.assertEqual(action(model, request), u'')

    def test_ActionCopy(self):
        model = CopySupportNode('copysupport')
        request = self.layer.new_request()

        ActionContext(model, request, 'listing')
        self.assertTrue(model.supports_copy)

        action = ActionCopy()
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('editor'):
            self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('manager'):
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
            id="toolbaraction-copy"
            href="#"
            ajax:target="http://example.com/copysupport"
            ><span class="ion-ios7-copy-outline"></span
            >&nbsp;Copy</a>...
            """, rendered)

            model.supports_copy = False
            self.assertEqual(action(model, request), u'')

    def test_ActionPaste(self):
        model = CopySupportNode('copysupport')
        request = self.layer.new_request()

        ActionContext(model, request, 'listing')
        self.assertTrue(model.supports_paste)

        action = ActionPaste()
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('editor'):
            self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('manager'):
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
            id="toolbaraction-paste"
            href="#"
            class="disabled"
            ajax:target="http://example.com/copysupport"
            ><span class="ion-clipboard"></span
            >&nbsp;Paste</a>...
            """, rendered)

            request.cookies['cone.app.copysupport.cut'] = ['foo']
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
            id="toolbaraction-paste"
            href="#"
            ajax:target="http://example.com/copysupport"
            ><span class="ion-clipboard"></span
            >&nbsp;Paste</a>...
            """, rendered)

            del request.cookies['cone.app.copysupport.cut']
            request.cookies['cone.app.copysupport.copy'] = ['foo']
            rendered = action(model, request)
            self.checkOutput("""
            ...<a
            id="toolbaraction-paste"
            href="#"
            ajax:target="http://example.com/copysupport"
            ><span class="ion-clipboard"></span
            >&nbsp;Paste</a>...
            """, rendered)

            del request.cookies['cone.app.copysupport.copy']

            model.supports_paste = False
            self.assertEqual(action(model, request), u'')

    def test__ActionMove(self):
        node = BaseNode()
        model = node['child'] = BaseNode()
        request = self.layer.new_request()

        action = _ActionMove()
        action.model = model
        action.request = request

        request.params['sort'] = 'asc'
        self.assertFalse(action.display)

        del request.params['sort']
        node.properties.action_move = True
        self.assertFalse(action.display)

        @plumbing(Order)
        class OrderableNode(BaseNode):
            pass

        node = OrderableNode()
        node.properties.action_move = True
        model = node['child'] = BaseNode()
        action.model = model
        with self.layer.authenticated('manager'):
            self.assertTrue(action.display)

        self.assertEqual(action.target, 'http://example.com/child')
        request.params['size'] = '10'
        request.params['b_page'] = '1'
        self.assertEqual(
            action.target,
            'http://example.com/child?b_page=1&size=10'
        )

    def test_ActionMoveUp(self):
        action = ActionMoveUp()
        self.assertEqual(action.id, 'toolbaraction-move-up')
        self.assertEqual(action.icon, 'glyphicon glyphicon-chevron-up')
        self.assertEqual(action.action, 'move_up:NONE:NONE')
        self.assertEqual(action.text, 'move_up')

        node = BaseNode()
        model = node['child'] = BaseNode()
        request = self.layer.new_request()

        action.model = model
        action.request = request
        self.assertFalse(action.display)

        @plumbing(Order)
        class OrderableNode(BaseNode):
            pass

        node = OrderableNode()
        node.properties.action_move = True
        node['a'] = BaseNode()
        node['b'] = BaseNode()

        action.model = node['a']
        with self.layer.authenticated('manager'):
            self.assertFalse(action.display)

        action.model = node['b']
        with self.layer.authenticated('manager'):
            self.assertTrue(action.display)

    def test_ActionMoveDown(self):
        action = ActionMoveDown()
        self.assertEqual(action.id, 'toolbaraction-move-down')
        self.assertEqual(action.icon, 'glyphicon glyphicon-chevron-down')
        self.assertEqual(action.action, 'move_down:NONE:NONE')
        self.assertEqual(action.text, 'move_down')

        node = BaseNode()
        model = node['child'] = BaseNode()
        request = self.layer.new_request()

        action.model = model
        action.request = request
        self.assertFalse(action.display)

        @plumbing(Order)
        class OrderableNode(BaseNode):
            pass

        node = OrderableNode()
        node.properties.action_move = True
        node['a'] = BaseNode()
        node['b'] = BaseNode()

        action.model = node['a']
        with self.layer.authenticated('manager'):
            self.assertTrue(action.display)

        action.model = node['b']
        with self.layer.authenticated('manager'):
            self.assertFalse(action.display)

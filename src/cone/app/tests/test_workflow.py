from cone.app import testing
from cone.app.interfaces import IWorkflowState
from cone.app.testing.mock import InexistentWorkflowNode
from cone.app.testing.mock import InterfaceWorkflowNode
from cone.app.testing.mock import StateACLWorkflowNode
from cone.app.testing.mock import WorkflowNode
from cone.app.workflow import initialize_workflow
from cone.app.workflow import lookup_state_data
from cone.app.workflow import lookup_workflow
from node.tests import NodeTestCase
from pyramid.security import ALL_PERMISSIONS
from repoze.workflow.workflow import Workflow


class TestWorkflow(NodeTestCase):
    layer = testing.security

    def test_lookup_workflow(self):
        wf = lookup_workflow(InexistentWorkflowNode)
        self.assertEqual(wf, None)

        wf = lookup_workflow(WorkflowNode)
        self.assertTrue(isinstance(wf, Workflow))

        wf = lookup_workflow(WorkflowNode())
        self.assertTrue(isinstance(wf, Workflow))

        wf = lookup_workflow(InterfaceWorkflowNode())
        self.assertTrue(isinstance(wf, Workflow))

        wf = lookup_workflow(InterfaceWorkflowNode)
        self.assertTrue(isinstance(wf, Workflow))

    def test_lookup_state_data(self):
        state_data = lookup_state_data(InexistentWorkflowNode)
        self.assertEqual(state_data, {})

        state_data = lookup_state_data(WorkflowNode())
        self.assertEqual(state_data, {
            'callback': None,
            'description': u'Foo',
            'title': u'Initial State'
        })

    def test_workflow(self):
        node = WorkflowNode()
        self.assertTrue(IWorkflowState.providedBy(node))

        # Workflow name is set on node properties for lookup
        self.assertEqual(node.workflow_name, u'dummy')

        # Initial workflow state gets set at node creation time if not set yet
        self.assertEqual(node.state, u'initial')

        node.state = u'final'
        self.assertEqual(node.attrs['state'], u'final')
        self.assertTrue(node.attrs['state'] is node.state)

        initialize_workflow(node)
        self.assertEqual(node.state, u'final')

    def test_copy(self):
        root = WorkflowNode()
        child = root['child'] = WorkflowNode()
        self.assertTrue(root.state == child.state == u'initial')

        root.state = child.state = u'final'
        self.assertTrue(root.state == child.state == u'final')

        # Workflow state gets set to initial state on copied nodes
        copied = root.copy()
        self.assertTrue(copied.state == copied['child'].state == u'initial')

    def test_acl(self):
        # Default workflow state ACL
        node = WorkflowNode()
        self.assertEqual(node.__acl__, [
            ('Allow', 'system.Authenticated', ['view']),
            ('Allow', 'role:viewer', ['view']),
            ('Allow', 'role:editor', ['view', 'add', 'edit']),
            ('Allow', 'role:owner', [
                'view', 'add', 'edit', 'delete',
                'change_state', 'manage_permissions'
            ]),
            ('Allow', 'role:admin', [
                'view', 'add', 'edit', 'delete',
                'change_state', 'manage_permissions'
            ]),
            ('Allow', 'role:manager', [
                'view', 'add', 'edit', 'delete', 'change_state',
                'manage_permissions', 'manage'
            ]),
            ('Allow', 'system.Everyone', ['login']),
            ('Deny', 'system.Everyone', ALL_PERMISSIONS)
        ])

        # If not set, and ACL not found in ``state_acls``, raise on access
        node.default_acl = None
        err = self.expect_error(ValueError, lambda: node.__acl__)
        self.assertEqual(str(err), "No ACL found for state 'initial'")

    def test_state_acl(self):
        node = StateACLWorkflowNode()
        self.assertEqual(node.workflow_name, u'dummy')
        self.assertTrue(IWorkflowState.providedBy(node))

        self.assertEqual(node.__acl__, [
            ('Allow', 'role:manager', ['manage', 'edit', 'change_state']),
            ('Allow', 'system.Everyone', ['login']),
            ('Deny', 'system.Everyone', ALL_PERMISSIONS)
        ])

        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            wf = lookup_workflow(node)
            wf.transition(node, request, u'initial_2_final')
            self.assertEqual(node.state, u'final')

        self.assertEqual(node.__acl__, [
            ('Allow', 'role:manager', ['view', 'edit', 'change_state']),
            ('Deny', 'system.Everyone', ALL_PERMISSIONS)
        ])

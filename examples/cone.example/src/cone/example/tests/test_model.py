from cone.app import get_root
from cone.app.model import Metadata
from cone.app.model import Properties
from cone.example import testing
from cone.example.model import BaseContainer
from cone.example.model import ContainerNode
from cone.example.model import DEFAULT_EXAMPLE_ACL
from cone.example.model import LiveSearch
from cone.example.model import Translation
from cone.example.model import WorkflowNode
from node.tests import NodeTestCase
from pyramid.security import ALL_PERMISSIONS


class TestModel(NodeTestCase):
    layer = testing.security

    def test_DEFAULT_EXAMPLE_ACL(self):
        # Check that ACL has expected structure
        self.assertEqual(len(DEFAULT_EXAMPLE_ACL), 7)
        # system.Authenticated gets view
        self.assertEqual(DEFAULT_EXAMPLE_ACL[0], (
            'Allow', 'system.Authenticated', ['view']
        ))
        # role:viewer gets view, list
        self.assertEqual(DEFAULT_EXAMPLE_ACL[1], (
            'Allow', 'role:viewer', ['view', 'list']
        ))
        # role:editor gets expanded permissions
        self.assertEqual(DEFAULT_EXAMPLE_ACL[2][0], 'Allow')
        self.assertEqual(DEFAULT_EXAMPLE_ACL[2][1], 'role:editor')
        self.assertIn('add', DEFAULT_EXAMPLE_ACL[2][2])
        self.assertIn('edit', DEFAULT_EXAMPLE_ACL[2][2])
        # role:admin gets delete and manage_permissions
        self.assertEqual(DEFAULT_EXAMPLE_ACL[3][1], 'role:admin')
        self.assertIn('delete', DEFAULT_EXAMPLE_ACL[3][2])
        self.assertIn('manage_permissions', DEFAULT_EXAMPLE_ACL[3][2])
        # role:manager gets manage
        self.assertEqual(DEFAULT_EXAMPLE_ACL[4][1], 'role:manager')
        self.assertIn('manage', DEFAULT_EXAMPLE_ACL[4][2])
        # Everyone gets login
        self.assertEqual(DEFAULT_EXAMPLE_ACL[5], (
            'Allow', 'system.Everyone', ['login']
        ))
        # Deny all other permissions
        self.assertEqual(DEFAULT_EXAMPLE_ACL[6], (
            'Deny', 'system.Everyone', ALL_PERMISSIONS
        ))

    def test_Translation(self):
        # Translation is a mapping-like object that stores values per language
        trans = Translation()
        # Set translations
        trans['en'] = 'Hello'
        trans['de'] = 'Hallo'
        # Verify storage
        self.assertEqual(trans['en'], 'Hello')
        self.assertEqual(trans['de'], 'Hallo')
        # Translation behaves like a mapping
        self.assertIn('en', trans)
        self.assertIn('de', trans)
        self.assertEqual(len(trans), 2)

    def test_WorkflowNode(self):
        # WorkflowNode is base class for nodes with workflow support
        # Note: WorkflowNode has workflow_name=None, which causes initialization
        # to fail when trying to lookup workflow. In practice, subclasses
        # always set workflow_name to a valid workflow name.
        # Test the class attributes instead
        self.assertIsNone(WorkflowNode.workflow_name)
        self.assertEqual(WorkflowNode.default_acl, DEFAULT_EXAMPLE_ACL)
        # Test with a concrete subclass that has a workflow (WikiPage)
        from cone.example.wiki.model import WikiPage
        page = WikiPage()
        page.__name__ = 'testpage'
        self.assertEqual(page.workflow_name, 'wiki_workflow')
        self.assertEqual(page.default_acl, DEFAULT_EXAMPLE_ACL)
        # Has attributes storage
        page.attrs['test'] = 'value'
        self.assertEqual(page.attrs['test'], 'value')

    def test_ContainerNode(self):
        # ContainerNode is base class without workflow
        node = ContainerNode()
        # Has default_acl
        self.assertEqual(node.default_acl, DEFAULT_EXAMPLE_ACL)
        # Can store children
        child = ContainerNode()
        node['child'] = child
        self.assertIn('child', node)
        # Has attributes
        node.attrs['key'] = 'value'
        self.assertEqual(node.attrs['key'], 'value')
        # Supports ordering
        node['second'] = ContainerNode()
        self.assertEqual(list(node.keys()), ['child', 'second'])

    def test_BaseContainer(self):
        # BaseContainer adds PrincipalACL and CopySupport
        node = BaseContainer()
        # Check role_inheritance
        self.assertTrue(node.role_inheritance)
        # principal_roles is empty dict by default
        self.assertEqual(node.principal_roles, {})
        # Has properties
        props = node.properties
        self.assertIsInstance(props, Properties)
        self.assertTrue(props.in_navtree)
        self.assertEqual(props.default_content_tile, 'listing')
        self.assertTrue(props.action_up)
        self.assertTrue(props.action_view)
        self.assertTrue(props.action_edit)
        self.assertTrue(props.action_list)
        self.assertTrue(props.action_sharing)
        self.assertTrue(props.action_move)
        self.assertTrue(props.action_add)

    def test_BaseContainer_metadata(self):
        # Test metadata property of BaseContainer
        node = BaseContainer()
        node.__name__ = 'testnode'
        # Set title and description translations
        title = Translation()
        title['en'] = 'Test Title'
        node.attrs['title'] = title
        description = Translation()
        description['en'] = 'Test Description'
        node.attrs['description'] = description
        node.attrs['creator'] = 'testuser'
        # Get metadata
        md = node.metadata
        self.assertIsInstance(md, Metadata)
        # Without request, title.value may not resolve, but structure exists
        self.assertIsNotNone(md.creator)
        self.assertEqual(md.creator, 'testuser')

    def test_LiveSearch(self):
        # LiveSearch adapter searches child nodes
        root = get_root()
        # Create a container with children
        container = BaseContainer()
        container.__name__ = 'container'
        container.__parent__ = root
        # Add child with title
        child = BaseContainer()
        child.__name__ = 'child'
        child.__parent__ = container
        title = Translation()
        title['en'] = 'Searchable Title'
        child.attrs['title'] = title
        container['child'] = child
        # Create search adapter
        adapter = LiveSearch(container)
        self.assertIs(adapter.model, container)
        # Search requires request
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            results = adapter.search(request, 'Searchable')
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['value'], 'Searchable Title')
        # Search is case-insensitive
        with self.layer.authenticated('max'):
            results = adapter.search(request, 'searchable')
        self.assertEqual(len(results), 1)
        # No match returns empty
        with self.layer.authenticated('max'):
            results = adapter.search(request, 'nonexistent')
        self.assertEqual(len(results), 0)

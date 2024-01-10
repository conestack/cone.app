from cone.app import ApplicationNodeTraverser
from cone.app import DefaultLayoutConfig
from cone.app import get_root
from cone.app import layout_config
from cone.app import main_hook
from cone.app import make_remote_addr_middleware
from cone.app import testing
from cone.app.interfaces import ILayoutConfig
from cone.app.model import BaseNode
from cone.app.model import LayoutConfig
from node.base import BaseNode as NodeBaseNode
from node.tests import NodeTestCase
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.router import Router
from pyramid.testing import DummyRequest
import cone.app


def tmp_root_node(fn):
    def wrapper(*a):
        cone.app.root = cone.app.default_root_node_factory({})
        try:
            fn(*a)
        finally:
            cone.app.root = None
    return wrapper


class TestApp(NodeTestCase):

    @tmp_root_node
    def test_get_root(self):
        root = cone.app.get_root()
        self.assertTrue(str(root).startswith("<AppRoot object 'None' at"))

        # AppRoot contains a settings node by default
        self.assertTrue('settings' in root.factories.keys())

        # Settings contains metadata.title by default
        self.assertEqual(list(root['settings'].metadata.keys()), ['title'])
        self.assertEqual(root['settings'].metadata.title, u'settings')

        # Settings is displayed in navtree by default
        self.assertEqual(
            sorted(root['settings'].properties.keys()),
            ['icon', 'in_navtree', 'skip_mainmenu']
        )
        self.assertFalse(root['settings'].properties.in_navtree)
        self.assertTrue(root['settings'].properties.skip_mainmenu)

    @tmp_root_node
    def test_register_entry(self):
        cone.app.register_entry('dummy', BaseNode)

        root = cone.app.get_root()
        self.assertTrue('dummy' in root.factories.keys())

        err = self.expectError(
            ValueError,
            lambda: cone.app.register_entry('dummy', BaseNode)
        )
        expected = "Entry with name 'dummy' already registered."
        self.assertEqual(str(err), expected)

    @tmp_root_node
    def test_register_config(self):
        cone.app.register_config('dummy', BaseNode)

        root = cone.app.get_root()
        self.assertTrue('dummy' in root['settings'].factories.keys())

        err = self.expectError(
            ValueError,
            lambda: cone.app.register_config('dummy', BaseNode)
        )
        expected = "Config with name 'dummy' already registered."
        self.assertEqual(str(err), expected)

    def test_main(self):
        # main hook
        hooks = dict(called=0)

        def custom_main_hook(configurator, global_config, settings):
            hooks['called'] += 1

        cone.app.register_main_hook(custom_main_hook)

        @main_hook
        def decorated_main_hook(configurator, global_config, settings):
            hooks['called'] += 1

        # set auth tkt factory``
        factory = cone.app.auth_tkt_factory(secret='12345')
        self.assertTrue(isinstance(factory, AuthTktAuthenticationPolicy))

        # ACL factory
        factory = cone.app.acl_factory()
        self.assertTrue(isinstance(factory, ACLAuthorizationPolicy))

        # remember original main template
        main_template_orgin = cone.app.cfg.main_template

        # settings
        settings = {
            'cone.admin_user': 'admin',
            'cone.admin_password': 'admin',
            'cone.auth_secret': '12345',
            'cone.auth_reissue_time': '300',
            'cone.auth_max_age': '600',
            'cone.main_template': 'package.browser:templates/main.pt',
            # ensure custom root node factory gets invoked
            'cone.root.node_factory': 'cone.app.default_root_node_factory',
            # ensure dummy main hooks called
            'cone.plugins': 'cone.app.tests'
        }

        # main
        router = cone.app.main({}, **settings)
        self.assertTrue(isinstance(router, Router))
        self.assertEqual(hooks['called'], 2)

        # Remove custom main hook after testing
        cone.app.main_hooks.remove(custom_main_hook)
        cone.app.main_hooks.remove(decorated_main_hook)

        # Check main template was set properly
        self.assertEqual(
            cone.app.cfg.main_template,
            'package.browser:templates/main.pt'
        )

        # reset main template
        cone.app.cfg.main_template = main_template_orgin

    def test_remote_addr_middleware(self):
        # Remote address middleware
        class DummyApp(object):
            remote_addr = None

            def __call__(self, environ, start_response):
                self.remote_addr = environ['REMOTE_ADDR']

        app = DummyApp()
        middleware = make_remote_addr_middleware(app, {})

        environ = {}
        environ['HTTP_X_REAL_IP'] = '1.2.3.4'
        middleware(environ, None)
        self.assertEqual(app.remote_addr, '1.2.3.4')

    def test_layout_config(self):
        config = layout_config.lookup(model=BaseNode(), request=DummyRequest())
        self.assertIsInstance(config, LayoutConfig)
        self.assertIsInstance(config, DefaultLayoutConfig)
        self.assertTrue(ILayoutConfig.providedBy(config))

        self.assertTrue(config.mainmenu)
        self.assertTrue(config.mainmenu_fluid)
        self.assertTrue(config.livesearch)
        self.assertTrue(config.personaltools)
        self.assertTrue(config.columns_fluid)
        self.assertTrue(config.pathbar)
        self.assertEqual(config.sidebar_left, ['navtree'])
        self.assertEqual(config.sidebar_left_grid_width, 3)
        self.assertEqual(config.content_grid_width, 9)

        @layout_config(BaseNode)
        class BaseNodeLayout(LayoutConfig):
            pass

        class CustomNode1(BaseNode):
            pass

        class CustomNode2(BaseNode):
            pass

        @layout_config(CustomNode1, CustomNode2)
        class CustomNodeLayout(LayoutConfig):
            pass

        config = layout_config.lookup(model=BaseNode(), request=DummyRequest())
        self.assertIsInstance(config, BaseNodeLayout)

        config = layout_config.lookup(model=CustomNode1(), request=DummyRequest())
        self.assertIsInstance(config, CustomNodeLayout)

        config = layout_config.lookup(model=CustomNode2(), request=DummyRequest())
        self.assertIsInstance(config, CustomNodeLayout)

        del layout_config._registry[BaseNode]
        del layout_config._registry[CustomNode1]
        del layout_config._registry[CustomNode2]


class TestTraversal(NodeTestCase):
    layer = testing.security

    def test_ApplicationNodeTraverser(self):
        root = BaseNode()
        root.child_constraints = None
        root['appnode_child'] = BaseNode()
        root['node_child'] = NodeBaseNode()
        root['non_node_child'] = {}

        traverser = ApplicationNodeTraverser(root)
        request = self.layer.new_request()

        request.matchdict['traverse'] = '/view'
        result = traverser(request)
        self.assertTrue(result['context'] is root)
        self.assertEqual(result['view_name'], 'view')
        self.assertEqual(result['traversed'], ())

        request.matchdict['traverse'] = '/appnode_child/view'
        result = traverser(request)
        self.assertTrue(result['context'] is root['appnode_child'])
        self.assertEqual(result['view_name'], 'view')
        self.assertEqual(result['traversed'], ('appnode_child',))

        request.matchdict['traverse'] = '/node_child'
        result = traverser(request)
        self.assertTrue(result['context'] is root)
        self.assertEqual(result['view_name'], 'node_child')
        self.assertEqual(result['traversed'], ())

        request.matchdict['traverse'] = '/non_node_child'
        result = traverser(request)
        self.assertTrue(result['context'] is get_root())
        self.assertEqual(result['view_name'], '')
        self.assertEqual(result['traversed'], ())

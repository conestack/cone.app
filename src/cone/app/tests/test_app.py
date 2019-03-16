from cone.app import make_remote_addr_middleware
from cone.app.model import BaseNode
from node.tests import NodeTestCase
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.router import Router
import cone.app


class TestApp(NodeTestCase):

    def test_get_root(self):
        root = cone.app.get_root()
        self.assertTrue(str(root).startswith("<AppRoot object 'None' at"))

        # AppRoot contains a settings node by default
        self.assertTrue('settings' in root.factories.keys())

        # Settings contains metadata.title by default
        self.assertEqual(root['settings'].metadata.keys(), ['title'])
        self.assertEqual(root['settings'].metadata.title, u'settings')

        # Settings is displayed in navtree by default
        self.assertEqual(
            root['settings'].properties.keys(),
            ['skip_mainmenu', 'in_navtree', 'icon']
        )
        self.assertFalse(root['settings'].properties.in_navtree)
        self.assertTrue(root['settings'].properties.skip_mainmenu)

    def test_register_plugin(self):
        cone.app.register_plugin('dummy', BaseNode)

        root = cone.app.get_root()
        self.assertTrue('dummy' in root.factories.keys())

        err = self.expect_error(
            ValueError,
            lambda: cone.app.register_plugin('dummy', BaseNode)
        )
        expected = "Entry with name 'dummy' already registered."
        self.assertEqual(str(err), expected)

    def test_register_plugin_config(self):
        cone.app.register_plugin_config('dummy', BaseNode)

        root = cone.app.get_root()
        self.assertTrue('dummy' in root['settings'].factories.keys())

        err = self.expect_error(
            ValueError,
            lambda: cone.app.register_plugin_config('dummy', BaseNode)
        )
        expected = "Config with name 'dummy' already registered."
        self.assertEqual(str(err), expected)

    def test_main(self):
        # main hook
        class CustomMainHook(object):
            called = False

            # normally a function
            def __call__(self, configurator, global_config, settings):
                self.called = True

        custom_main_hook = CustomMainHook()

        cone.app.register_main_hook(custom_main_hook)

        # set auth tkt factory``
        factory = cone.app.auth_tkt_factory(secret='12345')
        self.assertTrue(isinstance(factory, AuthTktAuthenticationPolicy))

        # ACL factory
        factory = cone.app.acl_factory()
        self.assertTrue(isinstance(factory, ACLAuthorizationPolicy))

        # settings
        settings = {
            'cone.admin_user': 'admin',
            'cone.admin_password': 'admin',
            'cone.auth_secret': '12345',
            'cone.auth_reissue_time': '300',
            'cone.auth_max_age': '600'
        }

        # main
        router = cone.app.main({}, **settings)
        self.assertTrue(isinstance(router, Router))
        self.assertTrue(custom_main_hook.called)

        # Remove custom main hook after testing
        cone.app.main_hooks.remove(custom_main_hook)

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

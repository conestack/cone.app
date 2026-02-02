from cone.app import get_root
from cone.app.model import Metadata
from cone.app.model import Properties
from cone.app.model import get_node_info
from cone.example import testing
from cone.example.browser import DynamicLayoutConfig
from cone.example.browser import ExampleLayoutConfig
from cone.example.browser import LAYOUT_DEMO_DEFAULTS
from cone.example.layout.model import LayoutDemo
from cone.tile import render_tile
from cone.tile.tests import TileTestCase


class TestLayoutModel(TileTestCase):
    layer = testing.security

    def test_LayoutDemo_node_info(self):
        info = get_node_info('layout_demo')
        self.assertEqual(info.name, 'layout_demo')
        self.assertEqual(info.icon, 'bi-layout-sidebar-inset-reverse')
        # LayoutDemo is a leaf node - empty addables
        self.assertEqual(info.addables, [])

    def test_LayoutDemo(self):
        demo = LayoutDemo()
        demo.__name__ = 'layout'
        # Properties
        props = demo.properties
        self.assertIsInstance(props, Properties)
        self.assertTrue(props.in_navtree)
        self.assertTrue(props.action_up)
        self.assertTrue(props.action_view)
        # Metadata
        md = demo.metadata
        self.assertIsInstance(md, Metadata)
        self.assertEqual(md.icon, 'bi-layout-sidebar-inset-reverse')


class TestLayoutConfig(TileTestCase):
    layer = testing.security

    def test_ExampleLayoutConfig(self):
        config = ExampleLayoutConfig()
        # Default sidebar configuration
        self.assertEqual(config.sidebar_left, ['navtree'])
        self.assertEqual(config.sidebar_right, ['tutorial'])
        self.assertEqual(config.sidebar_right_min_width, 400)

    def test_DynamicLayoutConfig_defaults(self):
        # Without request, DynamicLayoutConfig uses defaults
        config = DynamicLayoutConfig()
        # These are set in __init__ only if request is provided
        # Without request, values should be from parent class defaults
        self.assertTrue(hasattr(config, 'mainmenu'))

    def test_DynamicLayoutConfig_with_session(self):
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            # Set session values
            request.session['layout.mainmenu'] = False
            request.session['layout.livesearch'] = False
            request.session['layout.pathbar'] = False
            request.session['layout.sidebar_left'] = []
            request.session['layout.sidebar_right'] = []
            # Create config with request
            config = DynamicLayoutConfig(request=request)
            # Config should read from session
            self.assertFalse(config.mainmenu)
            self.assertFalse(config.livesearch)
            self.assertFalse(config.pathbar)
            self.assertEqual(config.sidebar_left, [])
            self.assertEqual(config.sidebar_right, [])

    def test_LAYOUT_DEMO_DEFAULTS(self):
        # Verify default values
        self.assertTrue(LAYOUT_DEMO_DEFAULTS['mainmenu'])
        self.assertTrue(LAYOUT_DEMO_DEFAULTS['livesearch'])
        self.assertTrue(LAYOUT_DEMO_DEFAULTS['personaltools'])
        self.assertTrue(LAYOUT_DEMO_DEFAULTS['pathbar'])
        self.assertEqual(LAYOUT_DEMO_DEFAULTS['sidebar_left'], ['navtree'])
        self.assertFalse(LAYOUT_DEMO_DEFAULTS['sidebar_left_static'])
        self.assertEqual(LAYOUT_DEMO_DEFAULTS['sidebar_left_min_width'], 150)
        self.assertEqual(LAYOUT_DEMO_DEFAULTS['sidebar_right'], ['tutorial'])
        self.assertFalse(LAYOUT_DEMO_DEFAULTS['sidebar_right_static'])
        self.assertEqual(LAYOUT_DEMO_DEFAULTS['sidebar_right_min_width'], 150)
        self.assertTrue(LAYOUT_DEMO_DEFAULTS['limit_content_width'])
        self.assertFalse(LAYOUT_DEMO_DEFAULTS['limit_page_width'])
        self.assertFalse(LAYOUT_DEMO_DEFAULTS['center_content'])


class TestLayoutBrowser(TileTestCase):
    layer = testing.security

    def test_layout_demo_content_tile(self):
        root = get_root()
        layout = root['layout']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(layout, request, 'content')
        self.assertIsNotNone(result)

    def test_toggle_layout_bool_tile(self):
        root = get_root()
        layout = root['layout']
        request = self.layer.new_request()
        request.params['setting'] = 'mainmenu'
        with self.layer.authenticated('max'):
            # Initial state from defaults
            initial = request.session.get(
                'layout.mainmenu',
                LAYOUT_DEMO_DEFAULTS['mainmenu']
            )
            # Toggle
            result = render_tile(layout, request, 'toggle_layout_bool')
            # State should be toggled
            new_state = request.session.get('layout.mainmenu')
            self.assertEqual(new_state, not initial)

    def test_toggle_sidebar_tile_tile(self):
        root = get_root()
        layout = root['layout']
        request = self.layer.new_request()
        request.params['sidebar'] = 'left'
        request.params['tile'] = 'navtree'
        with self.layer.authenticated('max'):
            # Initial state
            initial = request.session.get(
                'layout.sidebar_left',
                LAYOUT_DEMO_DEFAULTS['sidebar_left']
            )
            # Toggle
            result = render_tile(layout, request, 'toggle_sidebar_tile')
            # navtree should be removed
            new_state = request.session.get('layout.sidebar_left', [])
            self.assertNotIn('navtree', new_state)

    def test_set_layout_number_tile(self):
        root = get_root()
        layout = root['layout']
        request = self.layer.new_request()
        request.params['setting'] = 'sidebar_left_min_width'
        request.params['value'] = '200'
        with self.layer.authenticated('max'):
            result = render_tile(layout, request, 'set_layout_number')
            # Value should be set
            new_value = request.session.get('layout.sidebar_left_min_width')
            self.assertEqual(new_value, 200)

    def test_reset_layout_tile(self):
        root = get_root()
        layout = root['layout']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            # Set some session values
            request.session['layout.mainmenu'] = False
            request.session['layout.pathbar'] = False
            # Reset
            result = render_tile(layout, request, 'reset_layout')
            # Session should no longer have layout keys
            self.assertNotIn('layout.mainmenu', request.session)
            self.assertNotIn('layout.pathbar', request.session)

    def test_tutorial_content_tile(self):
        root = get_root()
        layout = root['layout']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(layout, request, 'tutorial_content')
        self.assertIsNotNone(result)

from cone.app import get_root
from cone.app.model import Metadata
from cone.app.model import Properties
from cone.app.model import get_node_info
from cone.example import testing
from cone.example.ajax.browser import AjaxPlayground
from cone.tile import render_tile
from cone.tile.tests import TileTestCase


class TestAjaxModel(TileTestCase):
    layer = testing.security

    def test_AjaxPlayground_node_info(self):
        info = get_node_info('ajax_playground')
        self.assertEqual(info.name, 'ajax_playground')
        self.assertEqual(info.icon, 'bi-lightning')

    def test_AjaxPlayground(self):
        playground = AjaxPlayground()
        playground.__name__ = 'ajax_playground'
        # Properties
        props = playground.properties
        self.assertIsInstance(props, Properties)
        self.assertTrue(props.in_navtree)
        self.assertTrue(props.action_up)
        self.assertTrue(props.action_view)
        # Metadata
        md = playground.metadata
        self.assertIsInstance(md, Metadata)
        self.assertEqual(md.icon, 'bi-lightning')


class TestAjaxBrowser(TileTestCase):
    layer = testing.security

    def test_ajax_playground_content_tile(self):
        root = get_root()
        playground = root['ajax_playground']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(playground, request, 'content')
        self.assertIsNotNone(result)
        # Content should contain AJAX demo elements
        self.assertIn('ajax', result.lower())

    def test_ajax_demo_content_tile(self):
        root = get_root()
        playground = root['ajax_playground']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(playground, request, 'ajax_demo_content')
        self.assertIsNotNone(result)

    def test_ajax_path_demo_tile(self):
        root = get_root()
        playground = root['ajax_playground']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(playground, request, 'ajax_path_demo')
        # Result is empty string (tile triggers ajax_continue)
        self.assertEqual(result, '')

    def test_ajax_path_result_tile(self):
        root = get_root()
        playground = root['ajax_playground']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(playground, request, 'ajax_path_result')
        self.assertIsNotNone(result)

    def test_ajax_event_demo_tile(self):
        root = get_root()
        playground = root['ajax_playground']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(playground, request, 'ajax_event_demo')
        self.assertEqual(result, '')

    def test_ajax_message_demo_tile(self):
        root = get_root()
        playground = root['ajax_playground']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(playground, request, 'ajax_message_demo')
        self.assertEqual(result, '')

    def test_ajax_action_demo_tile(self):
        root = get_root()
        playground = root['ajax_playground']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(playground, request, 'ajax_action_demo')
        self.assertEqual(result, '')

    def test_ajax_combined_demo_tile(self):
        root = get_root()
        playground = root['ajax_playground']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(playground, request, 'ajax_combined_demo')
        self.assertEqual(result, '')

    def test_ajax_combined_result_tile(self):
        root = get_root()
        playground = root['ajax_playground']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(playground, request, 'ajax_combined_result')
        self.assertIsNotNone(result)

    def test_tutorial_content_tile(self):
        root = get_root()
        playground = root['ajax_playground']
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(playground, request, 'tutorial_content')
        self.assertIsNotNone(result)

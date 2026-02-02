from cone.app import get_root
from cone.app.browser import render_main_template
from cone.example import testing
from cone.example.browser import ExampleContextAction
from cone.example.browser import ExampleToolsToolbar
from cone.example.browser import LandingPage
from cone.example.browser.utils import code_block
from cone.tile import render_tile
from cone.tile.tests import TileTestCase


class TestBrowserResources(TileTestCase):
    layer = testing.security

    def test_code_block_python(self):
        # code_block generates syntax-highlighted HTML
        code = 'def hello():\n    return "world"'
        result = code_block(code, 'python')
        # Result should contain highlight class
        self.assertIn('highlight', result)
        # Result should contain span elements for syntax
        self.assertIn('<span', result)
        self.assertIn('def', result)

    def test_code_block_javascript(self):
        code = 'function hello() { return "world"; }'
        result = code_block(code, 'javascript')
        self.assertIn('highlight', result)
        self.assertIn('function', result)

    def test_code_block_html(self):
        code = '<div class="test">Hello</div>'
        result = code_block(code, 'html')
        self.assertIn('highlight', result)

    def test_code_block_unknown_language(self):
        # Unknown language should fall back to TextLexer
        code = 'some random text'
        result = code_block(code, 'nonexistent_language')
        self.assertIn('highlight', result)


class TestLandingPage(TileTestCase):
    layer = testing.security

    def test_landing_page_tile(self):
        root = get_root()
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            result = render_tile(root, request, 'content')
        self.assertIsNotNone(result)
        # Landing page should contain links to modules
        self.assertIn('wiki', result.lower())

    def test_landing_page_urls(self):
        root = get_root()
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            tile = LandingPage()
            tile.model = root
            tile.request = request
            # Check URL properties
            self.assertIn('layout', tile.layout_url)
            self.assertIn('wiki', tile.wiki_url)
            self.assertIn('ajax_playground', tile.ajax_url)


class TestContextMenu(TileTestCase):
    layer = testing.security

    def test_ExampleToolsToolbar(self):
        # ExampleToolsToolbar is a context menu group
        toolbar = ExampleToolsToolbar()
        # It should be a valid toolbar
        self.assertIsNotNone(toolbar)

    def test_ExampleContextAction(self):
        root = get_root()
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            action = ExampleContextAction()
            action.model = root
            action.request = request
            # Check properties
            self.assertEqual(action.icon, 'bi-arrow-clockwise')
            self.assertEqual(action.css, 'nav-link')
            # target and href should return URLs
            self.assertIsNotNone(action.target)
            self.assertIsNotNone(action.href)
            # display should check permission
            self.assertTrue(action.display)


class TestMainTemplate(TileTestCase):
    layer = testing.security

    def test_render_main_template_authenticated(self):
        root = get_root()
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            res = render_main_template(root, request)
        # Authenticated users should see navigation elements
        self.assertTrue(res.text.find('id="mainmenu"') > -1)

    def test_render_main_template_unauthenticated(self):
        root = get_root()
        request = self.layer.new_request()
        res = render_main_template(root, request)
        # Unauthenticated users should not see mainmenu
        self.assertFalse(res.text.find('id="mainmenu"') > -1)


class TestEntryNodes(TileTestCase):
    layer = testing.security

    def test_entry_nodes_registered(self):
        # Verify all entry nodes are registered in root
        root = get_root()
        # Layout demo
        self.assertIn('layout', root)
        # Wiki
        self.assertIn('wiki', root)
        # AJAX playground
        self.assertIn('ajax_playground', root)
        # Settings
        self.assertIn('settings', root)

    def test_entry_nodes_types(self):
        from cone.example.layout.model import LayoutDemo
        from cone.example.wiki.model import Wiki
        from cone.example.ajax.browser import AjaxPlayground
        root = get_root()
        self.assertIsInstance(root['layout'], LayoutDemo)
        self.assertIsInstance(root['wiki'], Wiki)
        self.assertIsInstance(root['ajax_playground'], AjaxPlayground)

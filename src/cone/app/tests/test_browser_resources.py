from cone.app import testing
from cone.app.browser.resources import cone_css
from cone.app.browser.resources import cone_js
from cone.app.browser.resources import is_remote_resource
from cone.app.browser.resources import MergedAssets
from cone.app.browser.resources import print_css
from cone.app.browser.resources import Resources
from cone.app.model import Properties
from cone.app.testing.mock import static_resources
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
import cone.app
import os
import pkg_resources


class TestBrowserResources(TileTestCase):
    layer = testing.security

    def test_is_remote_resource(self):
        self.assertTrue(is_remote_resource('http://example.com/foo'))
        self.assertTrue(is_remote_resource('https://example.com/foo'))
        self.assertTrue(is_remote_resource('//foo'))
        self.assertFalse(is_remote_resource('foo'))

    def test_MergedAssets(self):
        request = self.layer.new_request()
        assets = MergedAssets(request)

        assets.merged_js_assets = Properties()
        assets.merged_js_assets.public = [(static_resources, 'script1.js')]
        assets.merged_js_assets.protected = [(static_resources, 'script2.js')]

        assets.merged_css_assets = Properties()
        assets.merged_css_assets.public = [(static_resources, 'style1.css')]
        assets.merged_css_assets.protected = [(static_resources, 'style2.css')]

        assets.merged_print_css_assets = Properties()
        assets.merged_print_css_assets.public = [(static_resources, 'print1.css')]
        assets.merged_print_css_assets.protected = [(static_resources, 'print2.css')]

        expected = 'console.log("script1");\n\n'
        self.assertEqual(assets.merged_js, expected)
        expected = '.style1 { display: block; }\n\n'
        self.assertEqual(assets.merged_css, expected)
        expected = '.print1 { display: none; }\n\n'
        self.assertEqual(assets.merged_print_css, expected)

        with self.layer.authenticated('max'):
            res = assets.merged_js
        expected = 'console.log("script1");\n\nconsole.log("script2");\n\n'
        self.assertEqual(res, expected)

        with self.layer.authenticated('max'):
            res = assets.merged_css
        expected = '.style1 { display: block; }\n\n.style2 { display: block; }\n\n'
        self.assertEqual(res, expected)

        with self.layer.authenticated('max'):
            res = assets.merged_print_css
        expected = '.print1 { display: none; }\n\n.print2 { display: none; }\n\n'
        self.assertEqual(res, expected)

    def test_cone_js(self):
        model = cone.app.root
        request = self.layer.new_request()
        res = cone_js(model, request)
        self.assertEqual(res.headers['Content-Type'], 'application/javascript')

    def test_cone_css(self):
        model = cone.app.root
        request = self.layer.new_request()
        res = cone_css(model, request)
        self.assertEqual(res.headers['Content-Type'], 'text/css')

    def test_print_css(self):
        model = cone.app.root
        request = self.layer.new_request()
        res = print_css(model, request)
        self.assertEqual(res.headers['Content-Type'], 'text/css')

    def test_Resources(self):
        class DummyResources(Resources):
            @property
            def js(self):
                js = Properties()
                js.public = ['public.js', 'https://remote.foo/public.js']
                js.protected = ['protected.js', 'https://remote.foo/protected.js']
                return js

            @property
            def css(self):
                css = Properties()
                css.public = ['public.css', 'https://remote.foo/public.css']
                css.protected = ['protected.css', 'https://remote.foo/protected.css']
                return css

        resources = DummyResources()
        resources.model = cone.app.root
        resources.request = self.layer.new_request()

        self.assertEqual(resources.authenticated, None)
        with self.layer.authenticated('max'):
            self.assertEqual(resources.authenticated, 'max')

        self.assertEqual(
            resources.resource_url('foo.js'),
            'http://example.com/foo.js'
        )
        self.assertEqual(
            resources.resource_url('https://remote.foo/resource.js'),
            'https://remote.foo/resource.js'
        )

        res = resources.resources(resources.js)
        self.assertEqual(res, [
            'http://example.com/public.js',
            'https://remote.foo/public.js'
        ])

        with self.layer.authenticated('max'):
            res = resources.resources(resources.js)
        self.assertEqual(res, [
            'http://example.com/public.js',
            'https://remote.foo/public.js',
            'http://example.com/protected.js',
            'https://remote.foo/protected.js'
        ])

        res = resources.resources(resources.css)
        self.assertEqual(res, [
            'http://example.com/public.css',
            'https://remote.foo/public.css'
        ])

        with self.layer.authenticated('max'):
            res = resources.resources(resources.css)
        self.assertEqual(res, [
            'http://example.com/public.css',
            'https://remote.foo/public.css',
            'http://example.com/protected.css',
            'https://remote.foo/protected.css'
        ])

    def test_resources(self):
        # CSS Resource
        self.assertTrue(isinstance(cone.app.cfg.css, Properties))
        self.assertEqual(
            sorted(cone.app.cfg.css.keys()),
            ['protected', 'public']
        )

        # Contain CSS resources for authenticated users
        self.checkOutput('[...]', str(cone.app.cfg.css.protected))

        # Contain CSS resource for all users
        self.checkOutput('[...]', str(cone.app.cfg.css.public))

        # JS Resources
        self.assertTrue(isinstance(cone.app.cfg.js, Properties))
        self.assertEqual(
            sorted(cone.app.cfg.js.keys()),
            ['protected', 'public']
        )

        # Contain CSS resources for authenticated users
        self.checkOutput('[...]', str(cone.app.cfg.js.protected))

        # Contain CSS resource for all users
        self.checkOutput('[...]', str(cone.app.cfg.js.public))

        # Render resources tile unauthorized
        request = self.layer.new_request()
        result = render_tile(cone.app.root, request, 'resources')
        self.checkOutput('...<!-- javascripts -->...', result)

        # Render resources tile authorized
        with self.layer.authenticated('max'):
            result = render_tile(cone.app.root, request, 'resources')
        self.checkOutput('...<!-- javascripts -->...', result)

        # Merged Assets
        assets = cone.app.cfg.merged.js.public
        self.checkOutput("""
        [(<pyramid.static.static_view object at ...>, 'jquery-1.9.1.js'),
        (<pyramid.static.static_view object at ...>, 'jquery.migrate-1.2.1.js'),
        (<pyramid.static.static_view object at ...>, 'jqueryui/jquery-ui-1.10.3.custom.js'),
        (<pyramid.static.static_view object at ...>, 'bootstrap/js/bootstrap.js')...]
        """, str(assets))

        static = assets[0][0]
        resource = assets[0][1]
        self.assertEqual(static.package_name, 'cone.app.browser')
        self.assertEqual(static.docroot, 'static')

        subpath = os.path.join(static.docroot, resource)
        path = pkg_resources.resource_filename(static.package_name, subpath)
        self.checkOutput('/.../cone/app/browser/static/jquery-1.9.1.js', path)

        data = ''
        with open(path, 'r') as file:
            data += file.read() + '\n\n'
        self.checkOutput('...\n\n', data)

        request = self.layer.new_request()
        assets = MergedAssets(request)
        self.assertTrue(len(assets.merged_js) > 0)
        self.checkOutput('...', assets.merged_css)

        with self.layer.authenticated('admin'):
            self.assertTrue(len(assets.merged_js) > 0)
            self.checkOutput('...', assets.merged_css)

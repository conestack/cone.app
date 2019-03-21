from cone.app import testing
from cone.app.browser.resources import MergedAssets
from cone.app.model import Properties
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
import cone.app
import os
import pkg_resources


class TestBrowserResources(TileTestCase):
    layer = testing.security

    def test_resources(self):
        # CSS Resource
        self.assertTrue(isinstance(cone.app.cfg.css, Properties))
        self.assertEqual(cone.app.cfg.css.keys(), ['protected', 'public'])

        # Contain CSS resources for authenticated users
        self.checkOutput('[...]', str(cone.app.cfg.css.protected))

        # Contain CSS resource for all users
        self.checkOutput('[...]', str(cone.app.cfg.css.public))

        # JS Resources
        self.assertTrue(isinstance(cone.app.cfg.js, Properties))
        self.assertEqual(cone.app.cfg.js.keys(), ['protected', 'public'])

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

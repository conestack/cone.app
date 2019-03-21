from cone.app import get_root
from cone.app import testing
from cone.app.browser import favicon_view
from cone.app.browser import get_related_view
from cone.app.browser import main_view
from cone.app.browser import RelatedViewConsumer
from cone.app.browser import RelatedViewProvider
from cone.app.browser import render_main_template
from cone.app.browser import set_related_view
from cone.app.browser.utils import make_url
from cone.app.model import BaseNode
from cone.tile import Tile
from cone.tile.tests import TileTestCase
from plumber import plumbing
from webob.response import Response


class BrowserTest(TileTestCase):
    layer = testing.security

    def test_render_main_template(self):
        root = get_root()
        request = self.layer.new_request()
        response = render_main_template(root, request)
        self.assertTrue(isinstance(response, Response))

    def test_main_view(self):
        root = get_root()
        request = self.layer.new_request()
        response = main_view(root, request)
        self.assertTrue(isinstance(response, Response))

    def test_favicon_view(self):
        request = self.layer.new_request()
        response = favicon_view(request)
        self.assertTrue(isinstance(response, Response))
        self.assertEqual(
            response.headers['Content-Type'],
            'image/vnd.microsoft.icon'
        )

    def test_related_view_support(self):
        # Test ``set_related_view``
        request = self.layer.new_request()
        set_related_view(request, 'someview')
        self.assertEqual(
            request.environ['cone.app.related_view'],
            'someview'
        )

        # Test ``get_related_view``
        self.assertEqual(get_related_view(request), 'someview')

        # Test ``RelatedViewConsumer``
        @plumbing(RelatedViewConsumer)
        class RelatedViewConsumingTile(Tile):
            def render(self):
                return make_url(
                    self.request,
                    node=self.model,
                    resource=self.related_view)

        model = BaseNode(name='root')
        request = self.layer.new_request()
        tile = RelatedViewConsumingTile()
        self.assertEqual(
            tile(model, request),
            'http://example.com/root'
        )

        set_related_view(request, 'someview')
        self.assertEqual(
            tile(model, request),
            'http://example.com/root/someview'
        )

        # Test ``RelatedViewProvider``
        @plumbing(RelatedViewProvider)
        class RelatedViewProvidingTile(Tile):
            related_view = 'related_view'

            def render(self):
                return RelatedViewConsumingTile()(self.model, self.request)

        model = BaseNode(name='root')
        request = self.layer.new_request()
        tile = RelatedViewProvidingTile()
        self.assertEqual(
            tile(model, request),
            'http://example.com/root/related_view'
        )

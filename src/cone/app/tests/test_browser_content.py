from cone.app import testing
from cone.app.browser.content import content_view_tile
from cone.app.model import BaseNode
from cone.tile import render_tile
from cone.tile import Tile
from cone.tile.tests import TileTestCase


class TestBrowserLayout(TileTestCase):
    layer = testing.security

    def test_content_view_tile(self):
        class Model(BaseNode):
            pass

        request = self.layer.new_request()
        with self.layer.hook_tile_reg():
            @content_view_tile(
                name='model_tile',
                interface=Model,
                permission='view')
            class ModelContentTile(Tile):
                def render(self):
                    return '<div>Model Content</div>'

        model = Model()
        with self.layer.authenticated('manager'):
            res = render_tile(model, request, 'model_tile')
        self.assertEqual(res, '<div>Model Content</div>')

        from cone.app.tests.test_browser_content import model_tile_content_view
        self.assertEqual(model_tile_content_view.__doc__, (
            'Dynamically created by '
            'cone.app.browser.content.content_view_tile'
        ))

        with self.layer.authenticated('manager'):
            res = model_tile_content_view(model, request)
        self.assertTrue(res.body.startswith(b'<!DOCTYPE html>') > -1)
        self.assertTrue(res.body.find(b'<div>Model Content</div>') > -1)

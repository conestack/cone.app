from cone.app import testing
from cone.app.browser.actions import ActionContext
from cone.app.model import BaseNode
from cone.app.testing.mock import CopySupportNode
from cone.app.testing.mock import SharingNode
from cone.tile import render_tile
from cone.tile.tests import TileTestCase


class TestBrowserContextmenu(TileTestCase):
    layer = testing.security

    def test_ContextMenu(self):
        with self.layer.authenticated('manager'):
            parent = BaseNode('root')
            model = parent['model'] = SharingNode()
            model.properties.action_up = True
            model.properties.action_view = True
            model.properties.action_list = True
            model.properties.action_edit = True
            model.properties.action_delete = True
            # XXX: model.properties.action_delete_children = True

            request = self.layer.new_request()
            ActionContext(model, request, 'content')
            rendered = render_tile(model, request, 'contextmenu')

            self.assertTrue(rendered.find('toolbaraction-up') > -1)
            self.assertTrue(rendered.find('toolbaraction-view') > -1)
            self.assertTrue(rendered.find('toolbaraction-list') > -1)
            self.assertTrue(rendered.find('toolbaraction-edit') > -1)
            self.assertTrue(rendered.find('toolbaraction-delete') > -1)
            self.assertTrue(rendered.find('toolbaraction-share') > -1)

            model = CopySupportNode()
            ActionContext(model, request, 'listing')
            rendered = render_tile(model, request, 'contextmenu')

            self.assertTrue(rendered.find('toolbaraction-cut') > -1)
            self.assertTrue(rendered.find('toolbaraction-copy') > -1)
            self.assertTrue(rendered.find('toolbaraction-paste') > -1)

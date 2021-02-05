from cone.app import testing
from cone.app.browser.actions import ActionContext
from cone.app.browser.content import content_view_action
from cone.app.browser.content import content_view_tile
from cone.app.browser.content import ContentViewAction
from cone.app.browser.contextmenu import context_menu
from cone.app.model import BaseNode
from cone.tile import render_tile
from cone.tile import Tile
from cone.tile.tests import TileTestCase
from zope.interface import implementer
from zope.interface import Interface


class TestBrowserLayout(TileTestCase):
    layer = testing.security

    def test_content_view_tile(self):
        class Model(BaseNode):
            pass

        with self.layer.hook_tile_reg():
            @content_view_tile(
                name='model_tile',
                interface=Model,
                permission='view')
            class ModelContentTile(Tile):
                def render(self):
                    return '<div>Model Content</div>'

        model = Model()
        request = self.layer.new_request()
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

    def test_content_view_action(self):
        class Model(BaseNode):
            pass

        @content_view_action(
            name='model_action',
            tilename='model_tile',
            interface=Model,
            permission='view',
            text='Model Action',
            icon='glyphicons glyphicons-star')
        class ModelContentTile(Tile):
            pass

        self.assertTrue('model_action' in context_menu['contentviews'])

        action = context_menu['contentviews']['model_action']
        self.assertIsInstance(action, ContentViewAction)
        self.assertEqual(action.name, 'model_tile')
        self.assertEqual(action.interface, Model)
        self.assertEqual(action.permission, 'view')
        self.assertEqual(action.text, 'Model Action')
        self.assertEqual(action.icon, 'glyphicons glyphicons-star')

        del context_menu['contentviews']['model_action']

    def test_ContentViewAction(self):
        model = BaseNode(name='model')
        request = self.layer.new_request()

        action = ContentViewAction(name='content_action')
        action.model = model
        action.request = request
        self.assertEqual(action.href, 'http://example.com/model/content_action')
        self.assertTrue(action.display)

        ActionContext(model, request, 'content_action')
        self.assertTrue(action.selected)

        del request.environ['action_context']
        self.assertFalse(action.selected)

        action = ContentViewAction(name='content_action', permission='view')
        action.model = model
        action.request = request
        self.assertFalse(action.display)
        with self.layer.authenticated('manager'):
            self.assertTrue(action.display)

        action = ContentViewAction(name='content_action', interface=BaseNode)
        action.model = model
        action.request = request
        self.assertTrue(action.display)

        class InvalidClassContext(object):
            pass

        action = ContentViewAction(
            name='content_action',
            interface=InvalidClassContext
        )
        action.model = model
        action.request = request
        self.assertFalse(action.display)

        class IContextInterface(Interface):
            pass

        action = ContentViewAction(
            name='content_action',
            interface=IContextInterface
        )
        action.model = model
        action.request = request
        self.assertFalse(action.display)

        @implementer(IContextInterface)
        class InterfaceModel(BaseNode):
            pass

        action.model = InterfaceModel()
        self.assertTrue(action.display)

from cone.app import testing
from cone.app.browser.order import MoveAction
from cone.app.model import AppNode
from cone.app.model import BaseNode
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from node.behaviors import Adopt
from node.behaviors import DefaultInit
from node.behaviors import DictStorage
from node.behaviors import Nodify
from node.behaviors import Order
from node.interfaces import IOrder
from plumber import plumbing


class TestBrowserOrder(TileTestCase):
    layer = testing.security

    def test_moving(self):
        move_action = MoveAction()
        with self.assertRaises(NotImplementedError):
            move_action.move()

        @plumbing(
            AppNode,
            Adopt,
            DefaultInit,
            Nodify,
            DictStorage)
        class UnorderedNode(object):
            pass

        node = UnorderedNode()
        node['child'] = BaseNode()

        self.assertFalse(IOrder.providedBy(node))
        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            self.assertEqual(render_tile(node['child'], request, 'move_up'), u'')
        self.assertEqual(
            request.environ['cone.app.continuation'][0].payload,
            u'Object "child" not movable'
        )

        @plumbing(Order)
        class OrderableNode(BaseNode):
            def __call__(self):
                pass

        node = OrderableNode()
        node['a'] = BaseNode()
        node['b'] = BaseNode()

        self.assertEqual(node.properties.action_move, None)
        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            self.assertEqual(render_tile(node['b'], request, 'move_up'), u'')
        self.assertEqual(
            request.environ['cone.app.continuation'][0].payload,
            u'You are not permitted to move this object'
        )

        node.properties.action_move = True
        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            self.assertEqual(render_tile(node['a'], request, 'move_down'), u'')
        self.assertEqual(node.keys(), ['b', 'a'])

        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            self.assertEqual(render_tile(node['a'], request, 'move_up'), u'')
        self.assertEqual(node.keys(), ['a', 'b'])

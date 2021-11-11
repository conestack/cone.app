from cone.app import testing
from node.interfaces import IBoundContext
from node.interfaces import INode
from zope.component import adapter
from zope.interface import implementer
import unittest


class TestBrowserContext(unittest.TestCase):
    layer = testing.security

    def test_adapter(self):
        @implementer(INode)
        class Node(object):
            pass

        @implementer(IBoundContext)
        class BoundContext(object):
            pass

        context = BoundContext()

        @adapter(INode)
        @implementer(IBoundContext)
        def bound_context_adapter(model):
            return context

        request = self.layer.new_request()
        request.registry.registerAdapter(
            bound_context_adapter,
            (INode,),
            IBoundContext,
            'name'
        )
        self.assertEqual(
            request.registry.getAdapter(Node(), IBoundContext, 'name'),
            context
        )

        request.registry.registerAdapter(
            bound_context_adapter,
            (object,),
            IBoundContext,
            'name'
        )
        self.assertEqual(
            request.registry.getAdapter(object(), IBoundContext, 'name'),
            context
        )

from cone.app import get_root
from cone.app import testing
from cone.app.browser.search import livesearch
from cone.app.interfaces import ILiveSearch
from cone.tile.tests import TileTestCase
from zope.component import adapter
from zope.interface import implementer
from zope.interface import Interface


class TestBrowserSearch(TileTestCase):
    layer = testing.security

    def test_livesearch(self):
        # Cone provides a livesearch view, but no referring ``ILiveSearch``
        # implementing adapter for it
        root = get_root()
        request = self.layer.new_request()
        request.params['term'] = 'foo'
        self.assertEqual(livesearch(root, request), [])

        # Provide dummy adapter
        @implementer(ILiveSearch)
        @adapter(Interface)
        class LiveSearch:
            def __init__(self, model):
                self.model = model

            def search(self, request, query):
                return [{'value': 'Value'}]

        registry = request.registry
        registry.registerAdapter(LiveSearch)

        self.assertEqual(livesearch(root, request), [{'value': 'Value'}])

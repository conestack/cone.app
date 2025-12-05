from cone.app import get_root
from cone.app import testing
from cone.app.browser.ajax import ajax_continue
from cone.app.browser.ajax import ajax_form_template
from cone.app.browser.ajax import ajax_message
from cone.app.browser.ajax import ajax_status_message
from cone.app.browser.ajax import ajax_tile
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.ajax import AjaxFormContinue
from cone.app.browser.ajax import AjaxMessage
from cone.app.browser.ajax import AjaxOverlay
from cone.app.browser.ajax import AjaxPath
from cone.app.browser.search import livesearch
from cone.app.browser.ajax import render_ajax_form
from cone.app.browser.form import Form
from cone.app.interfaces import ILiveSearch
from cone.tile import Tile
from cone.tile import tile
from cone.tile.tests import TileTestCase
from yafowil.base import factory
from zope.component import adapter
from zope.interface import implementer
from zope.interface import Interface
import json


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
        class LiveSearch(object):
            def __init__(self, model):
                self.model = model

            def search(self, request, query):
                return [{'value': 'Value'}]

        registry = request.registry
        registry.registerAdapter(LiveSearch)

        self.assertEqual(livesearch(root, request), [{'value': 'Value'}])

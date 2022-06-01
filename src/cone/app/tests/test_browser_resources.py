from cone.app import testing
from cone.app.browser.resources import Resources
from cone.tile import render_tile
from cone.tile.tests import TileTestCase


class TestBrowserResources(TileTestCase):
    layer = testing.security

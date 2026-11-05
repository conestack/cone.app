from cone.app import testing
from cone.app.origin import is_foreign_request
from cone.app.origin import origin_check_tween_factory
from cone.tile import Tile
from cone.tile import tile
from cone.tile.tests import TileTestCase
from pyramid.interfaces import ITweens
from pyramid.request import Request
from unittest import mock
import json
import unittest


AJAX_PARAMS = {'ajax.action': 'origintile', 'ajax.mode': 'inner', 'ajax.selector': '#a'}


def blank_request(headers=None, method='POST'):
    return Request.blank('/some/path', headers=headers or {}, method=method)


class TestIsForeignRequest(unittest.TestCase):
    def assert_foreign(self, headers, trusted=()):
        self.assertTrue(is_foreign_request(blank_request(headers), trusted))

    def assert_own(self, headers, trusted=()):
        self.assertFalse(is_foreign_request(blank_request(headers), trusted))

    def test_client_without_browser_headers_passes(self):
        self.assert_own({})

    def test_fetch_site_of_own_requests(self):
        self.assert_own({'Sec-Fetch-Site': 'same-origin'})
        self.assert_own({'Sec-Fetch-Site': 'none'})

    def test_fetch_site_of_foreign_requests(self):
        self.assert_foreign({'Sec-Fetch-Site': 'same-site'})
        self.assert_foreign({'Sec-Fetch-Site': 'cross-site'})

    def test_fetch_site_decides_over_origin(self):
        # A proxy might rewrite the host, the browser knows better.
        self.assert_own(
            {'Sec-Fetch-Site': 'same-origin', 'Origin': 'https://public.example.com'}
        )
        self.assert_foreign(
            {'Sec-Fetch-Site': 'cross-site', 'Origin': 'http://localhost:80'}
        )

    def test_origin_of_own_host(self):
        self.assert_own({'Origin': 'http://localhost:80'})

    def test_origin_is_compared_without_scheme(self):
        # A proxy terminating TLS talks to the application in plain HTTP.
        self.assert_own({'Origin': 'https://localhost:80'})

    def test_origin_of_other_host(self):
        self.assert_foreign({'Origin': 'http://other.example.com'})
        self.assert_foreign({'Origin': 'http://localhost:8080'})

    def test_origin_without_host(self):
        self.assert_foreign({'Origin': 'null'})
        self.assert_foreign({'Origin': ''})

    def test_trusted_origin(self):
        trusted = ['https://other.example.com']
        self.assert_own({'Origin': 'https://other.example.com'}, trusted)
        self.assert_own(
            {'Origin': 'https://other.example.com', 'Sec-Fetch-Site': 'cross-site'},
            trusted,
        )

    def test_trusted_origin_matches_completely(self):
        trusted = ['https://other.example.com']
        self.assert_foreign({'Origin': 'https://other.example.com.example.org'}, trusted)
        self.assert_foreign({'Origin': 'http://other.example.com'}, trusted)

    def test_trusted_origin_with_wildcard(self):
        trusted = ['moz-extension://*']
        self.assert_own({'Origin': 'moz-extension://1234-abcd'}, trusted)
        self.assert_foreign({'Origin': 'https://example.com'}, trusted)

    def test_trusted_origin_with_brackets(self):
        # Brackets enclose an IPv6 address, they are no character class
        trusted = ['http://[::1]:8080']
        self.assert_own(
            {'Origin': 'http://[::1]:8080', 'Sec-Fetch-Site': 'cross-site'}, trusted
        )
        self.assert_foreign(
            {'Origin': 'http://1:8080', 'Sec-Fetch-Site': 'cross-site'}, trusted
        )

    def test_trusted_origin_needs_origin_header(self):
        self.assert_foreign({'Sec-Fetch-Site': 'cross-site'}, ['moz-extension://*'])


class TestOriginCheckTween(unittest.TestCase):
    def tween(self, settings=None):
        self.handler = mock.Mock(return_value='handled')
        registry = mock.Mock(settings=settings or {})
        return origin_check_tween_factory(self.handler, registry)

    def test_safe_methods_are_not_checked(self):
        tween = self.tween()
        for method in ('GET', 'HEAD', 'OPTIONS'):
            with self.subTest(method=method):
                request = blank_request({'Sec-Fetch-Site': 'cross-site'}, method)
                self.assertEqual(tween(request), 'handled')

    def test_all_other_methods_are_checked(self):
        tween = self.tween()
        for method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            with self.subTest(method=method):
                request = blank_request({'Sec-Fetch-Site': 'cross-site'}, method)
                with self.assertLogs('cone.app', level='WARNING'):
                    self.assertEqual(tween(request).status_int, 403)
        self.handler.assert_not_called()

    def test_refused_request_gets_logged(self):
        tween = self.tween()
        request = blank_request({'Origin': 'https://other.example.com'})
        with self.assertLogs('cone.app', level='WARNING') as logs:
            tween(request)
        self.assertIn('POST', logs.output[0])
        self.assertIn("'/some/path'", logs.output[0])
        self.assertIn("'https://other.example.com'", logs.output[0])

    def test_own_request_is_handled(self):
        request = blank_request({'Sec-Fetch-Site': 'same-origin'})
        self.assertEqual(self.tween()(request), 'handled')

    def test_trusted_origins_setting(self):
        tween = self.tween({'cone.trusted_origins': '\nmoz-extension://*\nhttps://a.b\n'})
        for origin in ('moz-extension://1234', 'https://a.b'):
            with self.subTest(origin=origin):
                self.assertEqual(tween(blank_request({'Origin': origin})), 'handled')


class TestOriginCheckThroughRouter(TileTestCase):
    layer = testing.security

    def setUp(self):
        super().setUp()
        self.rendered = rendered = []
        with self.layer.hook_tile_reg():

            @tile(name='origintile', permission='login')
            class OriginTile(Tile):
                def render(self):
                    rendered.append(True)
                    return 'rendered'

    def ajax_response(self, headers):
        headers = {'Accept': 'application/json', **headers}
        request = Request.blank('/ajaxaction', POST=AJAX_PARAMS, headers=headers)
        return request.get_response(self.layer.app)

    def test_request_of_own_site(self):
        response = self.ajax_response({'Sec-Fetch-Site': 'same-origin'})
        self.assertEqual(response.status_int, 200)
        self.assertEqual(json.loads(response.text)['payload'], 'rendered')

    def test_request_of_other_site(self):
        with self.assertLogs('cone.app', level='WARNING'):
            response = self.ajax_response({'Sec-Fetch-Site': 'cross-site'})
        self.assertEqual(response.status_int, 403)
        self.assertEqual(self.rendered, [])

    def test_request_of_other_site_without_fetch_metadata(self):
        with self.assertLogs('cone.app', level='WARNING'):
            response = self.ajax_response({'Origin': 'http://other.example.com'})
        self.assertEqual(response.status_int, 403)
        self.assertEqual(self.rendered, [])

    def test_client_without_browser_headers(self):
        response = self.ajax_response({})
        self.assertEqual(response.status_int, 200)
        self.assertEqual(self.rendered, [True])

    def test_check_is_the_outermost_tween(self):
        self.assertEqual(
            self.layer.registry.queryUtility(ITweens).sorter.sorted()[0][0],
            'cone.app.origin.origin_check_tween_factory',
        )

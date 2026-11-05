from cone.app import get_root
from cone.app import testing
from cone.app.browser.exception import internal_server_error
from cone.app.model import BaseNode
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from pyramid.httpexceptions import HTTPForbidden
from pyramid.httpexceptions import HTTPNotFound
from pyramid.request import Request
from pyramid.view import render_view_to_response
import json


class TestBrowserException(TileTestCase):
    layer = testing.security

    def handle_error(self, request):
        try:
            raise Exception('Some detail')
        except Exception:
            return internal_server_error(request)

    def assert_page(self, response):
        self.checkOutput(
            """
        500 Internal Server Error
        Content-Type: text/html; charset=UTF-8
        Content-Length: ...
        <h1>An error occured</h1>
        <p>
          <a href="/">HOME</a>
          <hr />
        </p>
        An internal error occurred. Please try again later.
        """,
            str(response),
        )

    def assert_json(self, response):
        self.assertEqual(response.status_int, 500)
        self.assertEqual(response.content_type, 'application/json')
        result = json.loads(response.body)
        self.assertEqual(result['mode'], 'NONE')
        self.assertEqual(result['selector'], 'NONE')
        self.assertEqual(result['payload'], '')
        message = result['continuation'][0]
        self.assertEqual(message['type'], 'message')
        self.assertEqual(message['flavor'], 'error')
        self.assertEqual(message['selector'], None)
        self.assertEqual(
            message['payload'], 'An internal error occurred. Please try again later.'
        )

    def test_internal_server_error(self):
        # When requests are performed, and an uncaught exception is raised,
        # ``internal_server_error`` view is invoked. Response either represents
        # an error page or a JSON response containing treibstoff ajax
        # continuation operations which display an error dialog if request was
        # a treibstoff ajax action. The details go to the log.
        with self.assertLogs('cone.app', level='ERROR') as logs:
            self.assert_page(self.handle_error(self.layer.new_request()))
        self.assertIn('Traceback', logs.output[0])
        self.assertIn('Some detail', logs.output[0])

        with self.assertLogs('cone.app', level='ERROR'):
            self.assert_json(self.handle_error(self.layer.new_request(xhr=1)))

        with self.layer.authenticated('admin'):
            with self.assertLogs('cone.app', level='ERROR'):
                self.assert_page(self.handle_error(self.layer.new_request()))
            with self.assertLogs('cone.app', level='ERROR'):
                self.assert_json(self.handle_error(self.layer.new_request(xhr=1)))

    def test_internal_server_error_shows_traceback_on_demand(self):
        with testing.tracebacks_shown():
            for xhr in (False, True):
                with self.subTest(xhr=xhr):
                    request = self.layer.new_request(xhr=xhr)
                    with self.assertLogs('cone.app', level='ERROR'):
                        response = self.handle_error(request)
                    self.assertEqual(response.status_int, 500)
                    self.assertIn('Traceback', response.text)
                    self.assertIn('Some detail', response.text)

    def test_ajaxaction_answers_without_details(self):
        # A failing ajax action through the router, without ``ajax.action``
        def request_ajaxaction(headers):
            headers = dict(headers, Accept='application/json')
            request = Request.blank('/ajaxaction', method='POST', headers=headers)
            with self.assertLogs(level='ERROR'):
                return request.get_response(self.layer.app)

        anonymous = request_ajaxaction(dict())
        self.layer.new_request()
        with self.layer.authenticated('max'):
            cookie = self.layer.current_request.environ['HTTP_COOKIE']
            authenticated = request_ajaxaction(dict(Cookie=cookie))
        for response in (anonymous, authenticated):
            self.assertEqual(response.status_int, 200)
            self.assertIn(
                'An internal error occurred. Please try again later.', response.text
            )
            self.assertNotIn('Traceback', response.text)
            self.assertNotIn('.py', response.text)

    def test_forbidden(self):
        # Forbidden tile
        root = get_root()
        model = root['model'] = BaseNode(parent=get_root())
        request = self.layer.new_request()

        self.checkOutput(
            """
        ...<div class="card mt-3">...<h5 class="card-header">Unauthorized</h5>...
        ...<p class="card-text">You are not allowed to access this resource.</p>...
        """,
            render_tile(model, request, 'unauthorized'),
        )

        # Forbidden view. Unauthenticated renders login form.
        context = HTTPForbidden()
        request = self.layer.new_request()
        request.context = BaseNode(parent=get_root())
        res = render_view_to_response(context, request=request).text
        self.assertTrue(res.find('id="input-loginform-login"') > -1)

        # Authenticated renders unauthorized as content tile.
        with self.layer.authenticated('admin'):
            res = render_view_to_response(context, request=request).text
            self.assertTrue(res.find('<h5 class="card-header">Unauthorized</h5>') > -1)

    def test_json_forbidden(self):
        context = HTTPForbidden()
        request = self.layer.new_request(type='json')
        request.context = BaseNode(parent=get_root())
        res = render_view_to_response(context, request=request)
        self.assertEqual(res.text, '{}')
        self.assertEqual(res.status, '403 Forbidden')

    def test_not_found(self):
        # Not Found tile
        root = get_root()
        model = root['model'] = BaseNode(parent=get_root())
        request = self.layer.new_request()

        self.checkOutput(
            """
        ...<div class="card mt-3">...<h5 class="card-header">Not Found</h5>...
        ...<p class="card-text">The requested resource cannot be found.</p>...
        """,
            render_tile(model, request, 'not_found'),
        )

        # Not Found view. Always renders not found as content tile.
        context = HTTPNotFound()
        request = self.layer.new_request()
        request.context = BaseNode(parent=get_root())
        res = render_view_to_response(context, request=request).text
        self.assertTrue(res.find('<h5 class="card-header">Not Found</h5>') > -1)

        with self.layer.authenticated('admin'):
            res = render_view_to_response(context, request=request).text
            self.assertTrue(res.find('<h5 class="card-header">Not Found</h5>') > -1)

    def test_json_not_found(self):
        context = HTTPNotFound()
        request = self.layer.new_request(type='json')
        request.context = BaseNode(parent=get_root())
        res = render_view_to_response(context, request=request)
        self.assertEqual(res.text, '{}')
        self.assertEqual(res.status, '404 Not Found')

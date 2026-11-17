from cone.app import get_root
from cone.app import testing
from cone.app.browser.exception import internal_server_error
from cone.app.model import BaseNode
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from pyramid.authorization import ALL_PERMISSIONS
from pyramid.authorization import Allow
from pyramid.authorization import Deny
from pyramid.authorization import Everyone
from pyramid.httpexceptions import HTTPForbidden
from pyramid.httpexceptions import HTTPNotFound
from pyramid.request import Request
from pyramid.view import render_view_to_response
import json


class HiddenNode(BaseNode):
    """A node no one may view."""

    __acl__ = [(Allow, Everyone, ['login']), (Deny, Everyone, ALL_PERMISSIONS)]


class PublicNode(BaseNode):
    """A node everyone may view."""

    __acl__ = [(Allow, Everyone, ['login', 'view']), (Deny, Everyone, ALL_PERMISSIONS)]


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
        # Forbidden tile: access denied, for whom, and the ways out.
        root = get_root()
        model = root['model'] = BaseNode(parent=get_root())
        request = self.layer.new_request()
        request.url = 'http://example.com/model/edit'
        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'unauthorized')
        self.checkOutput(
            """
        ...<div class="error-state" id="access-denied">...
        ...<svg class="error-illustration"...aria-hidden="true"...
        ...<p class="error-code">403</p>...
        ...<h1 class="h3">Access denied</h1>...
        ...<p class="error-text">You are logged in as <strong>Max Mustermann</strong>
        and do not have permission to access this page.</p>...
        ...<a class="btn btn-primary" href="http://example.com/">Go to start page</a>...
        ...<a class="btn btn-outline-secondary"
        href="http://example.com/logout?came_from=http%3A//example.com/model/edit">Log
        in as another user</a>...
        """,
            rendered,
        )

        # Forbidden view. Unauthenticated renders login form.
        context = HTTPForbidden()
        request = self.layer.new_request()
        request.context = HiddenNode(parent=get_root())
        response = render_view_to_response(context, request=request)
        self.assertIn('id="input-loginform-login"', response.text)

        # Authenticated renders access denied as content tile, with the
        # status the page stands for. Header and footer stay, though the user
        # may not view the context - its menus check that and stay empty.
        with self.layer.authenticated('max'):
            response = render_view_to_response(context, request=request)
        self.assertEqual(response.status_int, 403)
        self.assertIn('id="access-denied"', response.text)
        self.assertIn('id="header-main"', response.text)
        self.assertIn('id="footer"', response.text)
        self.assertNotIn('id="personaltools"', response.text)

    def test_insufficient_privileges_is_access_denied(self):
        # For the user it is the same: logged in, not allowed to see this.
        model = BaseNode(parent=get_root())
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            self.assertIn(
                'id="access-denied"',
                render_tile(model, request, 'insufficient_privileges'),
            )

    def test_json_forbidden(self):
        context = HTTPForbidden()
        request = self.layer.new_request(type='json')
        request.context = BaseNode(parent=get_root())
        res = render_view_to_response(context, request=request)
        self.assertEqual(res.text, '{}')
        self.assertEqual(res.status, '403 Forbidden')

    def test_not_found(self):
        # Not Found tile: an illustration, the status code, a way home.
        root = get_root()
        model = root['model'] = BaseNode(parent=get_root())
        request = self.layer.new_request()

        self.checkOutput(
            """
        ...<div class="error-state" id="not-found">...
        ...<svg class="error-illustration"...aria-hidden="true"...
        ...<p class="error-code">404</p>...
        ...<h1 class="h3">Page not found</h1>...
        ...<p class="error-text">The page you were looking for does not exist...
        ...<a class="btn btn-primary" href="http://example.com/">Go to start page</a>...
        """,
            render_tile(model, request, 'not_found'),
        )

        # Not Found view. Renders not found as content tile, with the status
        # the page stands for - a 200 tells crawlers and monitoring the address
        # exists.
        context = HTTPNotFound()
        request = self.layer.new_request()
        request.context = PublicNode(parent=get_root())
        response = render_view_to_response(context, request=request)
        self.assertEqual(response.status_int, 404)
        self.assertIn('id="not-found"', response.text)

        # An anonymous user who may not view the context gets the login form:
        # not found may mean not visible before the login - an expired or
        # invalidated ticket, a traversal that hides what the user may not
        # see. Every unknown address answers the same, nothing is revealed.
        request = self.layer.new_request()
        request.context = HiddenNode(parent=get_root())
        response = render_view_to_response(context, request=request)
        self.assertIn('id="input-loginform-login"', response.text)
        self.assertNotIn('id="not-found"', response.text)

        # Logged in it is not found, whatever the user may view. Header and
        # footer stay - for a logged in user even where the context is not
        # visible to them.
        with self.layer.authenticated('max'):
            response = render_view_to_response(context, request=request)
            self.assertEqual(response.status_int, 404)
            self.assertIn('id="not-found"', response.text)
            self.assertIn('id="header-main"', response.text)
            self.assertIn('id="footer"', response.text)

    def test_json_not_found(self):
        context = HTTPNotFound()
        request = self.layer.new_request(type='json')
        request.context = BaseNode(parent=get_root())
        res = render_view_to_response(context, request=request)
        self.assertEqual(res.text, '{}')
        self.assertEqual(res.status, '404 Not Found')

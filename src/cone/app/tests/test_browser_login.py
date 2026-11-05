from cone.app import get_root
from cone.app import security
from cone.app import testing
from cone.app.browser import login as login_module
from cone.app.browser.login import login_view
from cone.app.browser.login import logout_view
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from pyramid.request import Request
from unittest import mock
from webob.exc import HTTPFound
from webob.response import Response


class TestBrowserLogin(TileTestCase):
    layer = testing.security

    def test_login_view(self):
        root = get_root()
        request = self.layer.new_request()
        response = login_view(root, request)
        self.assertTrue(isinstance(response, Response))

    def test_logout_view(self):
        root = get_root()
        request = self.layer.new_request()
        response = logout_view(root, request)
        self.assertTrue(isinstance(response, HTTPFound))
        self.checkOutput(
            """
        ResponseHeaders([('Content-Type', 'text/html; charset=UTF-8'),
        ('Content-Length', '0'),
        ('Set-Cookie', 'auth_tkt=; Domain=example.com; Max-Age=0; Path=/; expires=...; SameSite=Lax'),
        ('Location', 'http://example.com')])
        """,
            str(response.headers),
        )

    def test_logout_view_came_from(self):
        root = get_root()
        request = self.layer.new_request()
        request.params['came_from'] = 'http://example.com/a?b=c'
        self.assertEqual(logout_view(root, request).location, 'http://example.com/a?b=c')

        request.params['came_from'] = 'http://example.org/'
        self.assertEqual(logout_view(root, request).location, 'http://example.com')

    def login_params(self, user, password):
        return {
            'loginform.user': user,
            'loginform.password': password,
            'action.loginform.login': '1',
        }

    def test_login_view_tries_no_login_without_credentials(self):
        with mock.patch.object(login_module, 'authenticate') as authenticate:
            response = login_view(get_root(), self.layer.new_request())
        self.assertEqual(response.status_int, 200)
        authenticate.assert_not_called()

    def test_login_view_tries_no_login_with_missing_credentials(self):
        for user, password, message in (
            ('', '', 'No username given'),
            ('foo', '', 'No password given'),
            ('', 'bar', 'No username given'),
        ):
            with self.subTest(user=user, password=password):
                request = self.layer.new_request()
                request.params.update(self.login_params(user, password))
                with mock.patch.object(login_module, 'authenticate') as authenticate:
                    response = login_view(get_root(), request)
                self.assertEqual(response.status_int, 200)
                self.assertIn(message, response.text)
                authenticate.assert_not_called()

    def test_failed_login_answers_unauthorized(self):
        request = self.layer.new_request()
        request.params.update(self.login_params('foo', 'bar'))
        with self.assertLogs('cone.app', level='WARNING'):
            response = login_view(get_root(), request)
        self.assertEqual(response.status_int, 401)
        self.assertIn('Invalid Credentials', response.text)

    def test_failed_login_through_router(self):
        request = Request.blank('/login', POST=self.login_params('foo', 'bar'))
        with self.assertLogs('cone.app', level='WARNING'):
            response = request.get_response(self.layer.app)
        self.assertEqual(response.status_int, 401)
        self.assertIn('Invalid Credentials', response.text)

    def test_successful_login_through_router(self):
        request = Request.blank(
            '/login', POST=self.login_params(security.ADMIN_USER, security.ADMIN_PASSWORD)
        )
        response = request.get_response(self.layer.app)
        self.assertEqual(response.status_int, 302)
        self.assertIn('auth_tkt=', response.headers['Set-Cookie'])

    def test_failed_login_through_ajaxaction(self):
        params = self.login_params('foo', 'bar')
        params.update(
            {'ajax.action': 'loginform', 'ajax.mode': 'inner', 'ajax.selector': '#a'}
        )
        request = Request.blank(
            '/ajaxaction', POST=params, headers={'Accept': 'application/json'}
        )
        with self.assertLogs('cone.app', level='WARNING'):
            response = request.get_response(self.layer.app)
        self.assertEqual(response.status_int, 401)

    def test_login_form(self):
        root = get_root()
        request = self.layer.new_request()
        res = render_tile(root, request, 'loginform')
        self.assertTrue(res.find('<form action="http://example.com/login"') > -1)

        # Authenticate with wrong credentials
        request.params['loginform.user'] = 'foo'
        request.params['loginform.password'] = 'bar'
        request.params['action.loginform.login'] = '1'
        res = render_tile(root, request, 'loginform')
        self.assertTrue(res.find('class="invalid-feedback">Invalid Credentials') > -1)

        # Authenticate with correct credentials
        request.params['loginform.user'] = security.ADMIN_USER
        request.params['loginform.password'] = security.ADMIN_PASSWORD
        request.params['action.loginform.login'] = '1'
        render_tile(root, request, 'loginform')
        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))

from cone.app import get_root
from cone.app import security
from cone.app import testing
from cone.app.browser.login import login_view
from cone.app.browser.login import logout_view
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from webob.response import Response
from webob.exc import HTTPFound


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

    def test_logout_tile(self):
        root = get_root()
        request = self.layer.new_request()
        with self.layer.authenticated('admin'):
            render_tile(root, request, 'logout')
            self.checkOutput("""
            ResponseHeaders([('Set-Cookie', 'auth_tkt=; Max-Age=0; Path=/; expires=...'),
            ('Set-Cookie', 'auth_tkt=; Domain=example.com; Max-Age=0; Path=/; expires=...'),
            ('Set-Cookie', 'auth_tkt=; Domain=.example.com; Max-Age=0; Path=/; expires=...')])
            """, str(request.response.headers))

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
        self.assertTrue(res.find('class="errormessage">Invalid Credentials') > -1)

        # Authenticate with correct credentials
        request.params['loginform.user'] = security.ADMIN_USER
        request.params['loginform.password'] = security.ADMIN_PASSWORD
        request.params['action.loginform.login'] = '1'
        render_tile(root, request, 'loginform')
        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))

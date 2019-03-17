from cone.app.testing import DummyRequest
from cone.app.testing import Security
from cone.app.testing import security
from pyramid.security import authenticated_userid
import unittest


class TestTesting(unittest.TestCase):
    layer = security

    def test_layer(self):
        # Check layer instance
        self.assertTrue(isinstance(self.layer, Security))

        # Login with inexistent user
        self.layer.login('inexistent')

        req = self.layer.new_request()
        self.assertTrue(isinstance(req, DummyRequest))
        self.assertTrue(authenticated_userid(req) is None)
        self.assertTrue(self.layer.current_request is req)
        self.assertEqual(req.environ.keys(), ['AUTH_TYPE', 'SERVER_NAME'])

        # Login with existing user
        self.layer.login('max')
        self.assertEqual(
            req.environ.keys(),
            ['AUTH_TYPE', 'HTTP_COOKIE', 'SERVER_NAME']
        )
        self.assertEqual(req.environ['AUTH_TYPE'], 'cookie')
        self.assertTrue(req.environ['HTTP_COOKIE'].startswith('auth_tkt='))
        self.assertEqual(req.environ['SERVER_NAME'], 'testcase')

        self.assertTrue(self.layer.current_request is req)
        self.assertEqual(authenticated_userid(req), 'max')
        self.assertEqual(req.environ.keys(), [
            'AUTH_TYPE', 'REMOTE_USER_TOKENS', 'SERVER_NAME', 'HTTP_COOKIE',
            'REMOTE_USER_DATA', 'cone.app.user.roles'
        ])

        # Logout
        self.layer.logout()
        self.assertTrue(self.layer.current_request is req)
        self.assertEqual(req.environ.keys(), ['AUTH_TYPE', 'SERVER_NAME'])
        self.assertTrue(authenticated_userid(req) is None)

        # Create new request and check if instance changed
        old = req
        req = self.layer.new_request()
        self.assertFalse(old is req)

        # Create JSON request
        req = self.layer.new_request(type='json')
        self.assertEqual(req.headers, {'X-Request': 'JSON'})
        self.assertEqual(req.accept, 'application/json')

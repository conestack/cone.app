from cone.app.testing import DummyRequest
from cone.app.testing import Security
from cone.app.testing import security
import unittest


class TestTesting(unittest.TestCase):
    layer = security

    def test_layer(self):
        # Check layer instance
        self.assertTrue(isinstance(self.layer, Security))

        # Login with inexistent user
        with self.layer.authenticated('inexistent'):
            req = self.layer.new_request()
            self.assertTrue(isinstance(req, DummyRequest))
            self.assertTrue(req.authenticated_userid is None)
            self.assertTrue(self.layer.current_request is req)
            self.assertEqual(
                sorted(req.environ.keys()),
                ['AUTH_TYPE', 'SERVER_NAME']
            )

        # Login with existing user
        with self.layer.authenticated('max'):
            self.assertEqual(
                sorted(req.environ.keys()),
                ['AUTH_TYPE', 'HTTP_COOKIE', 'SERVER_NAME']
            )
            self.assertEqual(req.environ['AUTH_TYPE'], 'cookie')
            self.assertTrue(req.environ['HTTP_COOKIE'].startswith('auth_tkt='))
            self.assertEqual(req.environ['SERVER_NAME'], 'testcase')

            self.assertTrue(self.layer.current_request is req)
            self.assertEqual(req.authenticated_userid, 'max')
            self.assertEqual(sorted(req.environ.keys()), [
                'AUTH_TYPE', 'HTTP_COOKIE', 'REMOTE_USER_DATA',
                'REMOTE_USER_TOKENS', 'SERVER_NAME', 'cone.app.user.roles'
            ])

        # Logged out
        self.assertTrue(self.layer.current_request is req)
        self.assertEqual(
            sorted(req.environ.keys()),
            ['AUTH_TYPE', 'SERVER_NAME']
        )
        self.assertTrue(req.authenticated_userid is None)

        # Create new request and check if instance changed
        old = req
        req = self.layer.new_request()
        self.assertFalse(old is req)

        # Check auto request creation on login
        self.layer.current_request = None
        with self.layer.authenticated('max'):
            req = self.layer.current_request
            self.assertTrue(isinstance(req, DummyRequest))

        # Request accept property
        req = self.layer.new_request()
        self.assertEqual(
            req.accept.parsed,
            [('text/html', 1.0, [], [])]
        )

        del req.accept
        self.assertEqual(req.accept.parsed, None)

        # Create JSON request
        req = self.layer.new_request(type='json')
        self.assertEqual(req.headers, {'X-Request': 'JSON'})
        self.assertEqual(
            req.accept.parsed,
            [('application/json', 1.0, [], [])]
        )

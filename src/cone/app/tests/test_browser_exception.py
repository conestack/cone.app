from cone.app import get_root
from cone.app import testing
from cone.app.browser.exception import forbidden_view
from cone.app.browser.exception import internal_server_error
from cone.app.browser.exception import not_found_view
from cone.app.model import BaseNode
from cone.tile import render_tile
from cone.tile.tests import TileTestCase


class TestBrowserException(TileTestCase):
    layer = testing.security

    def test_internal_server_error(self):
        # When requests are performed, and an uncaught exception is raised,
        # ``internal_server_error`` view is invoked. Response either represents
        # an error page or a JSON response containing bdajax continuation
        # definitions which display the traceback in an error dialog if request
        # was a bdajax action
        request = self.layer.new_request()
        self.checkOutput("""
        200 OK
        Content-Type: text/html; charset=UTF-8
        Content-Length: ...
        <h1>An error occured</h1>
        <p>
          <a href="/">HOME</a>
          <hr />
        </p>
        <pre>Traceback (most recent call last):
          None...
        </pre>
        """, str(internal_server_error(request)))

        request = self.layer.new_request(xhr=1)
        res = str(internal_server_error(request))
        self.assertTrue(res.find('200 OK') > -1)
        self.assertTrue(res.find('Content-Type: application/json') > -1)
        self.assertTrue(res.find('"continuation"') > -1)
        self.assertTrue(res.find('"type": "message"') > -1)
        expected = '"payload": "<pre>Traceback (most recent call last):'
        self.assertTrue(res.find(expected) > -1)
        self.assertTrue(res.find('"selector": null') > -1)
        self.assertTrue(res.find('"payload": ""') > -1)
        self.assertTrue(res.find('"mode": "NONE"') > -1)
        self.assertTrue(res.find('"selector": "NONE"') > -1)

        with self.layer.authenticated('admin'):
            request = self.layer.new_request()

            self.checkOutput("""
            200 OK
            Content-Type: text/html; charset=UTF-8
            Content-Length: ...
            <h1>An error occured</h1>
            <p>
              <a href="/">HOME</a>
              <hr />
            </p>
            <pre>Traceback (most recent call last):
              None...
            </pre>
            """, str(internal_server_error(request)))

            request = self.layer.new_request(xhr=1)
            res = str(internal_server_error(request))

        self.assertTrue(res.find('200 OK') > -1)
        self.assertTrue(res.find('Content-Type: application/json') > -1)
        self.assertTrue(res.find('"continuation"') > -1)
        self.assertTrue(res.find('"type": "message"') > -1)
        expected = '"payload": "<pre>Traceback (most recent call last):'
        self.assertTrue(res.find(expected) > -1)
        self.assertTrue(res.find('"selector": null') > -1)
        self.assertTrue(res.find('"payload": ""') > -1)
        self.assertTrue(res.find('"mode": "NONE"') > -1)
        self.assertTrue(res.find('"selector": "NONE"') > -1)

    def test_forbidden(self):
        # Forbidden tile
        root = get_root()
        model = root['model'] = BaseNode()
        request = self.layer.new_request()

        self.checkOutput("""
        \n\n  <div>\n    <h1>Unauthorized</h1>\n
        <p>You are not allowed to access this resource.</p>\n  </div>\n\n\n
        """, render_tile(model, request, 'unauthorized'))

        del root['model']

        # Forbidden view
        root = get_root()
        model = root['model'] = BaseNode()
        request = self.layer.new_request()
        request.context = model
        res = forbidden_view(request).text
        self.assertTrue(res.find('id="input-loginform-login"') > -1)

        with self.layer.authenticated('admin'):
            request = self.layer.new_request()
            request.context = model
            res = forbidden_view(request).text
            self.assertTrue(res.find('<h1>Unauthorized</h1>') > -1)

        del root['model']

    def test_not_found(self):
        # Not Found tile
        root = get_root()
        model = root['model'] = BaseNode()
        request = self.layer.new_request()

        self.checkOutput("""
        \n\n  <div>\n    <h1>Not Found</h1>\n
        <p>The requested resource cannot be found.</p>\n  </div>\n\n\n
        """, render_tile(model, request, 'not_found'))

        del root['model']

        # Not Found view
        root = get_root()
        model = root['model'] = BaseNode()
        request = self.layer.new_request()
        request.context = model
        res = not_found_view(request).text
        self.assertTrue(res.find('<h1>Not Found</h1>') > -1)

        with self.layer.authenticated('admin'):
            request = self.layer.new_request()
            request.context = model
            res = not_found_view(request).text
            self.assertTrue(res.find('<h1>Not Found</h1>') > -1)

        del root['model']

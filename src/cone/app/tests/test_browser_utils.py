from cone.app import testing
from cone.app.browser.utils import authenticated
from cone.app.browser.utils import choose_name
from cone.app.browser.utils import format_date
from cone.app.browser.utils import format_traceback
from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.app.browser.utils import node_icon
from cone.app.browser.utils import request_property
from cone.app.model import BaseNode
from cone.app.model import node_info
from cone.tile.tests import TileTestCase
from datetime import datetime


class TestBrowserUtils(TileTestCase):
    layer = testing.security

    def test_authenticated(self):
        request = self.layer.new_request()
        self.assertEqual(authenticated(request), None)
        with self.layer.authenticated('max'):
            self.assertEqual(authenticated(request), 'max')

    def test_make_query(self):
        self.assertEqual(make_query(foo=None), None)
        self.assertEqual(make_query(foo=[]), None)
        self.assertEqual(make_query(foo='123'), '?foo=123')
        self.assertEqual(make_query(foo=['456', '789']), '?foo=456&foo=789')
        self.assertEqual(make_query(foo=1), '?foo=1')
        self.assertEqual(make_query(foo=1.), '?foo=1.0')
        self.assertEqual(make_query(foo='foo', bar='bar'), '?bar=bar&foo=foo')
        self.assertEqual(
            make_query(
                quote_params=('foo',),
                foo='http://example.com?param=value'
            ),
            '?foo=http%3A//example.com%3Fparam%3Dvalue'
        )
        self.assertEqual(
            make_query(came_from='http://example.com?param=value'),
            '?came_from=http%3A//example.com%3Fparam%3Dvalue'
        )

    def test_make_url(self):
        root = BaseNode()
        root['child'] = BaseNode()
        request = self.layer.new_request()
        self.assertEqual(make_url(request), 'http://example.com/')
        self.assertEqual(
            make_url(request, path=['1', '2', '3']),
            'http://example.com/1/2/3'
        )
        self.assertEqual(
            make_url(request, node=root['child']),
            'http://example.com/child'
        )
        self.assertEqual(
            make_url(request, node=root['child'], resource='foo'),
            'http://example.com/child/foo'
        )
        self.assertEqual(
            make_url(request, node=root['child'], resource='foo', query='&a=1'),
            'http://example.com/child/foo&a=1'
        )

    def test_choose_name(self):
        container = BaseNode()
        container['a'] = BaseNode()
        self.assertEqual(choose_name(container, 'a'), 'a-1')
        container['a-1'] = BaseNode()
        self.assertEqual(choose_name(container, 'a'), 'a-2')
        container['b-1'] = BaseNode()
        self.assertEqual(choose_name(container, 'b'), 'b')

    def test_format_date(self):
        dt = datetime(2011, 3, 15)
        self.assertEqual(format_date(dt), '15.03.2011 00:00')
        self.assertEqual(format_date(dt, long=False), '15.03.2011')
        self.assertEqual(format_date(object()), u'unknown')

    @testing.reset_node_info_registry
    def test_node_icon(self):
        model = BaseNode()
        model.properties.icon = 'my-icon'
        self.assertEqual(node_icon(model), 'my-icon')

        @node_info(
            name='mynode')
        class MyNode(BaseNode):
            pass

        model = MyNode()
        self.assertEqual(
            node_icon(model),
            'glyphicon glyphicon-asterisk'
        )

        @node_info(
            name='othernode',
            icon='other-icon')
        class OtherNode(BaseNode):
            pass

        model = OtherNode()
        self.assertEqual(node_icon(model), 'other-icon')

    def test_request_property(self):
        counter = dict(computed=0)

        class RequestPropertyUsingClass(object):
            def __init__(self, request):
                self.request = request

            @request_property
            def cached_attr(self):
                counter['computed'] += 1
                return 'cached attribute'

        request = self.layer.new_request()
        rpuc = RequestPropertyUsingClass(request)
        self.assertEqual(rpuc.cached_attr, 'cached attribute')
        self.assertEqual(counter['computed'], 1)

        self.assertEqual(rpuc.cached_attr, 'cached attribute')
        self.assertEqual(counter['computed'], 1)

    def test_format_traceback(self):
        class MyException(Exception):
            pass
        try:
            raise MyException('Error!')
        except MyException:
            self.checkOutput("""
            <pre>Traceback (most recent call last):
              File "...", line ..., in test_format_traceback
                raise MyException('Error!')
              ...MyException: Error!
            </pre>
            """, format_traceback())

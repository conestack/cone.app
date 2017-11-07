Browser Utils
=============

Common browser utils.::

    >>> from cone.app.browser.utils import authenticated
    >>> from cone.app.browser.utils import node_path
    >>> from cone.app.browser.utils import make_query
    >>> from cone.app.browser.utils import make_url
    >>> from cone.app.browser.utils import format_date

``authenticated`` - Will be removed.::

    >>> request = layer.new_request()
    >>> authenticated(request)

``node_path`` - Propably will be implemented in ``BaseNode``. Just skips root
in path.::

    >>> from cone.app.model import BaseNode
    >>> root = BaseNode()
    >>> root['child'] = BaseNode()
    >>> node_path(root['child'])
    [u'child']

``make_url`` - create URL's.::

    >>> make_url(request)
    'http://example.com/'

    >>> make_url(request, path=['1', '2', '3'])
    'http://example.com/1/2/3'

    >>> make_url(request, node=root['child'])
    'http://example.com/child'

    >>> make_url(request, node=root['child'], resource='foo')
    'http://example.com/child/foo'

    >>> make_url(request, node=root['child'], resource='foo', query='&a=1')
    'http://example.com/child/foo&a=1'

``make_query`` - create query strings.::

    >>> make_query(foo=None)

    >>> make_query(foo=[])

    >>> make_query(foo='123')
    '?foo=123'

    >>> make_query(foo=['456', '789'])
    '?foo=456&foo=789'

    >>> make_query(foo=1)
    '?foo=1'

    >>> make_query(foo=1.)
    '?foo=1.0'

    >>> make_query(foo='foo', bar='bar')
    '?foo=foo&bar=bar'

    >>> make_query(quote_params=('foo',), foo='http://example.com?param=value')
    '?foo=http%3A//example.com%3Fparam%3Dvalue'

    >>> make_query(came_from='http://example.com?param=value')
    '?came_from=http%3A//example.com%3Fparam%3Dvalue'

``format_date``::

    >>> from datetime import datetime
    >>> dt = datetime(2011, 3, 15)
    >>> format_date(dt)
    '15.03.2011 00:00'

    >>> format_date(dt, long=False)
    '15.03.2011'

    >>> format_date(object())
    u'unknown'

``request_property``::

    >>> from cone.app.browser.utils import request_property
    >>> class RequestPropertyUsingClass(object):
    ...     def __init__(self, request):
    ...         self.request = request
    ...     @request_property
    ...     def cached_attr(self):
    ...         print 'compute me'
    ...         return 'cached attribute'

    >>> request = layer.new_request()
    >>> rpuc = RequestPropertyUsingClass(request)
    >>> rpuc.cached_attr
    compute me
    'cached attribute'

    >>> rpuc.cached_attr
    'cached attribute'

Browser Utils
=============

Common browser utils.::

    >>> from cone.app.browser.utils import authenticated
    >>> from cone.app.browser.utils import nodepath
    >>> from cone.app.browser.utils import make_query
    >>> from cone.app.browser.utils import make_url
    >>> from cone.app.browser.utils import format_date

``authenticated`` - Will be removed.::

    >>> request = layer.new_request()
    >>> authenticated(request)

``nodepath`` - Propably will be implemented in ``BaseNode``. Just skips root in
path.::

    >>> from cone.app.model import BaseNode
    >>> root = BaseNode()
    >>> root['child'] = BaseNode()
    >>> nodepath(root['child'])
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

    >>> make_query(**{
    ...     'foo': None,
    ...     'bar': '123',
    ...     'baz': [],
    ...     'bam': ['456', '789'],
    ... })
    '?bar=123&bam=456&bam=789'

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

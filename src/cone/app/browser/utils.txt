Browser Utils
=============

Common browser utils.::

    >>> from cone.app.browser.utils import (
    ...     authenticated,
    ...     nodepath,
    ...     make_query,
    ...     make_url,
    ...     format_date,
    ...     node_icon_url,
    ...     AppUtil,
    ... )

``authenticated`` - Will be removed.::

    >>> request = layer.new_request()
    >>> authenticated(request)

``nodepath`` - Propably will be implemented in ``BaseNode``. Just skips root in
path.::

    >>> from cone.app.model import BaseNode
    >>> root = BaseNode()
    >>> root['child'] = BaseNode()
    >>> nodepath(root['child'])
    ['child']

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
    'unknown'

``node_icon_url``. First looks if ``node.properties.icon`` is set. If not found,
look if node info for node defines icon. Otherwise use default icon.

    >>> from cone.app.model import (
    ...     NodeInfo,
    ...     registerNodeInfo,
    ... )
    >>> node = BaseNode()
    >>> node_icon_url(request, node)
    'http://example.com/static/images/default_node_icon.png'
    
    >>> info = NodeInfo
    >>> info.icon = 'my-static/images/myicon.png'
    >>> registerNodeInfo('mytype', info)
    >>> node.node_info_name = 'mytype'
    >>> node_icon_url(request, node)
    'http://example.com/my-static/images/myicon.png'
    
    >>> info.icon = None
    >>> node_icon_url(request, node)
    'http://example.com/static/images/default_node_icon.png'
    
    >>> node.properties.icon = 'my-static/images/othericon.png'
    >>> node_icon_url(request, node)
    'http://example.com/my-static/images/othericon.png'

``AppUtil``. Combines above functions in an object which is available in main
template::

    >>> util = AppUtil()
    >>> util.authenticated(request)
    
    >>> util.nodepath(root['child'])
    ['child']
    
    >>> util.make_url(request)
    'http://example.com/'
    
    >>> util.make_query(foo='bar')
    '?foo=bar'
    
    >>> util.format_date(dt)
    '15.03.2011 00:00'

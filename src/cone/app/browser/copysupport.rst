Copysupport::

    >>> from cone.app.tests.mock import CopySupportNode
    >>> from cone.app.browser.ajax import ajax_tile
    
    >>> layer.login('manager')
    
    >>> model = CopySupportNode()
    >>> request = layer.new_request()
    >>> request.cookies['__cone.app.copysupport'] = ''
    >>> request.params['bdajax.mode'] = 'NONE'
    >>> request.params['bdajax.selector'] = 'NONE'
    >>> request.params['bdajax.action'] = 'paste'
    >>> ajax_tile(model, request)
    {'continuation': False, 
    'payload': u'', 
    'mode': 'NONE', 
    'selector': 'NONE'}
    
    u'http%3A//localhost%3A8081/time/orga_group0/planning/962273be-9ff3-4170-bb67-b1f8023ccb21/315ee5ab-81de-4431-b1b1-61f97a38dafe%3A%3Ahttp%3A//localhost%3A8081/time/orga_group0/planning/962273be-9ff3-4170-bb67-b1f8023ccb21/85805e24-faaf-4570-ae02-19ed1ad1d6aa'
    
    >>> layer.logout()

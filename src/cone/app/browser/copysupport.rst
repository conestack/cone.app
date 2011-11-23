Copysupport::

    >>> from cone.app.tests.mock import CopySupportNode
    >>> from cone.app.browser.ajax import ajax_tile
    
    >>> layer.login('manager')
    
    >>> model = CopySupportNode()
    >>> request = layer.new_request()
    >>> request.cookies['__cone.app.copysupport'] = ''
    >>> request.params['bdajax.mode'] = 'NONE'
    >>> request.params['bdajax.selector'] = 'NONE'
    
    >>> request.params['bdajax.action'] = 'cut'
    >>> ajax_tile(model, request)
    {'continuation': False, 
    'payload': u'', 
    'mode': 'NONE', 
    'selector': 'NONE'}
    
    >>> request.params['bdajax.action'] = 'copy'
    >>> ajax_tile(model, request)
    {'continuation': False, 
    'payload': u'', 
    'mode': 'NONE', 
    'selector': 'NONE'}
    
    >>> request.params['bdajax.action'] = 'paste'
    >>> ajax_tile(model, request)
    {'continuation': False, 
    'payload': u'', 
    'mode': 'NONE', 
    'selector': 'NONE'}
    
    >>> layer.logout()

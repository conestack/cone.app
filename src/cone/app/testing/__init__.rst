Test layer::

    >>> layer
    <Layer 'cone.app.testing.Security'>
    
    >>> layer.login('inexistent')
    
    >>> req = layer.new_request()
    >>> req
    <cone.app.testing.DummyRequest object at ...>
    
    >>> from pyramid.security import authenticated_userid
    >>> authenticated_userid(req)
    
    >>> layer.current_request is req
    True
    
    >>> layer.login('max')
    >>> req.environ
    {'AUTH_TYPE': 'cookie', 
    'HTTP_COOKIE': 'auth_tkt="...!userid_type:b64str"; Path=/', 
    'SERVER_NAME': 'testcase'}
    
    >>> layer.current_request is req
    True
    
    >>> authenticated_userid(req)
    'max'
    
    >>> req.environ.keys()
    ['AUTH_TYPE', 'REMOTE_USER_TOKENS', 'SERVER_NAME', 'HTTP_COOKIE', 
    'paste.cookies', 'REMOTE_USER_DATA', 'cone.app.user.roles']    
    
    >>> layer.logout()
    >>> layer.current_request is req
    True
    
    >>> req.environ.keys()
    ['AUTH_TYPE', 'SERVER_NAME']
    
    >>> authenticated_userid(req)
    
    >>> old = req
    >>> req = layer.new_request()
    >>> old is req
    False
    
    >>> req = layer.new_request(type='json')
    >>> req.headers
    {'X-Request': 'JSON'}
    
    >>> req.accept
    'application/json'

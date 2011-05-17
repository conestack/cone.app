Login form tile
===============

Render login form::

    >>> from cone.app import root
    >>> from cone.tile import render_tile
    >>> request = layer.new_request()
    >>> res = render_tile(root, request, 'loginform')
    >>> res.find('<form action="http://example.com/login"') > -1
    True

Authenticate with wrong credentials::

    >>> request.params['loginform.user'] = 'foo'
    >>> request.params['loginform.password'] = 'bar'
    >>> request.params['action.loginform.login'] = '1'
    >>> res = render_tile(root, request, 'loginform')
    >>> res.find('class="errormessage">Invalid Credentials') > -1
    True

    >>> from cone.app import security
    >>> request.params['loginform.user'] = security.ADMIN_USER
    >>> request.params['loginform.password'] = security.ADMIN_PASSWORD
    >>> request.params['action.loginform.login'] = '1'
    >>> res = render_tile(root, request, 'loginform')
    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

Login
=====

Prepare::

    >>> from cone.app import get_root
    >>> from cone.app import security
    >>> from cone.app.browser.login import forbidden_view
    >>> from cone.app.browser.login import login_view
    >>> from cone.app.browser.login import logout_view
    >>> from cone.app.model import BaseNode
    >>> from cone.tile import render_tile

    >>> root = get_root()
    >>> request = layer.new_request()

Test login view callable::

    >>> login_view(root, request)
    <Response at ... 200 OK>

Test logout view callable::

    >>> logout_view(root, request)
    <HTTPFound at ... 302 Found>

Test logout tile::

    >>> layer.login('admin')
    >>> request = layer.new_request()
    >>> res = render_tile(root, request, 'logout')
    >>> request.response.headers
    ResponseHeaders([('Set-Cookie', 
    'auth_tkt=""; Path=/; Max-Age=0; Expires=...'), 
    ('Set-Cookie', 'auth_tkt=""; Path=/; Domain=testcase; Max-Age=0; Expires=...'), 
    ('Set-Cookie', 'auth_tkt=""; Path=/; Domain=.testcase; Max-Age=0; Expires=...')])

    >>> layer.logout()

Test forbidden view::

    >>> request = layer.new_request()
    >>> request.context = BaseNode()
    >>> res = forbidden_view(request).body
    >>> res.find('id="input-loginform-login"') > -1
    True

Render login form::

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

    >>> request.params['loginform.user'] = security.ADMIN_USER
    >>> request.params['loginform.password'] = security.ADMIN_PASSWORD
    >>> request.params['action.loginform.login'] = '1'
    >>> res = render_tile(root, request, 'loginform')
    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

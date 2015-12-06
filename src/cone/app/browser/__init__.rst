Imports::

    >>> from cone.app import root
    >>> from cone.app.browser import forbidden_view
    >>> from cone.app.browser import login_view
    >>> from cone.app.browser import logout_view
    >>> from cone.app.browser import main_view
    >>> from cone.app.browser import render_main_template
    >>> from cone.app.model import BaseNode

Test render_main_template::

    >>> request = layer.new_request()
    >>> render_main_template(root, request)
    <Response at ... 200 OK>

Test default view callable::

    >>> main_view(root, request)
    <Response at ... 200 OK>

Test login view callable::

    >>> login_view(root, request)
    <Response at ... 200 OK>

Test logout view callable::

    >>> logout_view(root, request)
    <HTTPFound at ... 302 Found>

Test forbidden view::

    >>> request.context = BaseNode()
    >>> res = forbidden_view(request).body
    >>> res.find('id="input-loginform-login"') > -1
    True

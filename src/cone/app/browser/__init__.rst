Import root and create dummy request::

    >>> from cone.app import root
    >>> request = layer.new_request()

Test render_main_template::

    >>> from cone.app.browser import render_main_template
    >>> render_main_template(root, request)
    <Response at ... 200 OK>

Test default view callable::

    >>> from cone.app.browser import main_view
    >>> main_view(root, request)
    <Response at ... 200 OK>

Test login view callable::

    >>> from cone.app.browser import login_view
    >>> login_view(root, request)
    <Response at ... 200 OK>

Test logout view callable::

    >>> from cone.app.browser import logout_view
    >>> logout_view(root, request)
    <HTTPFound at ... 302 Found>

Test forbidden view::

    >>> from cone.app.browser import forbidden_view
    >>> from cone.app.model import BaseNode
    >>> request.context = BaseNode()
    >>> res = forbidden_view(request).body
    >>> res.find('id="input-loginform-login"') > -1
    True

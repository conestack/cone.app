Prepare::

    >>> from cone.app import get_root
    >>> from cone.app.browser import main_view
    >>> from cone.app.browser import render_main_template

    >>> root = get_root()
    >>> request = layer.new_request()

Test ``render_main_template``::

    >>> render_main_template(root, request)
    <Response at ... 200 OK>

Test ``main_view`` default view callable::

    >>> main_view(root, request)
    <Response at ... 200 OK>

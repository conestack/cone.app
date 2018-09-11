Exceptions
==========

Prepare::

    >>> from cone.app import get_root
    >>> from cone.app.browser.exception import forbidden_view
    >>> from cone.app.browser.exception import internal_server_error
    >>> from cone.app.browser.exception import not_found_view
    >>> from cone.app.model import BaseNode


Internal Server Error
---------------------

When requests are performed, and an uncaught exception is raised,
``internal_server_error`` view is invoked. Response either represents an
error page or a JSON response containing bdajax continuation definitions which
display the traceback in an error dialog if request was a bdajax action::

    >>> request = layer.new_request()
    >>> str(internal_server_error(request))
    '200 OK\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Length: 
    120\r\n\r\n\n<h1>An error occured</h1>\n<p>\n  <a href="/">HOME</a>\n  
    <hr />\n</p>\n<pre>Traceback (most recent call last):\nNone\n</pre>\n'

    >>> request = layer.new_request(xhr=1)
    >>> str(internal_server_error(request))
    '200 OK\r\nContent-Length: 195\r\nContent-Type: 
    application/json...\r\n\r\n{"continuation": 
    [{"flavor": "error", "type": "message", 
    "payload": "<pre>Traceback (most recent call last):\\nNone\\n</pre>", 
    "selector": null}], "payload": "", "mode": "NONE", "selector": "NONE"}'

    >>> layer.login('admin')
    >>> request = layer.new_request()

    >>> str(internal_server_error(request))
    '200 OK\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Length: 
    120\r\n\r\n\n<h1>An error occured</h1>\n<p>\n  <a href="/">HOME</a>\n  
    <hr />\n</p>\n<pre>Traceback (most recent call last):\nNone\n</pre>\n'

    >>> request = layer.new_request(xhr=1)
    >>> str(internal_server_error(request))
    '200 OK\r\nContent-Length: 195\r\nContent-Type: 
    application/json...\r\n\r\n{"continuation": 
    [{"flavor": "error", "type": "message", 
    "payload": "<pre>Traceback (most recent call last):\\nNone\\n</pre>", 
    "selector": null}], "payload": "", "mode": "NONE", "selector": "NONE"}'

    >>> layer.logout()


Forbidden View
--------------

::

    >>> root = get_root()
    >>> model = root['model'] = BaseNode()

    >>> request = layer.new_request()
    >>> request.context = model
    >>> res = forbidden_view(request).body
    >>> res.find('id="input-loginform-login"') > -1
    True

    >>> layer.login('admin')
    >>> request = layer.new_request()
    >>> request.context = model
    >>> res = forbidden_view(request).body
    >>> res.find('<h1>Unauthorized</h1>') > -1
    True

    >>> del root['model']

    >>> layer.logout()


Not Found View
--------------

::

    >>> root = get_root()
    >>> model = root['model'] = BaseNode()
    >>> request = layer.new_request()
    >>> request.context = model
    >>> res = not_found_view(request).body
    >>> res.find('<h1>Not Found</h1>') > -1
    True

    >>> layer.login('admin')
    >>> request = layer.new_request()
    >>> request.context = model
    >>> res = not_found_view(request).body
    >>> res.find('<h1>Not Found</h1>') > -1
    True

    >>> del root['model']

    >>> layer.logout()

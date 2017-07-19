Exceptions
----------

When requests are performed, and an uncaught exception is raised,
``internal_server_error`` view is invoked. Response either represents an
error page or a JSON response containing bdajax continuation definitions which
display the traceback in an error dialog if request was a bdajax action::

    >>> from cone.app.browser.exception import internal_server_error

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

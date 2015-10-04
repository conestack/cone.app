from pyramid.response import Response
from pyramid.view import view_config
import json
import sys
import traceback


def format_traceback():
    etype, value, tb = sys.exc_info()
    ret = ''.join(traceback.format_exception(etype, value, tb))
    return '<pre>%s</pre>' % ret


ERROR_PAGE = """
<h1>An error occured</h1>
<p>
  <a href="/">HOME</a>
  <hr />
</p>
%(error)s
"""


@view_config(context=Exception)
def internal_server_error(request):
    tb = format_traceback()
    if not request.is_xhr:
        return Response(ERROR_PAGE % {'error': tb})
    from cone.app.browser.ajax import (
        AjaxContinue,
        AjaxMessage,
    )
    continuation = AjaxContinue([AjaxMessage(tb, 'error', None)]).definitions
    ret = {
        'mode': 'NONE',
        'selector': 'NONE',
        'payload': '',
        'continuation': continuation,
    }
    response = Response(json.dumps(ret))
    response.content_type = 'application/json'
    return response

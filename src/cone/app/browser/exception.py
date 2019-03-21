from cone.app.browser import render_main_template
from cone.app.browser.login import login_view
from cone.app.browser.utils import format_traceback
from cone.tile import Tile
from cone.tile import tile
from pyramid.httpexceptions import HTTPForbidden
from pyramid.httpexceptions import HTTPNotFound
from pyramid.response import Response
from pyramid.view import view_config
import json


###############################################################################
# Internal Server Error
###############################################################################

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
    """Internal server error view.
    """
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


###############################################################################
# Unauthorized
###############################################################################

@tile(name='unauthorized', path='templates/unauthorized.pt', permission='login')
class UnauthorizedTile(Tile):
    """Unauthorized tile.
    """


@view_config(context=HTTPForbidden)
def forbidden_view(request):
    """Unauthorized view.
    """
    model = request.context
    if not request.authenticated_userid:
        return login_view(model, request)
    return render_main_template(model, request, contenttile='unauthorized')


###############################################################################
# Not Found
###############################################################################

@tile(name='not_found', path='templates/not_found.pt', permission='login')
class NotFoundTile(Tile):
    """Not Found tile.
    """


@view_config(context=HTTPNotFound)
def not_found_view(request):
    """Not Found view.
    """
    model = request.context
    return render_main_template(model, request, contenttile='not_found')

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
        # XXX: request.response.status = 500
        #      return {'errors': error_dict}
        return Response(ERROR_PAGE % {'error': tb})
    # XXX: Check request relates to bdajax action
    #      Check if json request and modify response as needed
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


@view_config(context=HTTPForbidden, accept='text/html')
def forbidden_view(request):
    """Unauthorized view.
    """
    model = request.context
    if not request.authenticated_userid:
        return login_view(model, request)
    return render_main_template(model, request, contenttile='unauthorized')


@view_config(
    context=HTTPForbidden,
    accept='application/json',
    renderer='json')
def json_forbidden_view(request):
    request.response.status = 403
    return {}


###############################################################################
# Not Found
###############################################################################

@tile(name='not_found', path='templates/not_found.pt', permission='login')
class NotFoundTile(Tile):
    """Not Found tile.
    """


@view_config(context=HTTPNotFound, accept='text/html')
def not_found_view(request):
    """Not Found view.
    """
    model = request.context
    return render_main_template(model, request, contenttile='not_found')


@view_config(
    context=HTTPNotFound,
    accept='application/json',
    renderer='json')
def json_not_found_view(request):
    request.response.status = 404
    return {}

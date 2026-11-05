from cone.app.browser import render_main_template
from cone.app.browser.login import login_view
from cone.app.browser.utils import client_error_message
from cone.tile import Tile
from cone.tile import tile
from pyramid.httpexceptions import HTTPForbidden
from pyramid.httpexceptions import HTTPNotFound
from pyramid.response import Response
from pyramid.view import view_config
import json
import logging


logger = logging.getLogger('cone.app')


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

    Answers with status 500, a commit veto of a transaction manager decides by
    the status.
    """
    logger.exception('Error while processing request')
    message = client_error_message(request)
    if not request.is_xhr:
        return Response(ERROR_PAGE % {'error': message}, status=500)
    # XXX: Check request relates to ajax action
    #      Check if json request and modify response as needed
    from cone.app.browser.ajax import AjaxContinue
    from cone.app.browser.ajax import AjaxMessage

    continuation = AjaxContinue([AjaxMessage(message, 'error', None)])
    ret = {
        'mode': 'NONE',
        'selector': 'NONE',
        'payload': '',
        'continuation': continuation.operations,
    }
    response = Response(json.dumps(ret), status=500)
    response.content_type = 'application/json'
    return response


###############################################################################
# Unauthorized
###############################################################################


@tile(name='unauthorized', path='templates/unauthorized.pt', permission='login')
class UnauthorizedTile(Tile):
    """Unauthorized tile."""


@view_config(context=HTTPForbidden, accept='text/html')
def forbidden_view(request):
    """Unauthorized view."""
    model = request.context
    if not request.authenticated_userid:
        return login_view(model, request)
    return render_main_template(model, request, contenttile='unauthorized')


@view_config(context=HTTPForbidden, accept='application/json', renderer='json')
def json_forbidden_view(request):
    request.response.status = 403
    return {}


###############################################################################
# Not Found
###############################################################################


@tile(name='not_found', path='templates/not_found.pt', permission='login')
class NotFoundTile(Tile):
    """Not Found tile."""


@view_config(context=HTTPNotFound, accept='text/html')
def not_found_view(request):
    """Not Found view."""
    model = request.context
    return render_main_template(model, request, contenttile='not_found')


@view_config(context=HTTPNotFound, accept='application/json', renderer='json')
def json_not_found_view(request):
    request.response.status = 404
    return {}

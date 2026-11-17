from cone.app.browser import render_main_template
from cone.app.browser.layout import AccessDeniedTile
from cone.app.browser.layout import ErrorStateTile
from cone.app.browser.login import login_view
from cone.app.browser.utils import client_error_message
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


@tile(name='unauthorized', path='templates/access_denied.pt', permission='login')
class UnauthorizedTile(AccessDeniedTile):
    """The page of a forbidden view - despite the name, for a logged in user."""


@view_config(context=HTTPForbidden, accept='text/html')
def forbidden_view(request):
    """Forbidden view.

    Anonymous users get the login form, logged in users the access denied page
    with status 403 - rendered into a response of its own, it would say 200.
    """
    model = request.context
    if not request.authenticated_userid:
        return login_view(model, request)
    response = render_main_template(model, request, contenttile='unauthorized')
    response.status_int = 403
    return response


@view_config(context=HTTPForbidden, accept='application/json', renderer='json')
def json_forbidden_view(request):
    request.response.status = 403
    return {}


###############################################################################
# Not Found
###############################################################################


@tile(name='not_found', path='templates/not_found.pt', permission='login')
class NotFoundTile(ErrorStateTile):
    """Not Found tile."""


@view_config(context=HTTPNotFound, accept='text/html')
def not_found_view(request):
    """Not Found view.

    Rendered within the page of the nearest existing node, answered with
    status 404 - the page is rendered into a response of its own, which
    would say 200 and tell crawlers and monitoring the address exists. An
    anonymous user who may not view that node gets the login form.
    """
    model = request.context
    if not request.authenticated_userid and not request.has_permission('view', model):
        # Not found may mean not visible before the login: an expired or
        # invalidated ticket, a traversal that hides what the user may not
        # see. Every such address answers the same, nothing is revealed.
        return login_view(model, request)
    response = render_main_template(model, request, contenttile='not_found')
    response.status_int = 404
    return response


@view_config(context=HTTPNotFound, accept='application/json', renderer='json')
def json_not_found_view(request):
    request.response.status = 404
    return {}

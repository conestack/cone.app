from cone.app.browser import render_main_template
from cone.app.browser.errorpage import error_page
from cone.app.browser.errorpage import mark_error_page
from cone.app.browser.errorpage import RenderErrorPage
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
# Error pages
###############################################################################


@tile(name='unauthorized', path='templates/access_denied.pt', permission='login')
class UnauthorizedTile(AccessDeniedTile):
    """The page of a forbidden view - despite the name, for a logged in user."""


@tile(name='not_found', path='templates/not_found.pt', permission='login')
class NotFoundTile(ErrorStateTile):
    """Not Found tile."""


def render_error_page(model, request, tile, status):
    """Render the error page with content tile ``tile`` as response.

    Within the page of ``model`` - the node the traversal ended at - with a
    layout of its own (``error_page_tile``). The status is set on the
    response: the page is rendered into a response of its own, which would
    say 200 and tell crawlers and monitoring the address exists.
    """
    mark_error_page(request, tile)
    response = render_main_template(model, request, contenttile=tile)
    response.status_int = status
    return response


@view_config(context=HTTPForbidden, accept='text/html')
@view_config(context=HTTPNotFound, accept='text/html')
@view_config(context=RenderErrorPage, accept='text/html')
def error_page_view(error, request):
    """The error page of ``error`` (``errorpage.error_page``).

    Anonymous users the login comes first for get the login form: refused, or
    not found where they may not view the node the traversal ended at.
    """
    page = error_page(request, error)
    if page is None:
        return login_view(request.context, request)
    tile, status = page
    return render_error_page(request.context, request, tile, status)


@view_config(context=HTTPForbidden, accept='application/json', renderer='json')
def json_forbidden_view(request):
    request.response.status = 403
    return {}


@view_config(context=HTTPNotFound, accept='application/json', renderer='json')
def json_not_found_view(request):
    request.response.status = 404
    return {}


@view_config(context=RenderErrorPage, accept='application/json', renderer='json')
def json_error_page_view(error, request):
    request.response.status = error.code
    return {}

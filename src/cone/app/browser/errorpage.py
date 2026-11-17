"""Error pages - raised where the knowledge is, rendered in one place.

A traversal that finds nothing, a view or a content tile the user may not see,
an application state such as a membership without a role: whoever knows raises,
and the exception views (``cone.app.browser.exception``) or ``ajax_tile``
render the page. The page is the page of the error, not of the context: it
names its content tile and its status, and the layout leaves out what belongs
to the context - its sidebars, its content width.

No browser imports here: the ajax, layout and exception modules all depend on
this one.
"""

from pyramid.httpexceptions import HTTPException
from pyramid.httpexceptions import HTTPForbidden
from pyramid.httpexceptions import HTTPNotFound


ERROR_PAGE = 'cone.app.error_page'
"""Key in ``request.environ``: the content tile of the error page the request
renders. Set by ``render_error_page`` before the layout renders."""


class RenderErrorPage(HTTPException):
    """Show an error page instead of the page requested.

    Applications subclass it per kind of page and set ``code`` and ``title``
    (the HTTP status) and ``tile``, the content tile rendering the page::

        class MembershipPending(RenderErrorPage):
            code = 403
            title = 'Forbidden'
            tile = 'membership_pending'

    Rendered for anonymous users too: unlike ``HTTPForbidden`` it is no
    refusal that a login could lift.
    """

    tile = None


def error_page(request, error):
    """The error page ``error`` stands for, or None.

    :param request: The current request.
    :param error: The exception raised.
    :return: Tuple of content tile name and status, or None - for an
        anonymous user refused, whom the login comes first, and for anything
        that is no error page.
    """
    if isinstance(error, RenderErrorPage):
        return error.tile, error.code
    authenticated = request.authenticated_userid is not None
    if isinstance(error, HTTPForbidden):
        return ('unauthorized', 403) if authenticated else None
    if isinstance(error, HTTPNotFound):
        # Not found may mean not visible before the login: an expired or
        # invalidated ticket, a traversal that hides what the user may not
        # see. Every such address answers the same, nothing is revealed.
        if authenticated or request.has_permission('view', request.context):
            return 'not_found', 404
    return None


def mark_error_page(request, tile):
    """Mark ``request`` as rendering the error page of content tile ``tile``."""
    request.environ[ERROR_PAGE] = tile


def error_page_tile(request):
    """The content tile of the error page ``request`` renders, or None."""
    return request.environ.get(ERROR_PAGE)

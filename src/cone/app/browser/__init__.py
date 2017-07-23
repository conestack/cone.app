from cone.app.browser.actions import ActionContext
from cone.tile import render_template_to_response
from plumber import Behavior
from plumber import default
from plumber import plumb
from pyramid.static import static_view
from pyramid.view import view_config
import cone.app
import yafowil.loader
import yafowil.webob


static_resources = static_view('static', use_subpath=True)


def render_main_template(model, request, contenttile='content'):
    """Renders main template and return response object.

    As main content the tile with name contenttile is rendered.
    """
    ActionContext(model, request, contenttile)
    return render_template_to_response(
        cone.app.cfg.main_template,
        request=request,
        model=model
    )


@view_config(permission='login')
def main_view(model, request):
    """Default view.
    """
    return render_main_template(model, request)


###############################################################################
# Related view support
###############################################################################

def set_related_view(request, view_name):
    """Store related view name on request.

    :param request: HTTP request instance
    :param view_name: View name related to this HTTP request
    """
    request.environ['cone.app.related_view'] = view_name


def get_related_view(request):
    """Return related view name from request.

    :param request: HTTP request instance
    """
    return request.environ.get('cone.app.related_view', None)


class RelatedViewProvider(Behavior):
    """Plumbing behavior for providing related view name.

    This behavior can be applied on tiles and is supposed to be used to set
    a related view name for the current request.

    This related view name can be used then by nested tiles to create browser
    URLs.
    """

    related_view = default(None)
    """Related view name to set on request.
    """

    @plumb
    def __call__(_next, self, model, request):
        """Set related view on request and call downstream function.
        """
        set_related_view(request, self.related_view)
        return _next(self, model, request)


class RelatedViewConsumer(Behavior):
    """Plumbing behavior for consuming related view name.

    This behavior can be applied on tiles and is supposed to be used on
    generic tiles for considering the current view name when creating browser
    URLs.

    This is useful for proper browser path and history support and for setting
    correct link href while keeping ajax targets sane.
    """

    @default
    @property
    def related_view(self):
        """Return related view name from request.
        """
        return get_related_view(self.request)

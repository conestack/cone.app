from cone.app.browser.actions import ActionContext
from cone.tile import render_template_to_response
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

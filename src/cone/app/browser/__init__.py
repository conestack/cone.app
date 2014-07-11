import yafowil.webob
import yafowil.loader
from webob.exc import HTTPFound
from pyramid.httpexceptions import HTTPForbidden
from pyramid.security import forget
from pyramid.static import static_view
from pyramid.view import view_config
from cone.tile import (
    render_template_to_response,
    render_tile,
)
import cone.app
from .actions import ActionContext


static_resources = static_view('static', use_subpath=True)


def render_main_template(model, request, contenttile='content'):
    """Renders main template and return response object.

    As main content the tile with name contenttile is rendered.
    """
    action_context = ActionContext(model, request, contenttile)
    contenttile = action_context.scope
    request.environ['contenttile'] = contenttile
    # XXX: contenttile passed only for B/C reasons
    return render_template_to_response(cone.app.cfg.main_template,
                                       request=request,
                                       model=model,
                                       contenttile=contenttile)


@view_config(permission='login')
def main_view(model, request):
    return render_main_template(model, request)


@view_config('login')
def login_view(model, request):
    return render_main_template(model, request, contenttile='loginform')


@view_config('logout')
def logout_view(model, request):
    headers = forget(request)
    location = request.params.get('came_from', request.application_url)
    return HTTPFound(location=location, headers=headers)


@view_config(context=HTTPForbidden)
def forbidden_view(request):
    return login_view(request.context, request)

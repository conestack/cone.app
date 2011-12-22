import yafowil.webob
import yafowil.loader
import yafowil.widget.datetime
import yafowil.widget.richtext
import yafowil.widget.dict
import yafowil.widget.array
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
from cone.app.browser.utils import AppUtil
from cone.app.browser.actions import ActionContext


static_resources = static_view('static', use_subpath=True)


def render_main_template(model, request, contenttilename='content'):
    """Renders main template and return response object.
    
    As main content the tile with name contenttilename is rendered.
    """
    action_context = ActionContext(model, request, contenttilename)
    contenttilename = action_context.scope
    util = AppUtil()
    return render_template_to_response(cone.app.cfg.main_template,
                                       request=request,
                                       model=model,
                                       util=util,
                                       layout=cone.app.cfg.layout,
                                       contenttilename=contenttilename)


@view_config(permission='login')
def main_view(model, request):
    return render_main_template(model, request)


@view_config('login')
def login_view(model, request):
    return render_main_template(model, request, contenttilename='loginform')


@view_config('logout')
def logout_view(model, request):
    headers = forget(request)
    location = request.params.get('came_from', request.application_url)
    return HTTPFound(location=location, headers=headers)


@view_config(context=HTTPForbidden)
def forbidden_view(request):
    return login_view(request.context, request)

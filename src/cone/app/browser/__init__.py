import yafowil.webob
import yafowil.loader
import yafowil.widget.datetime
import yafowil.widget.richtext
import yafowil.widget.dict
from webob.exc import HTTPFound
from pyramid.security import forget
from pyramid.view import (
    static,
    view_config,
)
from cone.tile import (
    render_template_to_response,
    render_tile,
)
import cone.app
from cone.app.browser.utils import AppUtil

# static resources
static_view = static('static')


def render_main_template(model, request, contenttilename='content'):
    """Renders main template and return response object.
    
    As main content the tile with name contenttilename is rendered.
    """
    util = AppUtil()
    return render_template_to_response(cone.app.settings.ui.main_template,
                                       request=request,
                                       model=model,
                                       util=util,
                                       layout=cone.app.settings.ui.layout,
                                       contenttilename=contenttilename)


@view_config(permission='login')
def main(model, request):
    return render_main_template(model, request)


@view_config('login')
def login(model, request):
    return render_main_template(model, request, contenttilename='loginform')


@view_config('logout')
def logout(context, request):
    headers = forget(request)
    location = request.params.get('came_from', request.application_url)
    return HTTPFound(location=location, headers=headers)

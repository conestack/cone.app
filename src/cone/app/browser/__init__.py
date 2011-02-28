import yafowil.webob
import yafowil.loader
import yafowil.widget.datetime
import yafowil.widget.richtext
import yafowil.widget.dict
from webob.exc import HTTPUnauthorized
from pyramid.view import (
    static,
    view_config,
)
from cone.tile import (
    render_template_to_response,
    render_tile,
)
from cone.app.browser.utils import (
    authenticated,
    AppUtil,
)

# main template. Overwrite to customize
MAIN_TEMPLATE = 'cone.app.browser:templates/main.pt'

# append to this list additional relative css file URL's
ADDITIONAL_CSS = []

# static resources
static_view = static('static')


def render_main_template(model, request, contenttilename='content'):
    """Renders main template and return response object.
    
    As main content the tile with name contenttilename is rendered.
    """
    apputil = AppUtil()
    apputil.additional_css = ADDITIONAL_CSS
    return render_template_to_response(MAIN_TEMPLATE,
                                       request=request,
                                       model=model,
                                       util=apputil,
                                       contenttilename=contenttilename,
                                       project='BDA DB Backend')


@view_config(permission='login')
def main(model, request):
    return render_main_template(model, request)


@view_config('logout')
def logout(context, request):
    return HTTPUnauthorized(headers=[('Location', request.application_url)])
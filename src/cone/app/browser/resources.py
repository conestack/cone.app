from cone.app.utils import app_config
from cone.tile import Tile
from cone.tile import tile
from pyramid.security import authenticated_userid
from pyramid.view import view_config
from webob import Response
import cone.app
import os
import pkg_resources


def is_remote_resource(resource):
    return resource.startswith('http://') \
        or resource.startswith('https://') \
        or resource.startswith('//')


class MergedAssets(object):

    def __init__(self, request):
        self.request = request

    def merged_assets(self, assets):
        if authenticated_userid(self.request):
            assets = assets.public + assets.protected
        else:
            assets = assets.public
        data = ''
        for view, subpath in assets:
            path = pkg_resources.resource_filename(
                view.package_name,
                os.path.join(view.docroot, subpath)
            )
            with open(path, 'r') as asset:
                data += asset.read() + '\n\n'
        return data

    @property
    def merged_js(self):
        return self.merged_assets(cone.app.cfg.merged.js)

    @property
    def merged_css(self):
        return self.merged_assets(cone.app.cfg.merged.css)

    @property
    def merged_print_css(self):
        return self.merged_assets(cone.app.cfg.merged.print_css)


@view_config(name='cone.js')
def cone_js(model, request):
    assets = MergedAssets(request)
    return Response(assets.merged_js)


@view_config(name='cone.css')
def cone_css(model, request):
    assets = MergedAssets(request)
    response = Response(assets.merged_css)
    response.headers['Content-Type'] = 'text/css'
    return response


@view_config(name='print.css')
def print_css(model, request):
    assets = MergedAssets(request)
    response = Response(assets.merged_print_css)
    response.headers['Content-Type'] = 'text/css'
    return response


@tile('resources', 'templates/resources.pt', permission='login')
class Resources(Tile):
    """Resources tile.

    XXX: either switch to resource management lib here or use resource
         management middleware.
    """

    @property
    def authenticated(self):
        return authenticated_userid(self.request)

    @property
    def js(self):
        return self.resources(app_config().js)

    @property
    def css(self):
        return self.resources(app_config().css)

    def resources(self, reg):
        ret = list()
        for res in reg['public']:
            ret.append(self.resource_url(res))
        if self.authenticated:
            for res in reg['protected']:
                ret.append(self.resource_url(res))
        return ret

    def resource_url(self, resource):
        if is_remote_resource(resource):
            return resource
        return '%s/%s' % (self.request.application_url, resource)

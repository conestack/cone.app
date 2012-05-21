from pyramid.view import view_config
from pyramid.security import authenticated_userid
from cone.tile import (
    tile,
    Tile,
)
from cone.app.utils import app_config


class MergedResources(object):
    
    def __init__(self, request):
        self.request = request


@view_config('cone.js')
def cone_js(model, request):
    pass


@view_config('cone.css')
def cone_css(model, request):
    pass


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
        if resource.startswith('http'):
            return resource
        return '%s/%s' % (self.request.application_url, resource)
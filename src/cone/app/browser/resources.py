from cone.app.browser.ajax import ajax_continue
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.ajax import AjaxPath
from cone.app.model import AppResources
from cone.app.utils import app_config
from cone.tile import Tile
from cone.tile import tile
from pyramid.httpexceptions import HTTPFound
from pyramid.static import static_view
from pyramid.threadlocal import get_current_request
from pyramid.view import view_config
from webob import Response
from yafowil.base import factory
from yafowil.bootstrap import configure_factory
import cone.app
import os
import pkg_resources
import sys
import treibstoff
import webresource as wr


cone_static_view = static_view('static', use_subpath=True)


def include_authenticated():
    return get_current_request().authenticated_userid


resources_dir = os.path.join(os.path.dirname(__file__), 'static')
resources = wr.ResourceGroup(name='resources')


# jquery
jquery_resources = wr.ResourceGroup(
    name='jquery',
    directory=os.path.join(resources_dir, 'jquery'),
    path='jquery',
    group=resources
)
jquery_resources.add(wr.ScriptResource(
    name='jquery-js',
    resource='jquery-3.6.0.js',
    compressed='jquery-3.6.0.min.js'
))


# bootstrap
bootstrap_resources = wr.ResourceGroup(
    name='bootstrap',
    directory=os.path.join(resources_dir, 'bootstrap'),
    path='bootstrap',
    group=resources
)
bootstrap_resources.add(wr.ScriptResource(
    name='bootstrap-js',
    depends='jquery-js',
    directory=os.path.join(resources_dir, 'bootstrap', 'js'),
    path='bootstrap/js',
    resource='bootstrap.js',
    compressed='bootstrap.min.js'
))
bootstrap_resources.add(wr.StyleResource(
    name='bootstrap-css',
    directory=os.path.join(resources_dir, 'bootstrap', 'css'),
    path='bootstrap/css',
    resource='bootstrap.css',
    compressed='bootstrap.min.css'
))
bootstrap_resources.add(wr.StyleResource(
    name='bootstrap-theme-css',
    depends='bootstrap-css',
    directory=os.path.join(resources_dir, 'bootstrap', 'css'),
    path='bootstrap/css',
    resource='bootstrap-theme.css',
    compressed='bootstrap-theme.min.css'
))


# typeahead
typeahead_resources = wr.ResourceGroup(
    name='typeahead',
    directory=os.path.join(resources_dir, 'typeahead'),
    path='typeahead',
    group=resources
)
typeahead_resources.add(wr.ScriptResource(
    name='typeahead-js',
    depends='jquery-js',
    resource='typeahead.bundle.js'
))
typeahead_resources.add(wr.StyleResource(
    name='typeahead-css',
    resource='typeahead.css'
))


# ionicons
ionicons_resources = wr.ResourceGroup(
    name='ionicons',
    directory=os.path.join(resources_dir, 'ionicons'),
    path='ionicons',
    group=resources
)
ionicons_resources.add(wr.StyleResource(
    name='ionicons-css',
    directory=os.path.join(resources_dir, 'ionicons', 'css'),
    path='ionicons/css',
    resource='ionicons.css'
))


# cone
cone_resources = wr.ResourceGroup(
    name='cone',
    directory=os.path.join(resources_dir, 'cone'),
    path='cone',
    group=resources
)
cone_resources.add(wr.ScriptResource(
    name='cone-app-public-js',
    depends='typeahead-js',
    resource='cone.public.js',
    compressed='cone.public.min.js'
))
cone_resources.add(wr.ScriptResource(
    name='cone-app-protected-js',
    depends='jquery-js',
    include=include_authenticated,
    resource='cone.protected.js',
    compressed='cone.protected.min.js'
))
cone_resources.add(wr.StyleResource(
    name='cone-app-css',
    resource='styles.css'
))
cone_resources.add(wr.StyleResource(
    name='cone-app-print-css',
    resource='print.css',
    media='print'
))


def register_resources_view(config, module, name, directory):
    resources_view = static_view(directory, use_subpath=True)
    view_name = '{}_static_view'.format(name.replace('-', '_').replace('.', '_'))
    setattr(module, view_name, resources_view)
    view_path = 'cone.app.browser.resources.{}'.format(view_name)
    config.add_view(view_path, name=name, context=AppResources)


# class YafowilResourceInclude(object):
# 
#     def __init__(self, settings):
#         resources_public = settings.get('yafowil.resources_public')
#         self.resources_public = resources_public in ['1', 'True', 'true']
# 
#     def __call__(self):
#         if self.resources_public:
#             return True
#         return include_authenticated()


def configure_resources(settings, config):
    configure_factory('bootstrap3')
    resources.add(treibstoff.resources.copy())
    for group in factory.get_resources().members:
        resources.add(group)
    handled_groups = []
    module = sys.modules[__name__]
    for group in resources.members[:]:
        if group.path in handled_groups:
            group.remove()
            continue
        register_resources_view(config, module, group.path, group.directory)
        handled_groups.append(group.path)
    handled_resources = []
    for resource in resources.scripts + resources.styles:
        if resource.name in handled_resources:
            resource.remove()
            continue
        resource.path = 'resources/{}'.format(resource.path)
        handled_resources.append(resource.name)


@tile(name='resources', path='templates/resources.pt', permission='login')
class Resources(Tile):
    """Resources tile."""

    @property
    def rendered_scripts(self):
        return wr.ResourceRenderer(
            wr.ResourceResolver(resources.scripts),
            base_url=self.request.application_url
        ).render()

    @property
    def rendered_styles(self):
        return wr.ResourceRenderer(
            wr.ResourceResolver(resources.styles),
            base_url=self.request.application_url
        ).render()


@view_config(permission='login', context=AppResources)
def resources_view(model, request):
    return HTTPFound(location=request.application_url)


@tile(name='content', interface=AppResources, permission='login')
class ResourcesContent(Tile):

    def render(self):
        url = self.request.application_url
        path = AjaxPath(path='/', target=url, event='contextchanged:#layout')
        event = AjaxEvent(target=url, name='contextchanged', selector='#layout')
        ajax_continue(self.request, [path, event])
        return u''

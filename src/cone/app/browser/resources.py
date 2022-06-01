from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.ajax import AjaxPath
from cone.app.browser.ajax import ajax_continue
from cone.app.model import AppResources
from cone.tile import Tile
from cone.tile import tile
from pyramid.httpexceptions import HTTPFound
from pyramid.static import static_view
from pyramid.threadlocal import get_current_request
from pyramid.view import view_config
from yafowil.base import factory
import logging
import os
import sys
import treibstoff
import webresource as wr


logger = logging.getLogger('cone.app')


resources_dir = os.path.join(os.path.dirname(__file__), 'static')
resources = wr.ResourceGroup(name='cone.app')


# jquery
jquery_resources = wr.ResourceGroup(
    name='cone.app-jquery',
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
    name='cone.app-bootstrap',
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
    name='cone.app-typeahead',
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
    name='cone.app-ionicons',
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
    name='cone.app-cone',
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


RESOURCE_INCLUDES_KEY = 'cone._resource_includes'


def set_resource_include(settings, name, value):
    resouce_settings = settings.setdefault(RESOURCE_INCLUDES_KEY, {})
    resouce_settings[name] = value


def configure_default_resource_includes(settings):
    # configure default inclusion of cone protectes JS
    set_resource_include(settings, 'cone-app-protected-js', 'authenticated')

    # configure default inclusion of yafowil resources
    yafowil_public = settings.get('yafowil.resources_public')
    if yafowil_public not in ['1', 'True', 'true']:
        yafowil_resources = factory.get_resources(
            copy_resources=False,
            exclude=['yafowil.bootstrap']
        )
        for resource in yafowil_resources.scripts + yafowil_resources.styles:
            set_resource_include(settings, resource.name, 'authenticated')


class ResourceInclude(object):

    def __init__(self, settings, name):
        self.settings = settings
        self.name = name

    def __call__(self):
        resouce_settings = self.settings.get(RESOURCE_INCLUDES_KEY, {})
        include = resouce_settings.get(self.name, True)
        if include == 'authenticated':
            return get_current_request().authenticated_userid
        return include


def configure_resources(settings, config, development):
    # set resource development mode
    wr.config.development = development

    # add treibstoff resources
    resources.add(treibstoff.resources.copy())

    # add and configure yafowil resources
    for group in factory.get_resources(exclude=['yafowil.bootstrap']).members:
        resources.add(group)

    # register static views for resource groups
    handled_groups = []
    module = sys.modules[__name__]
    for group in resources.members[:]:
        # ignore subsequent group in case path was defined multiple times.
        # otherwise we get an error when trying to register static view.
        if group.path in handled_groups:
            logger.warning((
                'Resource group for path "{}" already included.'
                'Skipping "{}"'
            ).format(group.path, group.name))
            group.remove()
            continue
        register_resources_view(config, module, group.path, group.directory)
        handled_groups.append(group.path)

    # configure scripts and styles contained in resources
    handled_resources = []
    for resource in resources.scripts + resources.styles:
        # ignore subsequent resource in case path was defined multiple times.
        if resource.name in handled_resources:
            logger.debug((
                'Resource with name "{}" already included. Skipping.'
            ).format(resource.name))
            resource.remove()
            continue
        if not resource.path.startswith('resources'):
            resource.path = 'resources/{}'.format(resource.path)
        resource.include = ResourceInclude(settings, resource.name)
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

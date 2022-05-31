from cone.app.model import AppResources
from cone.app.utils import app_config
from cone.tile import Tile
from cone.tile import tile
from pyramid.static import static_view
from pyramid.threadlocal import get_current_request
from pyramid.view import view_config
from webob import Response
from yafowil.base import factory
from yafowil.bootstrap import configure_factory
import cone.app
import copy
import os
import pkg_resources
import sys
import treibstoff
import warnings
import webresource as wr


cone_static_view = static_view('static', use_subpath=True)


def include_authenticated():
    return get_current_request().authenticated_userid


resources_dir = os.path.join(os.path.dirname(__file__), 'static')
resources = wr.ResourceGroup(name='cone')
resources.add(wr.ScriptResource(
    name='jquery-js',
    directory=resources_dir,
    path='resources/cone',
    resource='jquery-3.6.0.js',
    compressed='jquery-3.6.0.min.js'
))
resources.add(wr.ScriptResource(
    name='bootstrap-js',
    depends='jquery-js',
    directory=os.path.join(resources_dir, 'bootstrap', 'js'),
    path='resources/cone/bootstrap/js',
    resource='bootstrap.js',
    compressed='bootstrap.min.js'
))
resources.add(wr.StyleResource(
    name='bootstrap-css',
    directory=os.path.join(resources_dir, 'bootstrap', 'css'),
    path='resources/cone/bootstrap/css',
    resource='bootstrap.css',
    compressed='bootstrap.min.css'
))
resources.add(wr.StyleResource(
    name='bootstrap-theme-css',
    depends='bootstrap-css',
    directory=os.path.join(resources_dir, 'bootstrap', 'css'),
    path='resources/cone/bootstrap/css',
    resource='bootstrap-theme.css',
    compressed='bootstrap-theme.min.css'
))
resources.add(wr.ScriptResource(
    name='typeahead-js',
    depends='jquery-js',
    directory=os.path.join(resources_dir, 'typeahead'),
    path='resources/cone/typeahead',
    resource='typeahead.bundle.js'
))
resources.add(wr.ScriptResource(
    name='cone-app-public-js',
    depends='typeahead-js',
    directory=resources_dir,
    path='resources/cone',
    resource='cone.public.js',
    compressed='cone.public.min.js'
))
resources.add(wr.ScriptResource(
    name='cone-app-protected-js',
    depends='jquery-js',
    directory=resources_dir,
    path='resources/cone',
    include=include_authenticated,
    resource='cone.protected.js',
    compressed='cone.protected.min.js'
))
resources.add(wr.StyleResource(
    name='ionicons-css',
    directory=os.path.join(resources_dir, 'ionicons', 'css'),
    path='resources/cone/ionicons/css',
    resource='ionicons.css'
))
resources.add(wr.StyleResource(
    name='typeahead-css',
    directory=os.path.join(resources_dir, 'typeahead'),
    path='resources/cone/typeahead',
    resource='typeahead.css'
))
resources.add(wr.StyleResource(
    name='cone-app-css',
    directory=resources_dir,
    path='resources/cone',
    resource='styles.css'
))
resources.add(wr.StyleResource(
    name='cone-app-print-css',
    directory=resources_dir,
    path='resources/cone',
    resource='print.css',
    media='print'
))


def register_resources_view(config, module, name, directory):
    print(config, module, name, directory)
    resources_view = static_view(directory, use_subpath=True)
    view_name = '{}_static_view'.format(name.replace('-', '_').replace('.', '_'))
    setattr(module, view_name, resources_view)
    view_path = 'cone.app.browser.resources.{}'.format(view_name)
    config.add_view(view_path, name=name, context=AppResources)


def configure_treibstoff_resources(settings, config):
    treibstoff_resources = copy.deepcopy(treibstoff.resources)
    resources.add(treibstoff_resources)
    for member in treibstoff_resources.members:
        member.path = 'resources/{}'.format(member.path)
    register_resources_view(
        config,
        sys.modules[__name__],
        'treibstoff',
        treibstoff_resources.directory
    )


class YafowilResourceInclude(object):

    def __init__(self, settings):
        resources_public = settings.get('yafowil.resources_public')
        self.resources_public = resources_public in ['1', 'True', 'true']

    def __call__(self):
        if self.resources_public:
            return True
        return include_authenticated()


def configure_yafowil_resources(settings, config):
    configure_factory('bootstrap3')
    include = YafowilResourceInclude(settings)
    yafowil_resources = factory.get_resources()
    module = sys.modules[__name__]
    for group in yafowil_resources.members:
        resources.add(group)
        for script in group.scripts:
            script.path = 'resources/{}'.format(script.path)
            script.include = include
        for style in group.styles:
            style.path = 'resources/{}'.format(style.path)
            style.include = include
        register_resources_view(config, module, group.path, group.directory)


def configure_duplicate_resources():
    seen = []
    for script in resources.scripts:
        if script.name in seen:
            script.include = False
            seen.append(script.name)
    for style in resources.styles:
        if style.name in seen:
            style.include = False
            seen.append(style.name)


def configure_resources(settings, config):
    config.add_view(cone_static_view, name='cone', context=AppResources)
    configure_treibstoff_resources(settings, config)
    configure_yafowil_resources(settings, config)
    configure_duplicate_resources()


def bdajax_warning(attr):
    warnings.warn((
        '``bdajax.{}`` parameter received. Bdajax is no longer '
        'supported. Please migrate your code to ``treibstoff``.'
    ).format(attr))


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

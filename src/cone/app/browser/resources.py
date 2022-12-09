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

# jquery
jquery_resources = wr.ResourceGroup(
    name='cone.app-jquery',
    directory=os.path.join(resources_dir, 'jquery'),
    path='jquery'
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
    path='bootstrap'
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
    path='typeahead'
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
    path='ionicons'
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
    path='cone'
)
cone_resources.add(wr.ScriptResource(
    name='cone-app-public-js',
    depends='typeahead-js',
    resource='cone.app.public.js',
    compressed='cone.app.public.min.js'
))
cone_resources.add(wr.ScriptResource(
    name='cone-app-protected-js',
    depends='jquery-js',
    resource='cone.app.protected.js',
    compressed='cone.app.protected.min.js'
))
cone_resources.add(wr.StyleResource(
    name='cone-app-css',
    resource='cone.app.css'
))
cone_resources.add(wr.StyleResource(
    name='cone-app-print-css',
    resource='cone.app.print.css',
    media='print'
))


class ResourceInclude(object):

    def __init__(self, settings, name):
        self.settings = settings
        self.name = name

    def __call__(self):
        include = self.settings.get(self.name, True)
        if include == 'authenticated':
            return bool(get_current_request().authenticated_userid)
        return include


# Registry singleton
_registry = None


class ResourceRegistry(object):
    """Resource registry."""

    default_excludes = [
        'yafowil.bootstrap'
    ]
    """List of resource names which gets excluded by default."""

    resources = None
    """``webresource.ResourceGroup`` instance containing configured resources.

    Gets set from ``configure_resources``.
    """

    def __init__(self, settings):
        self._settings = settings
        self._includes = {}
        self._resources = wr.ResourceGroup(name='cone.app')

    @classmethod
    def initialize(cls, config, settings):
        global _registry
        _registry = reg = cls(settings)

        config.add_directive('register_resource', reg.register_resource)
        config.add_directive('set_resource_include', reg.set_resource_include)
        config.add_directive(
            'configure_default_resource_includes',
            reg.configure_default_resource_includes
        )
        config.add_directive('configure_resources', reg.configure_resources)

        # register default resources
        config.register_resource(jquery_resources)
        config.register_resource(bootstrap_resources)
        config.register_resource(typeahead_resources)
        config.register_resource(ionicons_resources)
        config.register_resource(cone_resources)

    def register_resource(self, config, resource):
        """Register resource in registry.

        This function is a pyramid configurator directive, thus automatically
        gets passed the configurator instance. The only argument a user
        has to pass is the resource. Resource registration happens at
        application initialization time and normally is done from inside a
        plugin ``main_hook``.

        .. code-block:: python

            from cone.app import main_hook
            import webresource as wr

            res = wr.ResourceGroup()

            @main_hook
            def initialize_plugin(config, global_config, settings)
                config.register_resource(res)

        :param resource: Either a ``webresource.Resource`` deriving object or
            a ``webresource.ResourceGroup`` instance.
        """
        self._resources.add(resource)

    def set_resource_include(self, config, name, value):
        """Configure inclusion of specific resource.

        This function is a pyramid configurator directive, thus automatically
        gets passed the configurator instance. The only arguments a user
        has to pass are name and value. Configuration of resource inclusion
        happens at application initialization time and normally is done from
        inside a plugin ``main_hook``.

        :param name: Name if the resource to configure inclusion as string.
        :param value: Inclusion setting. Either ``True``, ``False`` or
            ``'authenticated'``.
        """
        self._includes[name] = value

    def configure_default_resource_includes(self, config):
        """Configure default resource includes.

        This function is a pyramid configurator directive and gets called from
        ``cone.app.main``.
        """
        # configure default inclusion of cone protectes JS
        self.set_resource_include(
            config,
            'cone-app-protected-js',
            'authenticated'
        )

        # configure default inclusion of yafowil resources
        yafowil_public = self._settings.get('yafowil.resources_public')
        if yafowil_public not in ['1', 'True', 'true']:
            yafowil_resources = factory.get_resources(
                copy_resources=False,
                exclude=self.default_excludes
            )
            for resource in yafowil_resources.scripts + yafowil_resources.styles:
                self.set_resource_include(
                    config,
                    resource.name,
                    'authenticated'
                )

    def configure_resources(self, config, development):
        """Configure resources.

        This function is a pyramid configurator directive and gets called from
        ``cone.app.main``.
        """
        # set resource development mode
        wr.config.development = development

        # copy registered resources
        resources = self._resources.copy()

        # add treibstoff resources
        resources.add(treibstoff.resources.copy())

        # add and configure yafowil resources
        for group in factory.get_resources(exclude=self.default_excludes).members:
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
            if not group.path or not group.directory:  # pragma: no cover
                logger.warning((
                    'Resource group "{}" path or directory '
                    'missing. Skip configuration'
                ).format(group.name))
                group.remove()
                continue
            self._register_resources_view(
                config,
                module,
                group.path,
                group.directory
            )
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
            resource.path = 'resources/{}'.format(resource.path)
            resource.include = ResourceInclude(self._includes, resource.name)
            handled_resources.append(resource.name)

        # Set configured resources for subsequenct access from resource views.
        self.resources = resources

    def _register_resources_view(self, config, module, name, directory):
        resources_view = static_view(directory, use_subpath=True)
        view_name = '{}_static_view'.format(
            name.replace('-', '_').replace('.', '_')
        )
        setattr(module, view_name, resources_view)
        view_path = 'cone.app.browser.resources.{}'.format(view_name)
        config.add_view(view_path, name=name, context=AppResources)


@tile(name='resources', path='templates/resources.pt', permission='login')
class Resources(Tile):
    """Resources tile."""

    @property
    def rendered_scripts(self):
        global _registry
        return wr.ResourceRenderer(
            wr.ResourceResolver(_registry.resources.scripts),
            base_url=self.request.application_url
        ).render()

    @property
    def rendered_styles(self):
        global _registry
        return wr.ResourceRenderer(
            wr.ResourceResolver(_registry.resources.styles),
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

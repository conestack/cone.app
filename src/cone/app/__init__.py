# -*- coding: utf-8 -*-
from cone.app.browser import static_resources
from cone.app.interfaces import ILayout
from cone.app.model import AppRoot
from cone.app.model import AppSettings
from cone.app.model import Layout
from cone.app.model import Properties
from cone.app.utils import format_traceback
from node.ext.ugm.file import Ugm as FileUgm
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.config import Configurator
from pyramid.static import static_view
from yafowil.resources import YafowilResources as YafowilResourcesBase
from zope.component import adapter
from zope.component import getGlobalSiteManager
from zope.deprecation import deprecated
from zope.interface import implementer
from zope.interface import Interface
import logging
import pyramid_chameleon
import pyramid_zcml


logger = logging.getLogger('cone.app')

# configuration
cfg = Properties()

# authentication provider (expect ``node.ext.ugm.Ugm`` API)
cfg.auth = None

# used main template
cfg.main_template = 'cone.app.browser:templates/main.pt'

# default node icon
cfg.default_node_icon = 'glyphicon glyphicon-asterisk'

# XXX: move resource registration to browser package
# XXX: support developmenet and production mode

# JS resources
cfg.js = Properties()
cfg.js.public = [
    '++resource++bdajax/overlay.js',
    '++resource++bdajax/bdajax.js',
    '++resource++bdajax/bdajax_bs3.js',
    'static/public.js'
]
cfg.js.protected = [
    'static/protected.js'
]

# CSS Resources
cfg.css = Properties()

# development
cfg.css.public = [
    'static/jqueryui/jquery-ui-1.10.3.custom.css',
    'static/bootstrap/css/bootstrap.css',
    'static/bootstrap/css/bootstrap-theme.css',
    'static/ionicons/css/ionicons.css',
    'static/typeahead/typeahead.css',
    '++resource++bdajax/bdajax_bs3.css',
    'static/styles.css'
]

# production
# cfg.css.public = [
#     'static/jqueryui/jquery-ui-1.10.3.custom.css',
#     'static/bootstrap/css/bootstrap.min.css',
#     'static/bootstrap/css/bootstrap-theme.min.css',
#     'static/ionicons/css/ionicons.css',
#     'static/typeahead/typeahead.css',
#     '++resource++bdajax/bdajax_bs3.css',
#     'static/styles.css'
# ]

cfg.css.protected = list()

# JS and CSS Assets to publish merged
cfg.merged = Properties()
cfg.merged.js = Properties()

# development
cfg.merged.js.public = [
    (static_resources, 'jquery-1.9.1.js'),
    (static_resources, 'jquery.migrate-1.2.1.js'),
    (static_resources, 'jqueryui/jquery-ui-1.10.3.custom.js'),
    (static_resources, 'bootstrap/js/bootstrap.js'),
    (static_resources, 'typeahead/typeahead.bundle.js'),
    (static_resources, 'cookie_functions.js')
]

# production
# cfg.merged.js.public = [
#     (static_resources, 'jquery-1.9.1.min.js'),
#     (static_resources, 'jquery.migrate-1.2.1.min.js'),
#     (static_resources, 'jqueryui/jquery-ui-1.10.3.custom.min.js'),
#     (static_resources, 'bootstrap/js/bootstrap.min.js'),
#     (static_resources, 'typeahead/typeahead.bundle.js'),
#     (static_resources, 'cookie_functions.js')
# ]

cfg.merged.js.protected = list()

cfg.merged.css = Properties()
cfg.merged.css.public = list()
cfg.merged.css.protected = list()

cfg.merged.print_css = Properties()
cfg.merged.print_css.public = [
    (static_resources, 'print.css')
]
cfg.merged.print_css.protected = list()

# root node
root = AppRoot()
root.factories['settings'] = AppSettings


@implementer(ILayout)
@adapter(Interface)
def default_layout(context):
    layout = Layout()
    layout.mainmenu = True
    layout.mainmenu_fluid = False
    layout.livesearch = True
    layout.personaltools = True
    layout.columns_fluid = False
    layout.pathbar = True
    layout.sidebar_left = ['navtree']
    layout.sidebar_left_grid_width = 3
    layout.content_grid_width = 9
    return layout


def configure_root(settings):
    root.metadata.title = settings.get('cone.root.title', 'CONE')
    root.properties.default_child = settings.get('cone.root.default_child')
    root.properties.mainmenu_empty_title = \
        settings.get('cone.root.mainmenu_empty_title', 'false') \
        in ['True', 'true', '1']
    default_content_tile = settings.get('cone.root.default_content_tile')
    if default_content_tile:
        root.properties.default_content_tile = default_content_tile
    root.properties.in_navtree = False


def register_config(key, factory):
    factories = root['settings'].factories
    if key in factories:
        raise ValueError(u"Config with name '%s' already registered." % key)
    factories[key] = factory


# B/C
register_plugin_config = register_config
deprecated('register_plugin_config', """
``cone.app.register_plugin_config`` is deprecated as of cone.app 1.0 and will
be removed in cone.app 1.1. Use ``cone.app.register_config`` instead.""")


def register_entry(key, factory):
    factories = root.factories
    if key in factories:
        raise ValueError(u"Entry with name '%s' already registered." % key)
    root.factories[key] = factory


# B/C
register_plugin = register_entry
deprecated('register_plugin', """
``cone.app.register_plugin`` is deprecated as of cone.app 1.0 and will
be removed in cone.app 1.1. Use ``cone.app.register_entry`` instead.""")


main_hooks = list()


def main_hook(func):
    """decorator to register main hook.

    Decorated function gets called on application startup.
    """
    main_hooks.append(func)
    return func


# B/C
def register_main_hook(callback):
    """Register function to get called on application startup.
    """
    main_hooks.append(callback)


deprecated('register_main_hook', """
``cone.app.register_main_hook`` is deprecated as of cone.app 1.0 and will
be removed in cone.app 1.1. Use ``cone.app.main_hook`` instead.""")


def get_root(environ=None):
    return root


def auth_tkt_factory(**kwargs):
    from cone.app.security import groups_callback
    kwargs.setdefault('callback', groups_callback)
    return AuthTktAuthenticationPolicy(**kwargs)


def acl_factory(**kwargs):
    return ACLAuthorizationPolicy()


class ugm_backend(object):
    """Decorator for UGM backends.
    """
    factories = dict()
    instances = dict()

    def __init__(self, name):
        self.name = name

    def __call__(self, factory):
        self.factories[self.name] = factory
        return factory

    @classmethod
    def initialize(cls, name, settings):
        if name not in cls.factories:
            raise ValueError('Unknown UGM backend "{}"'.format(name))
        cls.instances[name] = cls.factories[name](settings)

    @classmethod
    def create(cls, name):
        if name not in cls.factories:
            raise ValueError('Unknown UGM backend "{}"'.format(name))
        if name not in cls.instances:
            raise ValueError('UGM backend "{}" not initialized'.format(name))
        ugm = cfg.auth = cls.instances[name]()
        return ugm

    @classmethod
    def get(cls, name):
        if name not in cls.factories:
            raise ValueError('Unknown UGM backend "{}"'.format(name))
        if name not in cls.instances:
            raise ValueError('UGM backend "{}" not initialized'.format(name))
        return cls.instances[name].ugm


class UGMBackend(object):
    ugm = None

    def __init__(self, settings):
        raise NotImplementedError(
            'Abstract ``UGMBackend`` does not implement ``__init__``')

    def __call__(self):
        raise NotImplementedError(
            'Abstract ``UGMBackend`` does not implement ``__call__``')


@ugm_backend('file')
class FileUGMBackend(UGMBackend):

    def __init__(self, settings):
        self.users_file = settings.get('ugm.users_file')
        self.groups_file = settings.get('ugm.groups_file')
        self.roles_file = settings.get('ugm.roles_file')
        self.datadir = settings.get('ugm.datadir')

    def __call__(self):
        self.ugm = FileUgm(
            name='ugm',
            users_file=self.users_file,
            groups_file=self.groups_file,
            roles_file=self.roles_file,
            data_directory=self.datadir
        )
        return self.ugm


@ugm_backend('node.ext.ugm')
class BCFileUGMBackend(FileUGMBackend):

    def __init__(self, settings):
        self.users_file = settings.get('node.ext.ugm.users_file')
        self.groups_file = settings.get('node.ext.ugm.groups_file')
        self.roles_file = settings.get('node.ext.ugm.roles_file')
        self.datadir = settings.get('node.ext.ugm.datadir')


cfg.yafowil = Properties()
cfg.yafowil.js_skip = set()
cfg.yafowil.css_skip = set()

# ignore bootstrap dependencies delivered by yafowil.bootstrap
cfg.yafowil.js_skip.add('bootstrap.dependencies')
cfg.yafowil.css_skip.add('bootstrap.dependencies')


class YafowilResources(YafowilResourcesBase):

    def __init__(self, js_skip=[], css_skip=[], config=None):
        self.config = config
        super(YafowilResources, self).__init__(
            js_skip=js_skip,
            css_skip=css_skip
        )

    def configure_resource_directory(self, plugin_name, resourc_edir):
        import cone.app
        resources_view = static_view(resourc_edir, use_subpath=True)
        view_name = '%s_resources' % plugin_name.replace('.', '_')
        setattr(cone.app, view_name, resources_view)
        view_path = 'cone.app.%s' % view_name
        resource_base = '++resource++%s' % plugin_name
        self.config.add_view(view_path, name=resource_base)
        return resource_base


def configure_yafowil_addon_resources(config):
    import cone.app
    resources = YafowilResources(
        js_skip=cone.app.cfg.yafowil.js_skip,
        css_skip=cone.app.cfg.yafowil.css_skip,
        config=config
    )
    for js in reversed(resources.js_resources):
        # bdajax needs to be loaded first in order to avoid double binding on
        # document ready
        idx = cone.app.cfg.js.public.index('++resource++bdajax/bdajax.js') + 1
        cone.app.cfg.js.public.insert(idx, js)
    for css in resources.css_resources:
        cone.app.cfg.css.public.insert(0, css)


def main(global_config, **settings):
    """Returns WSGI application.
    """
    # set authentication related application properties
    import cone.app
    cone.app.security.ADMIN_USER = settings.get('cone.admin_user')
    cone.app.security.ADMIN_PASSWORD = settings.get('cone.admin_password')

    auth_secret = settings.pop('cone.auth_secret', 'secret')
    auth_cookie_name = settings.pop('cone.auth_cookie_name', 'auth_tkt')
    auth_secure = settings.pop('cone.auth_secure', False)
    auth_include_ip = settings.pop('cone.auth_include_ip', False)
    auth_timeout = settings.pop('cone.auth_timeout', None)
    auth_reissue_time = settings.pop('cone.auth_reissue_time', None)
    if auth_reissue_time is not None:
        auth_reissue_time = int(auth_reissue_time)
    auth_max_age = settings.pop('cone.auth_max_age', None)
    if auth_max_age is not None:
        auth_max_age = int(auth_max_age)
    auth_http_only = settings.pop('cone.auth_http_only', False)
    auth_path = settings.pop('cone.auth_path', "/")
    auth_wild_domain = settings.pop('cone.auth_wild_domain', True)

    auth_policy = auth_tkt_factory(
        secret=auth_secret,
        cookie_name=auth_cookie_name,
        secure=auth_secure,
        include_ip=auth_include_ip,
        timeout=auth_timeout,
        reissue_time=auth_reissue_time,
        max_age=auth_max_age,
        http_only=auth_http_only,
        path=auth_path,
        wild_domain=auth_wild_domain,
    )

    configure_root(settings)

    if settings.get('testing.hook_global_registry'):
        globalreg = getGlobalSiteManager()
        config = Configurator(registry=globalreg)
        config.setup_registry(root_factory=get_root, settings=settings)
    else:
        config = Configurator(root_factory=get_root, settings=settings)

    # set authentication and authorization policies
    config.set_authentication_policy(auth_policy)
    config.set_authorization_policy(acl_factory())
    config.commit()

    # begin configuration
    config.begin()

    # include general dependencies
    config.include(pyramid_chameleon)
    config.include(pyramid_zcml)

    # register default layout adapter
    config.registry.registerAdapter(default_layout)

    # add translation
    config.add_translation_dirs('cone.app:locale/')

    # XXX: register yafowil and all yafowil addon widget locales.
    #      provide locales either in yafowil resources or as entry points in
    #      all yafowil packages providing translations

    # static routes
    config.add_route("favicon", "/favicon.ico")
    # XXX: robots.txt
    # XXX: humans.txt

    # register static resources
    config.add_view(static_resources, name='static')

    # scan browser package
    config.scan(cone.app.browser)

    # load zcml
    config.load_zcml('configure.zcml')

    # read plugin configurator
    plugins = settings.get('cone.plugins', '')
    plugins = plugins.split('\n')
    plugins = [pl for pl in plugins if pl]
    for plugin in plugins:
        # XXX: need to import plugin here?
        try:
            config.load_zcml('{}:configure.zcml'.format(plugin))
        except IOError:  # pragma: no cover
            msg = 'No configure.zcml in {}'.format(plugin)
            logger.info(msg)

    # execute main hooks
    for hook in main_hooks:
        hook(config, global_config, settings)

    # initialize UGM
    backend_name = settings.get('ugm.backend')
    # B/C
    if not backend_name:
        backend_name = settings.get('cone.auth_imp')
    if backend_name:
        try:
            ugm_backend.initialize(backend_name, settings)
            ugm_backend.create(backend_name)
        except Exception:
            msg = 'Failed to create UGM backend:\n{}'.format(format_traceback())
            logger.error(msg)

    # register yafowil static resources
    # done after addon config - addon code may disable yafowil resource groups
    configure_yafowil_addon_resources(config)

    # end configuration
    config.end()

    # return wsgi app
    return config.make_wsgi_app()


def make_remote_addr_middleware(app, global_conf):
    return RemoteAddrFilter(app)


class RemoteAddrFilter(object):
    """Use this middleware if nginx is used as proxy and IP address should be
    included in auth cookie. make sure nginx passes the right header:

    proxy_set_header X-Real-IP $remote_addr;
    """

    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        if 'HTTP_X_REAL_IP' in environ:
            environ['REMOTE_ADDR'] = environ['HTTP_X_REAL_IP']
        return self.app(environ, start_response)

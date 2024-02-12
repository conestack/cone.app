# -*- coding: utf-8 -*-
from cone.app import browser
from cone.app import security
from cone.app.browser.resources import ResourceRegistry
from cone.app.interfaces import IApplicationNode
from cone.app.model import AppResources
from cone.app.model import AppRoot
from cone.app.model import AppSettings
from cone.app.model import LayoutConfig
from cone.app.model import Properties
from cone.app.ugm import ugm_backend
from cone.app.utils import format_traceback
from cone.app.utils import node_path
from node.interfaces import INode
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.config import Configurator
from pyramid.traversal import ResourceTreeTraverser
from yafowil.bootstrap import configure_factory
from zope.component import adapter
from zope.component import getGlobalSiteManager
import importlib
import logging
import os
import pyramid_chameleon
import pyramid_zcml
import threading


logger = logging.getLogger('cone.app')

# configuration
cfg = Properties()

# available languages
cfg.available_languages = []

# used main template
cfg.main_template = 'cone.app.browser:templates/main.pt'

# default node icon
cfg.default_node_icon = 'glyphicon glyphicon-asterisk'


class layout_config(object):
    _registry = dict()

    def __init__(self, *for_):
        self.for_ = for_

    def __call__(self, factory):
        for context in self.for_:
            self._registry[context] = factory
        return factory

    @classmethod
    def lookup(cls, model=None, request=None):
        for cls_ in model.__class__.mro():
            factory = cls._registry.get(cls_)
            if factory:
                return factory(model=model, request=request)


@layout_config(object)
class DefaultLayoutConfig(LayoutConfig):

    def __init__(self, model=None, request=None):
        super(DefaultLayoutConfig, self).__init__(model=model, request=request)
        self.mainmenu = True
        self.mainmenu_fluid = True
        self.livesearch = True
        self.personaltools = True
        self.columns_fluid = True
        self.pathbar = True
        self.sidebar_left = ['navtree']
        self.sidebar_left_grid_width = 3
        self.content_grid_width = 9


def import_from_string(path):
    mod, ob = path.rsplit('.', 1)
    return getattr(importlib.import_module(mod), ob)


root = None


def get_root(environ=None):
    return root


def configure_root(root, settings):
    root.metadata.title = settings.get('cone.root.title', 'CONE')
    root.properties.default_child = settings.get('cone.root.default_child')
    mainmenu_empty_title = settings.get('cone.root.mainmenu_empty_title')
    mainmenu_empty_title = mainmenu_empty_title in ['True', 'true', '1']
    root.properties.mainmenu_empty_title = mainmenu_empty_title
    default_content_tile = settings.get('cone.root.default_content_tile')
    if default_content_tile:
        root.properties.default_content_tile = default_content_tile
    root.properties.in_navtree = False


def default_root_node_factory(settings):
    root = AppRoot()
    root.factories['settings'] = AppSettings
    root.factories['resources'] = AppResources
    configure_root(root, settings)
    return root


def register_config(key, factory):
    root = get_root()
    factories = root['settings'].factories
    if key in factories:
        raise ValueError(u"Config with name '%s' already registered." % key)
    factories[key] = factory


# B/C
register_plugin_config = register_config


def register_entry(key, factory):
    root = get_root()
    factories = root.factories
    if key in factories:
        raise ValueError(u"Entry with name '%s' already registered." % key)
    root.factories[key] = factory


# B/C
register_plugin = register_entry


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


thread_shutdown_hooks = list()


def thread_shutdown_hook(func):  # pragma: no cover
    """decorator to register thread shutdown hook.

    Decorated function gets called when main thread joins. Thread shutdown
    hooks are used for graceful joining of non daemon threads.
    """
    thread_shutdown_hooks.append(func)
    return func


def auth_tkt_factory(**kwargs):
    kwargs.setdefault('callback', security.groups_callback)
    return AuthTktAuthenticationPolicy(**kwargs)


def acl_factory(**kwargs):
    return ACLAuthorizationPolicy()


@adapter(IApplicationNode)
class ApplicationNodeTraverser(ResourceTreeTraverser):

    def __call__(self, request):
        result = super(ApplicationNodeTraverser, self).__call__(request)
        context = result['context']
        if not IApplicationNode.providedBy(context):
            if INode.providedBy(context):
                result['context'] = context.acquire(IApplicationNode)
                result['view_name'] = context.name
                result['traversed'] = tuple(node_path(result['context']))
            else:
                result['context'] = get_root()
                result['view_name'] = ''
                result['traversed'] = tuple()
        return result


def start_thread_monitor():  # pragma: no cover
    if not thread_shutdown_hooks:
        return

    def _monitor():
        main_thread = threading.main_thread()
        main_thread.join()
        for hook in thread_shutdown_hooks:
            hook()

    monitor = threading.Thread(target=_monitor)
    monitor.daemon = True
    monitor.start()


def main(global_config, **settings):
    """Returns WSGI application.
    """
    # set authentication related application properties
    security.ADMIN_USER = settings.get('cone.admin_user')
    security.ADMIN_PASSWORD = settings.get('cone.admin_password')
    security.AUTHENTICATOR = settings.get('cone.authenticator')

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

    # create root node
    global root
    root_node_factory = settings.pop('cone.root.node_factory', None)
    if root_node_factory:
        root = import_from_string(root_node_factory)(settings)
    else:
        root = default_root_node_factory(settings)

    if settings.get('testing.hook_global_registry'):
        globalreg = getGlobalSiteManager()
        config = Configurator(registry=globalreg)
        config.setup_registry(root_factory=get_root, settings=settings)
    else:
        config = Configurator(root_factory=get_root, settings=settings)

    # Initialize resource registry
    ResourceRegistry.initialize(config, settings)

    # set authentication and authorization policies
    config.set_authentication_policy(auth_policy)
    config.set_authorization_policy(acl_factory())
    config.commit()

    # begin configuration
    config.begin()

    # include general dependencies
    config.include(pyramid_chameleon)
    config.include(pyramid_zcml)

    # add custom traverser
    config.registry.registerAdapter(ApplicationNodeTraverser)

    # available languages
    available_languages = settings.get('cone.available_languages', '')
    cfg.available_languages = [
        lang.strip() for lang in available_languages.split(',') if lang
    ]

    # main template
    main_template = settings.get('cone.main_template')
    if main_template:
        cfg.main_template = main_template

    # add translation
    config.add_translation_dirs('cone.app:locale/')

    # XXX: register yafowil and all yafowil addon widget locales.
    #      provide locales either in yafowil resources or as entry points in
    #      all yafowil packages providing translations

    # static routes
    config.add_route("favicon", "/favicon.ico")
    # XXX: robots.txt
    # XXX: humans.txt

    # basic resource configuration
    # skip configuration of yafowil.bootstrap if tests running.
    # this is necessary because tests are written against default yafowil
    # blueprint rendering. in future versions, tests should be adopted to
    # run against adopted blueprint rendering
    if not os.environ.get('TESTRUN_MARKER'):  # pragma: no cover
        configure_factory('bootstrap3')
    config.configure_default_resource_includes()

    # scan browser package
    config.scan(browser)

    # load zcml
    config.load_zcml('configure.zcml')

    # read plugin configurator
    plugins = settings.get('cone.plugins', '')
    plugins = plugins.split('\n')
    plugins = [pl for pl in plugins if pl and not pl.startswith('#')]
    for plugin in plugins:
        try:
            importlib.import_module(plugin)
        except ImportError:
            msg = 'Cannot import plugin {}\n{}'.format(
                plugin,
                format_traceback()
            )
            logger.error(msg)
            continue
        try:
            config.load_zcml('{}:configure.zcml'.format(plugin))
        except IOError:  # pragma: no cover
            msg = 'No configure.zcml in {}'.format(plugin)
            logger.info(msg)

    # execute main hooks
    filtered_hooks = list()
    for plugin in plugins:
        for hook in main_hooks:
            if hook.__module__.startswith(plugin):
                filtered_hooks.append(hook)
    for hook in filtered_hooks:
        hook(config, global_config, settings)

    # load and initialize UGM
    backend_name = settings.get('ugm.backend')
    # B/C
    if not backend_name:
        backend_name = settings.get('cone.auth_impl')
    if backend_name:
        try:
            ugm_backend.load(backend_name, settings)
            ugm_backend.initialize()
        except Exception:  # pragma: no cover
            msg = 'Failed to create UGM backend:\n{}'.format(format_traceback())
            logger.error(msg)

    user_display_attr = settings.get('ugm.user_display_attr')
    if user_display_attr:
        ugm_backend.user_display_attr = user_display_attr

    group_display_attr = settings.get('ugm.group_display_attr')
    if group_display_attr:
        ugm_backend.group_display_attr = group_display_attr

    # configure static resources
    # this is done after main hooks, so plugins can register their resources
    development = global_config.get('debug') in ['true', 'True', '1']
    config.configure_resources(development)

    # end configuration
    config.end()

    # start thread monitor if thread shutdown hooks registered
    start_thread_monitor()

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

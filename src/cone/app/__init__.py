import os
import logging
import model
import pyramid_zcml
from zope.deprecation import __show__
from pyramid.config import Configurator
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.static import static_view
from zope.component import getGlobalSiteManager
from .model import (
    AppRoot,
    AppSettings,
    Properties,
)
from .browser import (
    forbidden_view,
    static_resources,
)
from yafowil.base import factory
from yafowil.utils import get_plugin_names

logger = logging.getLogger('cone.app')

# configuration
cfg = Properties()

# authentication provider (expect ``node.ext.ugm.Ugm`` API)
cfg.auth = None

# used main template
cfg.main_template = 'cone.app.browser:templates/main.pt'

# default node icon
cfg.default_node_icon = 'glyphicon glyphicon-asterisk'

# JS resources
cfg.js = Properties()
cfg.js.public = [
    '++resource++bdajax/overlay.js',
    '++resource++bdajax/bdajax.js',
    '++resource++bdajax/bdajax_bs3.js',
]
cfg.js.protected = [
    'static/cone.app.js',
]

# CSS Resources
cfg.css = Properties()

# dev
cfg.css.public = [
    'static/bootstrap/css/bootstrap.css',
    'static/bootstrap/css/bootstrap-theme.css',
#    'static/jqueryui/jquery-ui-1.10.3.custom.css',
    'static/ionicons/css/ionicons.css',
    '++resource++bdajax/bdajax_bs3.css',
    'static/styles.css',
]

# production
# cfg.css.public = [
#     'static/bootstrap/css/bootstrap.min.css',
#     'static/bootstrap/css/bootstrap-theme.min.css',
#     'static/jqueryui/jquery-ui-1.10.3.custom.css',
#     'static/ionicons/css/ionicons.css',
#     '++resource++bdajax/bdajax_bootstrap_3.css',
#     'static/styles.css',
# ]
cfg.css.protected = list()

# JS and CSS Assets to publish merged
cfg.merged = Properties()
cfg.merged.js = Properties()

# dev
cfg.merged.js.public = [
    (static_resources, 'jquery-1.9.1.js'),
    (static_resources, 'jquery.migrate-1.2.1.js'),
    (static_resources, 'jqueryui/jquery-ui-1.10.3.custom.js'),
    (static_resources, 'bootstrap/js/bootstrap.js'),
]

# production
# cfg.merged.js.public = [
#     (static_resources, 'jquery-1.9.1.min.js'),
#     (static_resources, 'jquery.migrate-1.2.1.min.js'),
#     (static_resources, 'jqueryui/jquery-ui-1.10.3.custom.min.js'),
#     (static_resources, 'bootstrap/js/bootstrap.min.js'),
# ]

cfg.merged.js.protected = [
    (static_resources, 'cookie_functions.js'),
]

cfg.merged.css = Properties()
cfg.merged.css.public = list()
cfg.merged.css.protected = list()

cfg.merged.print_css = Properties()
cfg.merged.print_css.public = [
    (static_resources, 'print.css'),
]
cfg.merged.print_css.protected = list()

# cfg.layout used to enable/disable tiles in main template
cfg.layout = Properties()
cfg.layout.livesearch = True
cfg.layout.personaltools = True
cfg.layout.mainmenu = True
cfg.layout.pathbar = True
cfg.layout.sidebar_left = ['navtree']

root = AppRoot()
root.factories['settings'] = AppSettings


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


def register_plugin_config(key, factory):
    factories = root['settings'].factories
    if key in factories:
        raise ValueError(u"Config with name '%s' already registered." % key)
    factories[key] = factory


def register_plugin(key, factory):
    factories = root.factories
    if key in factories:
        raise ValueError(u"Plugin with name '%s' already registered." % key)
    root.factories[key] = factory


main_hooks = list()


def register_main_hook(callback):
    """Register function to get called on application startup.
    """
    main_hooks.append(callback)


def get_root(environ=None):
    return root


def auth_tkt_factory(**kwargs):
    from cone.app.security import groups_callback
    kwargs.setdefault('callback', groups_callback)
    return AuthTktAuthenticationPolicy(**kwargs)


def acl_factory(**kwargs):
    return ACLAuthorizationPolicy()


cfg.yafowil = Properties()
cfg.yafowil.js_skip = set()
cfg.yafowil.css_skip = set()


# ignore bootstrap dependencies delivered by yafowil.bootstrap
cfg.yafowil.js_skip.add('bootstrap.dependencies')
cfg.yafowil.css_skip.add('bootstrap.dependencies')


def configure_yafowil_addon_resources(config):
    import cone.app
    all_js = list()
    all_css = list()
    for plugin_name in get_plugin_names():
        resources = factory.resources_for(plugin_name)
        if not resources:
            continue
        resources_view = static_view(resources['resourcedir'],
                                     use_subpath=True)
        view_name = '%s_resources' % plugin_name.replace('.', '_')
        setattr(cone.app, view_name, resources_view)
        view_path = 'cone.app.%s' % view_name
        resource_name = '++resource++%s' % plugin_name
        config.add_view(view_path, name=resource_name)
        for js in resources['js']:
            if js['group'] in cone.app.cfg.yafowil.js_skip:
                continue
            if not js['resource'].startswith('http'):
                js['resource'] = resource_name + '/' + js['resource']
            all_js.append(js)
        for css in resources['css']:
            if css['group'] in cone.app.cfg.yafowil.css_skip:
                continue
            if not css['resource'].startswith('http'):
                css['resource'] = resource_name + '/' + css['resource']
            all_css.append(css)
    all_js = sorted(all_js, key=lambda x: x['order'])
    all_css = sorted(all_css, key=lambda x: x['order'])
    for js in reversed(all_js):
        # bdajax needs to be loaded first in order to avoid double binding on
        # document ready
        idx = cone.app.cfg.js.public.index('++resource++bdajax/bdajax.js') + 1
        cone.app.cfg.js.public.insert(idx, js['resource'])
    for css in all_css:
        cone.app.cfg.css.public.insert(0, css['resource'])


def main(global_config, **settings):
    """Returns WSGI application.
    """
    # set authentication related application properties
    import cone.app.security as security
    security.ADMIN_USER = settings.get('cone.admin_user', 'admin')
    security.ADMIN_PASSWORD = settings.get('cone.admin_password', 'admin')

    auth_secret = settings.get('cone.auth_secret', 'secret')
    auth_cookie_name = settings.get('cone.auth_cookie_name', 'auth_tkt')
    auth_secure = settings.get('cone.auth_secure', False)
    auth_include_ip = settings.get('cone.auth_include_ip', False)
    auth_timeout = settings.get('cone.auth_timeout', None)
    auth_reissue_time = settings.get('cone.auth_reissue_time', None)
    if auth_reissue_time is not None:
        auth_reissue_time = int(auth_reissue_time)
    auth_max_age = settings.get('cone.auth_max_age', None)
    if auth_max_age is not None:
        auth_max_age = int(auth_max_age)
    auth_http_only = settings.get('cone.auth_http_only', False)
    auth_path = settings.get('cone.auth_path', "/")
    auth_wild_domain = settings.get('cone.auth_wild_domain', True)

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
        config.setup_registry(
            root_factory=get_root,
            settings=settings,
            authentication_policy=auth_policy,
            authorization_policy=acl_factory())
        config.hook_zca()
    else:
        config = Configurator(
            root_factory=get_root,
            settings=settings,
            authentication_policy=auth_policy,
            authorization_policy=acl_factory())

    config.include(pyramid_zcml)
    config.begin()

    # add translation
    config.add_translation_dirs('cone.app:locale/')

    # static resources
    config.add_view('cone.app.browser.static_resources', name='static')

    # supress deprecation warning during scan phase
    __show__.off()

    # scan browser package
    config.scan('cone.app.browser')

    # re-enable deprecation warning
    __show__.on()

    # load zcml
    config.load_zcml('configure.zcml')

    # read plugin configurator
    plugins = settings.get('cone.plugins', '')
    plugins = plugins.split('\n')
    plugins = [pl for pl in plugins if pl]
    for plugin in plugins:
        # XXX: check whether configure.zcml exists, skip loading if not found
        config.load_zcml('%s:configure.zcml' % plugin)      #pragma NO COVERAGE

    # execute main hooks
    for hook in main_hooks:
        hook(config, global_config, settings)

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

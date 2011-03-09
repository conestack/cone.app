import model
import pyramid_zcml
from pyramid.config import Configurator
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from cone.app.model import AppRoot

root = AppRoot()

def get_default_root(environ):
    return root

def auth_tkt_factory(**kwargs):
    from cone.app.security import groups_callback
    kwargs.setdefault('callback', groups_callback)
    return AuthTktAuthenticationPolicy(**kwargs)

def acl_factory(**kwargs):
    return ACLAuthorizationPolicy()

def main(global_config, **settings):
    """Returns WSGI application.
    """
    # set authentication related application properties
    import cone.app.security as security
    security.ADMIN_USER = settings.get('cone.admin_user', 'admin')
    security.ADMIN_PASSWORD = settings.get('cone.admin_password', 'admin')
    security.AUTH_IMPL = settings.get('cone.auth_impl', None)
    secret_password = settings.get('cone.secret_password', 'secret')
    
    # create config
    config = Configurator(
        root_factory=get_default_root,
        settings=settings,
        authentication_policy=auth_tkt_factory(secret=secret_password),
        authorization_policy=acl_factory())
    
    config.include(pyramid_zcml)
    config.begin()
    config.load_zcml('configure.zcml')
    
    # read plugin config
    plugins = settings.get('cone.plugins', '')
    plugins = plugins.split('\n')
    plugins = [pl for pl in plugins if pl]
    for plugin in plugins:
        config.load_zcml('%s:configure.zcml' % plugin)
    
    # end config and return wsgi app
    config.end()
    return config.make_wsgi_app()

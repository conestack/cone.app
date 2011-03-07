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
    import cone.app.security as security
    security.ADMIN_USER = settings.get('cone.admin_user', 'admin')
    security.ADMIN_PASSWORD = settings.get('cone.admin_password', 'admin')
    secret_password = settings.get('cone.secret_password', 'secret')
    authn_factory = settings.get('cone.authn_policy_factory', auth_tkt_factory)
    authz_factory = settings.get('cone.authz_policy_factory', acl_factory)
    config = Configurator(
        root_factory=get_default_root,
        settings=settings,
        authentication_policy=authn_factory(secret=secret_password),
        authorization_policy=authz_factory(secret=secret_password))
    zcml_file = settings.get('configure_zcml', 'configure.zcml')
    config.include(pyramid_zcml)
    config.begin()
    config.load_zcml(zcml_file)
    config.end()
    return config.make_wsgi_app()

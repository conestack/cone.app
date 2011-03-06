import model
import pyramid_zcml
from pyramid.config import Configurator
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from cone.app.model import AppRoot

root = AppRoot()

def get_root(environ):
    return root

def authn_policy_factory(**kwargs):
    from cone.app.security import groups_callback
    kwargs.setdefault('callback', groups_callback)
    return AuthTktAuthenticationPolicy(**kwargs)

def authz_policy_factory(**kwargs):
    return ACLAuthorizationPolicy()

def main(global_config, **settings):
    """Returns WSGI application.
    """
    config = Configurator(
        root_factory=get_root,
        settings=settings,
        authentication_policy=authn_policy_factory(secret='secret'),
        authorization_policy=authz_policy_factory(),
        autocommit=True)
    zcml_file = settings.get('configure_zcml', 'configure.zcml')
    config.include(pyramid_zcml)
    config.begin()
    config.load_zcml(zcml_file)
    config.end()
    return config.make_wsgi_app()
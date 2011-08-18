cone.app.security
-----------------

Superuser credentials are set on application startup by main function in
cone.app.__init__::

    >>> from cone.app import security
    >>> security.ADMIN_USER = 'user'
    >>> security.ADMIN_PASSWORD = 'secret'

The default ACL::

    >>> security.DEFAULT_ACL
    [('Allow', 'system.Authenticated', ['view']), 
    ('Allow', 'role:viewer', ['view']), 
    ('Allow', 'role:editor', ['view', 'add', 'edit']), 
    ('Allow', 'role:admin', ['view', 'add', 'edit', 'delete']), 
    ('Allow', 'role:owner', ['view', 'add', 'edit', 'delete']), 
    ('Allow', 'role:manager', ['view', 'add', 'edit', 'delete', 'manage']), 
    ('Allow', 'system.Everyone', ['login']), 
    ('Deny', 'system.Everyone', 
    <pyramid.security.AllPermissionsList object at ...>)]
    
Base security tests::

    >>> from pyramid.interfaces import IAuthenticationPolicy
    >>> from pyramid.threadlocal import get_current_registry
    >>> get_current_registry().queryUtility(IAuthenticationPolicy)
    <pyramid.authentication.AuthTktAuthenticationPolicy object at ...>
    
    >>> layer.new_request()
    <pyramid.testing.DummyRequest object at ...>
    
    >>> layer.current_request.registry
    <BaseGlobalComponents base>
    
    >>> layer.login('inexistent')
    >>> from pyramid.security import authenticated_userid
    >>> authenticated_userid(layer.current_request)

Create some security context for testing::

    >>> from pyramid.security import has_permission
    >>> from cone.app.security import DEFAULT_ACL
    >>> class ACLTest(object):
    ...     __acl__ = DEFAULT_ACL
    >>> context = ACLTest()

Authenticate as default user::

    >>> layer.login('user')
    >>> authenticated_userid(layer.current_request)
    'user'
    
    >>> has_permission('manage', context, layer.current_request)
    <ACLAllowed instance ...

    >>> layer.login('viewer')
    >>> authenticated_userid(layer.current_request)
    'viewer'
    
    >>> has_permission('manage', context, layer.current_request)
    <ACLDenied instance ...
    
    >>> layer.logout()
    >>> authenticated_userid(layer.current_request)
    
    >>> has_permission('manage', context, layer.current_request)
    <ACLDenied instance ...

If an authentication plugin raises an error when calling ``authenticate``, an
error message is logged::

    >>> import logging
    >>> class TestHandler(logging.StreamHandler):
    ...     def handle(self, record):
    ...         print record
    >>> handler = TestHandler()
    >>> from cone.app.security import logger
    >>> logger.addHandler(handler)
    >>> logger.setLevel(logging.DEBUG)
    
    >>> noauthenticator = object()
    >>> import cone.app
    >>> cone.app.cfg.auth.append(noauthenticator)
    >>> from cone.app.security import authenticate
    >>> request = layer.current_request
    >>> authenticate(request, 'foo', 'foo')
    <LogRecord: cone.app, 30, ...security.py, 64, 
    "Authentication plugin <type 'object'> raised an Exception while trying 
    to authenticate: 'object' object has no attribute 'users'">

Test Group callback, also logs if an error occurs::

    >>> from cone.app.security import groups_callback
    >>> layer.login('manager')
    >>> request = layer.current_request
    >>> groups_callback('manager', request)
    [u'role:manager']
    
    >>> layer.logout()
    
    >>> groups_callback('foo', layer.new_request())
    <LogRecord: cone.app, 40, 
    ...security.py, 82, "'object' object has no attribute 'users'">
    []

Cleanup::

    >>> logger.setLevel(logging.INFO)
    >>> logger.removeHandler(handler)
    >>> cone.app.cfg.auth.remove(noauthenticator)

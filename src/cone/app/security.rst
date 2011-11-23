cone.app.security
-----------------

Superuser credentials are set on application startup by main function in
cone.app.__init__::

    >>> from cone.app import security
    >>> security.ADMIN_USER = 'user'
    >>> security.ADMIN_PASSWORD = 'secret'

``authenticated_user``::

    >>> from cone.app.security import authenticated_user
    >>> authenticated_user(layer.current_request)
    
    >>> layer.login('manager')
    >>> authenticated_user(layer.current_request)
    <User object 'manager' at ...>
    
    >>> layer.logout()

``principal_by_id``::

    >>> from cone.app.security import principal_by_id
    >>> principal_by_id('manager')
    <User object 'manager' at ...>
    
    >>> principal_by_id('group:group1')
    <Group object 'group1' at ...>

``search_for_principals``::

    >>> from cone.app.security import search_for_principals
    >>> search_for_principals('viewer')
    [u'viewer']
    
    >>> search_for_principals('group*')
    [u'group:group1']

The default ACL::

    >>> security.DEFAULT_ACL
    [('Allow', 'system.Authenticated', ['view']), 
    ('Allow', 'role:viewer', ['view']), 
    ('Allow', 'role:editor', ['view', 'add', 'edit']), 
    ('Allow', 'role:admin', ['view', 'add', 'edit', 'delete', 'manage_permissions']), 
    ('Allow', 'role:owner', ['view', 'add', 'edit', 'delete', 'manage_permissions']), 
    ('Allow', 'role:manager', ['view', 'add', 'edit', 'delete', 'manage_permissions', 'manage']), 
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

PrincipalACL::

    >>> from plumber import plumber, default
    >>> from cone.app.model import BaseNode
    >>> from cone.app.security import PrincipalACL

PrincipalACL is an abstract class. Directly mixing in causes an error on use::
    
    >>> class PrincipalACLNode(BaseNode):
    ...     __metaclass__ = plumber
    ...     __plumbing__ = PrincipalACL
    ...     @property
    ...     def __acl__(self):
    ...         return BaseNode.__acl__
    
    >>> node = PrincipalACLNode()
    >>> node.__acl__
    Traceback (most recent call last):
      ...
    NotImplementedError: Abstract ``PrincipalACL`` does not 
    implement ``principal_roles``.

Concrete PrincipalACL implementation. Implements principal_roles property::

    >>> from node.utils import instance_property
    >>> class MyPrincipalACL(PrincipalACL):
    ...     @default
    ...     @instance_property
    ...     def principal_roles(self):
    ...         return dict()
    
    >>> class MyPrincipalACLNode(BaseNode):
    ...     __metaclass__ = plumber
    ...     __plumbing__ = MyPrincipalACL
    ...     @property
    ...     def __acl__(self):
    ...         return BaseNode.__acl__
    
    >>> node = MyPrincipalACLNode()
    >>> node.principal_roles['someuser'] = ['manager']
    >>> node.principal_roles['otheruser'] = ['editor']
    >>> node.principal_roles['group:some_group'] = ['editor', 'manager']
    
    >>> node.__acl__
    [('Allow', 'someuser', ['edit', 'manage', 'add', 'view', 'manage_permissions', 'delete']), 
    ('Allow', 'otheruser', ['edit', 'add', 'view']), 
    ('Allow', 'group:some_group', ['edit', 'manage', 'add', 'view', 'manage_permissions', 'delete']), 
    ('Allow', 'system.Authenticated', ['view']), 
    ('Allow', 'role:viewer', ['view']), 
    ('Allow', 'role:editor', ['view', 'add', 'edit']), 
    ('Allow', 'role:admin', ['view', 'add', 'edit', 'delete', 'manage_permissions']), 
    ('Allow', 'role:owner', ['view', 'add', 'edit', 'delete', 'manage_permissions']), 
    ('Allow', 'role:manager', ['view', 'add', 'edit', 'delete', 'manage_permissions', 'manage']), 
    ('Allow', 'system.Everyone', ['login']), 
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]

PrincipalACL role inheritance::

    >>> child = node['child'] = MyPrincipalACLNode()
    >>> child.principal_roles['someuser'] = ['editor']
    >>> child.__acl__
    [('Allow', 'someuser', ['edit', 'add', 'view']), 
    ('Allow', 'system.Authenticated', ['view']), 
    ('Allow', 'role:viewer', ['view']), 
    ('Allow', 'role:editor', ['view', 'add', 'edit']), 
    ('Allow', 'role:admin', ['view', 'add', 'edit', 'delete', 'manage_permissions']), 
    ('Allow', 'role:owner', ['view', 'add', 'edit', 'delete', 'manage_permissions']), 
    ('Allow', 'role:manager', ['view', 'add', 'edit', 'delete', 'manage_permissions', 'manage']), 
    ('Allow', 'system.Everyone', ['login']), 
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]
    
    >>> subchild = child['child'] = MyPrincipalACLNode()
    >>> subchild.role_inheritance = True
    >>> subchild.principal_roles['otheruser'] = ['admin']
    >>> subchild.aggregated_roles_for('inexistent')
    []
    
    >>> subchild.aggregated_roles_for('someuser')
    ['manager', 'editor']
    
    >>> subchild.aggregated_roles_for('otheruser')
    ['admin', 'editor']
    
    >>> subchild.__acl__
    [('Allow', 'someuser', ['edit', 'manage', 'add', 'view', 'manage_permissions', 'delete']), 
    ('Allow', 'otheruser', ['edit', 'add', 'delete', 'manage_permissions', 'view']), 
    ('Allow', 'group:some_group', ['edit', 'manage', 'add', 'view', 'manage_permissions', 'delete']), 
    ('Allow', 'system.Authenticated', ['view']), 
    ('Allow', 'role:viewer', ['view']), 
    ('Allow', 'role:editor', ['view', 'add', 'edit']), 
    ('Allow', 'role:admin', ['view', 'add', 'edit', 'delete', 'manage_permissions']), 
    ('Allow', 'role:owner', ['view', 'add', 'edit', 'delete', 'manage_permissions']), 
    ('Allow', 'role:manager', ['view', 'add', 'edit', 'delete', 'manage_permissions', 'manage']), 
    ('Allow', 'system.Everyone', ['login']), 
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]

Principal roles get inherited even if some parent does not provide principal
roles::

    >>> child = node['no_principal_roles'] = BaseNode()
    >>> subchild = child['no_principal_roles'] =  MyPrincipalACLNode()
    >>> subchild.aggregated_roles_for('group:some_group')
    ['manager', 'editor']

If principal role found which is not provided by plumbing endpoint acl, this
role does not grant any permissions::

    >>> node = MyPrincipalACLNode()
    >>> node.principal_roles['someuser'] = ['inexistent_role']
    >>> node.__acl__
    [('Allow', 'someuser', []), 
    ('Allow', 'system.Authenticated', ['view']), 
    ('Allow', 'role:viewer', ['view']), 
    ('Allow', 'role:editor', ['view', 'add', 'edit']), 
    ('Allow', 'role:admin', ['view', 'add', 'edit', 'delete', 'manage_permissions']), 
    ('Allow', 'role:owner', ['view', 'add', 'edit', 'delete', 'manage_permissions']), 
    ('Allow', 'role:manager', ['view', 'add', 'edit', 'delete', 'manage_permissions', 'manage']), 
    ('Allow', 'system.Everyone', ['login']), 
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]

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
    
    >>> import cone.app
    >>> old_ugm = cone.app.cfg.auth
    >>> cone.app.cfg.auth = object()
    
    >>> from cone.app.security import authenticate
    >>> request = layer.current_request
    
    >>> authenticate(request, 'foo', 'foo')
    <LogRecord: cone.app, 30, ...security.py, ..., 
    "Authentication plugin <type 'object'> raised an Exception while trying 
    to authenticate: 'object' object has no attribute 'users'">

Test Group callback, also logs if an error occurs::

    >>> from cone.app.security import groups_callback
    >>> layer.login('user')
    >>> request = layer.current_request
    >>> groups_callback('user', request)
    [u'role:manager']
    
    >>> layer.logout()
    
    >>> groups_callback('foo', layer.new_request())
    <LogRecord: cone.app, 40, 
    ...security.py, ..., "'object' object has no attribute 'users'">
    []

Cleanup::

    >>> logger.setLevel(logging.INFO)
    >>> logger.removeHandler(handler)
    >>> cone.app.cfg.auth = old_ugm

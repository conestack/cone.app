from node.tests import NodeTestCase
from cone.app import testing
from cone.app import security
from cone.app.interfaces import IOwnerSupport
from cone.app.interfaces import IPrincipalACL
from cone.app.model import BaseNode
from cone.app.security import DEFAULT_ACL
from cone.app.security import OwnerSupport
from cone.app.security import PrincipalACL
from cone.app.security import acl_registry
from cone.app.security import authenticate
from cone.app.security import authenticated_user
from cone.app.security import groups_callback
from cone.app.security import logger
from cone.app.security import principal_by_id
from cone.app.security import search_for_principals
from node.ext.ugm.interfaces import IUser
from node.ext.ugm.interfaces import IGroup
from node.utils import instance_property
from plumber import default
from plumber import plumbing
from pyramid.interfaces import IAuthenticationPolicy
from pyramid.security import authenticated_userid
from pyramid.security import has_permission
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import ACLAllowed
from pyramid.security import ACLDenied
from pyramid.threadlocal import get_current_registry
from pyramid.authentication import AuthTktAuthenticationPolicy
from zope.component.globalregistry import BaseGlobalComponents
import cone.app
import logging


class SecurityTest(NodeTestCase):
    layer = testing.security

    def test_superuser_credentials(self):
        # Superuser credentials are set on application startup by main function
        # in cone.app.__init__

        # 'superuser' values get set in test layer
        self.assertEqual(security.ADMIN_USER, 'superuser')
        self.assertEqual(security.ADMIN_PASSWORD, 'superuser')

    def test_authenticated_user(self):
        self.layer.new_request()
        self.assertTrue(authenticated_user(self.layer.current_request) is None)

        self.layer.login('manager')

        user = authenticated_user(self.layer.current_request)
        self.assertTrue(IUser.providedBy(user))
        self.assertEqual(user.name, 'manager')

        self.layer.logout()

    def test_principal_by_id(self):
        user = principal_by_id('manager')
        self.assertTrue(IUser.providedBy(user))
        self.assertEqual(user.name, 'manager')

        group = principal_by_id('group:group1')
        self.assertTrue(IGroup.providedBy(group))
        self.assertEqual(group.name, 'group1')

        self.assertTrue(principal_by_id('inexistent') is None)

    def test_search_for_principals(self):
        self.assertEqual(search_for_principals('viewer'), [u'viewer'])
        self.assertEqual(search_for_principals('group*'), [u'group:group1'])

    def test_acls(self):
        # The default ACL
        self.assertEqual(security.DEFAULT_ACL, [
            ('Allow', 'system.Authenticated', ['view']),
            ('Allow', 'role:viewer', ['view', 'list']),
            ('Allow', 'role:editor', ['view', 'list', 'add', 'edit']),
            ('Allow', 'role:admin', [
                'view', 'list', 'add', 'edit', 'delete', 'cut', 'copy',
                'paste', 'manage_permissions', 'change_state'
            ]),
            ('Allow', 'role:manager', [
                'view', 'list', 'add', 'edit', 'delete', 'cut', 'copy',
                'paste', 'manage_permissions', 'change_state', 'manage'
            ]),
            ('Allow', 'role:owner', [
                'view', 'list', 'add', 'edit', 'delete', 'cut', 'copy',
                'paste', 'manage_permissions', 'change_state'
            ]),
            ('Allow', 'system.Everyone', ['login']),
            ('Deny', 'system.Everyone', ALL_PERMISSIONS)
        ])

        # Base security tests
        policy = get_current_registry().queryUtility(IAuthenticationPolicy)
        self.assertTrue(isinstance(policy, AuthTktAuthenticationPolicy))

        self.layer.new_request()
        self.assertTrue(isinstance(
            self.layer.current_request.registry,
            BaseGlobalComponents
        ))

        self.layer.login('inexistent')
        userid = authenticated_userid(self.layer.current_request)
        self.assertTrue(userid is None)

        # Create some security context for testing
        class ACLTest(object):
            __acl__ = DEFAULT_ACL
        context = ACLTest()

        # Authenticate as default user
        self.layer.login('superuser', 'superuser')
        userid = authenticated_userid(self.layer.current_request)
        self.assertEqual(userid, 'superuser')

        rule = has_permission('manage', context, self.layer.current_request)
        self.assertTrue(isinstance(rule, ACLAllowed))

        self.layer.login('viewer')
        userid = authenticated_userid(self.layer.current_request)
        self.assertEqual(userid, 'viewer')

        rule = has_permission('manage', context, self.layer.current_request)
        self.assertTrue(isinstance(rule, ACLDenied))

        self.layer.logout()
        userid = authenticated_userid(self.layer.current_request)
        self.assertTrue(userid is None)

        rule = has_permission('manage', context, self.layer.current_request)
        self.assertTrue(isinstance(rule, ACLDenied))

"""
ACLRegistry::

    >>> class SomeModel(object): pass

    >>> acl = [('Allow', 'role:viewer', ['view'])]
    >>> acl_registry.register(acl, SomeModel)

    >>> acl = [('Allow', 'role:viewer', ['edit'])]
    >>> acl_registry.register(acl, node_info_name='some_model')

    >>> acl = [('Allow', 'role:viewer', ['delete'])]
    >>> acl_registry.register(acl, SomeModel, 'some_model')

    >>> acl_registry.lookup(None, None, [('Allow', 'role:viewer', ['add'])])
    [('Allow', 'role:viewer', ['add'])]

    >>> acl_registry.lookup(SomeModel)
    [('Allow', 'role:viewer', ['view'])]

    >>> acl_registry.lookup(node_info_name='some_model')
    [('Allow', 'role:viewer', ['edit'])]

    >>> acl_registry.lookup(SomeModel, 'some_model')
    [('Allow', 'role:viewer', ['delete'])]

OwnerSupport::

    >>> @plumbing(OwnerSupport)
    ... class OwnerSupportNode(BaseNode):
    ...     pass

    >>> ownersupportnode = OwnerSupportNode()
    >>> ownersupportnode.owner

    >>> ownersupportnode.__acl__
    [('Allow', 'system.Authenticated', ['view']), ...]

    >>> layer.login('sepp')
    >>> authenticated_userid(layer.current_request)
    'sepp'

    >>> ownersupportnode = OwnerSupportNode()
    >>> ownersupportnode.owner
    'sepp'

    >>> ownersupportnode.attrs['owner']
    'sepp'

    >>> ownersupportnode.__acl__
    [('Allow', 'sepp', ['view', 'list', 'add', 'edit', 'delete', 'cut', 
    'copy', 'paste', 'manage_permissions', 'change_state']), 
    ('Allow', 'system.Authenticated', ['view']), 
    ('Allow', 'role:viewer', ['view', 'list']), 
    ('Allow', 'role:editor', ['view', 'list', 'add', 'edit']), 
    ('Allow', 'role:admin', ['view', 'list', 'add', 'edit', 'delete', 'cut', 
    'copy', 'paste', 'manage_permissions', 'change_state']), 
    ('Allow', 'role:manager', ['view', 'list', 'add', 'edit', 'delete', 'cut', 
    'copy', 'paste', 'manage_permissions', 'change_state', 'manage']), 
    ('Allow', 'role:owner', ['view', 'list', 'add', 'edit', 'delete', 'cut', 
    'copy', 'paste', 'manage_permissions', 'change_state']), 
    ('Allow', 'system.Everyone', ['login']), 
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]

    >>> layer.login('viewer')
    >>> has_permission('delete', ownersupportnode, layer.current_request)
    <ACLDenied instance ...

    >>> layer.login('sepp')
    >>> has_permission('delete', ownersupportnode, layer.current_request)
    <ACLAllowed instance ...

    >>> @plumbing(OwnerSupport)
    ... class NoOwnerACLOnBaseNode(BaseNode):
    ...     @property
    ...     def __acl__(self):
    ...         return [('Allow', 'role:viewer', ['view'])]

    >>> ownersupportnode = NoOwnerACLOnBaseNode()
    >>> ownersupportnode.owner
    'sepp'

    >>> ownersupportnode.__acl__
    [('Allow', 'role:viewer', ['view'])]

    >>> layer.logout()

PrincipalACL. PrincipalACL is an abstract class. Directly mixing in causes an
error on use::

    >>> @plumbing(PrincipalACL)
    ... class PrincipalACLNode(BaseNode):
    ...     pass

    >>> node = PrincipalACLNode()
    >>> node.__acl__
    Traceback (most recent call last):
      ...
    NotImplementedError: Abstract ``PrincipalACL`` does not 
    implement ``principal_roles``.

Concrete PrincipalACL implementation. Implements principal_roles property::

    >>> class MyPrincipalACL(PrincipalACL):
    ...     @default
    ...     @instance_property
    ...     def principal_roles(self):
    ...         return dict()

    >>> @plumbing(MyPrincipalACL)
    ... class MyPrincipalACLNode(BaseNode):
    ...     pass

    >>> node = MyPrincipalACLNode()
    >>> IPrincipalACL.providedBy(node)
    True

    >>> node.principal_roles['someuser'] = ['manager']
    >>> node.principal_roles['otheruser'] = ['editor']
    >>> node.principal_roles['group:some_group'] = ['editor', 'manager']

    >>> node.__acl__
    [('Allow', 'someuser', ['cut', 'edit', 'copy', 'manage', 'list', 'add', 
    'change_state', 'view', 'paste', 'manage_permissions', 'delete']), 
    ('Allow', 'otheruser', ['edit', 'add', 'list', 'view']), 
    ('Allow', 'group:some_group', ['cut', 'edit', 'copy', 'manage', 'list', 
    'add', 'change_state', 'view', 'paste', 'manage_permissions', 'delete']), 
    ('Allow', 'system.Authenticated', ['view']), 
    ('Allow', 'role:viewer', ['view', 'list']), 
    ...
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]

PrincipalACL role inheritance::

    >>> child = node['child'] = MyPrincipalACLNode()
    >>> child.principal_roles['someuser'] = ['editor']
    >>> child.__acl__
    [('Allow', 'someuser', ['edit', 'add', 'list', 'view']), 
    ('Allow', 'system.Authenticated', ['view']), 
    ('Allow', 'role:viewer', ['view', 'list']), 
    ...
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
    [('Allow', 'someuser', ['cut', 'edit', 'copy', 'manage', 'list', 'add', 
    'change_state', 'view', 'paste', 'manage_permissions', 'delete']), 
    ('Allow', 'otheruser', ['cut', 'edit', 'copy', 'list', 'add', 
    'change_state', 'view', 'paste', 'manage_permissions', 'delete']), 
    ('Allow', 'group:some_group', ['cut', 'edit', 'copy', 'manage', 'list', 
    'add', 'change_state', 'view', 'paste', 'manage_permissions', 'delete']), 
    ('Allow', 'system.Authenticated', ['view']), 
    ...
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
    ('Allow', 'role:viewer', ['view', 'list']), 
    ...
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]

If an authentication plugin raises an error when calling ``authenticate``, an
error message is logged::

    >>> class TestHandler(logging.StreamHandler):
    ...     def handle(self, record):
    ...         print record

    >>> handler = TestHandler()

    >>> logger.addHandler(handler)
    >>> logger.setLevel(logging.DEBUG)

    >>> old_ugm = cone.app.cfg.auth
    >>> cone.app.cfg.auth = object()

    >>> request = layer.current_request

    >>> authenticate(request, 'foo', 'foo')
    <LogRecord: cone.app, 30, ...security.py, ..., 
    "Authentication plugin <type 'object'> raised an Exception while trying 
    to authenticate: 'object' object has no attribute 'users'">

Test Group callback, also logs if an error occurs::

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
"""
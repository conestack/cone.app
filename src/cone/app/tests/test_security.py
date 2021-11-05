from cone.app import security
from cone.app import testing
from cone.app.interfaces import IAuthenticator
from cone.app.interfaces import IOwnerSupport
from cone.app.interfaces import IPrincipalACL
from cone.app.model import BaseNode
from cone.app.security import acl_registry
from cone.app.security import authenticate
from cone.app.security import authenticated_user
from cone.app.security import DEFAULT_ACL
from cone.app.security import groups_callback
from cone.app.security import logger
from cone.app.security import OwnerSupport
from cone.app.security import principal_by_id
from cone.app.security import PrincipalACL
from cone.app.security import search_for_principals
from cone.app.ugm import ugm_backend
from node.ext.ugm.interfaces import IGroup
from node.ext.ugm.interfaces import IUser
from node.tests import NodeTestCase
from node.utils import instance_property
from plumber import default
from plumber import plumbing
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.interfaces import IAuthenticationPolicy
from pyramid.security import ACLAllowed
from pyramid.security import ACLDenied
from pyramid.security import ALL_PERMISSIONS
from pyramid.threadlocal import get_current_registry
from zope.component.globalregistry import BaseGlobalComponents
from zope.interface import implementer
import logging


@implementer(IAuthenticator)
class TestAuthenticator(object):

    def authenticate(self, login, password):
        return login


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

        with self.layer.authenticated('manager'):
            user = authenticated_user(self.layer.current_request)
            self.assertTrue(IUser.providedBy(user))
            self.assertEqual(user.name, 'manager')

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
            ('Allow', 'role:editor', [
                'view', 'list', 'add', 'edit', 'change_order'
            ]),
            ('Allow', 'role:admin', [
                'view', 'list', 'add', 'edit', 'change_order', 'delete', 'cut',
                'copy', 'paste', 'manage_permissions', 'change_state'
            ]),
            ('Allow', 'role:manager', [
                'view', 'list', 'add', 'edit', 'change_order', 'delete', 'cut',
                'copy', 'paste', 'manage_permissions', 'change_state', 'manage'
            ]),
            ('Allow', 'role:owner', [
                'view', 'list', 'add', 'edit', 'change_order', 'delete', 'cut',
                'copy', 'paste', 'manage_permissions', 'change_state'
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

        with self.layer.authenticated('inexistent'):
            userid = self.layer.current_request.authenticated_userid
            self.assertTrue(userid is None)

        # Create some security context for testing
        class ACLTest(object):
            __acl__ = DEFAULT_ACL
        context = ACLTest()

        # Authenticate several users and check permission
        with self.layer.authenticated('superuser', 'superuser'):
            userid = self.layer.current_request.authenticated_userid
            self.assertEqual(userid, 'superuser')

            rule = self.layer.current_request.has_permission('manage', context)
            self.assertTrue(isinstance(rule, ACLAllowed))

        with self.layer.authenticated('viewer'):
            userid = self.layer.current_request.authenticated_userid
            self.assertEqual(userid, 'viewer')

            rule = self.layer.current_request.has_permission('manage', context)
            self.assertTrue(isinstance(rule, ACLDenied))

        userid = self.layer.current_request.authenticated_userid
        self.assertTrue(userid is None)

        rule = self.layer.current_request.has_permission('manage', context)
        self.assertTrue(isinstance(rule, ACLDenied))

    def test_ACLRegistry(self):
        class SomeModel(object):
            pass

        acl = [('Allow', 'role:viewer', ['view'])]
        acl_registry.register(acl, SomeModel)

        acl = [('Allow', 'role:viewer', ['edit'])]
        acl_registry.register(acl, node_info_name='some_model')

        acl = [('Allow', 'role:viewer', ['delete'])]
        acl_registry.register(acl, SomeModel, 'some_model')

        self.assertEqual(
            acl_registry.lookup(None, None, [('Allow', 'role:viewer', ['add'])]),
            [('Allow', 'role:viewer', ['add'])]
        )
        self.assertEqual(
            acl_registry.lookup(SomeModel),
            [('Allow', 'role:viewer', ['view'])]
        )
        self.assertEqual(
            acl_registry.lookup(node_info_name='some_model'),
            [('Allow', 'role:viewer', ['edit'])]
        )
        self.assertEqual(
            acl_registry.lookup(SomeModel, 'some_model'),
            [('Allow', 'role:viewer', ['delete'])]
        )

    def test_OwnerSupport(self):
        @plumbing(OwnerSupport)
        class OwnerSupportNode(BaseNode):
            pass

        ownersupportnode = OwnerSupportNode()
        self.assertTrue(IOwnerSupport.providedBy(ownersupportnode))
        self.assertTrue(ownersupportnode.owner is None)
        self.assertEqual(
            ownersupportnode.__acl__[0],
            ('Allow', 'system.Authenticated', ['view'])
        )

        with self.layer.authenticated('sepp'):
            userid = self.layer.current_request.authenticated_userid
            self.assertEqual(userid, 'sepp')

            ownersupportnode = OwnerSupportNode()
            self.assertEqual(ownersupportnode.owner, 'sepp')
            self.assertEqual(ownersupportnode.attrs['owner'], 'sepp')
            self.assertEqual(ownersupportnode.__acl__, [
                ('Allow', 'sepp', [
                    'view', 'list', 'add', 'edit', 'change_order', 'delete',
                    'cut', 'copy', 'paste', 'manage_permissions', 'change_state'
                ]),
                ('Allow', 'system.Authenticated', ['view']),
                ('Allow', 'role:viewer', ['view', 'list']),
                ('Allow', 'role:editor', [
                    'view', 'list', 'add', 'edit', 'change_order'
                ]),
                ('Allow', 'role:admin', [
                    'view', 'list', 'add', 'edit', 'change_order', 'delete',
                    'cut', 'copy', 'paste', 'manage_permissions',
                    'change_state'
                ]),
                ('Allow', 'role:manager', [
                    'view', 'list', 'add', 'edit', 'change_order', 'delete',
                    'cut', 'copy', 'paste', 'manage_permissions',
                    'change_state', 'manage'
                ]),
                ('Allow', 'role:owner', [
                    'view', 'list', 'add', 'edit', 'change_order', 'delete',
                    'cut', 'copy', 'paste', 'manage_permissions',
                    'change_state'
                ]),
                ('Allow', 'system.Everyone', ['login']),
                ('Deny', 'system.Everyone', ALL_PERMISSIONS)
            ])

        with self.layer.authenticated('viewer'):
            rule = self.layer.current_request.has_permission(
                'delete',
                ownersupportnode
            )
            self.assertTrue(isinstance(rule, ACLDenied))

        with self.layer.authenticated('sepp'):
            rule = self.layer.current_request.has_permission(
                'delete',
                ownersupportnode
            )
            self.assertTrue(isinstance(rule, ACLAllowed))

        @plumbing(OwnerSupport)
        class NoOwnerACLOnBaseNode(BaseNode):
            @property
            def __acl__(self):
                return [('Allow', 'role:viewer', ['view'])]

        with self.layer.authenticated('sepp'):
            ownersupportnode = NoOwnerACLOnBaseNode()
            self.assertEqual(ownersupportnode.owner, 'sepp')
            self.assertEqual(
                ownersupportnode.__acl__,
                [('Allow', 'role:viewer', ['view'])]
            )

    def test_PrincipalACL(self):
        # PrincipalACL is an abstract class. Directly use causes an error
        @plumbing(PrincipalACL)
        class PrincipalACLNode(BaseNode):
            pass

        node = PrincipalACLNode()
        err = self.expect_error(NotImplementedError, lambda: node.__acl__)
        expected = (
            'Abstract ``PrincipalACL`` does not implement ``principal_roles``.'
        )
        self.assertEqual(str(err), expected)

        # Concrete PrincipalACL implementation. Implements principal_roles
        # property
        class MyPrincipalACL(PrincipalACL):
            @default
            @instance_property
            def principal_roles(self):
                return dict()

        @plumbing(MyPrincipalACL)
        class MyPrincipalACLNode(BaseNode):
            pass

        node = MyPrincipalACLNode()
        self.assertTrue(IPrincipalACL.providedBy(node))

        node.principal_roles['someuser'] = ['manager']
        node.principal_roles['otheruser'] = ['editor']
        node.principal_roles['group:some_group'] = ['editor', 'manager']

        def find_rule(acl, who):
            for rule in acl:
                if rule[1] == who:
                    return rule

        rule = find_rule(node.__acl__, 'someuser')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'someuser')
        self.assertEqual(sorted(rule[2]), sorted([
            'cut', 'change_order', 'edit', 'copy', 'manage', 'list', 'add',
            'change_state', 'view', 'paste', 'manage_permissions', 'delete'
        ]))

        rule = find_rule(node.__acl__, 'otheruser')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'otheruser')
        self.assertEqual(sorted(rule[2]), sorted([
            'edit', 'add', 'list', 'view', 'change_order'
        ]))

        rule = find_rule(node.__acl__, 'group:some_group')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'group:some_group')
        self.assertEqual(sorted(rule[2]), sorted([
            'cut', 'edit', 'copy', 'manage', 'list', 'add', 'change_state',
            'view', 'paste', 'manage_permissions', 'delete', 'change_order'
        ]))

        rule = find_rule(node.__acl__, 'system.Authenticated')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'system.Authenticated')
        self.assertEqual(rule[2], ['view'])

        rule = find_rule(node.__acl__, 'role:viewer')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'role:viewer')
        self.assertEqual(sorted(rule[2]), sorted(['view', 'list']))

        rule = node.__acl__[-1]
        self.assertEqual(rule[0], 'Deny')
        self.assertEqual(rule[1], 'system.Everyone')
        self.assertEqual(rule[2], ALL_PERMISSIONS)

        # PrincipalACL role inheritance
        child = node['child'] = MyPrincipalACLNode()
        child.principal_roles['someuser'] = ['editor']

        rule = find_rule(child.__acl__, 'someuser')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'someuser')
        self.assertEqual(sorted(rule[2]), sorted([
            'edit', 'add', 'list', 'view', 'change_order'
        ]))

        rule = find_rule(child.__acl__, 'system.Authenticated')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'system.Authenticated')
        self.assertEqual(rule[2], ['view'])

        rule = find_rule(child.__acl__, 'role:viewer')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'role:viewer')
        self.assertEqual(sorted(rule[2]), sorted(['view', 'list']))

        rule = child.__acl__[-1]
        self.assertEqual(rule[0], 'Deny')
        self.assertEqual(rule[1], 'system.Everyone')
        self.assertEqual(rule[2], ALL_PERMISSIONS)

        subchild = child['child'] = MyPrincipalACLNode()
        subchild.role_inheritance = True
        subchild.principal_roles['otheruser'] = ['admin']
        self.assertEqual(subchild.aggregated_roles_for('inexistent'), [])
        self.assertEqual(
            sorted(subchild.aggregated_roles_for('someuser')),
            sorted(['manager', 'editor'])
        )
        self.assertEqual(
            sorted(subchild.aggregated_roles_for('otheruser')),
            sorted(['admin', 'editor'])
        )

        rule = find_rule(subchild.__acl__, 'someuser')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'someuser')
        self.assertEqual(sorted(rule[2]), sorted([
            'cut', 'edit', 'copy', 'manage', 'list', 'add', 'change_state',
            'view', 'paste', 'manage_permissions', 'delete', 'change_order'
        ]))

        rule = find_rule(subchild.__acl__, 'otheruser')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'otheruser')
        self.assertEqual(sorted(rule[2]), sorted([
            'cut', 'edit', 'copy', 'list', 'add', 'change_state', 'view',
            'paste', 'manage_permissions', 'delete', 'change_order'
        ]))

        rule = find_rule(subchild.__acl__, 'group:some_group')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'group:some_group')
        self.assertEqual(sorted(rule[2]), sorted([
            'cut', 'edit', 'copy', 'manage', 'list', 'add', 'change_state',
            'view', 'paste', 'manage_permissions', 'delete', 'change_order'
        ]))

        rule = find_rule(subchild.__acl__, 'system.Authenticated')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'system.Authenticated')
        self.assertEqual(rule[2], ['view'])

        rule = subchild.__acl__[-1]
        self.assertEqual(rule[0], 'Deny')
        self.assertEqual(rule[1], 'system.Everyone')
        self.assertEqual(rule[2], ALL_PERMISSIONS)

        # Principal roles get inherited even if some parent does not provide
        # principal roles
        child = node['no_principal_roles'] = BaseNode()
        subchild = child['no_principal_roles'] = MyPrincipalACLNode()
        self.assertEqual(
            sorted(subchild.aggregated_roles_for('group:some_group')),
            sorted(['manager', 'editor'])
        )

        # If principal role found which is not provided by plumbing endpoint
        # acl, this role does not grant any permissions
        node = MyPrincipalACLNode()
        node.principal_roles['someuser'] = ['inexistent_role']

        rule = find_rule(node.__acl__, 'someuser')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'someuser')
        self.assertEqual(rule[2], [])

        rule = find_rule(node.__acl__, 'system.Authenticated')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'system.Authenticated')
        self.assertEqual(rule[2], ['view'])

        rule = find_rule(node.__acl__, 'role:viewer')
        self.assertEqual(rule[0], 'Allow')
        self.assertEqual(rule[1], 'role:viewer')
        self.assertEqual(sorted(rule[2]), sorted(['view', 'list']))

        rule = node.__acl__[-1]
        self.assertEqual(rule[0], 'Deny')
        self.assertEqual(rule[1], 'system.Everyone')
        self.assertEqual(rule[2], ALL_PERMISSIONS)
        self.assertEqual(
            node.__acl__[-1],
            ('Deny', 'system.Everyone', ALL_PERMISSIONS)
        )

    def test_authentication_logging(self):
        # If an authentication plugin raises an error when calling
        # ``authenticate``, an error message is logged
        class TestHandler(logging.StreamHandler):
            record = None

            def handle(self, record):
                self.record = record

        handler = TestHandler()

        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)

        orgin_ugm = ugm_backend.ugm
        ugm_backend.ugm = object()

        authenticate(self.layer.new_request(), 'foo', 'foo')

        self.check_output("""
        <LogRecord: cone.app, ..., ...security.py, ...,
        "Authentication plugin <... 'object'> raised an Exception while trying
        to authenticate: 'object' object has no attribute 'users'">
        """, str(handler.record))

        # Test Group callback, also logs if an error occurs
        with self.layer.authenticated('superuser', 'superuser'):
            self.assertEqual(
                groups_callback('superuser', self.layer.new_request()),
                [u'role:manager']
            )

        groups_callback('foo', self.layer.new_request())
        self.check_output("""
        <LogRecord: cone.app, 40,
        ...security.py, ..., "'object' object has no attribute 'users'">
        """, str(handler.record))

        # Cleanup
        logger.setLevel(logging.INFO)
        logger.removeHandler(handler)
        ugm_backend.ugm = orgin_ugm

    def test_IAuthenticator(self):
        request = self.layer.new_request()
        registry = request.registry
        authenticator = TestAuthenticator()
        registry.registerUtility(
            authenticator,
            IAuthenticator,
            name='test_authenticator'
        )
        authenticator_origin = security.AUTHENTICATOR
        security.AUTHENTICATOR = 'test_authenticator'

        with self.layer.authenticated('foo'):
            self.assertEqual(request.authenticated_userid, 'foo')
        self.assertEqual(request.authenticated_userid, None)

        security.AUTHENTICATOR = authenticator_origin
        registry.unregisterUtility(authenticator)

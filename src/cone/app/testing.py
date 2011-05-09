import os
from pyramid.threadlocal import get_current_registry
from pyramid.interfaces import (
    IAuthenticationPolicy,
    IAuthorizationPolicy,
)
from pyramid.authentication import CallbackAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy
from pyramid.registry import global_registry
from pyramid.testing import DummyRequest
from plone.testing import Layer
from node.ext.ugm.file import Ugm
from cone.app.utils import app_config


def groups_callback(name, request):
    """Group callback for security test layer.
    """
    if name == 'viewer':
        return ['role:viewer']
    if name == 'editor':
        return ['role:editor']
    if name == 'owner':
        return ['role:owner']
    if name == 'manager':
        return ['role:manager']
    return []


DATADIR = os.path.join(os.path.dirname(__file__), 'tests', 'data', 'ugm')

class Security(Layer):
    """Test layer with dummy authentication for security testing.
    """

    def authenticate(self, login):
        self.authn.unauthenticated_userid = lambda *args: login
        
    def logout(self):
        self.authn.unauthenticated_userid = lambda *args: None
    
    def defaults(self):
        return {'request': self.current_request, 'registry': global_registry}
    
    def request(self):
        self.current_request = DummyRequest()
        return self.current_request
    
    def _create_dummy_users(self, ugm):
        """Needed once to create testing users and groups.
        
        Files created by this function are contained in tests/ugm.
        
        Function only needed if test users change
        """
        user = ugm.users.create('viewer',
                                fullname='Viewer User',
                                email='viewer@bar.com')
        user.add_role('viewer')
        ugm.users.passwd('viewer', '', 'secret')
        user = ugm.users.create('editor',
                                fullname='Editor User',
                                email='editor@bar.com')
        user.add_role('editor')
        ugm.users.passwd('editor', '', 'secret')
        user = ugm.users.create('owner',
                                fullname='Owner User',
                                email='owner@bar.com')
        user.add_role('owner')
        ugm.users.passwd('owner', '', 'secret')
        user = ugm.users.create('manager',
                                fullname='Manager User',
                                email='manager@bar.com')
        user.add_role('manager')
        ugm.users.passwd('manager', '', 'secret')
        user = ugm.users.create('max',
                                fullname='Max Mustermann',
                                email='max@bar.com')
        ugm.users.passwd('max', '', 'secret')
        group = ugm.groups.create('group1', description='Group 1 Description')
        group['viewer'] = ugm.users['viewer']
        group['max'] = ugm.users['max']
        ugm()
    
    def initialize_ugm(self):
        cfg = app_config()
        users_file = os.path.join(DATADIR, 'users')
        groups_file = os.path.join(DATADIR, 'groups')
        roles_file = os.path.join(DATADIR, 'roles')
        datadir = os.path.join(DATADIR, 'userdata')
        ugm = Ugm(name='ugm',
                  users_file=users_file,
                  groups_file=groups_file,
                  roles_file=roles_file,
                  data_directory=datadir)
        # Function only needed if test users change
        #self._create_dummy_users(ugm)
        cfg.auth.append(ugm)
    
    def setUp(self, args=None):
        self.request()
        import pyramid.threadlocal
        pyramid.threadlocal.manager.default = self.defaults
        self.initialize_ugm()
        self.authn = CallbackAuthenticationPolicy()
        self.authn.callback = groups_callback
        self.authn.remember = lambda self, x: [['X-Foo', x]]
        self.authn.forget = lambda x: None
        self.authn.unauthenticated_userid = lambda *args: None
        self.authz = ACLAuthorizationPolicy()
        self.registry = get_current_registry()
        self.registry.settings = dict()
        self.registry.registerUtility(self.authn, IAuthenticationPolicy)
        self.registry.registerUtility(self.authz, IAuthorizationPolicy)
        print "Security set up."

    def tearDown(self):
        import pyramid.threadlocal
        pyramid.threadlocal.manager.default = pyramid.threadlocal.defaults
        self.registry.unregisterUtility(self.authn, IAuthenticationPolicy)
        self.registry.unregisterUtility(self.authz, IAuthorizationPolicy)
        print "Security torn down."

security = Security()
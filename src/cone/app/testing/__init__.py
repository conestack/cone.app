import os
import cone.app
from pyramid.testing import DummyRequest
from zope.component import getGlobalSiteManager
from zope.component.hooks import resetHooks
from plone.testing import Layer
from cone.app.security import authenticate


DATADIR = os.path.join(os.path.dirname(__file__), 'data', 'ugm')


class Security(Layer):
    """Test layer with dummy authentication for security testing.
    """

    def login(self, login):
        request = self.current_request
        if not request:
            request = self.new_request()
        else:
            self.logout()
        res = authenticate(request, login, 'secret')
        if res:
            request.environ['HTTP_COOKIE'] = res[0][1]
        
    auth_env_keys = [
        'HTTP_COOKIE',
        'paste.cookies',
        'REMOTE_USER_TOKENS',
        'REMOTE_USER_DATA',
        'cone.app.user.roles',
    ]
    
    def logout(self):
        request = self.current_request
        if request:
            environ = request.environ
            for key in self.auth_env_keys:
                if environ.has_key(key):
                    del environ[key]
    
    def defaults(self):
        return {'request': self.current_request, 'registry': self.registry}
    
    @property
    def registry(self):
        return getGlobalSiteManager()
    
    def new_request(self, type=None):
        request = self.current_request
        auth = dict()
        if request:
            environ = request.environ
            for key in self.auth_env_keys:
                if environ.has_key(key):
                    auth[key] = environ[key]
        request = DummyRequest()
        request.environ['SERVER_NAME'] = 'testcase'
        request.environ['AUTH_TYPE'] = 'cookie'
        request.environ.update(auth)
        if type == 'json':
            request.headers['X-Request'] = 'JSON'
            request.accept = 'application/json'
        self.current_request = request
        return request
    
    def make_app(self, **kw):
        settings = {
            'cone.admin_user': 'superuser',
            'cone.admin_password': 'superuser',
            'cone.auth_secret': '12345',
            'cone.auth_impl': 'node.ext.ugm',
            'cone.plugins': 'node.ext.ugm',
            'cone.root.title': 'cone',
            'cone.root.default_child': None,
            'cone.root.mainmenu_empty_title': False,
            'node.ext.ugm.users_file': os.path.join(DATADIR, 'users'),
            'node.ext.ugm.groups_file': os.path.join(DATADIR, 'groups'),
            'node.ext.ugm.roles_file': os.path.join(DATADIR, 'roles'),
            'node.ext.ugm.datadir': os.path.join(DATADIR, 'userdata'),
            'testing.hook_global_registry': True,
        }
        settings.update(**kw)
        self.app = cone.app.main({}, **settings)
        self.current_request = None
        import pyramid.threadlocal
        pyramid.threadlocal.manager.default = self.defaults
    
    def setUp(self, args=None):
        self.make_app()
        print "Security set up."

    def tearDown(self):
        # XXX: something is wrong here.
        import pyramid.threadlocal
        pyramid.threadlocal.manager.default = pyramid.threadlocal.defaults
        resetHooks()
        print "Security torn down."

security = Security()
from pyramid.registry import global_registry
from pyramid.testing import DummyRequest
from plone.testing import Layer
from cone.app.security import authenticate


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
    
    def new_request(self):
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
        self.current_request = request
        return request
    
    def _get_registry(self):
        if hasattr(self, '_current_registry') \
          and self._current_registry is not None:
            return self._current_registry
        return global_registry
    
    def _set_registry(self, registry):
        self._current_registry = registry
    
    registry = property(_get_registry, _set_registry)
    
    def setUp(self, args=None):
        self.current_request = None
        self.new_request()
        self.registry = None
        import pyramid.threadlocal
        pyramid.threadlocal.manager.default = self.defaults
        print "Security set up."

    def tearDown(self):
        import pyramid.threadlocal
        pyramid.threadlocal.manager.default = pyramid.threadlocal.defaults
        print "Security torn down."

security = Security()
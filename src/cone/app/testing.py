from pyramid.registry import global_registry
from pyramid.testing import DummyRequest
from plone.testing import Layer
from cone.app.security import authenticate


class Security(Layer):
    """Test layer with dummy authentication for security testing.
    """

    def login(self, login):
        request = self.new_request()
        res = authenticate(request, login, 'secret')
        if res:
            self.current_request.environ['HTTP_COOKIE'] = res[0][1]
        
    def logout(self):
        self.new_request()
    
    def defaults(self):
        return {'request': self.current_request, 'registry': self.registry}
    
    def new_request(self):
        self.current_request = DummyRequest()
        self.current_request.registry = self.registry
        self.current_request.environ['SERVER_NAME'] = 'testcase'
        self.current_request.environ['AUTH_TYPE'] = 'cookie'
        return self.current_request
    
    def _get_registry(self):
        if hasattr(self, '_current_registry') \
          and self._current_registry is not None:
            return self._current_registry
        return global_registry
    
    def _set_registry(self, registry):
        self._current_registry = registry
    
    registry = property(_get_registry, _set_registry)
    
    def setUp(self, args=None):
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
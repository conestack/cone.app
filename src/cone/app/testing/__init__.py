from cone.app import model
from cone.app.security import authenticate
from cone.tile.tests import DummyVenusian
from contextlib import contextmanager
from pyramid.security import AuthenticationAPIMixin
from pyramid.testing import DummyRequest as BaseDummyRequest
from zope.component import getGlobalSiteManager
from zope.component.hooks import resetHooks
from zope.configuration.xmlconfig import XMLConfig
import cone.app
import cone.tile
import os
import venusian


def reset_node_info_registry(fn):
    """Decorator for tests using node info registry
    """
    def wrapper(*a, **kw):
        try:
            fn(*a, **kw)
        finally:
            model._node_info_registry = dict()
    return wrapper


class DummyRequest(BaseDummyRequest, AuthenticationAPIMixin):

    @property
    def is_xhr(self):
        return self.headers.get('X-Requested-With') == 'XMLHttpRequest'


DATADIR = os.path.join(os.path.dirname(__file__), 'data', 'ugm')


class Security(object):
    """Test layer with dummy authentication for security testing.
    """
    current_request = None
    auth_env_keys = [
        'REMOTE_USER_TOKENS',
        'REMOTE_USER_DATA',
        'HTTP_COOKIE',
        'cone.app.user.roles',
    ]

    def __init__(self):
        self.__name__ = self.__class__.__name__
        self.__bases__ = []

    @property
    def registry(self):
        return getGlobalSiteManager()

    def defaults(self):
        return {
            'request': self.current_request,
            'registry': self.registry
        }

    def new_request(self, type=None, xhr=False):
        request = self.current_request
        auth = dict()
        cookies = dict()
        if request:
            cookies = request.cookies
            environ = request.environ
            for key in self.auth_env_keys:
                if key in environ:
                    auth[key] = environ[key]
        request = DummyRequest()
        request.cookies.update(cookies)
        request.environ['SERVER_NAME'] = 'testcase'
        request.environ['AUTH_TYPE'] = 'cookie'
        request.environ.update(auth)
        request.params['_LOCALE_'] = 'en'
        if type == 'json':
            request.headers['X-Request'] = 'JSON'
            request.accept = 'application/json'
        if xhr:
            request.headers['X-Requested-With'] = 'XMLHttpRequest'
        self.current_request = request
        return request

    def login(self, login, password=None):
        request = self.current_request
        if not request:
            request = self.new_request()
        else:
            self.logout()
        password = password if password else 'secret'
        res = authenticate(request, login, password)
        if res:
            request.environ['HTTP_COOKIE'] = res[0][1]
            cookie = res[0][1].split(';')[0].split('=')
            request.cookies[cookie[0]] = cookie[1]

    def logout(self):
        request = self.current_request
        if request:
            request.cookies.clear()
            environ = request.environ
            for key in self.auth_env_keys:
                if key in environ:
                    del environ[key]

    @contextmanager
    def authenticated(self, login, password=None):
        try:
            self.login(login, password=password)
            yield
        finally:
            self.logout()

    @contextmanager
    def hook_tile_reg(self):
        try:
            cone.tile.tile.venusian = DummyVenusian()
            yield
        finally:
            cone.tile.tile.venusian = venusian

    def make_app(self, **kw):
        import pyramid.threadlocal
        pyramid.threadlocal.manager.default = self.defaults
        settings = {
            'default_locale_name': 'en',
            'cone.admin_user': 'superuser',
            'cone.admin_password': 'superuser',
            'cone.auth_secret': '12345',
            'cone.plugins': 'node.ext.ugm\ninexistent',
            'cone.root.title': 'cone',
            'cone.root.default_child': None,
            'cone.root.default_content_tile': 'content',
            'cone.root.mainmenu_empty_title': False,
            'ugm.backend': 'file',
            'ugm.user_display_attr': 'fullname',
            'ugm.group_display_attr': 'groupname',
            'ugm.users_file': os.path.join(DATADIR, 'users'),
            'ugm.groups_file': os.path.join(DATADIR, 'groups'),
            'ugm.roles_file': os.path.join(DATADIR, 'roles'),
            'ugm.datadir': os.path.join(DATADIR, 'userdata'),
            'testing.hook_global_registry': True,
        }
        settings.update(**kw)
        self.app = cone.app.main({}, **settings)
        self.current_request = None

    def setUp(self, args=None):
        self.make_app()
        XMLConfig('testing/dummy_workflow.zcml', cone.app)()
        print("Security set up.")

    def tearDown(self):
        # XXX: something is wrong here.
        import pyramid.threadlocal
        pyramid.threadlocal.manager.default = pyramid.threadlocal.defaults
        resetHooks()
        print("Security torn down.")


security = Security()

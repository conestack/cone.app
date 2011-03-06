from webob.exc import HTTPFound
from yafowil.base import (
    factory,
    ExtractionError,
    UNSET,
)
from cone.tile import tile
from cone.app.security import authenticate
from cone.app.browser.utils import authenticated
from cone.app.browser.form import Form
from cone.app.browser.utils import make_url

@tile('loginform', permission="login")
class LoginForm(Form):
    
    def prepare(self):
        action = make_url(self.request, node=self.model, resource='login')
        form = factory(u'form',
                       name='loginform',
                       props={'action': action})
        form['__do_login'] = factory('hidden', value='true')
        form['user'] = factory(
            'field:label:error:text',
            props = {
                'required': 'No username given',
                'label': 'Username',
            })    
        form['password'] = factory(
            'field:label:*credentials:error:password',
            props = {
                'required': 'No password given',
                'label': 'Password',
            },
            custom = {
                'credentials': ([self.login], [], [], []),
            })
        form['login'] = factory(
            'submit',
            props = {
                'action': 'login',
                'expression': True,
                'handler': None,
                'next': self.next,
                'label': 'Login',
            })
        self.form = form
    
    def login(self, widget, data):
        login = data.root['user'].extracted
        # get password directly from request instead of widget data for password
        # XXX_ figure out whats wrong
        password = data.request.get('loginform.password')
        self.headers = authenticate(data.request.request, login, password)
        if not self.headers:
            raise ExtractionError(u'Invalid Credentials')
    
    def next(self, request):
        if not self.headers:
            return self.render()
        return HTTPFound(location=request.request.application_url,
                         headers=self.headers)

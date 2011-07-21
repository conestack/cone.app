from webob.exc import HTTPFound
from yafowil.base import (
    factory,
    ExtractionError,
    UNSET,
)
from cone.tile import tile
from cone.app.security import authenticate
from cone.app.browser.form import Form
from cone.app.browser.utils import make_url


@tile('loginform', permission="login")
class LoginForm(Form):
    ajax = False
    
    def prepare(self):
        action = make_url(self.request, node=self.model, resource='login')
        form = factory(
            u'form',
            name='loginform',
            props={
                'action': action
            })
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
                'handler': self.noop,
                'next': self.next,
                'label': 'Login',
            })
        self.form = form
    
    def noop(self, widget, data):
        pass
    
    def login(self, widget, data):
        login = data.fetch('loginform.user').extracted
        password = data.fetch('loginform.password').extracted
        webob_req = data.request.request
        self.headers = authenticate(webob_req, login, password)
        if not self.headers:
            raise ExtractionError(u'Invalid Credentials')
    
    def next(self, request):
        return HTTPFound(location=request.request.application_url,
                         headers=self.headers)
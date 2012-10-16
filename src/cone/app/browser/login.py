from webob.exc import HTTPFound
from pyramid.i18n import TranslationStringFactory
from yafowil.base import (
    factory,
    ExtractionError,
)
from cone.tile import tile
from ..security import authenticate
from .form import Form
from .utils import make_url

_ = TranslationStringFactory('cone.app')


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
            props={
                'required': _('no_username_given', 'No username given'),
                'label': _('username', 'Username'),
            })
        form['password'] = factory(
            'field:label:*credentials:error:password',
            props={
                'required': _('no_password_given', 'No password given'),
                'label': _('password', 'Password'),
            },
            custom={
                'credentials': ([self.login], [], [], []),
            })
        form['login'] = factory(
            'submit',
            props={
                'action': 'login',
                'expression': True,
                'handler': self.noop,
                'next': self.next,
                'label': _('login', 'Login'),
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
            raise ExtractionError(
                _('invalid_credentials', 'Invalid Credentials'))

    def next(self, request):
        return HTTPFound(location=request.request.application_url,
                         headers=self.headers)

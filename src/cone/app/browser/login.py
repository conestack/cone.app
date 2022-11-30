from cone.app.browser import render_main_template
from cone.app.browser.form import Form
from cone.app.browser.utils import make_url
from cone.app.security import authenticate
from cone.tile import tile
from pyramid.i18n import TranslationStringFactory
from pyramid.security import forget
from pyramid.view import view_config
from webob.exc import HTTPFound
from yafowil.base import ExtractionError
from yafowil.base import factory


_ = TranslationStringFactory('cone.app')


@view_config(name='login')
def login_view(model, request):
    return render_main_template(model, request, contenttile='loginform')


@view_config(name='logout')
def logout_view(model, request):
    headers = forget(request)
    location = request.params.get('came_from', request.application_url)
    return HTTPFound(location=location, headers=headers)


@tile(name='loginform', permission='login')
class LoginForm(Form):
    ajax = False

    def prepare(self):
        action = make_url(self.request, node=self.model, resource='login')
        form = factory(
            u'form',
            name='loginform',
            props={
                'action': action,
                'class': 'form-horizontal',
            })
        form['user'] = factory(
            'field:label:div:help:error:text',
            props={
                'required': _('no_username_given', default='No username given'),
                'label': _('username', default='Username'),
                'label.class_add': 'col-sm-2',
                'div.class_add': 'col-sm-5',
            })
        form['password'] = factory(
            'field:label:div:help:*credentials:error:password',
            props={
                'required': _('no_password_given', default='No password given'),
                'label': _('password', default='Password'),
                'label.class_add': 'col-sm-2',
                'div.class_add': 'col-sm-5',
            },
            custom={
                'credentials': ([self.login], [], [], []),
            })
        actions = form['form_actions'] = factory(
            'field:div',
            props={
                'div.class_add': 'col-sm-offset-2 col-sm-5',
                'structural': True,
            })
        actions['login'] = factory(
            'submit',
            props={
                'action': 'login',
                'expression': True,
                'handler': self.noop,
                'next': self.next,
                'label': _('login', default='Login'),
                'div.class_add': 'col-sm-offset-2 col-sm-5',
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
            raise ExtractionError(_(
                'invalid_credentials',
                default='Invalid Credentials'
            ))

    def next(self, request):
        return HTTPFound(
            location=request.request.application_url,
            headers=self.headers
        )

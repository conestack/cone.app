from cone.app.browser import render_main_template
from cone.app.browser.form import Form
from cone.app.browser.utils import is_same_host_url
from cone.app.browser.utils import make_url
from cone.app.browser.utils import page_url
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
    response = render_main_template(model, request, contenttile='loginform')
    # The template rendering creates its own response.
    if request.response.status_int == 401:
        response.status_int = 401
    return response


@view_config(name='logout')
def logout_view(model, request):
    headers = forget(request)
    location = request.params.get('came_from', '')
    if not is_same_host_url(request, location):
        location = request.application_url
    return HTTPFound(location=location, headers=headers)


@tile(name='loginform', permission='login')
class LoginForm(Form):
    ajax = False

    def prepare(self):
        action = make_url(self.request, node=self.model, resource='login')
        form = factory(
            'form',
            name='loginform',
            props={
                'action': action,
                'class': 'form-horizontal',
            },
        )
        form['user'] = factory(
            'field:label:div:help:error:text',
            props={
                'required': _('no_username_given', default='No username given'),
                'label': _('username', default='Username'),
            },
        )
        form['password'] = factory(
            'field:label:div:help:*credentials:error:password',
            props={
                'required': _('no_password_given', default='No password given'),
                'label': _('password', default='Password'),
            },
            custom={
                'credentials': ([self.login], [], [], []),
            },
        )
        # Bare name, the logout view takes the same parameter.
        form['came_from'] = factory('proxy', value=self.came_from)
        actions = form['form_actions'] = factory(
            'field:div',
            props={
                'structural': True,
            },
        )
        actions['login'] = factory(
            'submit',
            props={
                'action': 'login',
                'expression': True,
                'handler': self.noop,
                'next': self.next,
                'label': _('login', default='Login'),
                'class_add': 'bg-primary text-light',
            },
        )
        self.form = form

    @property
    def came_from(self):
        """Where the login leads back to: the page that showed the form.

        Pages refused to anonymous users render the form in place, the login
        returns there instead of to the start page. On the login view itself
        it is what the view was sent, kept through a failed attempt.

        Not ``CameFromNext``: the login answers outside ajax, with the headers
        of the ticket, and falls back to the start page, not to the node.
        """
        if self.request.view_name == 'login':
            return self.request.params.get('came_from', '')
        return page_url(self.request, self.model)

    def noop(self, widget, data):
        pass

    def login(self, widget, data):
        login = data.fetch('loginform.user').extracted
        password = data.fetch('loginform.password').extracted
        # Forms extract on every rendering, this is no login attempt then.
        if not login or not password:
            return data.extracted
        # The form posts to the login view. Pages showing it for anonymous users and
        # ajaxaction render it too, a throttle at the edge would not see them.
        if self.request.view_name != 'login':
            raise ExtractionError(_('invalid_credentials', default='Invalid Credentials'))
        webob_req = data.request.request
        self.headers = authenticate(webob_req, login, password)
        if not self.headers:
            # Lets the edge recognize failed logins, see configuration docs.
            self.request.response.status_int = 401
            raise ExtractionError(_('invalid_credentials', default='Invalid Credentials'))

    def next(self, request):
        location = self.request.params.get('came_from', '')
        # A login form posted from elsewhere must not send the user away.
        if not location or not is_same_host_url(self.request, location):
            location = self.request.application_url
        return HTTPFound(location=location, headers=self.headers)

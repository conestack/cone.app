import urllib
from paste.request import parse_formvars
from paste.request import construct_url
from paste.httpexceptions import HTTPFound
from repoze.who.interfaces import IAuthenticator
from repoze.who.plugins.form import FormPlugin as BasePlugin

class FormPlugin(BasePlugin):
    
    def identify(self, environ):
        query = parse_formvars(environ)
        if query.get(self.login_form_qs): 
            from StringIO import StringIO
            environ['wsgi.input'] = StringIO()
            try:
                login = query['loginform.user']
                password = query['loginform.password']
            except KeyError:
                return None
            credentials = {
                'login': login,
                'password': password,
            }
            
            # XXX: HACK, change authentication mechanism to repoze.who API as
            #      soon as repoze.who >= 2.0 takes place
            #
            # repoze.who first calls identify, then the downstream app and
            # finally remembers the credentials. this causes authentication
            # checks to fail in downstream app even if credentials are valid.
            #
            # so we iterate the available IAuthentication plugins and check
            # if user is already authenticated. if so, change downstream to
            # a HTTPFound instance
            already_authenticated = False
            for plugin in environ['repoze.who.plugins'].values():
                if IAuthenticator.providedBy(plugin):
                    login = credentials['login']
                    if plugin.authenticate(environ, credentials) == login:
                        already_authenticated = True
            if already_authenticated:
                environ['QUERY_STRING'] = ''
                downstream = HTTPFound(construct_url(environ))
                environ['repoze.who.application'] = downstream
            # XXX: END HACK
            
            del query[self.login_form_qs]
            environ['QUERY_STRING'] = urllib.urlencode(query)
            
            max_age = query.get('max_age', None)
            if max_age is not None:
                credentials['max_age'] = max_age
            return credentials
        return None

def make_plugin(login_form_qs='__do_login',
                rememberer_name=None, form=None):
    if rememberer_name is None:
        raise ValueError(
            'must include rememberer key (name of another IIdentifier plugin)')
    if form is not None:
        form = open(form).read()
    plugin = FormPlugin(login_form_qs, rememberer_name, form)
    return plugin

###############################################################################
# Group resolution callback for authentication policy.
###############################################################################

def groupcallback(userid, request):
    auth_md = request.environ['repoze.who.plugins']['authorization_md']
    groups = auth_md.group_adapters['ini_group']
    return ['group:%s' % g for g, users in groups.info.items() if userid in users]
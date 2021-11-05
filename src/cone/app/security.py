from cone.app.interfaces import IAuthenticator
from cone.app.interfaces import IOwnerSupport
from cone.app.interfaces import IPrincipalACL
from cone.app.ugm import ugm_backend
from plumber import Behavior
from plumber import default
from plumber import plumb
from pyramid.i18n import TranslationStringFactory
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Allow
from pyramid.security import Deny
from pyramid.security import Everyone
from pyramid.security import remember
from pyramid.threadlocal import get_current_request
from zope.interface import implementer
import logging


logger = logging.getLogger('cone.app')
_ = TranslationStringFactory('cone.app')


DEFAULT_ROLES = [
    ('viewer', _('role_viewer', default='Viewer')),
    ('editor', _('role_editor', default='Editor')),
    ('admin', _('role_admin', default='Admin')),
    ('manager', _('role_manager', default='Manager')),
]


authenticated_permissions = [
    'view',
]
viewer_permissions = [
    'view', 'list',
]
editor_permissions = [
    'view', 'list', 'add', 'edit', 'change_order'
]
owner_permissions = [
    'view', 'list', 'add', 'edit', 'change_order', 'delete', 'cut',
    'copy', 'paste', 'manage_permissions', 'change_state',
]
admin_permissions = [
    'view', 'list', 'add', 'edit', 'change_order', 'delete', 'cut',
    'copy', 'paste', 'manage_permissions', 'change_state',
]
manager_permissions = [
    'view', 'list', 'add', 'edit', 'change_order', 'delete', 'cut',
    'copy', 'paste', 'manage_permissions', 'change_state', 'manage',
]
everyone_permissions = [
    'login',
]
DEFAULT_ACL = [
    (Allow, 'system.Authenticated', authenticated_permissions),
    (Allow, 'role:viewer', viewer_permissions),
    (Allow, 'role:editor', editor_permissions),
    (Allow, 'role:admin', admin_permissions),
    (Allow, 'role:manager', manager_permissions),
    (Allow, 'role:owner', owner_permissions),
    (Allow, Everyone, everyone_permissions),
    (Deny, Everyone, ALL_PERMISSIONS),
]


settings_manager_permissions = [
    'view', 'edit', 'manage',
]
DEFAULT_SETTINGS_ACL = [
    (Allow, 'role:manager', settings_manager_permissions),
    (Allow, Everyone, everyone_permissions),
    (Deny, Everyone, ALL_PERMISSIONS),
]


ADMIN_USER = None
ADMIN_PASSWORD = None
AUTHENTICATOR = None


def authenticate(request, login, password):
    if ADMIN_USER and ADMIN_PASSWORD:
        if login == ADMIN_USER and password == ADMIN_PASSWORD:
            return remember(request, login)
    if AUTHENTICATOR:
        authenticator = request.registry.queryUtility(
            IAuthenticator,
            name=AUTHENTICATOR
        )
        if authenticator:
            pid = authenticator.authenticate(login, password)
            if pid:
                return remember(request, pid)
    ugm = ugm_backend.ugm
    try:
        if ugm.users.authenticate(login, password):
            pid = ugm.users.id_for_login(login)
            return remember(request, pid)
    except Exception as e:
        logger.warning((
            u'Authentication plugin {} raised an Exception while '
            u'trying to authenticate: {}'
        ).format(str(ugm.__class__), e))


def authenticated_user(request):
    user_id = request.authenticated_userid
    return principal_by_id(user_id)


def principal_by_id(principal_id):
    ugm = ugm_backend.ugm
    try:
        if principal_id.startswith('group:'):
            principal = ugm.groups.get(principal_id[6:])
        else:
            principal = ugm.users.get(principal_id)
        if not principal:
            return None
        return principal
    except Exception:
        return None


def search_for_principals(term):
    ret = list()
    criteria = {
        'id': term,
    }
    ugm = ugm_backend.ugm
    for user in ugm.users.search(criteria=criteria, or_search=True):
        ret.append(user)
    for group in ugm.groups.search(criteria=criteria, or_search=True):
        ret.append(u'group:%s' % group)
    return ret


ROLES_CACHE_KEY = 'cone.app.user.roles'


def groups_callback(name, request):
    """Collect and return roles and groups for user.

    XXX: request caching via decorator
    """
    environ = request.environ
    roles = environ.get(ROLES_CACHE_KEY)
    if roles:
        return roles
    if name == ADMIN_USER:
        roles = environ[ROLES_CACHE_KEY] = [u'role:manager']
        return roles
    ugm = ugm_backend.ugm
    user = None
    try:
        user = ugm.users.get(name)
    except Exception as e:
        logger.error(str(e))
    roles = list()
    if user:
        aggregated = set()
        for role in user.roles:
            aggregated.add('role:%s' % role)
        for group in user.groups:
            aggregated.add('group:%s' % group.name)
            for role in group.roles:
                aggregated.add('role:%s' % role)
        roles = environ[ROLES_CACHE_KEY] = list(aggregated)
    # XXX: this function is expected to return None if no roles?
    #      owner support not works if None returned
    # if not roles:
    #     return None
    return roles


class ACLRegistry(dict):

    def register(self, acl, obj=None, node_info_name=''):
        self[(obj, node_info_name)] = acl

    def lookup(self, obj=None, node_info_name='', default=DEFAULT_ACL):
        return self.get((obj, node_info_name), default)


acl_registry = ACLRegistry()


@implementer(IOwnerSupport)
class OwnerSupport(Behavior):
    """Plumbing behavior providing ownership information.
    """

    @plumb
    def __init__(_next, self, *args, **kw):
        _next(self, *args, **kw)
        if not self.owner:
            request = get_current_request()
            self.owner = request.authenticated_userid

    @plumb
    @property
    def __acl__(_next, self):
        acl = _next(self)
        if self.owner:
            for ace in acl:
                if ace[1] == 'role:owner':
                    return [(Allow, self.owner, ace[2])] + acl
        return acl

    @property
    def owner(self):
        return self.attrs.get('owner')

    @default
    @owner.setter
    def owner(self, value):
        self.attrs['owner'] = value


@implementer(IPrincipalACL)
class PrincipalACL(Behavior):
    """Plumbing behavior providing principal ACL's.

    Warning: This behavior works only for nodes defining the ``__acl__``
    attribute as property function. Plumber does not support class property
    plumbing (yet).
    """
    role_inheritance = default(False)

    @default
    @property
    def principal_roles(self):
        raise NotImplementedError(u"Abstract ``PrincipalACL`` does not "
                                  u"implement ``principal_roles``.")

    @default
    @property
    def aggregated_roles(self):
        aggregated = dict()
        model = self
        while model:
            if not IPrincipalACL.providedBy(model):
                model = model.parent
                continue
            for id, roles in model.principal_roles.items():
                if aggregated.get(id):
                    aggregated[id].update(roles)
                else:
                    aggregated[id] = set(roles)
            model = model.parent
        return aggregated

    @default
    def aggregated_roles_for(self, principal_id):
        return list(self.aggregated_roles.get(principal_id, list()))

    @plumb
    @property
    def __acl__(_next, self):
        base_acl = _next(self)
        acl = list()
        if self.role_inheritance:
            principal_roles = self.aggregated_roles
        else:
            principal_roles = self.principal_roles
        for id, roles in principal_roles.items():
            aggregated = set()
            for role in roles:
                aggregated.update(self._permissions_for_role(base_acl, role))
            acl.append((Allow, id, list(aggregated)))
        for ace in base_acl:
            acl.append(ace)
        return acl

    @default
    def _permissions_for_role(self, acl, role):
        for ace in acl:
            if ace[1] == 'role:%s' % role:
                return ace[2]
        return list()

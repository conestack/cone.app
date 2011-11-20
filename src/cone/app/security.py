import logging
from plumber import (
    Part,
    default,
    extend,
    plumb,
)
from pyramid.security import (
    Everyone,
    Allow,
    Deny,
    ALL_PERMISSIONS,
    remember,
    authenticated_userid,
)
from cone.app.utils import app_config


logger = logging.getLogger('cone.app')

DEFAULT_ROLES = [
    ('viewer', 'Viewer'),
    ('editor', 'Editor'),
    ('admin', 'Admin'),
    ('owner', 'Owner'),
    ('manager', 'Manager'),
]

DEFAULT_ACL = [
    (Allow, 'system.Authenticated', ['view']),
    (Allow, 'role:viewer', ['view']),
    (Allow, 'role:editor', ['view', 'add', 'edit']),
    (Allow, 'role:admin', ['view', 'add', 'edit', 'delete']),
    (Allow, 'role:owner', ['view', 'add', 'edit', 'delete']),
    (Allow, 'role:manager', ['view', 'add', 'edit', 'delete', 'manage']),
    (Allow, Everyone, ['login']),
    (Deny, Everyone, ALL_PERMISSIONS),
]


DEFAULT_SETTINGS_ACL = [
    (Allow, 'role:manager', ['view', 'add', 'edit', 'delete', 'manage']),
    (Allow, Everyone, 'login'),
    (Deny, Everyone, ALL_PERMISSIONS),
]


DEFAULT_NODE_PROPERTY_PERMISSIONS = {
    'action_up': ['view'],
    'action_view': ['view'],
    'action_list': ['view'],
    'editable': ['edit'],
    'deletable': ['delete'],
    'wf_state': ['view'],
}


ADMIN_USER = None
ADMIN_PASSWORD = None


def authenticate(request, login, password):
    for impl in app_config().auth:
        try:
            if impl.users.authenticate(login, password):
                return remember(request, login)
        except Exception, e:
            msg = u"Authentication plugin %s raised an Exception while " + \
                  u"trying to authenticate: %s"
            msg = msg % (str(impl.__class__), str(e))
            logger.warning(msg)
    if login == ADMIN_USER and password == ADMIN_PASSWORD:
        return remember(request, login)


def authenticated_user(request):
    user_id = authenticated_userid(request)
    return principal_by_id(user_id)


def principal_by_id(principal_id):
    for impl in app_config().auth:
        try:
            if principal_id.startswith('group:'):
                principal = impl.group.get(principal_id[6:])
            else:
                principal = impl.users.get(principal_id)
            return principal
        except Exception:
            return None


def search_for_principals(term):
    ret = list()
    criteria = {
        'id': term,
    }
    for impl in app_config().auth:
        for user in impl.users.search(criteria=criteria, or_search=True):
            ret.append(user)
        for group in impl.groups.search(criteria=criteria, or_search=True):
            ret.append('group:%s' % group)
    return ret


def groups_callback(name, request):
    """Collect and return roles and groups for user.
    
    XXX: request caching via decorator
    """
    roles = request.environ.get('cone.app.user.roles')
    if roles:
        return roles
    roles = list()
    for impl in app_config().auth:
        try:
            user = impl.users.get(name)
        except Exception, e:
            logger.error(str(e))
            continue
        if not user:
            continue
        aggregated = set()
        for role in user.roles:
            aggregated.add('role:%s' % role)
        for group in user.groups:
            aggregated.add('group:%s' % group.name)
            for role in group.roles:
                aggregated.add('role:%s' % role)
        roles = list(aggregated)
        break
    if name == ADMIN_USER:
        roles = ['role:manager']
    request.environ['cone.app.user.roles'] = roles
    return roles


class PrincipalACL(Part):
    """Plumbing part providing principal ACL's.
    
    Warning: This part works only for nodes defining the ``__acl__`` attribute
    as property function. Plumber does not support class property plumbing
    (yet).
    """
    
    @default
    @property
    def principal_roles(self):
        raise NotImplementedError(u"Abstract ``PrincipalACL`` does not "
                                  u"implement ``principal_roles``.")
    
    @plumb
    @property
    def __acl__(_next, self):
        base_acl = _next(self)
        acl = list()
        for id, roles in self.principal_roles.items():
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
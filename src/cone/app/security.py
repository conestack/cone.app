import logging
from plumber import (
    Part,
    default,
    extend,
    plumb,
)
from zope.interface import implements
from pyramid.security import (
    Everyone,
    Allow,
    Deny,
    ALL_PERMISSIONS,
    remember,
    authenticated_userid,
)
from cone.app.interfaces import IPrincipalACL
from cone.app.utils import app_config


logger = logging.getLogger('cone.app')


DEFAULT_ROLES = [
    ('viewer', 'Viewer'),
    ('editor', 'Editor'),
    ('admin', 'Admin'),
    ('owner', 'Owner'), # XXX: owner handling on nodes
    ('manager', 'Manager'),
]


AUTHENTICATED = 'system.Authenticated'
VIEWER = 'role:viewer'
EDITOR = 'role:editor'
ADMIN = 'role:admin'
OWNER = 'role:owner'
MANAGER = 'role:manager'


WORKFLOW_PERMISSIONS = ['change_state']
SHARING_PERMISSIONS = ['manage_permissions']
COPYSUPPORT_PERMISSIONS = ['cut', 'copy', 'paste']


AUTHENTICATED_PERMISSIONS = ['view']
VIEWER_PERMISSIONS = AUTHENTICATED_PERMISSIONS
EDITOR_PERMISSIONS = VIEWER_PERMISSIONS + ['add', 'edit']
ADMIN_PERMISSIONS = \
    EDITOR_PERMISSIONS + \
    ['delete'] + \
    COPYSUPPORT_PERMISSIONS + \
    SHARING_PERMISSIONS + \
    WORKFLOW_PERMISSIONS
OWNER_PERMISSIONS = ADMIN_PERMISSIONS
MANAGER_PERMISSIONS = ADMIN_PERMISSIONS + ['manage']
EVERYONE_PERMISSIONS = ['login']

# BBB
ADMIN_PERM = ADMIN_PERMISSIONS


DEFAULT_ACL = [
    (Allow, AUTHENTICATED, AUTHENTICATED_PERMISSIONS),
    (Allow, VIEWER, VIEWER_PERMISSIONS),
    (Allow, EDITOR, EDITOR_PERMISSIONS),
    (Allow, ADMIN, ADMIN_PERMISSIONS),
    (Allow, OWNER, ADMIN_PERMISSIONS),
    (Allow, MANAGER, MANAGER_PERMISSIONS),
    (Allow, Everyone, EVERYONE_PERMISSIONS),
    (Deny, Everyone, ALL_PERMISSIONS),
]


DEFAULT_SETTINGS_ACL = [
    (Allow, MANAGER, EDITOR_PERMISSIONS + ['delete', 'manage']),
    (Allow, Everyone, EVERYONE_PERMISSIONS),
    (Deny, Everyone, ALL_PERMISSIONS),
]


# XXX: get rid of.
DEFAULT_NODE_PROPERTY_PERMISSIONS = {
    'action_up': ['view'],
    'action_view': ['view'],
    'action_list': ['view'],
    'action_edit': ['edit'],
    'action_delete': ['delete'],
    'action_delete_children': ['delete'],
}


ADMIN_USER = None
ADMIN_PASSWORD = None


def authenticate(request, login, password):
    if login == ADMIN_USER and password == ADMIN_PASSWORD:
        return remember(request, login)
    ugm = app_config().auth
    try:
        if ugm.users.authenticate(login, password):
            return remember(request, login)
    except Exception, e:
        msg = u"Authentication plugin %s raised an Exception while " + \
              u"trying to authenticate: %s"
        msg = msg % (str(ugm.__class__), str(e))
        logger.warning(msg)


def authenticated_user(request):
    user_id = authenticated_userid(request)
    return principal_by_id(user_id)


def principal_by_id(principal_id):
    ugm = app_config().auth
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
    ugm = app_config().auth
    for user in ugm.users.search(criteria=criteria, or_search=True):
        ret.append(user)
    for group in ugm.groups.search(criteria=criteria, or_search=True):
        ret.append('group:%s' % group)
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
    ugm = app_config().auth
    user = None
    try:
        user = ugm.users.get(name)
    except Exception, e:
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
    return roles


class PrincipalACL(Part):
    """Plumbing part providing principal ACL's.
    
    Warning: This part works only for nodes defining the ``__acl__`` attribute
    as property function. Plumber does not support class property plumbing
    (yet).
    """
    implements(IPrincipalACL)
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
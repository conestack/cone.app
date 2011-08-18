import logging
from pyramid.security import (
    Everyone,
    Allow,
    Deny,
    ALL_PERMISSIONS,
    remember,
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
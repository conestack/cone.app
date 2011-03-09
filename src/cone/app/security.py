from pyramid.security import (
    Everyone,
    Allow,
    Deny,
    ALL_PERMISSIONS,
    remember,
)

DEFAULT_ACL = [
    (Allow, 'system.Authenticated', ['view']),
    (Allow, 'role:viewer', ['view']),
    (Allow, 'role:editor', ['view', 'add', 'edit']),
    (Allow, 'role:owner', ['view', 'add', 'edit', 'delete']),
    (Allow, 'role:manager', ['view', 'add', 'edit', 'delete', 'manage']),
    (Allow, Everyone, ['login']),
    (Deny, Everyone, ALL_PERMISSIONS),
]

ADMIN_USER = None
ADMIN_PASSWORD = None
AUTH_IMPL = None

def authenticate(request, login, password):
    # XXX: node.ext.ugm goes here
    if login == ADMIN_USER and password == ADMIN_PASSWORD:
        return remember(request, login)

def groups_callback(name, request):
    # XXX: node.ext.ugm goes here
    if name == ADMIN_USER:
        return ['role:manager']
    return []
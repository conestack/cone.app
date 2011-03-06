from pyramid.security import (
    Everyone,
    Allow,
    Deny,
    ALL_PERMISSIONS,
    remember,
)

DEFAULT_ACL = [
    (Allow, 'system.Authenticated', ['view']),
    (Allow, Everyone, ['login']),
    (Deny, Everyone, ALL_PERMISSIONS),
]

ADMIN_USER = None
ADMIN_PASSWORD = None

def authenticate(request, login, password):
    # XXX: node.ext.ugm goes here
    if login == ADMIN_USER and password == ADMIN_PASSWORD:
        return remember(request, login)

def groups_callback(name, request):
    # XXX: node.ext.ugm goes here
    return []
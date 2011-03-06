from pyramid.security import (
    Everyone,
    Allow,
    Deny,
    ALL_PERMISSIONS,
)

DEFAULT_ACL = [
    (Allow, 'system.Authenticated', ['view']),
    (Allow, Everyone, ['login']),
    (Deny, Everyone, ALL_PERMISSIONS),
]

def groups_callback(name, request):
    return []
Cone workflow parts::

    >>> from plumber import plumber
    >>> from pyramid.security import (
    ...     Everyone,
    ...     Allow,
    ...     Deny,
    ...     ALL_PERMISSIONS,
    ... )
    >>> from repoze.workflow import get_workflow
    >>> from cone.app.model import (
    ...     BaseNode,
    ...     Properties,
    ... )
    >>> from cone.app.workflow import initialize_workflow

Test env provides mock node with workflow parts configured::

    >>> from cone.app.tests.mock import WorkflowNode
    
    >>> node = WorkflowNode()
    >>> node.state
    
    >>> node.state = 'foo'
    >>> node.attrs['state']
    'foo'
    
    >>> initialize_workflow(node)
    >>> node.state
    u'initial'

Default workflow state ACL::

    >>> node.__acl__
    [('Allow', 'system.Authenticated', ['view']), 
    ('Allow', 'role:viewer', ['view']), 
    ('Allow', 'role:editor', ['view', 'add', 'edit']), 
    ('Allow', 'role:owner', ['view', 'add', 'edit', 'delete', 'change_state']), 
    ('Allow', 'role:manager', ['view', 'add', 'edit', 'delete', 'change_state', 'manage']), 
    ('Allow', 'system.Everyone', ['login']), 
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]

If not set, and ACL not found in ``state_acls``, raise on access::

    >>> node.default_acl = None
    >>> node.__acl__
    Traceback (most recent call last):
      ...
    ValueError: No ACL found for state 'initial'

Subclass workflow node and define ``state_acls`` for dummy workflow states::

    >>> class WorkflowNode2(WorkflowNode):
    ...     state_acls = {
    ...         'initial': [
    ...             (Allow, 'role:manager', ['manage', 'edit', 'change_state']),
    ...             (Allow, Everyone, ['login']),
    ...             (Deny, Everyone, ALL_PERMISSIONS),
    ...         ],
    ...         'final': [
    ...             (Allow, 'role:manager', ['view', 'edit', 'change_state']),
    ...             (Deny, Everyone, ALL_PERMISSIONS),
    ...         ],
    ...     }

Initialize new node and check ACL's::

    >>> node = WorkflowNode2()
    >>> initialize_workflow(node)
    >>> node.__acl__
    [('Allow', 'role:manager', ['manage', 'edit', 'change_state']), 
    ('Allow', 'system.Everyone', ['login']), 
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]
    
    >>> layer.login('manager')
    
    >>> request = layer.new_request()
    >>> wf = get_workflow(WorkflowNode2, node.properties.wf_name)
    >>> wf.transition(node, request, u'initial_2_final')
    >>> node.state
    u'final'
    
    >>> layer.logout()
    
    >>> node.__acl__
    [('Allow', 'role:manager', ['view', 'edit', 'change_state']), 
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]

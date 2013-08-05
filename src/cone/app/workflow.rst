Cone workflow behaviors::

    >>> from plumber import plumber
    >>> from repoze.workflow import get_workflow
    >>> from cone.app.interfaces import IWorkflowState
    >>> from cone.app.workflow import initialize_workflow

Test env provides mock node with workflow behaviors configured::

    >>> from cone.app.testing.mock import WorkflowNode
    
    >>> node = WorkflowNode()
    >>> IWorkflowState.providedBy(node)
    True
    
    >>> get_workflow(node.__class__, node.properties.wf_name)
    <repoze.workflow.workflow.Workflow object at ...>
    
    >>> node.state
    u'initial'
    
    >>> node.state = 'foo'
    >>> node.attrs['state']
    'foo'
    
    >>> node.attrs['state'] is node.state
    True
    
    >>> initialize_workflow(node)
    >>> node.state
    u'initial'

Test copy::

    >>> root = WorkflowNode()
    >>> child = root['child'] = WorkflowNode()
    >>> root.state == child.state == u'initial'
    True
    
    >>> root.state = child.state = u'final'
    >>> root.state == child.state == u'final'
    True
    
    >>> copied = root.copy()
    >>> copied.state == copied['child'].state == 'initial'
    True

Default workflow state ACL::

    >>> node.__acl__
    [('Allow', 'system.Authenticated', ['view']), 
    ('Allow', 'role:viewer', ['view']), 
    ('Allow', 'role:editor', ['view', 'add', 'edit']), 
    ('Allow', 'role:owner', ['view', 'add', 'edit', 'delete', 'change_state', 'manage_permissions']), 
    ('Allow', 'role:admin', ['view', 'add', 'edit', 'delete', 'change_state', 'manage_permissions']), 
    ('Allow', 'role:manager', ['view', 'add', 'edit', 'delete', 'change_state', 'manage_permissions', 'manage']), 
    ('Allow', 'system.Everyone', ['login']), 
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]

If not set, and ACL not found in ``state_acls``, raise on access::

    >>> node.default_acl = None
    >>> node.__acl__
    Traceback (most recent call last):
      ...
    ValueError: No ACL found for state 'initial'

Test ``state_acls``::

    >>> from cone.app.testing.mock import StateACLWorkflowNode
    >>> node = StateACLWorkflowNode()
    >>> get_workflow(node.__class__, node.properties.wf_name)
    <repoze.workflow.workflow.Workflow object at ...>
    
    >>> node.properties.wf_name
    u'dummy'
    
    >>> IWorkflowState.providedBy(node)
    True
    
    >>> node.__acl__
    [('Allow', 'role:manager', ['manage', 'edit', 'change_state']), 
    ('Allow', 'system.Everyone', ['login']), 
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]
    
    >>> layer.login('manager')
    
    >>> request = layer.new_request()
    >>> wf = get_workflow(node.__class__, node.properties.wf_name)
    >>> wf.transition(node, request, u'initial_2_final')
    >>> node.state
    u'final'
    
    >>> layer.logout()
    
    >>> node.__acl__
    [('Allow', 'role:manager', ['view', 'edit', 'change_state']), 
    ('Deny', 'system.Everyone', <pyramid.security.AllPermissionsList object at ...>)]

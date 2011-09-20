=========
Workflows
=========

``cone.app`` uses ``repoze.workflow`` for state based workflows.

Workflows are described in ZCML. See documentation of ``repoze.workflow`` for
details.

In the ``workflow`` directive, the ``content_types`` attribute contains the
nodes this workflow can be used for.

As ``permission_checker``, ``pyramid.security.has_permission`` is used.

In ``transition`` directives ``cone.app.workflow.persist_state`` is defined
as ``callback``, which sets the ``state`` attribute of the node.::

    <configure xmlns="http://namespaces.repoze.org/bfg">
    
      <include package="repoze.workflow" file="meta.zcml"/>
    
      <workflow type="example"
                name="Example workflow"
                state_attr="state"
                initial_state="initial"
                content_types="example.app.model.WorkflowNode"
                permission_checker="pyramid.security.has_permission">
    
        <state name="initial">
          <key name="title" value="Initial state" />
          <key name="description" value="Initial state" />
        </state>
    
        <state name="final">
          <key name="title" value="Final state"/>
          <key name="description" value="Final state" />
        </state>
    
        <transition
           name="initial_2_final"
           callback="cone.app.workflow.persist_state"
           from_state="initial"
           to_state="final"
           permission="change_state"
        />
        
      </workflow>
    
    </configure>

To use workflows on application model nodes, two plumbing parts are provided.

The first one is ``cone.app.workflow.WorkflowState``, hooking the ``state``
property to node which reads and writes the workflow state to
``node.attrs['state']``.

The second one is ``cone.app.workflow.WorkflowACL``, which alters the
``__acl__`` property of the node. The property computing code first tries to
lookup an ACL explicitly defined for current workflow state. If no ACL for
state is found, the ACL defined in ``default_acl`` is returned. This ACL
permits 'change_state' for roles owner and manager by default.::

Also workflow tile related node ``properties`` must be set. As described in
tiles documentation, ``wf_state`` must be set to ``True`` indicating that
workflow is provided, ``wf_name`` contains the workflow ID, and
``wf_transition_names`` contains a mapping "transition ID -> transition Title"
(needed due to the lack of transition titles in repoze.workflow).::

    >>> from plumber import plumber
    >>> from node.utils import instance_property
    
    >>> from cone.app.model import (
    ...     BaseNode,
    ...     Properties,
    ... )
    
    >>> from cone.app.workflow import (
    ...     WorkflowState,
    ...     WorkflowACL,
    ... )
    
    >>> class WorkflowNode(BaseNode):
    ...     __metaclass__ = plumber
    ...     __plumbing__ = WorkflowState, WorkflowACL
    ...     
    ...     @instance_property
    ...     def properties(self):
    ...         props = Properties()
    ...         props.wf_state = True
    ...         props.wf_name = u'example'
    ...         props.wf_transition_names = {
    ...             'initial_2_final': 'Finalize',
    ...         }
    ...         return props

ACL's defined for specific workflow states are defined in ``state_acls``
attribute of the node by state id.::

    >>> class WorkflowNodeWithStateACLs(WorkflowNode):
    ... 
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

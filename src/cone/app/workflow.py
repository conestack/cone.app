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
)
from repoze.workflow import get_workflow
from cone.app.interfaces import IWorkflowState


logger = logging.getLogger('cone.workflow')


def initialize_workflow(node):
    wf_name = node.properties.wf_name
    workflow = get_workflow(node.__class__, wf_name)
    if workflow:
        workflow.initialize(node)


def persist_state(node, info):
    """Transition callback for repoze.workflow.
    
    Persist state to ``node.state`` and call node.
    """
    node.state = info.transition[u'to_state']
    node()


class WorkflowState(Part):
    """Part for nodes providing workflow states.
    
    This implementation persists to self.attrs['state']
    """
    implements(IWorkflowState)
    
    @plumb
    def __init__(_next, self, *args, **kw):
        _next(self, *args, **kw)
        initialize_workflow(self)
    
    @plumb
    def copy(_next, self):
        """Set initial state for copied node and all children providing
        ``cone.app.interfaces.IWorkflowState``.
        """
        ret = _next(self)
        def recursiv_initial_state(node):
            if IWorkflowState.providedBy(node):
                initialize_workflow(node)
                for child in node.values():
                    recursiv_initial_state(child)
        recursiv_initial_state(ret)
        return ret
    
    def _get_state(self):
        return self.attrs.get('state', None)
    
    def _set_state(self, val):
        self.attrs['state'] = val
    
    state = default(property(_get_state, _set_state))


class WorkflowACL(Part):
    """Part providing ACL's by worfklow state.
    
    Requires ``WorkflowState`` part.
    """
    state_acls = default(dict())
    default_acl = default([
        (Allow, 'system.Authenticated', ['view']),
        (Allow, 'role:viewer', ['view']),
        (Allow, 'role:editor', ['view', 'add', 'edit']),
        (Allow, 'role:owner', ['view', 'add', 'edit', 'delete', 
                               'change_state', 'manage_permissions']),
        (Allow, 'role:admin', ['view', 'add', 'edit', 'delete', 
                               'change_state', 'manage_permissions']),
        (Allow, 'role:manager', ['view', 'add', 'edit', 'delete',
                                 'change_state', 'manage_permissions',
                                 'manage']),
        (Allow, Everyone, ['login']),
        (Deny, Everyone, ALL_PERMISSIONS),
    ])
    
    @extend
    @property
    def __acl__(self):
        acl = self.state_acls.get(self.state, self.default_acl)
        if not acl:
            raise ValueError(u"No ACL found for state '%s'" % self.state)
        if acl is self.default_acl:
            logger.warning(u"No ACL found for state "
                           u"'%s'. Using default" % self.state)
        return acl
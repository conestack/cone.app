from plumber import plumber
from node.parts import (
    Adopt,
    Nodespaces,
    Attributes,
    Nodify,
    OdictStorage,
    DefaultInit,
)
from node.utils import instance_property
from pyramid.security import (
    Everyone,
    Allow,
    Deny,
    ALL_PERMISSIONS,
)
from cone.app.model import (
    AppNode,
    BaseNode,
    CopySupport,
    Properties,
)
from cone.app.workflow import (
    WorkflowState,
    WorkflowACL,
)
from cone.app.security import (
    PrincipalACL,
    DEFAULT_ACL,
)


class WorkflowNode(BaseNode):
    __metaclass__ = plumber
    __plumbing__ = WorkflowState, WorkflowACL
    
    @property
    def properties(self):
        props = Properties()
        props.in_navtree = True
        props.wf_name = u'dummy'
        # XXX: check in repoze.workflow the intended way for naming
        #      transitions
        props.wf_transition_names = {
            'initial_2_final': 'Finalize',
        }
        return props
    
    def __call__(self):
        pass


class InexistentWorkflowNode(WorkflowNode):
    
    @property
    def properties(self):
        props = super(InexistentWorkflowNode, self).properties
        props.wf_name = u'inexistent'
        return props


class StateACLWorkflowNode(WorkflowNode):
    state_acls = {
        'initial': [
            (Allow, 'role:manager', ['manage', 'edit', 'change_state']),
            (Allow, Everyone, ['login']),
            (Deny, Everyone, ALL_PERMISSIONS),
        ],
        'final': [
            (Allow, 'role:manager', ['view', 'edit', 'change_state']),
            (Deny, Everyone, ALL_PERMISSIONS),
        ],
    }


class SharingNode(object):
    __metaclass__ = plumber
    __plumbing__ = (
        PrincipalACL,
        AppNode,
        Adopt,
        Nodespaces,
        Attributes,
        DefaultInit,
        Nodify,
        OdictStorage,
    )

    @property
    def __acl__(self):
        return DEFAULT_ACL

    @instance_property
    def principal_roles(self):
        return dict()


class CopySupportNode(BaseNode):
    __metaclass__ = plumber
    __plumbing__ = CopySupport
    
    def __call__(self):
        print 'Called: %s' % self.name
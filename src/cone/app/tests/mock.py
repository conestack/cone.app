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
from cone.app.model import (
    AppNode,
    BaseNode,
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
from cone.app.copysupport import CopySupport


class WorkflowNode(BaseNode):
    __metaclass__ = plumber
    __plumbing__ = WorkflowState, WorkflowACL
    
    @property
    def properties(self):
        props = Properties()
        props.in_navtree = True
        props.wf_state = True
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

    @instance_property
    def properties(self):
        props = Properties()
        props.action_cut = True
        props.action_copy = True
        props.action_paste = True
        return props
    
    def __call__(self):
        print 'Called: %s' % self.name
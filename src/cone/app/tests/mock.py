from plumber import plumber
from cone.app.model import (
    BaseNode,
    Properties,
)
from cone.app.workflow import (
    WorkflowState,
    WorkflowACL,
)

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
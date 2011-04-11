from cone.app.model import (
    BaseNode,
    WorkflowNodeMixin,
    Properties,
)

class WorkflowNode(BaseNode, WorkflowNodeMixin):
    
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
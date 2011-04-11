try:
    from repoze.workflow import get_workflow
    
    def initialize_workflow(node):
        wf_name = node.properties.wf_name
        workflow = get_workflow(node.__class__, wf_name)
        workflow.initialize(node)
    
    
    def persist_state(node, info):
        """Transition callback for repoze.workflow.
        
        Persist state to ``node.state`` and call node.
        """
        node.state = info.transition[u'to_state']
        node()

except ImportError:
    # repoze.workflow is not installed
    pass
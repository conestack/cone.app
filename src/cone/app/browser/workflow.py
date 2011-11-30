from cone.tile import (
    tile,
    Tile,
)
from cone.app.model import Properties
from cone.app.browser.ajax import (
    AjaxAction,
    AjaxEvent,
)
from cone.app.browser.utils import (
    make_query,
    make_url,
)
from repoze.workflow import get_workflow
from repoze.workflow import WorkflowError

import logging
logger = logging.getLogger('cone.app')


@tile('wf_dropdown', 'templates/wf_dropdown.pt', 
      permission='change_state', strict=False)
class WfDropdown(Tile):
    """Transition dropdown.
    
    If ``do_transition`` is found in ``request.params``, perform given
    transition on ``self.model`` immediately before dropdown gets rendered.
    
    Configuration expected on ``self.model.properties``:
    
    wf_name
        Registration name of workflow.
    
    wf_transition_names
        transition id to transition title mapping. XXX: get rid of
    """
    
    def do_transition(self):
        """if ``do_transition`` is found on request.params, perform 
        transition.
        """
        transition = self.request.params.get('do_transition')
        if not transition:
            return
        workflow = self.workflow
        workflow.transition(self.model, self.request, transition)
        self.model()
        url = make_url(self.request, node=self.model)
        continuation = [
            AjaxAction(url, 'content', 'inner', '#content'),
            AjaxEvent(url, 'contextchanged', '.contextsensitiv'),
        ]
        self.request.environ['cone.app.continuation'] = continuation
        
    @property
    def workflow(self):
        return get_workflow(self.model.__class__,
                            self.model.properties.wf_name)
    
    @property
    def transitions(self):
        self.do_transition()
        ret = list()
        try:
            workflow = self.workflow
            transitions = workflow.get_transitions(
                self.model, self.request, from_state=self.model.state)
        except (WorkflowError, AttributeError), e:
            logger.error("transitions error: %s" % str(e))
            return ret
        # XXX: check in repoze.workflow the intended way for naming
        #      transitions
        transition_names = self.model.properties.wf_transition_names
        for transition in transitions:
            query = make_query(do_transition=transition['name'])
            url = make_url(self.request, node=self.model,
                           resource='dotransition', query=query)
            target = make_url(self.request, node=self.model, query=query)
            props = Properties()
            props.url = url
            props.target = target
            props.title = transition_names[transition['name']]
            ret.append(props)
        return ret
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.app.model import Properties
from cone.app.workflow import lookup_state_data
from cone.app.workflow import lookup_workflow
from cone.tile import Tile
from cone.tile import tile
from repoze.workflow import WorkflowError
import logging


logger = logging.getLogger('cone.app')


@tile(name='wf_dropdown',
      path='templates/wf_dropdown.pt',
      permission='change_state',
      strict=False)
class WfDropdown(Tile):
    """Transition dropdown.

    If ``do_transition`` is found in ``request.params``, perform given
    transition on ``self.model`` immediately before dropdown gets rendered.
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
        continuation = [AjaxEvent(url, 'contextchanged', '#layout')]
        self.request.environ['cone.app.continuation'] = continuation

    @property
    def workflow(self):
        return lookup_workflow(self.model)

    @property
    def state_name(self):
        workflow_tsf = self.model.workflow_tsf
        if workflow_tsf:
            return workflow_tsf(self.model.state)
        state_data = lookup_state_data(self.model)
        return state_data.get('title', self.model.state)

    @property
    def transitions(self):
        self.do_transition()
        ret = list()
        try:
            workflow = self.workflow
            transitions = workflow.get_transitions(
                self.model, self.request, from_state=self.model.state)
        except (WorkflowError, AttributeError) as e:
            logger.error("transitions error: %s" % str(e))
            return ret
        workflow_tsf = self.model.workflow_tsf
        for transition in transitions:
            query = make_query(do_transition=transition['name'])
            target = make_url(self.request, node=self.model, query=query)
            props = Properties()
            props.target = target
            if workflow_tsf:
                props.title = workflow_tsf(transition['name'])
            else:
                props.title = transition.get('title', transition['name'])
            ret.append(props)
        return ret

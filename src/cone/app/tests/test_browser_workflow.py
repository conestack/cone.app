from cone.app import testing
from cone.app.testing.mock import InexistentWorkflowNode
from cone.app.testing.mock import WorkflowNode
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from pyramid.i18n import TranslationStringFactory


class TestBrowserWorkflow(TileTestCase):
    layer = testing.security

    def test_workflow_dropdown(self):
        request = self.layer.new_request()
        node = WorkflowNode()

        self.assertEqual(node.state, u'initial')

        with self.layer.authenticated('manager'):
            res = render_tile(node, request, 'wf_dropdown')
        self.checkOutput("""
        ...<a href="#"
              class="state-initial dropdown-toggle"
              title="Change state"
              data-toggle="dropdown">
          <span>State</span>:
          <span>Initial State</span>
        </a>...
        """, res)

        request.params['do_transition'] = 'initial_2_final'
        with self.layer.authenticated('manager'):
            res = render_tile(node, request, 'wf_dropdown')
        self.checkOutput("""
        ...<li class="dropdown">
          <span class="no-transitions state-final">
            <span>State</span>:
            <span>Final State</span>
          </span>
        </li>...
        """, res)

        self.assertEqual(node.state, u'final')

        node = InexistentWorkflowNode()
        request = self.layer.new_request()
        with self.layer.authenticated('manager'):
            res = render_tile(node, request, 'wf_dropdown')
        self.assertEqual(res, u'\n\n  \n\n\n')

        tsf = TranslationStringFactory('cone.app.tests')
        node = WorkflowNode()
        node.workflow_tsf = tsf

        with self.layer.authenticated('manager'):
            res = render_tile(node, request, 'wf_dropdown')
        self.checkOutput("""
        ...<a href="#"
              class="state-initial dropdown-toggle"
              title="Change state"
              data-toggle="dropdown">
          <span>State</span>:
          <span>initial</span>
        </a>...
        """, res)

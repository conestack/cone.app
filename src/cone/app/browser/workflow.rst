Workflow dropdown
=================

::

    >>> from cone.tile import render_tile
    >>> from cone.app import root
    >>> from cone.app.testing.mock import WorkflowNode
    >>> from cone.app.testing.mock import InexistentWorkflowNode
    >>> import cone.app.browser.workflow

    >>> request = layer.new_request()
    >>> node = WorkflowNode()

    >>> node.state
    u'initial'

    >>> layer.login('manager')

    >>> res = render_tile(node, request, 'wf_dropdown')
    >>> res
    u'...<a href="#"\n         
    class="state-initial dropdown-toggle"\n         
    title="Change state"\n         
    data-toggle="dropdown">\n        
    <span>State</span>:\n        
    <span>initial</span>\n      </a>...'

    >>> request.params['do_transition'] = 'initial_2_final'
    >>> res = render_tile(node, request, 'wf_dropdown')
    >>> res
    u'...<li class="dropdown">\n\n    \n\n    \n      
    <span>State</span>:\n      <span\n            
    class="state-final">final</span>\n    \n\n  </li>...'

    >>> node.state
    u'final'

    >>> node = InexistentWorkflowNode()
    >>> request = layer.new_request()
    >>> render_tile(node, request, 'wf_dropdown')
    u'\n\n  \n\n\n'

    >>> layer.logout()

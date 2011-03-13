import json
from pyramid.response import Response
from pyramid.view import view_config
from cone.tile import (
    registerTile,
    render_tile,
)


registerTile('bdajax', 'bdajax:bdajax.pt', permission='login')


@view_config(name='ajaxaction', accept='application/json', renderer='json')
def ajax_tile(model, request):
    """Render an ajax action by name.
    
    Request must provide the parameter ``name`` containing the view or tile
    name.
    """
    # XXX: prefix action name with tile to indicate tile rendering, otherwise
    #      render view
    name = request.params.get('bdajax.action')
    rendered = render_tile(model, request, name)
    return {
        'mode': request.params.get('bdajax.mode'),
        'selector': request.params.get('bdajax.selector'),
        'payload': rendered,
    }


class AjaxAction(object):
    """Ajax action configuration. Used to define continuation actions for
    client side.
    """
    
    def __init__(self, target, name, mode, selector, params='{}'):
        self.target = target
        self.params = params
        self.name = name
        self.mode = mode
        self.selector = selector


class AjaxEvent(object):
    """Ajax event configuration. Used to define continuation events for
    client side.
    """
    
    def __init__(self, target, name, selector, params='{}'):
        self.target = target
        self.params = params
        self.name = name
        self.selector = selector


class AjaxFormContinue(object):
    """Ajax form continuation computing. Used by ``render_ajax_form``
    """
    
    def __init__(self, result, actions):
        self.result = result
        self.actions = actions
    
    @property
    def form(self):
        """Return rendered form tile result if no continuation actions
        """
        if not self.actions:
            return self.result
        return ''
    
    @property
    def next(self):
        """Return 'false' if no continuation actions, otherwise a JSON dump of
        action definitions.
        """
        if not self.actions:
            return 'false'
        actions = list()
        for action in self.actions:
            if isinstance(action, AjaxAction):
                actions.append({
                    'type': 'action',
                    'target': action.target,
                    'name': action.name,
                    'mode': action.mode,
                    'selector': action.selector,
                    'params': {},
                })
            if isinstance(action, AjaxEvent):
                actions.append({
                    'type': 'event',
                    'target': action.target,
                    'name': action.name,
                    'selector': action.selector,
                    'params': {},
                })
        return json.dumps(actions)


ajax_form_template = """\
<script language="javascript" type="text/javascript">
    var parent = window.top.window;
    parent.cone.ajaxformrender('%(form)s');
    parent.cone.ajaxformcontinue(%(next)s);
</script>
"""

def render_ajax_form(model, request, name):
    """Render ajax form.
    """
    result = render_tile(model, request, name)
    actions = request.get('cone.app.continuation')
    cont = AjaxFormContinue(result, actions)
    rendered = ajax_form_template % {
        'form': cont.form,
        'next': cont.next,
    }
    return Response(rendered)


def dummy_livesearch_callback(model, request):
    """Dummy callback for Livesearch. Set as default.
    
    We receive the search term at ``request.params['term']``.
    
    Livesearch expects a list of dicts with keys:
        ``label`` - Label of found item
        ``value`` - The value re-inserted in input. This is normally ``term``
        ``target`` - The target URL for rendering the content tile.
    """
    term = request.params['term']
    return [
        {
            'label': 'Root',
            'value': term,
            'target': request.application_url,
        },
    ]


# Overwrite this with your own implementation on application startup
LIVESEARCH_CALLBACK = dummy_livesearch_callback

@view_config(name='livesearch', accept='application/json', renderer='json')
def livesearch(model, request):
    """Call ``LIVESEARCH_CALLBACK`` and return its results.
    """
    return LIVESEARCH_CALLBACK(model, request)
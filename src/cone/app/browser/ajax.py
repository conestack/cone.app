from pyramid.response import Response
from pyramid.view import view_config
from cone.tile import (
    registerTile,
    render_tile,
)

registerTile('bdajax',
             'bdajax:bdajax.pt',
             permission='login',
             strict=False)

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
    
    XXX: multiple continuation actions.
    """
    
    def __init__(self, target, name, mode, selector, params='{}'):
        self.target = target
        self.params = params
        self.name = name
        self.mode = mode
        self.selector = selector

AJAX_FORM_RESPONSE = """\
<script language="javascript" type="text/javascript">
    %(call)s;
</script>
"""

AJAX_FORM_RENDER = "window.top.window.cone.ajaxformrender('%(rendered)s')"
AJAX_FORM_CONTINUE = "window.top.window.cone.ajaxformcontinue" + \
    "('%(url)s', '%(name)s', '%(mode)s', '%(selector)s', %(params)s)"

def ajax_form(model, request, name):
    """Render ajax form.
    """
    result = render_tile(model, request, name)
    action = request.get('cone.app.continuation')
    if action:
        call = AJAX_FORM_CONTINUE % {
            'url': action.target,
            'name': action.name,
            'mode': action.mode,
            'selector': action.selector,
            'params': action.params,
        }
    else:
        call = AJAX_FORM_RENDER % {
            'rendered': result,
        }
    return Response(AJAX_FORM_RESPONSE % dict(call=call))

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
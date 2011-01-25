from repoze.bfg.view import bfg_view
from cone.tile import (
    registerTile,
    render_tile,
)

registerTile('bdajax',
             'bdajax:bdajax.pt',
             permission='login',
             strict=False)

@bfg_view(name='ajaxaction', accept='application/json', renderer='json')
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

@bfg_view(name='livesearch', accept='application/json', renderer='json')
def livesearch(model, request):
    """Call ``LIVESEARCH_CALLBACK`` and return its results.
    """
    return LIVESEARCH_CALLBACK(model, request)
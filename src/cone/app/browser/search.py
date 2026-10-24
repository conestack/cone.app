from cone.app.interfaces import ILiveSearch
from cone.tile import tile
from cone.tile import Tile
from pyramid.view import view_config


@tile(name='livesearch', path='templates/livesearch.pt', permission='login')
class LivesearchTile(Tile):
    """Tile rendering the live search."""


@view_config(name='livesearch', accept='application/json', renderer='json')
def livesearch(model, request):
    adapter = request.registry.queryAdapter(model, ILiveSearch)
    if not adapter:
        return list()
    return adapter.search(request, request.params['term'])

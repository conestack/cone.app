cone.app.browser
================

Imports::

    >>> from cone.app import get_root
    >>> from cone.app.browser import RelatedViewConsumer
    >>> from cone.app.browser import RelatedViewProvider
    >>> from cone.app.browser import get_related_view
    >>> from cone.app.browser import set_related_view
    >>> from cone.app.browser import main_view
    >>> from cone.app.browser import render_main_template
    >>> from cone.app.browser.utils import make_url
    >>> from cone.app.model import BaseNode
    >>> from cone.tile import Tile
    >>> from plumber import plumbing


render_main_template
--------------------

Prepare::

    >>> root = get_root()
    >>> request = layer.new_request()

Test ``render_main_template``::

    >>> render_main_template(root, request)
    <Response at ... 200 OK>

main_view
---------

Test ``main_view`` default view callable::

    >>> main_view(root, request)
    <Response at ... 200 OK>


Related view support
--------------------

Test ``set_related_view``::

    >>> request = layer.new_request()
    >>> set_related_view(request, 'someview')
    >>> request.environ['cone.app.related_view']
    'someview'

Test ``get_related_view``::

    >>> get_related_view(request)
    'someview'

Test ``RelatedViewConsumer``::

    >>> @plumbing(RelatedViewConsumer)
    ... class RelatedViewConsumingTile(Tile):
    ...     def render(self):
    ...         return make_url(
    ...             self.request,
    ...             node=self.model,
    ...             resource=self.related_view)

    >>> model = BaseNode(name='root')
    >>> request = layer.new_request()
    >>> tile = RelatedViewConsumingTile()
    >>> tile(model, request)
    'http://example.com/root'

    >>> set_related_view(request, 'someview')
    >>> tile(model, request)
    'http://example.com/root/someview'

Test ``RelatedViewProvider``::

    >>> @plumbing(RelatedViewProvider)
    ... class RelatedViewProvidingTile(Tile):
    ...     related_view = 'related_view'
    ...
    ...     def render(self):
    ...         return RelatedViewConsumingTile()(self.model, self.request)

    >>> model = BaseNode(name='root')
    >>> request = layer.new_request()
    >>> tile = RelatedViewProvidingTile()
    >>> tile(model, request)
    'http://example.com/root/related_view'

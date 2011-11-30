Actions::

    >>> from cone.app.model import BaseNode
    >>> from cone.app.browser.actions import (
    ...     Action,
    ...     TileAction,
    ...     TemplateAction,
    ... )
    
    >>> model = BaseNode()
    >>> request = layer.new_request()

Abstract actions fail::

    >>> Action()(model, request)
    Traceback (most recent call last):
      ...
    NotImplementedError: Abstract ``Action`` does not implement render.
    
    >>> TileAction()(model, request)
    u"Tile with name '' not found:..."
    
    >>> TemplateAction()(model, request)
    Traceback (most recent call last):
      ...
    ValueError: Relative path not supported:
    
Dummy actions::

    >>> class DummyAction(Action):
    ...     def render(self):
    ...         return '<a href="">dummy action</a>'
    
    >>> DummyAction()(model, request)
    '<a href="">dummy action</a>'
    
    >>> class DummyTemplateAction(TemplateAction):
    ...     template = u'cone.app.testing:dummy_action.pt'
    
    >>> DummyTemplateAction()(model, request)
    u'<a href="">dummy template action</a>'
    
    >>> from cone.tile import registerTile
    >>> registerTile('dummy_action_tile', 'cone.app.testing:dummy_action.pt')
    >>> class DummyTileAction(TileAction):
    ...     tile = u'dummy_action_tile'
    
    >>> layer.login('viewer')
    
    >>> DummyTileAction()(model, request)
    u'<a href="">dummy template action</a>'
    
    >>> layer.logout()
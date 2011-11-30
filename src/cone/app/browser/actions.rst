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

Toolbar::

    >>> from cone.app.browser.actions import Toolbar
    >>> tb = Toolbar()
    >>> tb['a'] = DummyAction()
    >>> tb['b'] = DummyTemplateAction()
    >>> tb['c'] = DummyTileAction()
    
    >>> layer.login('viewer')
    
    >>> tb(model, request).split('\n')
    [u'<a href="">dummy action</a>', 
    u'<a href="">dummy template action</a>', 
    u'<a href="">dummy template action</a>']
    
    >>> tb.display = False
    >>> tb(model, request)
    u''
    
    >>> layer.logout()

LinkAction::

    >>> from cone.app.browser.actions import LinkAction
    >>> LinkAction()(model, request)
    u'\n  <a\n     ajax:bind="click">&amp;nbsp;</a>\n'
    
    >>> action = LinkAction()
    >>> action.href = 'http://example.com/foo'
    >>> action.css = 'link_action'
    >>> action.title = 'Foo'
    >>> action.action = 'http://example.com/foo'
    >>> action.event = 'contextchanged:.contextsensitiv'
    >>> action.confirm = 'Do you want to perform?'
    >>> action.overlay = 'someaction'
    >>> action.text = 'Foo'
    >>> action(model, request)
    u'\n  <a href="http://example.com/foo"\n     
    class="link_action"\n     
    title="Foo"\n     
    ajax:bind="click"\n     
    ajax:event="contextchanged:.contextsensitiv"\n     
    ajax:action="http://example.com/foo"\n     
    ajax:confirm="Do you want to perform?"\n     
    ajax:overlay="someaction">Foo</a>\n'

    >>> action.enabled = False
    >>> action(model, request).find('class="link_action disabled"') > -1
    True
    
    >>> action.display = False
    >>> action(model, request)
    u''

ActionUp::

    >>> 
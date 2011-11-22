Browser settings
----------------

The 'content' tile for ``AppSettings`` object renders all registered settings
objects inside tabs::

    >>> from cone.app import register_plugin_config
    >>> from cone.app.model import BaseNode

Create and register some settings node::

    >>> class SomeSettings(BaseNode):
    ...     pass
    
    >>> register_plugin_config('foo', SomeSettings)
    >>> register_plugin_config('bar', SomeSettings)

Create 'content' tile for settings node::

    >>> from cone.tile import tile
    >>> from cone.tile import Tile
    
    
    >>> @tile('content', interface=SomeSettings)
    ... class SomeSettingsTile(Tile):
    ...     def render(self):
    ...         return '<div>Settings Contents</div>'
    
    >>> from cone.tile import render_tile

Login and render settings::

    >>> layer.login('manager')
    >>> request = layer.new_request()
    
    >>> from cone.app import get_root
    >>> res = render_tile(get_root()['settings'], request, 'content')
    >>> res.find('<a class="w1" href="#">foo</a>') > -1
    True
    
    >>> res.find('<a class="w1" href="#">bar</a>') > -1
    True
    
    >>> res.find('<div class="foo">') > -1
    True
    
    >>> res.find('<div class="bar">') > -1
    True

Another settings node::

    >>> class OtherSettings(BaseNode):
    ...     pass
    
    >>> register_plugin_config('baz', OtherSettings)

Tile for ``OtherSettings`` which raises an exception at render time:: 

    >>> @tile('content', interface=OtherSettings)
    ... class OtherSettingsTile(Tile):
    ...     def render(self):
    ...         raise Exception(u"This tile can not be rendered for some "
    ...                         u"reason")

Check if error raised by ``OtherSettingsTile`` is caught::

    >>> res = render_tile(get_root()['settings'], request, 'content')
    >>> expected = '<div class="box">Error: This tile can not be rendered ' +\
    ...            'for some reason</div>'
    >>> res.find(expected) > -1
    True
    
    >>> layer.logout()


Settings Form Part
------------------

Settings part for settings forms. Provides a default ``next`` function hooking
form to correct tab::

    >>> from plumber import plumber
    >>> from yafowil.base import factory
    >>> from cone.app.browser.form import Form
    >>> from cone.app.browser.settings import SettingsPart
    
    >>> @tile('editform', interface=SomeSettings)
    ... class SomeSettingsForm(Form):
    ...     __metaclass__ = plumber
    ...     __plumbing__ = SettingsPart
    ... 
    ...     def prepare(self):
    ...         form = factory(u'form',
    ...                        name='editform',
    ...                        props={'action': self.nodeurl})
    ...         form['foo'] = factory(
    ...             'field:label:text',
    ...             props = {
    ...                 'label': 'Foo',
    ...             })
    ...         form['save'] = factory(
    ...             'submit',
    ...             props = {
    ...                 'action': 'save',
    ...                 'expression': True,
    ...                 'handler': None,
    ...                 'next': self.next,
    ...                 'label': 'Save',
    ...             })
    ...         self.form = form
    
    >>> layer.login('manager')
    >>> request = layer.new_request()
    >>> request.params['action.editform.save'] = '1'
    >>> request.params['editform.foo'] = 'foo'
    >>> request.params['ajax'] = '1'
    
    >>> res = render_tile(get_root()['settings']['foo'], request, 'editform')
    >>> res
    u''
    
    >>> request.environ['cone.app.continuation']
    [<cone.app.browser.ajax.AjaxAction object at ...>]
    
    >>> request.environ['cone.app.continuation'][0].selector
    '.foo'
    
    >>> layer.login('manager')
    >>> request = layer.new_request()
    >>> request.params['action.editform.save'] = '1'
    >>> request.params['editform.foo'] = 'foo'
    >>> res = render_tile(get_root()['settings']['foo'], request, 'editform')
    
    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>
    
    >>> layer.logout()

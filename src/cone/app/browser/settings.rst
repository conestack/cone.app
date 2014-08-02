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
    >>> res.find('foo</a>') > -1
    True

    >>> res.find('bar</a>') > -1
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

Check if error raised by ``OtherSettingsTile``::

    >>> model = get_root()['settings']['baz']
    >>> res = render_tile(model, request, 'content')
    Traceback (most recent call last):
      ...
    Exception: This tile can not be rendered for some reason

    >>> layer.logout()


Settings Form Behavior
----------------------

Settings behavior for settings forms. Provides a default ``next`` function
hooking form to correct tab::

    >>> from plumber import plumbing
    >>> from yafowil.base import factory
    >>> from cone.app.browser.form import Form
    >>> from cone.app.browser.settings import SettingsBehavior

    >>> @tile('editform', interface=SomeSettings)
    ... @plumbing(SettingsBehavior)
    ... class SomeSettingsForm(Form):
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

Ajax View for tabs::

    >>> from cone.app.browser.settings import settings_tab_content
    >>> request = layer.new_request()
    >>> response = settings_tab_content(get_root()['settings']['foo'], request)
    >>> response.body
    '<div class="foo"><div>Settings Contents</div></div>'

    >>> response = settings_tab_content(get_root()['settings']['baz'], request)
    >>> response.body
    '<div class="baz">...Exception: This tile can not be rendered for some 
    reason\n</pre></div></div>'

    >>> layer.logout()

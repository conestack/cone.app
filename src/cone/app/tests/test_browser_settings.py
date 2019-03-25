from cone.app import get_root
from cone.app import register_plugin_config
from cone.app import testing
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.form import Form
from cone.app.browser.settings import settings_tab_content
from cone.app.browser.settings import SettingsBehavior
from cone.app.model import BaseNode
from cone.tile import render_tile
from cone.tile import Tile
from cone.tile import tile
from cone.tile.tests import TileTestCase
from plumber import plumbing
from yafowil.base import factory


class SomeSettings(BaseNode):
    pass


class OtherSettings(BaseNode):
    pass


class TestBrowserSettings(TileTestCase):
    layer = testing.security

    def test_register_plugin_config(self):
        root = get_root()
        settings = root['settings']
        settings.factories.clear()

        register_plugin_config('foo', SomeSettings)
        register_plugin_config('bar', SomeSettings)
        register_plugin_config('baz', OtherSettings)
        self.assertEqual(settings.factories.keys(), ['foo', 'bar', 'baz'])

        err = self.expectError(
            ValueError,
            register_plugin_config,
            'baz',
            OtherSettings
        )
        self.assertEqual(str(err), "Config with name 'baz' already registered.")

    def test_settings_content_tile(self):
        root = get_root()
        settings = root['settings']
        settings.factories.clear()
        register_plugin_config('foo', SomeSettings)
        register_plugin_config('bar', SomeSettings)
        register_plugin_config('baz', OtherSettings)

        request = self.layer.new_request()

        # Login and render 'content' tile on ``Settings`` node
        with self.layer.authenticated('manager'):
            res = render_tile(settings, request, 'content')
        self.assertTrue(res.find('foo</a>') > -1)
        self.assertTrue(res.find('bar</a>') > -1)
        self.assertTrue(res.find('baz</a>') > -1)

        # 'content' tile for ``SomeSettings``
        with self.layer.hook_tile_reg():
            @tile(name='content', interface=SomeSettings)
            class SomeSettingsTile(Tile):
                def render(self):
                    return '<div>Settings Contents</div>'

        with self.layer.authenticated('manager'):
            res = render_tile(settings['foo'], request, 'content')
        self.assertEqual(res, '<div>Settings Contents</div>')

        # 'content' tile for ``OtherSettings`` which raises an exception at
        # render time
        with self.layer.hook_tile_reg():
            @tile(name='content', interface=OtherSettings)
            class OtherSettingsTile(Tile):
                def render(self):
                    msg = 'This tile can not be rendered for some reason'
                    raise Exception(msg)

        with self.layer.authenticated('manager'):
            err = self.expectError(
                Exception,
                render_tile,
                settings['baz'],
                request,
                'content'
            )
        self.assertEqual(
            str(err),
            'This tile can not be rendered for some reason'
        )

    def test_SettingsBehavior(self):
        root = get_root()
        settings = root['settings']
        settings.factories.clear()
        register_plugin_config('foo', SomeSettings)

        with self.layer.hook_tile_reg():
            @tile(name='editform', interface=SomeSettings)
            @plumbing(SettingsBehavior)
            class SomeSettingsForm(Form):
                def prepare(self):
                    form = factory(
                        u'form',
                        name='editform',
                        props={
                            'action': self.nodeurl
                        })
                    form['foo'] = factory(
                        'field:label:text',
                        props={
                            'label': 'Foo',
                        })
                    form['save'] = factory(
                        'submit',
                        props={
                            'action': 'save',
                            'expression': True,
                            'handler': None,
                            'next': self.next,
                            'label': 'Save',
                        })
                    self.form = form

        request = self.layer.new_request()
        request.params['action.editform.save'] = '1'
        request.params['editform.foo'] = 'foo'
        request.params['ajax'] = '1'

        with self.layer.authenticated('manager'):
            res = render_tile(settings['foo'], request, 'editform')
        self.assertEqual(res, u'')

        action = request.environ['cone.app.continuation'][0]
        self.assertTrue(isinstance(action, AjaxAction))
        self.assertEqual(action.selector, '.foo')

    def test_settings_tab_content(self):
        root = get_root()
        settings = root['settings']
        settings.factories.clear()
        register_plugin_config('foo', SomeSettings)
        register_plugin_config('baz', OtherSettings)

        with self.layer.hook_tile_reg():
            @tile(name='content', interface=SomeSettings)
            class SomeSettingsTile(Tile):
                def render(self):
                    return '<div>Settings Contents</div>'

            @tile(name='content', interface=OtherSettings)
            class OtherSettingsTile(Tile):
                def render(self):
                    msg = 'This tile can not be rendered for some reason'
                    raise Exception(msg)

        # Ajax view for tabs
        request = self.layer.new_request()
        with self.layer.authenticated('manager'):
            response = settings_tab_content(settings['foo'], request)
        self.assertEqual(
            response.text,
            '<div class="foo"><div>Settings Contents</div></div>'
        )

        with self.layer.authenticated('manager'):
            response = settings_tab_content(settings['baz'], request)
        self.checkOutput("""
        <div class="baz">...Exception: This tile can not be rendered for some
        reason\n</pre></div></div>
        """, response.text)

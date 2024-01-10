from cone.app import get_root
from cone.app import layout_config
from cone.app import register_config
from cone.app import testing
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.form import Form
from cone.app.browser.settings import SettingsBehavior
from cone.app.browser.settings import SettingsLayoutConfig
from cone.app.browser.settings import SettingsTile
from cone.app.model import BaseNode
from cone.app.model import NO_SETTINGS_CATEGORY
from cone.app.model import SettingsNode
from cone.app.model import node_info
from cone.tile import Tile
from cone.tile import render_tile
from cone.tile import tile
from cone.tile.tests import TileTestCase
from plumber import plumbing
from yafowil.base import factory


class SomeSettings(SettingsNode):
    pass


class OtherSettings(SettingsNode):
    pass


class TestBrowserSettings(TileTestCase):
    layer = testing.security

    def test_register_config(self):
        root = get_root()
        settings = root['settings']
        settings.factories.clear()

        register_config('foo', SomeSettings)
        register_config('bar', SomeSettings)
        register_config('baz', OtherSettings)
        self.assertEqual(settings.factories.keys(), ['foo', 'bar', 'baz'])

        with self.assertRaises(ValueError) as arc:
            register_config('baz', OtherSettings)
        self.assertEqual(
            str(arc.exception),
            "Config with name 'baz' already registered."
        )

    def test_SettingsLayoutConfig(self):
        root = get_root()
        settings = root['settings']

        lc = layout_config.lookup(model=settings)
        self.assertIsInstance(lc, SettingsLayoutConfig)

        lc = layout_config.lookup(model=SettingsNode())
        self.assertIsInstance(lc, SettingsLayoutConfig)

        self.assertEqual(lc.sidebar_left, ['settings_sidebar'])

    @testing.reset_node_info_registry
    def test_SettingsTile(self):
        root = get_root()
        settings = root['settings']
        settings.factories.clear()

        @node_info(
            name='no_cat_settings',
            title='No Cat',
            icon='nocat-icon')
        class NoCatSettings(SettingsNode):
            pass

        @node_info(
            name='cat_settings',
            title='Cat',
            icon='cat-icon')
        class CatSettings(SettingsNode):
            category = 'cat'

        class IgnoreSettings(SettingsNode):
            display = False

        class LegacySettings(BaseNode):
            @property
            def metadata(self):
                md = super(LegacySettings, self).metadata
                md.title = 'Legacy'
                return md

        register_config('nocat', NoCatSettings)
        register_config('cat', CatSettings)
        register_config('ignore', IgnoreSettings)
        register_config('legacy', LegacySettings)

        tile = SettingsTile()
        tile.model = settings
        tile.request = self.layer.new_request()

        cc = tile.categorized_children
        self.assertEqual(cc.keys(), [NO_SETTINGS_CATEGORY, 'cat'])
        self.assertEqual(cc[NO_SETTINGS_CATEGORY], [{
            'title': 'No Cat',
            'icon': 'nocat-icon',
            'target': 'http://example.com/settings/nocat',
            'current': False
        }, {
            'title': 'Legacy',
            'icon': 'glyphicon glyphicon-asterisk',
            'target': 'http://example.com/settings/legacy',
            'current': False
        }])
        self.assertEqual(cc['cat'], [{
            'title': 'Cat',
            'icon': 'cat-icon',
            'target': 'http://example.com/settings/cat',
            'current': False
        }])

        tile = SettingsTile()
        tile.model = settings['cat']
        tile.request = self.layer.new_request()
        cc = tile.categorized_children
        self.assertEqual(cc['cat'], [{
            'title': 'Cat',
            'icon': 'cat-icon',
            'target': 'http://example.com/settings/cat',
            'current': True
        }])

    def test_settings_content_tile(self):
        root = get_root()
        settings = root['settings']
        settings.factories.clear()
        register_config('foo', SomeSettings)
        register_config('bar', SomeSettings)
        register_config('baz', OtherSettings)

        request = self.layer.new_request()

        # Login and render 'content' tile on ``Settings`` node
        with self.layer.authenticated('manager'):
            res = render_tile(settings, request, 'content')
        self.assertTrue(res.find('http://example.com/settings/foo') > -1)
        self.assertTrue(res.find('http://example.com/settings/bar') > -1)
        self.assertTrue(res.find('http://example.com/settings/baz') > -1)

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
            with self.assertRaises(Exception) as arc:
                render_tile(settings['baz'], request, 'content')
        self.assertEqual(
            str(arc.exception),
            'This tile can not be rendered for some reason'
        )

    def test_SettingsBehavior(self):
        root = get_root()
        settings = root['settings']
        settings.factories.clear()
        register_config('foo', SomeSettings)

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

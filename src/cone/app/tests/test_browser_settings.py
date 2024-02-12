from cone.app import get_root
from cone.app import layout_config
from cone.app import register_config
from cone.app import testing
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.form import Form
from cone.app.browser.layout import personal_tools
from cone.app.browser.settings import SettingsBehavior
from cone.app.browser.settings import SettingsForm
from cone.app.browser.settings import SettingsLayoutConfig
from cone.app.browser.settings import SettingsTile
from cone.app.browser.settings import settings_form
from cone.app.browser.settings import ViewSettingsAction
from cone.app.model import BaseNode
from cone.app.model import NO_SETTINGS_CATEGORY
from cone.app.model import SettingsNode
from cone.app.model import node_info
from cone.tile import Tile
from cone.tile import render_tile
from cone.tile import tile
from cone.tile.tests import TileTestCase
from plumber import plumbing
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.view import render_view_to_response
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
        settings.invalidate()
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

    def test_ViewSettingsAction(self):
        self.assertTrue('settings' in personal_tools)

        root = get_root()
        settings = root['settings']
        settings.invalidate()
        settings.factories.clear()

        action = ViewSettingsAction()
        action.model = settings
        action.request = self.layer.new_request()

        self.assertEqual(action.text, 'settings')
        self.assertEqual(action.icon, 'ion-ios7-gear')
        self.assertEqual(action.event, 'contextchanged:#layout')
        self.assertEqual(action.path, 'href')
        self.assertEqual(action.target, 'http://example.com/settings')
        self.assertTrue(action.__class__.href is action.__class__.target)
        self.assertTrue(action.settings is settings)

        class TestSettings(SettingsNode):
            pass

        class IgnoreSettings(SettingsNode):
            display = False

        class LegacySettings(BaseNode):
            pass

        register_config('test', TestSettings)
        register_config('ignore', IgnoreSettings)
        register_config('legacy', LegacySettings)

        self.assertFalse(action.display)
        with self.layer.authenticated('max'):
            self.assertFalse(action.display)
        with self.layer.authenticated('manager'):
            self.assertTrue(action.display)

    @testing.reset_node_info_registry
    def test_SettingsTile(self):
        root = get_root()
        settings = root['settings']
        settings.invalidate()
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

        with self.layer.authenticated('manager'):
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
        with self.layer.authenticated('manager'):
            cc = tile.categorized_children
        self.assertEqual(cc['cat'], [{
            'title': 'Cat',
            'icon': 'cat-icon',
            'target': 'http://example.com/settings/cat',
            'current': True
        }])

    @testing.reset_node_info_registry
    def test_SettingsSidebar(self):
        root = get_root()
        settings = root['settings']
        settings.invalidate()
        settings.factories.clear()

        @node_info(
            name='test_settings',
            title='Test Settings',
            icon='test-settings-icon')
        class TestSettings(SettingsNode):
            pass

        register_config('test_settings', TestSettings)
        request = self.layer.new_request()
        with self.layer.authenticated('manager'):
            res = render_tile(settings, request, 'settings_sidebar')
        self.assertTrue(res.find('id="settings_sidebar"') > -1)
        self.assertTrue(res.find('class="list-group-item "') > -1)
        self.assertTrue(res.find('http://example.com/settings/test_settings') > -1)

        test_settings = settings['test_settings']
        with self.layer.authenticated('manager'):
            res = render_tile(test_settings, request, 'settings_sidebar')
        self.assertTrue(res.find('class="list-group-item selected"') > -1)

    @testing.reset_node_info_registry
    def test_SettingsContent(self):
        root = get_root()
        settings = root['settings']
        settings.invalidate()
        settings.factories.clear()

        @node_info(
            name='test_settings',
            title='Test Settings',
            icon='test-settings-icon')
        class TestSettings(SettingsNode):
            pass

        register_config('test_settings', TestSettings)
        request = self.layer.new_request()
        with self.layer.authenticated('manager'):
            res = render_tile(settings, request, 'content')
        self.assertTrue(res.find('http://example.com/settings/test_settings') > -1)

    @testing.reset_node_info_registry
    def test_SettingsEditTile(self):
        root = get_root()
        settings = root['settings']
        settings.invalidate()
        settings.factories.clear()

        @node_info(
            name='test_settings',
            title='Test Settings',
            icon='test-settings-icon')
        class TestSettings(SettingsNode):
            display = True

        register_config('test_settings', TestSettings)
        with self.layer.hook_tile_reg():
            @tile(name='editform', interface=TestSettings)
            class TestSettingsEditForm(Tile):
                def render(self):
                    return '<form id="editform" />'

        request = self.layer.new_request()
        test_settings = settings['test_settings']
        with self.layer.authenticated('manager'):
            res = render_tile(test_settings, request, 'content')
        self.assertEqual(res, '<form id="editform" />')

        with self.layer.authenticated('manager'):
            res = render_view_to_response(
                test_settings,
                request=request,
                name='edit'
            ).text
        self.assertTrue(res.find('<form id="editform" />') > -1)

        test_settings.display = False
        with self.layer.authenticated('manager'):
            with self.assertRaises(HTTPUnauthorized):
                render_tile(test_settings, request, 'content')

    def test_SettingsForm(self):
        root = get_root()
        settings = root['settings']
        settings.invalidate()
        settings.factories.clear()

        @node_info(
            name='test_settings',
            title='Test Settings',
            icon='test-settings-icon')
        class TestSettings(SettingsNode):
            display = True

        register_config('test_settings', TestSettings)
        with self.layer.hook_tile_reg():
            @settings_form(interface=TestSettings)
            @plumbing(SettingsForm)
            class TestSettingsEditForm(Form):
                def prepare(self):
                    self.form = factory(
                        u'form',
                        name='editform',
                        props={
                            'action': self.nodeurl
                        })
                    self.form['save'] = factory(
                        'submit',
                        props={
                            'action': 'save',
                            'expression': True,
                            'handler': None,
                            'next': self.next,
                            'label': 'Save',
                        })

        request = self.layer.new_request()
        test_settings = settings['test_settings']
        with self.layer.authenticated('manager'):
            res = render_tile(test_settings, request, 'editform')
        self.assertTrue(res.find('<h1>Test Settings</h1>') > -1)
        self.assertTrue(res.find('<form action="http://example.com/settings/test_settings"') > -1)

        request.params['action.editform.save'] = '1'
        request.params['ajax'] = '1'
        with self.layer.authenticated('manager'):
            render_tile(test_settings, request, 'editform')

        event = request.environ['cone.app.continuation'][0]
        self.assertIsInstance(event, AjaxEvent)
        self.assertEqual(event.name, 'contextchanged')
        self.assertEqual(event.selector, '#layout')
        self.assertEqual(event.target, 'http://example.com/settings/test_settings')

        test_settings.display = False
        with self.layer.authenticated('manager'):
            with self.assertRaises(HTTPUnauthorized):
                render_tile(test_settings, request, 'editform')

    def test_SettingsBehavior(self):
        root = get_root()
        settings = root['settings']
        settings.invalidate()
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
        request.params['ajax'] = '1'

        with self.layer.authenticated('manager'):
            res = render_tile(settings['foo'], request, 'editform')
        self.assertEqual(res, u'')

        action = request.environ['cone.app.continuation'][0]
        self.assertTrue(isinstance(action, AjaxAction))
        self.assertEqual(action.selector, '.foo')

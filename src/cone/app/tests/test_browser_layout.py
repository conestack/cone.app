from cone.app import cfg
from cone.app import DefaultLayoutConfig
from cone.app import layout_config
from cone.app import testing
from cone.app.browser import render_main_template
from cone.app.browser.actions import LinkAction
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.layout import LanguageTile
from cone.app.browser.layout import LayoutConfigTile
from cone.app.browser.layout import NavTree
from cone.app.browser.layout import personal_tools
from cone.app.browser.layout import personal_tools_action
from cone.app.browser.layout import ProtectedContentTile
from cone.app.interfaces import ILayoutConfig
from cone.app.interfaces import INavigationLeaf
from cone.app.model import AppRoot
from cone.app.model import BaseNode
from cone.app.model import LayoutConfig
from cone.app.security import DEFAULT_SETTINGS_ACL
from cone.app.testing.mock import default_layout
from cone.app.testing.mock import LayoutConfigNode
from cone.app.testing.mock import WorkflowNode
from cone.tile import render_tile
from cone.tile import Tile
from cone.tile import tile
from cone.tile.tests import TileTestCase
from datetime import datetime
from node.base import BaseNode as NodeBaseNode
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Deny
from pyramid.security import Everyone
from zope.interface import implementer
import cone.app
import cone.app.browser.login


class TestBrowserLayout(TileTestCase):
    layer = testing.security

    def test_render_main_template(self):
        # To change the default layout, change the main template
        self.checkOutput('...', cone.app.cfg.main_template)

        main = 'cone.app.testing:dummy_main.pt'
        cone.app.cfg.main_template = main

        # An unprotected tile named 'content' registered for all sorts of node
        with self.layer.hook_tile_reg():
            @tile(name='content', permission='login')
            class ContentTile(Tile):
                def render(self):
                    return '<div>Content</div>'

        model = BaseNode()
        request = self.layer.new_request()

        # Render main template. The function accepts an optional ``contenttile``
        # argument. if omitted, reserved name 'content' is used
        res = render_main_template(model, request)
        self.checkOutput("""
        <!DOCTYPE html...<div>Content</div>...</html>
        """, res.text)

        with self.layer.hook_tile_reg():
            @tile(name='othername', permission='login')
            class OtherContentTile(ContentTile):
                def render(self):
                    return '<div>Content</div>'

        res = render_main_template(model, request, contenttile='othername')
        self.checkOutput("""
        <!DOCTYPE html...<div>Content</div>...</html>
        """, res.text)

        # Switch back to default main template
        main = 'cone.app.browser:templates/main.pt'
        cone.app.cfg.main_template = main

        # Non authenticated users only gets unprotected content tile, no
        # controls like navtree, mainmenu, etc
        res = render_main_template(model, request, contenttile='othername')
        self.assertFalse(res.text.find('id="mainmenu"') > -1)
        self.assertFalse(res.text.find('id="navtree"') > -1)
        self.assertFalse(res.text.find('id="personaltools"') > -1)
        self.assertTrue(res.text.find('<div>Content</div>') > -1)

        # Authenticate non privileged
        with self.layer.authenticated('max'):
            res = render_main_template(model, request, contenttile='othername')

        # All tiles protected by 'view' permission are now available to the user
        self.assertTrue(res.text.find('id="mainmenu"') > -1)
        self.assertTrue(res.text.find('id="navtree"') > -1)
        self.assertTrue(res.text.find('id="personaltools"') > -1)

    def test_ProtectedContentTile(self):
        # A login form should be rendered instead of the content for anonymous
        # users. Class ``cone.app.browser.layout.ProtectedContentTile``
        # provides this behavior
        class ProtectedModel(BaseNode):
            pass

        with self.layer.hook_tile_reg():
            @tile(name='content', interface=ProtectedModel, permission='login')
            class ProtectedContent(ProtectedContentTile):
                def render(self):
                    return '<div>Content</div>'

        model = ProtectedModel()
        request = self.layer.new_request()

        # Render protected tile.
        self.checkOutput("""
        <form action="http://example.com/login"
        class="form-horizontal"
        enctype="multipart/form-data" id="form-loginform" method="post"
        novalidate="novalidate">...
        """, render_tile(model, request, 'content'))

        with self.layer.authenticated('max'):
            result = render_tile(model, request, 'content')

        self.assertTrue(result.find('<div>Content</div>') > -1)

        # test coneten permission
        self.assertEqual(ProtectedContent.content_permission, 'view')
        ProtectedContent.content_permission = 'manage'

        with self.layer.authenticated('max'):
            result = render_tile(model, request, 'content')

        self.assertTrue(result.find('<h3>Insufficient privileges</h3>') > -1)

        with self.layer.authenticated('manager'):
            result = render_tile(model, request, 'content')

        self.assertTrue(result.find('<div>Content</div>') > -1)

    def test_mainmenu(self):
        root = BaseNode()
        root['1'] = BaseNode()
        root['2'] = BaseNode()

        request = self.layer.new_request()

        # Render main menu at root unauthorized
        res = render_tile(root, request, 'mainmenu')
        self.assertFalse(res.find('href="http://example.com/1"') > -1)
        self.assertFalse(res.find('href="http://example.com/2"') > -1)

        # Render main menu at root authorized
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'mainmenu')
        self.assertTrue(res.find('ajax:target="http://example.com/1"') > -1)
        self.assertTrue(res.find('ajax:target="http://example.com/2"') > -1)
        self.assertTrue(res.find('href="http://example.com/1"') > -1)
        self.assertTrue(res.find('href="http://example.com/2"') > -1)

        # Render main menu at child. Child is marked selected
        with self.layer.authenticated('max'):
            res = render_tile(root['1'], request, 'mainmenu')
        self.assertTrue(res.find('<li class="active node-1">') > -1)

        # Render main menu with default child
        model = BaseNode()
        model['1'] = BaseNode()
        model['2'] = BaseNode()
        model.properties.default_child = '2'
        with self.layer.authenticated('max'):
            res = render_tile(model, request, 'mainmenu')
        self.assertTrue(res.find('<li class="active node-2">') > -1)

        # Render main menu on child '1' and check if '2' is unselected now
        with self.layer.authenticated('max'):
            res = render_tile(model['1'], request, 'mainmenu')
        self.assertFalse(res.find('<li class="active node-2">') > -1)
        self.assertTrue(res.find('<li class="active node-1">') > -1)

        # Check rendering of main menu with empty title. This is needed if main
        # menu items are supposed to be displayed as icons via CSS
        with self.layer.authenticated('max'):
            res = render_tile(model, request, 'mainmenu')
        expected = '<span></span></a>'
        self.assertFalse(res.find(expected) > -1)

        model.properties.mainmenu_empty_title = True
        with self.layer.authenticated('max'):
            res = render_tile(model, request, 'mainmenu')
        expected = '<span></span></a>'
        self.assertTrue(res.find(expected) > -1)

        # Child nodes which do not grant permission 'view' are skipped
        class SettingsNode(BaseNode):
            __acl__ = DEFAULT_SETTINGS_ACL

        model['3'] = SettingsNode()
        with self.layer.authenticated('max'):
            res = render_tile(model, request, 'mainmenu')
        self.assertFalse(res.find('<li class=" node-3">') > -1)

        with self.layer.authenticated('manager'):
            res = render_tile(model, request, 'mainmenu')
        self.assertTrue(res.find('<li class=" node-3">') > -1)

        # Check mainmenu displays children
        model = BaseNode()
        child = model['child'] = BaseNode()
        child.properties.mainmenu_display_children = True
        child['1'] = BaseNode()
        child['2'] = BaseNode()
        child['3'] = BaseNode()
        child['3'].properties.skip_mainmenu = True

        with self.layer.authenticated('max'):
            res = render_tile(model, request, 'mainmenu')
        expected = '<li class="dropdown node-child">'
        self.assertTrue(res.find(expected) > -1)
        expected = 'href="http://example.com/child/1"'
        self.assertTrue(res.find(expected) > -1)
        expected = 'href="http://example.com/child/2"'
        self.assertTrue(res.find(expected) > -1)
        expected = 'href="http://example.com/child/3"'
        self.assertFalse(res.find(expected) > -1)

        child['1']['1'] = BaseNode()
        with self.layer.authenticated('max'):
            res = render_tile(child['1']['1'], request, 'mainmenu')
        self.checkOutput("""
        ...<li class="active">
        <a href="http://example.com/child/1"...
        """, res)

    def test_navtree(self):
        root = BaseNode()
        request = self.layer.new_request()

        # Unauthorized
        res = render_tile(root, request, 'navtree')
        self.assertFalse(res.find('id="navtree"') != -1)

        # Empty navtree, no items are marked to be displayed
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'navtree')
        self.assertTrue(res.find('id="navtree"') != -1)
        self.assertTrue(res.find('ajax:bind="contextchanged"') != -1)
        self.assertTrue(res.find('ajax:action="navtree:#navtree:replace"') != -1)
        self.assertTrue(res.find('class="contextsensitiv list-group"') != -1)

        # Node's which are in navtree
        root = BaseNode()
        root.properties.in_navtree = True
        root['1'] = BaseNode()
        root['1'].properties.in_navtree = True
        root['1']['11'] = BaseNode()
        root['1']['11'].properties.in_navtree = True
        root['1']['11']['111'] = BaseNode()
        root['1']['11']['111'].properties.in_navtree = True
        root['2'] = BaseNode()
        root['2'].properties.in_navtree = True

        # ``in_navtree`` is read from ``node.properties`` and defines display
        # UI contract with the navtree tile
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'navtree')
        self.assertTrue(res.find('ajax:target="http://example.com/1"') > -1)

        # Render navtree on ``root['1']``, must be selected
        with self.layer.authenticated('max'):
            res = render_tile(root['1'], request, 'navtree')
        self.checkOutput("""
        ...<li class="active navtreelevel_1">
        <a href="http://example.com/1"...
        """, res)

        # Render navtree on ``root['1']['11']``, must be selected
        with self.layer.authenticated('max'):
            res = render_tile(root['1']['11'], request, 'navtree')
        self.checkOutput("""
        ...<li class="active navtreelevel_2">
        <a href="http://example.com/1/11"...
        """, res)

        # Child nodes which not provide IApplicationNode are skipped
        root['3'] = NodeBaseNode()
        with self.layer.authenticated('manager'):
            res = render_tile(root, request, 'navtree')
        self.assertFalse(res.find('ajax:target="http://example.com/3"') > -1)

        # Subtree rendering stops if node provides INaviationLeaf
        @implementer(INavigationLeaf)
        class LeafNode(BaseNode):
            pass

        root['3'] = LeafNode()
        root['3'].properties.in_navtree = True
        root['3']['3'] = BaseNode()
        root['3']['3'].properties.in_navtree = True

        with self.layer.authenticated('manager'):
            res = render_tile(root['3'], request, 'navtree')
        self.assertTrue(res.find('ajax:target="http://example.com/3"') > -1)
        self.assertFalse(res.find('ajax:target="http://example.com/3/3"') > -1)

        # Child nodes which do not grant permission 'view' are skipped
        class InvisibleNavNode(BaseNode):
            __acl__ = DEFAULT_SETTINGS_ACL

        root['3'] = InvisibleNavNode()
        root['3'].properties.in_navtree = True
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'navtree')
        self.assertFalse(res.find('ajax:target="http://example.com/3"') > -1)

        with self.layer.authenticated('manager'):
            res = render_tile(root, request, 'navtree')
        self.assertTrue(res.find('ajax:target="http://example.com/3"') > -1)

        # Workflow state
        root['4'] = WorkflowNode()
        with self.layer.authenticated('manager'):
            res = render_tile(root, request, 'navtree')
        self.checkOutput("""
        ...<li class="state-initial navtreelevel_1">
        <a href="http://example.com/4"...
        """, res)

        # Default child behavior of navtree. Default children objects are
        # displayed in navtree.
        root.properties.default_child = '1'
        with self.layer.authenticated('manager'):
            res = render_tile(root, request, 'navtree')
        self.checkOutput("""
        ...<li class="active navtreelevel_1">
        <a href="http://example.com/1"...
        """, res)

        with self.layer.authenticated('manager'):
            res = render_tile(root['1'], request, 'navtree')
        self.checkOutput("""
        ...<li class="active navtreelevel_1">
        <a href="http://example.com/1"...
        """, res)

        # If default child should not be displayed it navtree,
        # ``node.properties.hide_if_default`` must be set to 'True'
        root['1'].properties.hide_if_default = True

        # In this case, also children context gets switched. Instead of
        # remaining non default children, children of default node are
        # displayed.
        with self.layer.authenticated('manager'):
            res = render_tile(root, request, 'navtree')
        self.assertFalse(res.find('ajax:target="http://example.com/1"') > -1)
        self.assertFalse(res.find('ajax:target="http://example.com/2"') > -1)
        self.assertTrue(res.find('ajax:target="http://example.com/1/11"') > -1)

        # Check whether children subrendering works on nodes which have set
        # ``hide_if_default``
        root['1']['11']['a'] = BaseNode()
        root['1']['11']['a'].properties.in_navtree = True
        root['1']['11']['a']['aa'] = BaseNode()
        root['1']['11']['a']['aa'].properties.in_navtree = True
        root['1']['11']['b'] = BaseNode()
        root['1']['11']['b'].properties.in_navtree = True

        with self.layer.authenticated('manager'):
            res = render_tile(root['1']['11'], request, 'navtree')
        self.assertTrue(res.find('ajax:target="http://example.com/1/11/a"') > -1)
        self.assertTrue(res.find('ajax:target="http://example.com/1/11/b"') > -1)

        with self.layer.authenticated('manager'):
            res = render_tile(root['1']['11']['a'], request, 'navtree')
        self.assertTrue(res.find('ajax:target="http://example.com/1/11/a/aa"') > -1)

        with self.layer.authenticated('manager'):
            res = render_tile(root['1']['11']['a']['aa'], request, 'navtree')
        self.assertTrue(res.find('ajax:target="http://example.com/1/11/a/aa"') > -1)

        # Render navtree on ``root['1']['11']``, check selected
        with self.layer.authenticated('manager'):
            res = render_tile(root['1']['11'], request, 'navtree')
        self.checkOutput("""
        ...<li class="active navtreelevel_1">
        <a href="http://example.com/1/11"...
        """, res)

        # Nodes can be marked as navigation root
        class TestNavTree(NavTree):
            def __init__(self, model, request):
                self.model = model
                self.request = request

        ignored_root = BaseNode(name='ignored_root')
        ignored_root.properties.in_navtree = True
        navroot = ignored_root['navroot'] = BaseNode()
        navroot.properties.in_navtree = True
        navroot.properties.is_navroot = True
        navroot.metadata.title = 'Navigation Root'
        navroot['child_1'] = BaseNode()
        navroot['child_1'].properties.in_navtree = True
        navroot['child_2'] = BaseNode()
        navroot['child_2'].properties.in_navtree = True

        navtree = TestNavTree(navroot, request)
        self.assertEqual(navtree.navroot.name, 'navroot')
        self.assertEqual(navtree.title, 'Navigation Root')

        with self.layer.authenticated('manager'):
            self.assertEqual(len(navtree.navtree()['children']), 2)

    def test_personal_tools_action(self):
        @personal_tools_action(name='testaction')
        class TestAction(LinkAction):
            pass

        self.assertTrue('testaction' in personal_tools)
        self.assertIsInstance(personal_tools['testaction'], TestAction)

        del personal_tools['testaction']

    def test_personaltools(self):
        root = BaseNode()
        request = self.layer.new_request()

        # Unauthorized
        res = render_tile(root, request, 'personaltools')
        self.assertFalse(res.find('id="personaltools"') > -1)

        # Authorized
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'personaltools')
        self.assertTrue(res.find('id="personaltools"') > -1)
        self.assertTrue(res.find('href="http://example.com/logout"') > -1)
        self.assertFalse(res.find('href="http://example.com/settings"') > -1)

        # No settings link if empty settings
        root['settings'] = BaseNode()
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'personaltools')
        self.assertFalse(res.find('href="http://example.com/settings"') > -1)

        # Settings link if settings container contains children
        root['settings']['mysettings'] = BaseNode()
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'personaltools')
        self.assertTrue(res.find('href="http://example.com/settings"') > -1)

        # No settings if no view permission
        class NoAccessSettings(BaseNode):
            __acl__ = [(Deny, Everyone, ALL_PERMISSIONS)]

        root['settings'] = NoAccessSettings()
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'personaltools')
        self.assertFalse(res.find('href="http://example.com/settings"') > -1)

    def test_pathbar(self):
        root = BaseNode()
        root['1'] = BaseNode()
        request = self.layer.new_request()

        # Unauthorized
        res = render_tile(root, request, 'pathbar')
        self.assertFalse(res.find('pathbaritem') != -1)

        # Authorized
        with self.layer.authenticated('max'):
            res = render_tile(root['1'], request, 'pathbar')
        self.assertTrue(res.find('id="pathbar"') != -1)

        # Default child behavior of pathbar
        root = BaseNode()
        root['1'] = BaseNode()
        root['2'] = BaseNode()

        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'pathbar')
        self.assertTrue(res.find('<strong>Home</strong>') > -1)

        with self.layer.authenticated('max'):
            res = render_tile(root['1'], request, 'pathbar')
        self.assertTrue(res.find('>Home</a>') > -1)
        self.assertTrue(res.find('<strong>1</strong>') > -1)

        with self.layer.authenticated('max'):
            res = render_tile(root['2'], request, 'pathbar')
        self.assertTrue(res.find('>Home</a>') > -1)
        self.assertTrue(res.find('<strong>2</strong>') > -1)

        root.properties.default_child = '1'
        with self.layer.authenticated('max'):
            res = render_tile(root['1'], request, 'pathbar')
        self.assertTrue(res.find('<strong>Home</strong>') > -1)
        self.assertFalse(res.find('<strong>1</strong>') > -1)

        with self.layer.authenticated('max'):
            res = render_tile(root['2'], request, 'pathbar')
        self.assertTrue(res.find('>Home</a>') > -1)
        self.assertTrue(res.find('<strong>2</strong>') > -1)

        root['1'].properties.default_child = '12'
        root['1']['11'] = BaseNode()
        root['1']['12'] = BaseNode()

        with self.layer.authenticated('max'):
            res = render_tile(root['1']['11'], request, 'pathbar')
        self.assertTrue(res.find('<strong>11</strong>') > -1)

        with self.layer.authenticated('max'):
            res = render_tile(root['1']['12'], request, 'pathbar')
        self.assertTrue(res.find('<strong>Home</strong>') > -1)

    def test_byline(self):
        # Byline renders ``model.metadata.creator``, ``model.metadata.created``
        # and ``model.metadata.modified``
        dt = datetime(2011, 3, 14)
        root = BaseNode()
        root.metadata.created = dt
        root.metadata.modified = dt
        root.metadata.creator = 'max'
        request = self.layer.new_request()

        # Unauthenticated
        res = render_tile(root, request, 'byline')
        self.assertEqual(res, u'')

        # Authenticated
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'byline')
        self.checkOutput("""
        <p class="byline">
          <span>Created by</span>:
          <strong>max</strong>,
          <span>on</span>
          <strong>14.03.2011 00:00</strong>.
          <span>Last modified</span>:
          <strong>14.03.2011 00:00</strong>
        </p>
        """, res)

    def test_default_root_content(self):
        # Default root
        root = AppRoot()
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'content')
        self.assertEqual(res, '<div>Default Root</div>')

        # Default child
        class DefaultChild(BaseNode):
            pass

        with self.layer.hook_tile_reg():
            @tile(name='content', interface=DefaultChild, permission='view')
            class DefaultChildContentTile(Tile):
                def render(self):
                    return '<div>Default Child Content</div>'

        root = AppRoot()
        root.factories['1'] = DefaultChild
        root.properties.default_child = '1'
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'content')
        self.assertEqual(res, '<div>Default Child Content</div>')

        # Default content tile
        with self.layer.hook_tile_reg():
            @tile(name='mycontent', interface=AppRoot, permission='view')
            class MyRootContentTile(Tile):
                def render(self):
                    return '<div>My Root Content Tile</div>'

        root = AppRoot()
        root.properties.default_content_tile = 'mycontent'
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'content')
        self.assertEqual(res, '<div>My Root Content Tile</div>')

        # Custom root content tile
        with self.layer.hook_tile_reg():
            @tile(name='content', interface=AppRoot, permission='view')
            class RootContentTile(Tile):
                def render(self):
                    return '<div>Root Content</div>'

        root = AppRoot()
        request = self.layer.new_request()
        with self.layer.authenticated('max'):
            res = render_tile(root, request, 'content')
        self.assertEqual(res, '<div>Root Content</div>')

    def test_layout_config_tile(self):
        # B/C from layout attribute
        tile = LayoutConfigTile()
        tile.model = LayoutConfigNode()
        tile.request = self.layer.new_request()
        config = tile.config
        self.assertIsInstance(config, LayoutConfig)

        # B/C from layout adapter
        request = self.layer.new_request()
        request.registry.registerAdapter(default_layout)

        model = BaseNode()
        config = request.registry.queryAdapter(model, ILayoutConfig, default=None)
        self.assertIsInstance(config, LayoutConfig)

        tile = LayoutConfigTile()
        tile.model = model
        tile.request = request
        config = tile.config
        self.assertIsInstance(config, LayoutConfig)

        request.registry.unregisterAdapter(default_layout)
        config = request.registry.queryAdapter(model, ILayoutConfig, default=None)
        self.assertEqual(config, None)

        # from layout_config
        tile = LayoutConfigTile()
        tile.model = BaseNode()
        tile.request = self.layer.new_request()
        config = tile.config
        self.assertIsInstance(config, DefaultLayoutConfig)

        # default child
        class ChildNode(BaseNode):
            pass

        @layout_config(ChildNode)
        class ChildNodeLayout(LayoutConfig):
            pass

        model = BaseNode()
        model['child'] = ChildNode()
        model.properties.default_child = 'child'
        tile = LayoutConfigTile()
        tile.model = model
        tile.request = self.layer.new_request()
        config = tile.config
        self.assertIsInstance(config, ChildNodeLayout)

        del layout_config._registry[ChildNode]

    def test_LanguageTile(self):
        tile = LanguageTile()
        request = tile.request = self.layer.new_request()
        self.assertEqual(tile.param_blacklist, [
            '_',
            '_LOCALE_',
            'bdajax.action',
            'bdajax.mode',
            'bdajax.selector'
        ])
        request.params['_'] = '123'
        request.params['existing'] = 'value'
        self.assertEqual(tile.make_query(), '?existing=value')
        self.assertEqual(tile.make_query(lang='en'), '?existing=value&lang=en')

    def test_language(self):
        self.assertEqual(cfg.available_languages, ['en', 'de'])
        root = BaseNode()
        request = self.layer.new_request()

        res = render_tile(root, request, 'language')
        self.checkOutput("""
        <li class="dropdown">
          <a href="#"
             class="dropdown-toggle"
             data-toggle="dropdown">
             <span>Language</span>
             <span class="caret"></span>
          </a>
          <ul class="dropdown-menu" role="languagemenu">
            <li>
              <a href="#"
                 ajax:bind="click"
                 ajax:target="http://example.com/?lang=en"
                 ajax:action="change_language:NONE:NONE">
                 <span class="icon-lang-en"></span>
                EN
              </a>
            </li>
            <li>
              <a href="#"
                 ajax:bind="click"
                 ajax:target="http://example.com/?lang=de"
                 ajax:action="change_language:NONE:NONE">
                 <span class="icon-lang-de"></span>
                DE
              </a>
            </li>
          </ul>
        </li>
        """, res)

        cfg.available_languages = []
        res = render_tile(root, request, 'language')
        cfg.available_languages = ['en', 'de']
        self.assertEqual(res, '')

    def test_change_language(self):
        self.assertEqual(cfg.available_languages, ['en', 'de'])
        root = BaseNode()
        request = self.layer.new_request()

        request.params['lang'] = 'de'
        render_tile(root, request, 'change_language')

        cookie = request.response.headers['Set-Cookie']
        self.assertTrue(cookie.startswith('_LOCALE_=de;'))

        continuation = request.environ['cone.app.continuation']
        self.assertEqual(len(continuation), 1)

        event = continuation[0]
        self.assertIsInstance(event, AjaxEvent)
        self.assertEqual(event.target, 'http://example.com/')
        self.assertEqual(event.name, 'contextchanged')
        self.assertEqual(event.selector, '#layout')

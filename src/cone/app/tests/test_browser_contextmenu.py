from cone.app import testing
from cone.app.browser.actions import Action
from cone.app.browser.actions import ActionContext
from cone.app.browser.actions import LinkAction
from cone.app.browser.contextmenu import context_menu
from cone.app.browser.contextmenu import context_menu_group
from cone.app.browser.contextmenu import context_menu_item
from cone.app.browser.contextmenu import ContextMenuDropdown
from cone.app.browser.contextmenu import ContextMenuToolbar
from cone.app.model import BaseNode
from cone.app.testing.mock import CopySupportNode
from cone.app.testing.mock import SharingNode
from cone.tile import render_tile
from cone.tile.tests import TileTestCase


class TestBrowserContextmenu(TileTestCase):
    layer = testing.security

    def test_ContextMenuToolbar(self):
        model = BaseNode()
        request = self.layer.new_request()

        cmt = ContextMenuToolbar()
        cmt.display = False
        self.assertEqual(cmt(model, request), '')

        class EmptyRenderAction(Action):
            def render(self):
                return ''

        cmt = ContextMenuToolbar()
        cmt['empty'] = EmptyRenderAction()
        self.assertEqual(cmt(model, request), '')

        class RenderAction(Action):
            def render(self):
                return '<span>Rendered action</span>'

        cmt = ContextMenuToolbar()
        cmt['action'] = RenderAction()
        self.assertEqual(
            cmt(model, request),
            '<ul class="nav navbar-nav"><span>Rendered action</span></ul>'
        )

        class MyLinkAction(LinkAction):
            id = 'myaction'
            icon = 'myicon'
            text = 'My Action'
            href = 'http://example.com'

        cmt = ContextMenuToolbar()
        cmt['link'] = MyLinkAction()
        self.assertTrue(cmt(model, request).find('My Action') > -1)
        self.assertFalse(cmt(model, request).find('<li class="active">') > -1)

        cmt['link'].selected = True
        self.assertTrue(cmt(model, request).find('<li class="active">') > -1)

        cmt.css = 'mytoolbar'
        expected = 'class="nav navbar-nav mytoolbar"'
        self.assertTrue(cmt(model, request).find(expected) > -1)

    def test_ContextMenuDropdown(self):
        cmd = ContextMenuDropdown(title='Dropdown')

        def add_action():
            cmd['invalid'] = Action()
        err = self.expectError(ValueError, add_action)
        expected = (
            'Only ``LinkAction`` deriving objects can be added '
            'to ``ContextMenuDropdown`` instances.'
        )
        self.assertEqual(str(err), expected)

        class MyLinkAction(LinkAction):
            id = 'myaction'
            icon = 'myicon'
            text = 'My Action'
            href = 'http://example.com'

        cmd = ContextMenuDropdown(title='Dropdown')
        cmd.model = BaseNode()
        cmd.request = self.layer.new_request()

        cmd['link'] = MyLinkAction()
        self.assertTrue(cmd.display)

        cmd['link'].display = False
        self.assertFalse(cmd.display)

        cmd = ContextMenuDropdown(title='Dropdown')
        cmd['link'] = MyLinkAction()

        model = BaseNode()
        request = self.layer.new_request()
        res = cmd(model, request)
        self.assertTrue(res.find('<li class="dropdown">') > -1)

    def test_context_menu_decorators(self):
        @context_menu_group(name='testgroup')
        class TestContextMenuGroup(ContextMenuToolbar):
            pass

        self.assertTrue('testgroup' in context_menu)
        self.assertIsInstance(context_menu['testgroup'], TestContextMenuGroup)

        @context_menu_item(group='testgroup', name='testaction')
        class TestAction(LinkAction):
            pass

        self.assertTrue('testaction' in context_menu['testgroup'])
        self.assertIsInstance(context_menu['testgroup']['testaction'], TestAction)

        del context_menu['testgroup']

    def test_contextmenu(self):
        with self.layer.authenticated('manager'):
            parent = BaseNode('root')
            model = parent['model'] = SharingNode()
            model.properties.action_up = True
            model.properties.action_view = True
            model.properties.action_list = True
            model.properties.action_edit = True
            model.properties.action_delete = True
            # XXX: model.properties.action_delete_children = True

            request = self.layer.new_request()
            ActionContext(model, request, 'content')
            rendered = render_tile(model, request, 'contextmenu')

            self.assertTrue(rendered.find('toolbaraction-up') > -1)
            self.assertTrue(rendered.find('toolbaraction-view') > -1)
            self.assertTrue(rendered.find('toolbaraction-list') > -1)
            self.assertTrue(rendered.find('toolbaraction-edit') > -1)
            self.assertTrue(rendered.find('toolbaraction-delete') > -1)
            self.assertTrue(rendered.find('toolbaraction-share') > -1)

            model = CopySupportNode()
            ActionContext(model, request, 'listing')
            rendered = render_tile(model, request, 'contextmenu')

            self.assertTrue(rendered.find('toolbaraction-cut') > -1)
            self.assertTrue(rendered.find('toolbaraction-copy') > -1)
            self.assertTrue(rendered.find('toolbaraction-paste') > -1)

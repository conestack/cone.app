from cone.app import testing
from cone.app.browser.actions import Action
from cone.app.browser.actions import ActionContext
from cone.app.browser.actions import LinkAction
from cone.app.browser.actions import TemplateAction
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
            '<li class="nav-item py-0"><span>Rendered action</span></li>'
        )

        class MyLinkAction(LinkAction):
            id = 'myaction'
            icon = 'myicon'
            text = 'My Action'
            href = 'http://example.com'

        cmt = ContextMenuToolbar()
        cmt['link'] = MyLinkAction()
        self.assertTrue(cmt(model, request).find('My Action') > -1)
        self.assertFalse(cmt(model, request).find('class="active"') > -1)

        cmt['link'].selected = True
        self.assertTrue(cmt(model, request).find('class="active"') > -1)

        cmt.css = 'mytoolbar'
        expected = 'class="mytoolbar"'
        self.assertTrue(cmt(model, request).find(expected) > -1)

    def test_ContextMenuDropdown(self):
        cmd = ContextMenuDropdown(title='Dropdown')

        def add_action():
            cmd['invalid'] = Action()
        with self.assertRaises(ValueError) as arc:
            add_action()
        expected = (
            'Only ``TemplateAction`` deriving objects can be added '
            'to ``ContextMenuDropdown`` instances.'
        )
        self.assertEqual(str(arc.exception), expected)

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
        self.assertTrue(res.find('<li class="nav-item dropdown') > -1)

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
            parent = BaseNode(name='root')
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


class TestContextMenuIsolation(TileTestCase):
    """Two requests must not see each other's model.

    The registries hold **one instance per action and per toolbar**, created
    at import time: ``context_menu_item`` calls ``factory()`` and stores the
    result. Binding used to write ``model`` and ``request`` straight onto those
    shared objects, so a second request overwrote what a first one was still
    working with.

    Measured in production on 2026-09-23: an action that reads the container,
    queries it, and then indexes it with the result got a name from one
    container and looked it up in another - ``KeyError`` on a perfectly healthy
    record. The silent half of the same defect is worse: an action decides
    ``display`` against a foreign model and offers itself where it does not
    belong.
    """

    layer = testing.security

    def test_binding_leaves_the_registered_action_alone(self):
        """The registry entry is shared; whatever binds must not write on it."""

        class Recording(Action):
            def render(self):
                return str(self.model.name)

        action = Recording()
        model = BaseNode(name='first')
        request = self.layer.new_request()

        self.assertEqual(action(model, request), 'first')
        self.assertNotIn('model', action.__dict__)
        self.assertNotIn('request', action.__dict__)

    def test_two_threads_do_not_see_each_others_model(self):
        """The defect itself, reproduced without a browser.

        The first thread is held **between** reading the model and using it -
        exactly the window a database query opens in real life - while the
        second binds the same shared action to a different model.
        """
        import threading

        bound = threading.Event()
        released = threading.Event()
        seen = {}

        class Slow(Action):
            def render(self):
                first = self.model.name
                # ⚠ Only the first thread waits. Both calls run **this** body -
                # the object is shared, that is the whole point - and a body
                # that blocks unconditionally deadlocks the test rather than
                # testing anything.
                if first != 'slow':
                    return ''
                bound.set()
                released.wait(5)
                # The same attribute, read again after the other thread bound.
                seen['slow'] = (first, self.model.name)
                return ''

        action = Slow()
        slow_model = BaseNode(name='slow')
        fast_model = BaseNode(name='fast')
        request = self.layer.new_request()

        thread = threading.Thread(target=action, args=(slow_model, request))
        thread.start()
        self.assertTrue(bound.wait(5))
        action(fast_model, request)
        released.set()
        thread.join(5)

        before, after = seen['slow']
        self.assertEqual(before, 'slow')
        self.assertEqual(after, 'slow', 'the other thread changed this model')

    def test_a_dropdown_does_not_write_on_its_registered_actions(self):
        """⛔ The widest part of the window. ``ContextMenuDropdown.display``
        assigned ``model`` and ``request`` into **every** child before anything
        rendered - so one request published its node to the whole group, not
        just to the action being drawn."""
        class Shown(TemplateAction):
            def render(self):
                return '<span>x</span>'

        dropdown = ContextMenuDropdown()
        dropdown.title = 'Group'
        child = Shown()
        dropdown['shown'] = child

        model = BaseNode(name='container')
        request = self.layer.new_request()
        self.assertIn('x', dropdown(model, request))
        self.assertNotIn('model', child.__dict__)
        self.assertNotIn('request', child.__dict__)
        self.assertNotIn('model', dropdown.__dict__)
        self.assertNotIn('request', dropdown.__dict__)

    def test_a_dropdown_asks_its_children_about_the_bound_model(self):
        """Binding is not enough - the children have to be asked about the
        node that is being rendered, not about whatever they saw last."""
        seen = []

        class Asking(TemplateAction):
            @property
            def display(self):
                seen.append(self.model.name)
                return True

            def render(self):
                return '<span>x</span>'

        dropdown = ContextMenuDropdown()
        dropdown.title = 'Group'
        dropdown['asking'] = Asking()
        dropdown(BaseNode(name='first'), self.layer.new_request())
        dropdown(BaseNode(name='second'), self.layer.new_request())
        self.assertEqual(sorted(set(seen)), ['first', 'second'])

    def test_a_toolbar_does_not_write_on_its_registered_actions(self):
        """``display`` used to assign ``model`` and ``request`` into **every**
        child before anything rendered - the widest part of the window."""

        class Shown(Action):
            display = True

            def render(self):
                return '<span>x</span>'

        toolbar = ContextMenuToolbar()
        child = Shown()
        toolbar['shown'] = child

        model = BaseNode(name='container')
        request = self.layer.new_request()
        self.assertIn('x', toolbar(model, request))
        self.assertNotIn('model', child.__dict__)
        self.assertNotIn('request', child.__dict__)
        self.assertNotIn('model', toolbar.__dict__)

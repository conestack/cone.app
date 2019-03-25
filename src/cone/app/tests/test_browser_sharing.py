from cone.app import testing
from cone.app.browser.ajax import ajax_tile
from cone.app.browser.sharing import sharing
from cone.app.model import BaseNode
from cone.app.testing.mock import SharingNode
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from pyramid.exceptions import HTTPForbidden


class TestBrowserSharing(TileTestCase):
    layer = testing.security

    def test_render_sharing_view(self):
        model = SharingNode(name='root')
        request = self.layer.new_request()

        err = self.expectError(
            HTTPForbidden,
            sharing,
            model,
            request
        )
        self.checkOutput("""
        ...Unauthorized: tile <cone.app.browser.sharing.SharingTile object at ...>
        failed permission check...
        """, str(err))

        with self.layer.authenticated('manager'):
            res = sharing(model, request)
        self.assertTrue(res.text.find('<!DOCTYPE html>') > -1)

    def test_render_sharing_tile(self):
        root = SharingNode(name='root')
        request = self.layer.new_request()

        # Render sharing tile
        with self.layer.authenticated('manager'):
            res = render_tile(root, request, 'sharing')
        self.checkOutput("""
        ...<table class="table table-striped table-condensed"
        id="localacltable_table">...
        """, res)

    def test_search_principal(self):
        root = SharingNode(name='root')
        request = self.layer.new_request()

        # Render sharing tile with search term
        with self.layer.authenticated('manager'):
            res = render_tile(root, request, 'sharing')
        self.assertFalse(res.find('Manager User') > -1)

        request.params['term'] = 'manager'
        with self.layer.authenticated('manager'):
            res = render_tile(root, request, 'sharing')
        self.assertTrue(res.find('Manager User') > -1)

        request.params['term'] = 'group1'
        with self.layer.authenticated('manager'):
            res = render_tile(root, request, 'sharing')
        self.assertTrue(res.find('Group 1') > -1)

        # Existing principal roles are not rendered if term found on request
        root.principal_roles['viewer'] = ['editor']
        with self.layer.authenticated('manager'):
            res = render_tile(root, request, 'sharing')
        expected = (
            '<input checked="checked" '
            'class="add_remove_role_for_principal" '
            'id="input-viewer" name="viewer" type="checkbox" value="editor" />'
        )
        self.assertFalse(res.find(expected) > -1)

        # Existing principal roles are rendered if no term found
        del request.params['term']
        with self.layer.authenticated('manager'):
            res = render_tile(root, request, 'sharing')
        self.assertTrue(res.find(expected) > -1)

    def test_inherited_principal_roles(self):
        root = SharingNode(name='root')
        root.principal_roles['viewer'] = ['editor']

        child = root['child'] = SharingNode()
        child.role_inheritance = True
        child.principal_roles['viewer'] = ['admin']

        request = self.layer.new_request()

        with self.layer.authenticated('manager'):
            res = render_tile(child, request, 'sharing')

        expected = (
            '<input checked="checked" '
            'class="add_remove_role_for_principal" disabled="disabled" '
            'id="input-viewer" name="viewer" type="checkbox" value="editor" />'
        )
        self.assertTrue(res.find(expected) > -1)

        expected = (
            '<input checked="checked" '
            'class="add_remove_role_for_principal" id="input-viewer" '
            'name="viewer" type="checkbox" value="admin" />'
        )
        self.assertTrue(res.find(expected) > -1)

        expected = (
            '<input class="add_remove_role_for_principal" '
            'id="input-viewer" name="viewer" type="checkbox" '
            'value="manager" />'
        )
        self.assertTrue(res.find(expected) > -1)

    def test_table_sorting(self):
        root = SharingNode(name='root')
        child = root['child'] = SharingNode()
        child.principal_roles['viewer'] = ['admin']
        child.principal_roles['editor'] = ['admin']

        request = self.layer.new_request()

        # Sharing table sorting
        with self.layer.authenticated('manager'):
            res = render_tile(child, request, 'sharing')
        self.assertTrue(res.find('Editor User') > -1)
        self.assertTrue(res.find('Viewer User') > -1)
        self.assertTrue(res.find('Editor User') < res.find('Viewer User'))

        request.params['order'] = 'desc'
        with self.layer.authenticated('manager'):
            res = render_tile(child, request, 'sharing')
        self.assertTrue(res.find('Editor User') > -1)
        self.assertTrue(res.find('Viewer User') > -1)
        self.assertFalse(res.find('Editor User') < res.find('Viewer User'))

        del request.params['order']

    def test_skip_inexistent(self):
        root = SharingNode(name='root')
        child = root['child'] = SharingNode()

        # Users defined in ``principal_roles`` but not exists in ugm are
        # skipped. This could happen if user was deleted but principal roles
        # were not
        child.principal_roles['inexistent'] = ['viewer']

        request = self.layer.new_request()

        with self.layer.authenticated('manager'):
            res = render_tile(child, request, 'sharing')
        self.assertFalse(res.find('name="inexistent"') > -1)

    def test_add_role(self):
        root = SharingNode(name='root')
        child = root['child'] = SharingNode()
        child.principal_roles['viewer'] = ['admin']
        child.principal_roles['editor'] = ['admin']

        # Add role for user
        request = self.layer.new_request()
        request.params['id'] = 'viewer'
        request.params['role'] = 'manager'
        request.params['bdajax.action'] = 'add_principal_role'
        request.params['bdajax.mode'] = 'NONE'
        request.params['bdajax.selector'] = 'NONE'

        # Nothing happens if success
        with self.layer.authenticated('manager'):
            res = ajax_tile(child, request)
        self.assertEqual(res, {
            'continuation': False,
            'payload': u'',
            'mode': 'NONE',
            'selector': 'NONE'
        })

        # Principal roles have changed
        self.assertEqual(len(child.principal_roles), 2)
        self.assertEqual(
            sorted(child.principal_roles['viewer']),
            ['admin', 'manager']
        )
        self.assertEqual(child.principal_roles['editor'], ['admin'])

        # Add role for user not added yet
        request.params['id'] = 'otheruser'
        request.params['role'] = 'manager'
        with self.layer.authenticated('manager'):
            res = ajax_tile(child, request)
        self.assertEqual(res, {
            'continuation': False,
            'payload': u'',
            'mode': 'NONE',
            'selector': 'NONE'
        })

        self.assertEqual(len(child.principal_roles), 3)
        self.assertEqual(
            sorted(child.principal_roles['viewer']),
            ['admin', 'manager']
        )
        self.assertEqual(child.principal_roles['editor'], ['admin'])
        self.assertEqual(child.principal_roles['otheruser'], ['manager'])

        # If an error occurs, a message gets displayed
        invalid_node = BaseNode()
        request.params['id'] = 'viewer'
        with self.layer.authenticated('manager'):
            res = ajax_tile(invalid_node, request)
        self.assertEqual(res, {
            'continuation': [{
                'flavor': 'error',
                'type': 'message',
                'payload': u"Can not add role 'manager' for principal 'viewer'",
                'selector': None
            }],
            'payload': u'',
            'mode': 'NONE',
            'selector': 'NONE'
        })

    def test_remove_role(self):
        root = SharingNode(name='root')
        child = root['child'] = SharingNode()
        child.principal_roles['viewer'] = ['admin', 'manager']
        child.principal_roles['editor'] = ['admin']
        child.principal_roles['otheruser'] = ['manager']

        # Remove role for user
        request = self.layer.new_request()
        request.params['id'] = 'viewer'
        request.params['role'] = 'manager'
        request.params['bdajax.action'] = 'remove_principal_role'
        request.params['bdajax.mode'] = 'NONE'
        request.params['bdajax.selector'] = 'NONE'

        # Nothing happens if success
        with self.layer.authenticated('manager'):
            res = ajax_tile(child, request)
        self.assertEqual(res, {
            'continuation': False,
            'payload': u'',
            'mode': 'NONE',
            'selector': 'NONE'
        })

        # Principal roles has changed
        self.assertEqual(child.principal_roles, {
            'viewer': ['admin'],
            'editor': ['admin'],
            'otheruser': ['manager']
        })

        # Principal id gets removed if no more roles left
        request.params['id'] = 'otheruser'
        request.params['role'] = 'manager'
        with self.layer.authenticated('manager'):
            res = ajax_tile(child, request)
        self.assertEqual(res, {
            'continuation': False,
            'payload': u'',
            'mode': 'NONE',
            'selector': 'NONE'
        })

        self.assertEqual(child.principal_roles, {
            'viewer': ['admin'],
            'editor': ['admin']
        })

        # If an error occurs, a message gets displayed.
        # Inexistent role
        request.params['id'] = 'viewer'
        request.params['role'] = 'inexistent'
        with self.layer.authenticated('manager'):
            res = ajax_tile(child, request)
        self.assertEqual(res, {
            'continuation': [{
                'flavor': 'error',
                'type': 'message',
                'payload': u"Can not remove role 'inexistent' for principal 'viewer'",
                'selector': None
            }],
            'payload': u'',
            'mode': 'NONE',
            'selector': 'NONE'
        })

        # Inexistent userid
        request = self.layer.new_request()
        request.params['id'] = 'foo'
        request.params['role'] = 'manager'
        request.params['bdajax.action'] = 'remove_principal_role'
        request.params['bdajax.mode'] = 'NONE'
        request.params['bdajax.selector'] = 'NONE'
        with self.layer.authenticated('manager'):
            res = ajax_tile(child, request)
        self.assertEqual(res, {
            'continuation': [{
                'flavor': 'error',
                'type': 'message',
                'payload': u"Can not remove role 'manager' for principal 'foo'",
                'selector': None
            }],
            'payload': u'',
            'mode': 'NONE',
            'selector': 'NONE'
        })

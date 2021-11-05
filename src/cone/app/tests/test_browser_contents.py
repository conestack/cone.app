from cone.app import compat
from cone.app import testing
from cone.app.browser import set_related_view
from cone.app.browser.contents import ContentsTile
from cone.app.browser.contents import ContentsViewLink
from cone.app.browser.contents import listing
from cone.app.browser.table import TableSlice
from cone.app.browser.utils import make_url
from cone.app.model import BaseNode
from cone.app.model import node_info
from cone.app.testing.mock import CopySupportNode
from cone.app.testing.mock import WorkflowNode
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from datetime import datetime
from datetime import timedelta
from node.base import BaseNode as NodeBaseNode
from node.behaviors import Order
from plumber import plumbing
from pyramid.exceptions import HTTPForbidden
from pyramid.security import ACLDenied
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Deny
from pyramid.security import Everyone


class NeverShownChild(BaseNode):
    __acl__ = [(Deny, Everyone, ALL_PERMISSIONS)]


class TestBrowserContents(TileTestCase):
    layer = testing.security

    def create_dummy_model(self):
        created = datetime(2011, 3, 14)
        delta = timedelta(1)
        modified = created + delta
        model = BaseNode()
        for i in range(19):
            model[str(i)] = BaseNode()
            model[str(i)].properties.action_view = True
            model[str(i)].properties.action_edit = True
            model[str(i)].properties.action_delete = True
            model[str(i)].metadata.title = str(i) + ' Title'
            model[str(i)].metadata.creator = 'admin ' + str(19 - i)
            model[str(i)].metadata.created = created
            model[str(i)].metadata.modified = modified
            created = created + delta
            modified = modified + delta
        model['nevershown'] = NeverShownChild()
        model['no_app_node'] = NodeBaseNode()
        return model

    def test_sorted_rows(self):
        tmpl = 'cone.app:browser/templates/table.pt'
        contents = ContentsTile(tmpl, None, 'contents')
        contents.model = self.create_dummy_model()
        contents.request = self.layer.new_request()

        # ``sorted_rows`` returns sorted listing items. ``start``, ``end``,
        # ``sort`` and ``order`` are expected by this function
        with self.layer.authenticated('manager'):
            res = contents.sorted_rows(None, None, 'created', 'desc')[0]['title']
            self.checkOutput('...0 Title...', res)

            res = contents.sorted_rows(None, None, 'created', 'desc')[-1]['title']
            self.checkOutput('...18 Title...', res)

            res = contents.sorted_rows(None, None, 'created', 'asc')[0]['title']
            self.checkOutput('...18 Title...', res)

            res = contents.sorted_rows(None, None, 'created', 'asc')[-1]['title']
            self.checkOutput('...0 Title...', res)

    def test_slice(self):
        tmpl = 'cone.app:browser/templates/table.pt'
        contents = ContentsTile(tmpl, None, 'contents')
        contents.model = self.create_dummy_model()
        request = contents.request = self.layer.new_request()

        # ``contents.slice.slice`` return current batch start and positions
        self.assertTrue(isinstance(contents.slice, TableSlice))
        self.assertEqual(contents.slice.slice, (0, 15))

        request.params['b_page'] = '1'
        self.assertEqual(contents.slice.slice, (15, 30))

        del request.params['b_page']

        # ``contents.slice.rows`` return the current sorted row data for listing.
        with self.layer.authenticated('manager'):
            # Items returned by default sorting
            res = contents.slice.rows[0]['title']
            self.checkOutput('...0 Title...', res)

            res = contents.slice.rows[-1]['title']
            self.checkOutput('...14 Title...', res)

            # Inverse order
            request.params['order'] = 'asc'
            res = contents.slice.rows[0]['title']
            self.checkOutput('...18 Title...', res)

            res = contents.slice.rows[-1]['title']
            self.checkOutput('...4 Title...', res)

            # Switch batch page with inversed order
            request.params['b_page'] = '1'
            res = contents.slice.rows[0]['title']
            self.checkOutput('...3 Title...', res)

            res = contents.slice.rows[-1]['title']
            self.checkOutput('...0 Title...', res)

            # Reset order and batch page
            del request.params['order']
            del request.params['b_page']

            # Sort by creator
            request.params['sort'] = 'creator'
            self.assertEqual([row['creator'] for row in contents.slice.rows], [
                'admin 1', 'admin 10', 'admin 11', 'admin 12', 'admin 13',
                'admin 14', 'admin 15', 'admin 16', 'admin 17', 'admin 18',
                'admin 19', 'admin 2', 'admin 3', 'admin 4', 'admin 5'
            ])

            request.params['b_page'] = '1'
            self.assertEqual([row['creator'] for row in contents.slice.rows], [
                'admin 6', 'admin 7', 'admin 8', 'admin 9'
            ])

            # Sort by created
            request.params['b_page'] = '0'
            request.params['sort'] = 'created'

            self.assertEqual(
                contents.slice.rows[0]['created'],
                datetime(2011, 3, 14, 0, 0)
            )
            self.assertEqual(
                contents.slice.rows[-1]['created'],
                datetime(2011, 3, 28, 0, 0)
            )

            request.params['b_page'] = '1'
            request.params['sort'] = 'modified'

            self.assertEqual(
                contents.slice.rows[0]['modified'],
                datetime(2011, 3, 30, 0, 0)
            )

            self.assertEqual(
                contents.slice.rows[-1]['modified'],
                datetime(2011, 4, 2, 0, 0)
            )

            del request.params['b_page']
            del request.params['sort']

    def test_batch(self):
        tmpl = 'cone.app:browser/templates/table.pt'
        contents = ContentsTile(tmpl, None, 'contents')
        contents.model = self.create_dummy_model()
        request = contents.request = self.layer.new_request()

        with self.layer.authenticated('manager'):
            rendered = contents.batch

        expected = (
            '<li class="active">\n          '
            '<a href="javascript:void(0)">1</a>'
        )
        self.assertTrue(rendered.find(expected) != -1)

        expected = (
            'http://example.com/?b_page=1&amp;'
            'order=desc&amp;size=15&amp;sort=created'
        )
        self.assertTrue(rendered.find(expected) != -1)

        # Change page
        request.params['b_page'] = '1'
        with self.layer.authenticated('manager'):
            rendered = contents.batch

        expected = (
            '<li class="active">\n          '
            '<a href="javascript:void(0)">2</a>'
        )
        self.assertTrue(rendered.find(expected) != -1)

        expected = (
            'http://example.com/?b_page=0&amp;'
            'order=desc&amp;size=15&amp;sort=created'
        )
        self.assertTrue(rendered.find(expected) != -1)

        # Change sort and order. Sort is proxied by batch
        request.params['sort'] = 'modified'
        with self.layer.authenticated('manager'):
            rendered = contents.batch

        expected = (
            'http://example.com/?b_page=0&amp;'
            'order=desc&amp;size=15&amp;sort=modified'
        )
        self.assertTrue(rendered.find(expected) != -1)

    def test_authenticated(self):
        model = self.create_dummy_model()
        request = self.layer.new_request()

        # Rendering fails unauthorized, 'list' permission is required
        rule = request.has_permission('list', model)
        self.assertTrue(isinstance(rule, ACLDenied))

        err = self.expectError(
            HTTPForbidden,
            render_tile,
            model,
            request,
            'contents'
        )
        self.checkOutput("""
        Unauthorized: tile
        <cone.app.browser.contents.ContentsTile object at ...> failed
        permission check
        """, str(err))

        # Render authenticated
        with self.layer.authenticated('manager'):
            request.params['sort'] = 'modified'
            request.params['b_page'] = '1'
            rendered = render_tile(model, request, 'contents')
            expected = (
                '<a href="http://example.com/?b_page=1&amp;'
                'order=desc&amp;size=15&amp;sort=title"'
            )
            self.assertTrue(rendered.find(expected) != -1)

    def test_copysupport(self):
        # Copysupport Attributes
        model = CopySupportNode()
        model['child'] = CopySupportNode()
        request = self.layer.new_request()

        with self.layer.authenticated('manager'):
            rendered = render_tile(model, request, 'contents')

        expected = 'class="selectable copysupportitem"'
        self.assertTrue(rendered.find(expected) > -1)

        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            cut_url = compat.quote(make_url(request, node=model['child']))
            request.cookies['cone.app.copysupport.cut'] = cut_url
            rendered = render_tile(model, request, 'contents')

        expected = 'class="selectable copysupportitem copysupport_cut"'
        self.assertTrue(rendered.find(expected) > -1)

    def test_ContentsViewLink(self):
        tmpl = 'cone.app:browser/templates/table.pt'
        contents = ContentsTile(tmpl, None, 'contents')

        model = BaseNode(name='root')
        request = self.layer.new_request()

        view_link = contents.view_link
        self.assertTrue(isinstance(contents.view_link, ContentsViewLink))

        with self.layer.authenticated('max'):
            res = view_link(model, request)
        expected = 'ajax:target="http://example.com/root"'
        self.assertTrue(res.find(expected) > -1)

        set_related_view(request, 'someview')
        with self.layer.authenticated('max'):
            res = view_link(model, request)
        expected = 'ajax:target="http://example.com/root?contenttile=someview"'
        self.assertTrue(res.find(expected) > -1)

    def test_workflow_state(self):
        root = BaseNode(name='root')
        root['wf'] = WorkflowNode()
        request = self.layer.new_request()

        tmpl = 'cone.app:browser/templates/table.pt'
        contents = ContentsTile(tmpl, None, 'contents')
        contents.model = root
        contents.request = request

        with self.layer.authenticated('max'):
            res = contents.sorted_rows(
                0,
                1,
                contents.default_sort,
                contents.default_order
            )
        self.assertEqual(res[0].css, ' state-initial')

    @testing.reset_node_info_registry
    def test_node_type(self):
        @node_info(
            name='mynode')
        class MyNode(BaseNode):
            pass

        root = BaseNode()
        root['child'] = MyNode()
        request = self.layer.new_request()

        tmpl = 'cone.app:browser/templates/table.pt'
        contents = ContentsTile(tmpl, None, 'contents')
        contents.model = root
        contents.request = request

        with self.layer.authenticated('max'):
            res = contents.sorted_rows(
                0,
                1,
                contents.default_sort,
                contents.default_order
            )
        self.assertEqual(res[0].css, ' node-type-mynode')

    def test_filtered_children(self):
        root = BaseNode()

        child_1 = root['1'] = BaseNode()
        md_1 = child_1.metadata
        md_1.title = 'Child 1'
        md_1.creator = 'max'

        child_2 = root['2'] = BaseNode()
        md_2 = child_2.metadata
        md_2.title = 'Child 2'
        md_2.creator = 'sepp'

        tmpl = 'cone.app:browser/templates/table.pt'
        contents = ContentsTile(tmpl, None, 'contents')
        contents.model = root
        contents.request = self.layer.new_request()

        res = contents.filtered_children
        self.assertEqual(res, [])

        contents.request = self.layer.new_request()
        with self.layer.authenticated('max'):
            res = contents.filtered_children
        self.assertEqual(len(res), 2)

        request = contents.request = self.layer.new_request()
        request.params['term'] = 'sepp'
        with self.layer.authenticated('max'):
            res = contents.filtered_children
        self.assertEqual(len(res), 1)

        request = contents.request = self.layer.new_request()
        request.params['term'] = 'Child 1'
        with self.layer.authenticated('max'):
            res = contents.filtered_children
        self.assertEqual(len(res), 1)

        request = contents.request = self.layer.new_request()
        request.params['term'] = 'hild'
        with self.layer.authenticated('max'):
            res = contents.filtered_children
        self.assertEqual(len(res), 2)

        request = contents.request = self.layer.new_request()
        request.params['term'] = 'foo'
        with self.layer.authenticated('max'):
            res = contents.filtered_children
        self.assertEqual(len(res), 0)

    def test_listing(self):
        model = self.create_dummy_model()
        request = self.layer.new_request()

        with self.layer.authenticated('max'):
            res = listing(model, request)
        self.assertTrue(res.text.startswith('<!DOCTYPE html>'))

    def test_move_actions(self):
        @plumbing(Order)
        class OrderableNode(BaseNode):
            pass

        node = OrderableNode()
        node.properties.action_move = True
        node['a'] = BaseNode()
        node['b'] = BaseNode()
        node['c'] = BaseNode()

        with self.layer.authenticated('manager'):
            rendered = render_tile(node, self.layer.new_request(), 'contents')

        self.assertEqual(rendered.count('toolbaraction-move-up'), 2)
        self.assertEqual(rendered.count('toolbaraction-move-down'), 2)

from cone.app import testing
from cone.app.browser.actions import ViewLink
from cone.app.browser.table import RowData
from cone.app.browser.table import Table
from cone.app.browser.table import TableBatch
from cone.app.browser.table import TableSlice
from cone.app.model import BaseNode
from cone.tile import render_tile
from cone.tile import tile
from cone.tile.tests import TileTestCase
from datetime import datetime
from pyramid.httpexceptions import HTTPForbidden


class DummyTable(Table):
    default_slicesize = 10

    @property
    def item_count(self):
        # ``item_count`` is used to calculate the slice
        return 21

    def sorted_rows(self, start, end, sort, order):
        # ``sorted_rows`` is responsible to generate the table rows data. It
        # gets passed ``start``, ``end``, ``sort`` and ``order`` and must
        # return a list of ``RowData`` instances
        rows = []
        for i in range(self.item_count):
            row_data = RowData()
            row_data['col_1'] = 'Col 1 Value'
            row_data['col_2'] = 'Col 2 Value'
            rows.append(row_data)
        return rows[start:end]


class TestBrowserTable(TileTestCase):
    layer = testing.security

    def test_Table(self):
        table = Table('cone.app:browser/templates/table.pt', None, 'table')
        err = self.expectError(
            NotImplementedError,
            lambda: table.item_count
        )
        expected = 'Abstract table does not implement ``item_count``.'
        self.assertEqual(str(err), expected)

        err = self.expectError(
            NotImplementedError,
            table.sorted_rows,
            None,
            None,
            None,
            None
        )
        expected = 'Abstract table does not implement ``sorted_rows``.'
        self.assertEqual(str(err), expected)

    def test_TableBatch(self):
        model = BaseNode()
        request = self.layer.new_request()

        table = DummyTable(
            'cone.app:browser/templates/table.pt',
            None,
            'table'
        )
        table.request = request
        batch = TableBatch(table)
        batch.model = model
        batch.request = request

        self.assertEqual(batch.vocab, [{
            'current': True,
            'visible': True,
            'url': 'http://example.com/?b_page=0&size=10',
            'page': '1'
        }, {
            'current': False,
            'visible': True,
            'url': 'http://example.com/?b_page=1&size=10',
            'page': '2'
        }, {
            'current': False,
            'visible': True,
            'url': 'http://example.com/?b_page=2&size=10',
            'page': '3'
        }])

    def test_TableSlice(self):
        model = BaseNode()
        request = self.layer.new_request()

        table = DummyTable(
            'cone.app:browser/templates/table.pt',
            None,
            'table'
        )
        table.request = request
        slice = TableSlice(table, model, request)

        self.assertEqual(slice.slice, (0, 10))
        self.assertEqual(slice.rows[0]['col_1'], 'Col 1 Value')
        self.assertEqual(slice.rows[0]['col_2'], 'Col 2 Value')

    def test_col_defs(self):
        model = BaseNode()
        request = self.layer.new_request()

        table = DummyTable(
            'cone.app:browser/templates/table.pt',
            None,
            'table'
        )

        # In order to get row_data rendered inside table, column definitions
        # must be defined
        self.assertEqual(table.col_defs, [])

        res = table(model, request)
        self.assertFalse(res.find('Col 1 Value') > -1)
        self.assertFalse(res.find('Col 2 Value') > -1)

        table.col_defs = [{
            'id': 'col_1',
            'title': 'Col 1',
            'sort_key': 'col_1',
            'sort_title': 'Sort by col 1',
            'content': 'string'
        }, {
            'id': 'col_2',
            'title': 'Col 2',
            'sort_key': 'col_2',
            'sort_title': 'Sort by col 2',
            'content': 'string'
        }]

        res = table(model, request)
        self.assertTrue(res.find('Col 1 Value') > -1)
        self.assertTrue(res.find('Col 2 Value') > -1)

    def test_table_tile(self):
        with self.layer.hook_tile_reg():
            @tile(name='mytabletile',
                  path='cone.app:browser/templates/table.pt',
                  permission='view')
            class MyTable(Table):
                table_id = 'mytable'
                table_css = 'mytable'
                table_tile_name = 'mytabletile'
                col_defs = [{
                    'id': 'col_1',
                    'title': 'Col 1',
                    'sort_key': None,
                    'sort_title': None,
                    'content': 'structure'
                }, {
                    'id': 'col_2',
                    'title': 'Col 2',
                    'sort_key': 'col_2',
                    'sort_title': 'Sort by col 2',
                    'content': 'string'
                }, {
                    'id': 'col_3',
                    'title': 'Col 3',
                    'sort_key': 'col_3',
                    'sort_title': 'Sort by col 3',
                    'content': 'datetime'
                }]
                default_sort = 'col_2'
                default_order = 'desc'
                default_slicesize = 10
                query_whitelist = ['foo']  # additional query params to consider

                @property
                def item_count(self):
                    return 20

                def sorted_rows(self, start, end, sort, order):
                    rows = []
                    for i in range(self.item_count):
                        row_data = RowData()
                        # structure
                        row_data['col_1'] = ViewLink()(self.model, self.request)
                        # string
                        row_data['col_2'] = 'Col 2 -> %i' % i
                        # datetime value
                        row_data['col_3'] = datetime(2011, 4, 1)
                        # append row data
                        rows.append(row_data)
                    # sorting goes here (i.e.)
                    return rows[start:end]

        model = BaseNode()
        model.properties.action_view = True
        model.metadata.title = 'Foo'
        request = self.layer.new_request()

        # Rendering fails unauthorized, 'view' permission is required
        err = self.expectError(
            HTTPForbidden,
            render_tile,
            model,
            request,
            'mytabletile'
        )
        self.checkOutput("""
        Unauthorized: tile <...MyTable object at ...> failed permission check
        """, str(err))

        # Render authenticated
        request.params['foo'] = 'bar'
        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'mytabletile')
        expected = '<div id="mytable"'
        self.assertTrue(rendered.find(expected) > -1)

        expected = 'panel-default mytable"'
        self.assertTrue(rendered.find(expected) > -1)

        # Sort header with query white list param
        expected = (
            'ajax:target="http://example.com/'
            '?b_page=1&amp;foo=bar&amp;order=desc&amp;size=10&amp;sort=col_2"'
        )

        self.assertTrue(rendered.find(expected) > -1)

        # Structure content
        self.checkOutput("""
        ...<a
        id="toolbaraction-view"
        href="http://example.com/"
        ajax:bind="click"
        ajax:target="http://example.com/"
        ajax:action="content:#content:inner"
        ajax:path="href"
        >&nbsp;Foo</a>...
        """, rendered)

        # String
        expected = 'Col 2 -&gt; 1'
        self.assertTrue(rendered.find(expected) > -1)

        # Datetime
        expected = '01.04.2011 00:00'
        self.assertTrue(rendered.find(expected) > -1)

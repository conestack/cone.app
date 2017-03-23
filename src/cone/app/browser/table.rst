Table
=====

Abstract table tile. Provides rendering of sortable, batched tables.

A subclass of this tile must be registered under the same name as defined
at ``self.table_tile_name``, normally bound to template
``cone.app:browser/templates/table.pt``

Imports and dummy context::

    >>> from cone.app.model import BaseNode

    >>> model = BaseNode()
    >>> request = layer.new_request()

    >>> from cone.app.browser.table import RowData
    >>> from cone.app.browser.table import Table
    >>> from cone.app.browser.table import TableSlice
    >>> from cone.app.browser.table import TableBatch

``item_count`` and ``sorted_rows`` are not implemented::

    >>> table = Table('cone.app:browser/templates/table.pt', None, 'table')
    >>> table.item_count
    Traceback (most recent call last):
      ...
    NotImplementedError: Abstract table does not implement ``item_count``.

    >>> table.sorted_rows(None, None, None, None)
    Traceback (most recent call last):
      ...
    NotImplementedError: Abstract table does not implement ``sorted_rows``.

``item_count`` is used to calculate the slice::

    >>> class MyTable(Table):
    ...     default_slicesize = 10
    ... 
    ...     @property
    ...     def item_count(self):
    ...         return 21

    >>> table = MyTable('cone.app:browser/templates/table.pt', None, 'table')
    >>> table.request = request
    >>> table.item_count
    21

    >>> batch = TableBatch(table)
    >>> batch.model = model
    >>> batch.request = request
    >>> batch.vocab
    [{'current': True, 'visible': True, 
    'url': 'http://example.com/?b_page=0&size=10', 'page': '1'}, 
    {'current': False, 'visible': True, 
    'url': 'http://example.com/?b_page=1&size=10', 'page': '2'}, 
    {'current': False, 'visible': True, 
    'url': 'http://example.com/?b_page=2&size=10', 'page': '3'}]

``sorted_rows`` is responsible to generate the table rows data. It gets passed
``start``, ``end``, ``sort`` and ``order`` and must return a list of
``RowData`` instances::

    >>> class MyTable(Table):
    ...     default_slicesize = 10
    ... 
    ...     @property
    ...     def item_count(self):
    ...         return 20
    ... 
    ...     def sorted_rows(self, start, end, sort, order):
    ...         rows = []
    ...         for i in range(self.item_count):
    ...             row_data = RowData()
    ...             row_data['col_1'] = 'Col 1 Value'
    ...             row_data['col_2'] = 'Col 2 Value'
    ...             rows.append(row_data)
    ...         return rows[start:end]

    >>> table = MyTable('cone.app:browser/templates/table.pt', None, 'table')
    >>> table.request = request
    >>> slice = TableSlice(table, model, request)
    >>> slice.slice
    (0, 10)

    >>> slice.rows[0]['col_1']
    'Col 1 Value'

    >>> slice.rows[0]['col_2']
    'Col 2 Value'

In order to get row_data rendered inside table, column definitions must be
defined::

    >>> table.col_defs
    []

    >>> res = table(model, request)
    >>> res.find('Col 1 Value') > -1
    False

    >>> res.find('Col 2 Value') > -1
    False

    >>> table.col_defs = [
    ...     {
    ...         'id': 'col_1',
    ...         'title': 'Col 1',
    ...         'sort_key': 'col_1',
    ...         'sort_title': 'Sort by col 1',
    ...         'content': 'string',
    ...     },
    ...     {
    ...         'id': 'col_2',
    ...         'title': 'Col 2',
    ...         'sort_key': 'col_2',
    ...         'sort_title': 'Sort by col 2',
    ...         'content': 'string',
    ...     },
    ... ]

    >>> res = table(model, request)
    >>> res.find('Col 1 Value') > -1
    True

    >>> res.find('Col 2 Value') > -1
    True

A column definition consists of:

``id``
    Column id. Maps to row data

``title``
    Title of this column

``sort_key``
    Sort Key for this column. If None, sorting is disabled for this column.

``sort_title``
    Sort title for this column. Gets rendered to sort link title attribute if
    sorting is enabled.

``content``
    Column content definition. possible values are 'string', 'datetime' and
    'actions'.

    If 'string', value is rendered as is to column.

    If 'datetime' value is expected as ``datetime.datetime`` value and
    gets formatted.

    If 'structure' value is rendered as markup.

A complete example::

    >>> from cone.tile import tile
    >>> from datetime import datetime
    >>> from cone.app.browser.actions import ViewLink
    >>> view_link = ViewLink()

    >>> @tile('mytabletile', 'cone.app:browser/templates/table.pt',
    ...       permission='view')
    ... class MyTable(Table):
    ... 
    ...     table_id = 'mytable'
    ...     table_tile_name = 'mytabletile'
    ...     col_defs = [
    ...         {
    ...             'id': 'col_1',
    ...             'title': 'Col 1',
    ...             'sort_key': None,
    ...             'sort_title': None,
    ...             'content': 'structure',
    ...         },
    ...         {
    ...             'id': 'col_2',
    ...             'title': 'Col 2',
    ...             'sort_key': 'col_2',
    ...             'sort_title': 'Sort by col 2',
    ...             'content': 'string',
    ...         },
    ...         {
    ...             'id': 'col_3',
    ...             'title': 'Col 3',
    ...             'sort_key': 'col_3',
    ...             'sort_title': 'Sort by col 3',
    ...             'content': 'datetime',
    ...         },
    ...     ]
    ...     default_sort = 'col_2'
    ...     default_order = 'desc'
    ...     default_slicesize = 10
    ...     query_whitelist = ['foo'] # additional query params to consider
    ... 
    ...     @property
    ...     def item_count(self):
    ...         return 20
    ... 
    ...     def sorted_rows(self, start, end, sort, order):
    ...         rows = []
    ...         for i in range(self.item_count):
    ...             row_data = RowData()
    ... 
    ...             # structure
    ...             row_data['col_1'] = view_link(self.model, self.request)
    ... 
    ...             # string
    ...             row_data['col_2'] = 'Col 2 -> %i' % i
    ... 
    ...             # datetime value
    ...             row_data['col_3'] = datetime(2011, 4, 1)
    ... 
    ...             # append row data
    ...             rows.append(row_data)
    ... 
    ...         # sorting goes here (i.e.)
    ... 
    ...         return rows[start:end]

Rendering fails unauthorized, 'view' permission is required::

    >>> from cone.tile import render_tile
    >>> render_tile(model, request, 'mytabletile')
    Traceback (most recent call last):
      ...
    HTTPForbidden: Unauthorized: tile <MyTable object at ...> 
    failed permission check

Render authenticated::

    >>> layer.login('max')
    >>> model.properties.action_view = True
    >>> model.metadata.title = 'Foo'
    >>> request = layer.new_request()
    >>> request.params['foo'] = 'bar'
    >>> rendered = render_tile(model, request, 'mytabletile')

Sort header with query white list param::

    >>> rendered
    u'...<div id="mytable"\n
    ...
    ajax:target="http://example.com/?sort=col_2&amp;b_page=1&amp;foo=bar&amp;order=desc&amp;size=10"...

Structure content::

    >>> rendered
    u'...<div id="mytable"...
    <a\n     
    id="toolbaraction-view"\n     
    href="http://example.com/"\n     
    ajax:bind="click"\n     
    ajax:target="http://example.com/"\n     
    ajax:action="content:#content:inner"\n    
    ajax:path="href"\n    
    >&nbsp;Foo</a>...'

String::

    >>> rendered
    u'...<div id="mytable"\n
      ...
    Col 2 -&gt; 1...

Datetime::

    >>> expected = '01.04.2011 00:00'
    >>> rendered.find(expected) != -1
    True

    >>> layer.logout()

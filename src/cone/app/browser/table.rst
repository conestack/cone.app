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
    
    >>> from cone.app.browser.table import (
    ...     RowData,
    ...     Item,
    ...     Action,
    ...     Table,
    ...     TableSlice,
    ...     TableBatch,
    ... )

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
    ...     @property
    ...     def item_count(self):
    ...         return 21
    
    >>> table = MyTable('cone.app:browser/templates/table.pt', None, 'table')
    >>> table.item_count
    21
    
    >>> batch = TableBatch(table)
    >>> batch.model = model
    >>> batch.request = request
    >>> batch.vocab
    [{'current': True, 'visible': True, 
    'url': 'http://example.com/?sort=&b_page=0', 'page': '1'}, 
    {'current': False, 'visible': True, 
    'url': 'http://example.com/?sort=&b_page=1', 'page': '2'}, 
    {'current': False, 'visible': True, 
    'url': 'http://example.com/?sort=&b_page=2', 'page': '3'}]

``sorted_rows`` is responsible to generate the table rows data. It gets passed
``start``, ``end``, ``sort`` and ``order`` and must return a list of
``RowData`` instances::

    >>> class MyTable(Table):
    ...     @property
    ...     def item_count(self):
    ...         return 20
    ... 
    ...     def sorted_rows(self, start, end, sort, order):
    ...         rows = []
    ...         for i in range(self.item_count):
    ...             row_data = RowData()
    ...             row_data['col_1'] = Item('Col 1 Value')
    ...             row_data['col_2'] = Item('Col 2 Value')
    ...             rows.append(row_data)
    ...         return rows[start:end]

    >>> table = MyTable('cone.app:browser/templates/table.pt', None, 'table')
    >>> slice = TableSlice(table, model, request)
    >>> slice.slice
    (0, 10)
    
    >>> slice.rows[0]['col_1'].value
    'Col 1 Value'
    
    >>> slice.rows[0]['col_2'].value
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
    ...         'link': False,
    ...     },
    ...     {
    ...         'id': 'col_2',
    ...         'title': 'Col 2',
    ...         'sort_key': 'col_2',
    ...         'sort_title': 'Sort by col 2',
    ...         'content': 'string',
    ...         'link': False,
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
    
    If 'string', ``Item.value`` is rendered as is to column.
    
    If 'datetime' ``Item.value`` is expected as ``datetime.datetime`` value and
    gets formatted.
    
    If 'actions' ``Item.actions`` is rendered and all other attributes of
    Item are ignored.

``link``
    Flag whether to render ``Item.value`` as hyperlink. Ignored if column
    content is 'actions'.
    
    If 'True', ``Item.link``, ``Item.target``, ``Item.action`` and
    ``Item.event`` are considered.

A complete example::

    >>> from cone.tile import tile
    >>> from datetime import datetime
    
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
    ...             'content': 'actions',
    ...             'link': False,
    ...         },
    ...         {
    ...             'id': 'col_2',
    ...             'title': 'Col 2',
    ...             'sort_key': 'col_2',
    ...             'sort_title': 'Sort by col 2',
    ...             'content': 'string',
    ...             'link': True,
    ...         },
    ...         {
    ...             'id': 'col_3',
    ...             'title': 'Col 3',
    ...             'sort_key': 'col_3',
    ...             'sort_title': 'Sort by col 3',
    ...             'content': 'datetime',
    ...             'link': False,
    ...         },
    ...     ]
    ...     default_sort = 'col_2'
    ...     default_order = 'desc'
    ...     slicesize = 10
    ...     
    ...     @property
    ...     def item_count(self):
    ...         return 20
    ...     
    ...     def sorted_rows(self, start, end, sort, order):
    ...         rows = []
    ...         for i in range(self.item_count):
    ...             row_data = RowData()
    ...             actions = []
    ...             
    ...             # common action definition
    ...             title = 'Action title'
    ...             link = 'http://example.com'     # action href
    ...             target = 'http://example.com'   # action ajax:target
    ...             action = 'action:selector:mode' # action ajax:action
    ...             event = 'event:selector'        # action ajax:event
    ...             css = 'myaction'                # action css class
    ...             action = Action(title, link, target, action, event, css)
    ...             actions.append(action)
    ...             
    ...             # if custom action, pass ``rendered`` as kwarg, all other
    ...             # action arguments are ignored then and contents of
    ...             # rendered is used
    ...             action = Action(rendered='<strong>CustomAction</strong>')
    ...             actions.append(action)
    ...             
    ...             # add item with actions for column 1
    ...             row_data['col_1'] = Item(actions=actions)
    ...             
    ...             # add item with link definitions for column 2
    ...             value = 'Col 2 -> %i' % i         # item value
    ...             link = 'http://example.org'       # item href
    ...             target = 'http://example.org'     # item ajax:target
    ...             action = 'action2:selector2:mode' # item ajax:action
    ...             event = 'event2:selector2'        # item ajax:event
    ...             row_data['col_2'] = Item(value, link, target, action, event)
    ...             
    ...             # add item with datetime value for column 3, no link
    ...             # definitions required since column definition says so
    ...             row_data['col_3'] = Item(datetime(2011, 4, 1))
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
    >>> rendered = render_tile(model, layer.current_request, 'mytabletile')
    
Part of custom action::
    
    >>> expected = '<strong>CustomAction</strong>'
    >>> rendered.find(expected) != -1
    True

Part of action::

    >>> expected = 'class="myaction"'
    >>> rendered.find(expected) != -1
    True
    
    >>> expected = 'title="Action title"'
    >>> rendered.find(expected) != -1
    True
    
    >>> expected = 'ajax:target="http://example.com"'
    >>> rendered.find(expected) != -1
    True
    
    >>> expected = 'ajax:action="action:selector:mode">&nbsp;</a>'
    >>> rendered.find(expected) != -1
    True

Part of link::

    >>> expected = 'href="http://example.org"'
    >>> rendered.find(expected) != -1
    True
    
    >>> expected = 'ajax:action="action2:selector2:mode">Col 2 -&gt; 8</a>'
    >>> rendered.find(expected) != -1
    True
    
    >>> expected = 'ajax:target="http://example.org"'
    >>> rendered.find(expected) != -1
    True
    
    >>> expected = 'ajax:event="event2:selector2"'
    >>> rendered.find(expected) != -1
    True

Part of datetime::

    >>> expected = '01.04.2011 00:00'
    >>> rendered.find(expected) != -1
    True
    
    >>> layer.logout()

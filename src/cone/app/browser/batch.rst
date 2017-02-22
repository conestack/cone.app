Batching
========

Batch
-----

Abstract batch tile. A deriving class must implement the ``vocab``
property, which promises to return a list of dict like objects, providing the
following keys:

- ``page`` - the displayed page name, normally a number, or a character.

- ``current`` - Flag wether page is current page or not.

- ``visible`` - Flag wether page is visible or not.

- ``url`` - Target url.

Required imports.::

    >>> from cone.tile import tile, render_tile
    >>> from cone.app.browser.batch import Batch
    >>> from cone.app.browser.utils import nodepath
    >>> from cone.app.browser.utils import make_query
    >>> from cone.app.browser.utils import make_url

Instanciate directly, base tests::

    >>> batch = Batch(None, 'render', 'batch')

The dummy page::

    >>> batch.dummypage
    {'current': False, 'visible': False, 'url': '', 'page': ''}

Ellipsis to display if ``batchrange`` exceeds::

    >>> batch.ellipsis
    u'...'

By default empty ``vocab``, subclass must override::

    >>> batch.vocab
    []

Batches are displayed by default::

    >>> batch.display
    True

Default ``batchrange`` is 30 items. Defines how many pages are displayed::

    >>> batch.batchrange
    8

Test ``currentpage`` returns None if no currentpage::

    >>> batch.currentpage

Test ``firstpage`` returns None if empty vocab::

    >>> batch.firstpage

Test ``lastpage`` returns None if empty vocab::

    >>> batch.lastpage

Test ``prevpage`` returns None if empty vocab::

    >>> batch.prevpage

Test ``nextpage`` returns None if empty vocab::

    >>> batch.nextpage

No left or right ellipsis sind no batchrange exceeding::

    >>> batch.leftellipsis
    u''

    >>> batch.rightellipsis
    u''

No ``pages`` returned for empty vocab::

    >>> batch.pages
    []

Dummy Batch implementation::

    >>> class DummyBatch(Batch):
    ... 
    ...     _vocab = []
    ...     _batchrange = 5
    ... 
    ...     @property
    ...     def vocab(self):
    ...         return self._vocab
    ... 
    ...     @property
    ...     def batchrange(self):
    ...         return self._batchrange

Test with all pages invisible::

    >>> batch = DummyBatch(None, 'render', 'batch')
    >>> for i in range(3):
    ...     batch._vocab.append({
    ...         'current': False,
    ...         'visible': False,
    ...         'url': 'http://example.com/',
    ...         'page': str(i),
    ...     })

If no visible page, ``firstpage`` returns first page from vocab::

    >>> batch.firstpage
    {'current': False, 
    'visible': False, 
    'url': 'http://example.com/', 
    'page': '0'}

If no visible page, ``lastpage`` returns last page from vocab::

    >>> batch.lastpage
    {'current': False, 
    'visible': False, 
    'url': 'http://example.com/', 
    'page': '2'}

No visible pages in vocab return ``dummypage`` on prevpage and nextpage:: 

    >>> batch.prevpage
    {'current': False, 'visible': False, 'url': '', 'page': ''}

    >>> batch.nextpage
    {'current': False, 'visible': False, 'url': '', 'page': ''}

Test with visible pages::

    >>> batch._vocab = list()
    >>> for i in range(5):
    ...     batch._vocab.append({
    ...         'current': False,
    ...         'visible': True,
    ...         'url': 'http://example.com/',
    ...         'page': str(i),
    ...     })
    >>> batch._vocab[1]['visible'] = False
    >>> batch._vocab[3]['visible'] = False

Set first page current::

    >>> batch._vocab[0]['current'] = True

First vocab item is visible, ``firstpage`` returns it::

    >>> batch.firstpage
    {'current': True, 
    'visible': True, 
    'url': 'http://example.com/', 
    'page': '0'}

Last vocab item is visible, ``lastpage`` returns it::

    >>> batch.lastpage
    {'current': False, 
    'visible': True, 
    'url': 'http://example.com/', 
    'page': '4'}

First item is selected, ``prevpage`` returns dummy page::

    >>> batch.prevpage
    {'current': False, 
    'visible': False, 
    'url': '', 
    'page': ''}

``nextpage`` returns next visible page, vocab[1] is skipped::

    >>> batch.nextpage
    {'current': False, 
    'visible': True, 
    'url': 'http://example.com/', 
    'page': '2'}

Set last page current::

    >>> batch._vocab[0]['current'] = False
    >>> batch._vocab[-1]['current'] = True

``prevpage`` returns next visible page, vocab[3] is skipped::

    >>> batch.prevpage
    {'current': False, 
    'visible': True, 
    'url': 'http://example.com/', 
    'page': '2'}

Last item is selected, ``nextpage`` returns dummy page::

    >>> batch.nextpage
    {'current': False, 
    'visible': False, 
    'url': '', 
    'page': ''}

Set third page current::

    >>> batch._vocab[-1]['current'] = False
    >>> batch._vocab[2]['current'] = True

``prevpage`` returns next visible page, vocab[1] is skipped::

    >>> batch.prevpage
    {'current': False, 
    'visible': True, 
    'url': 'http://example.com/', 
    'page': '0'}

``nextpage`` returns next visible page, vocab[3] is skipped::

    >>> batch.nextpage
    {'current': False, 
    'visible': True, 
    'url': 'http://example.com/', 
    'page': '4'}

Inverse visible flags::

    >>> batch._vocab[0]['visible'] = False
    >>> batch._vocab[1]['visible'] = True
    >>> batch._vocab[2]['visible'] = False
    >>> batch._vocab[3]['visible'] = True
    >>> batch._vocab[4]['visible'] = False

Set second item selected::

    >>> batch._vocab[2]['current'] = False
    >>> batch._vocab[1]['current'] = True

``firstpage`` returns first visible page::

    >>> batch.firstpage
    {'current': True, 
    'visible': True, 
    'url': 'http://example.com/', 
    'page': '1'}

``lastpage`` returns last visible page::

    >>> batch.lastpage
    {'current': False, 
    'visible': True, 
    'url': 'http://example.com/', 
    'page': '3'}

Selected page is first visible page, ``prevpage`` returns dummypage::

    >>> batch.prevpage
    {'current': False, 
    'visible': False, 
    'url': '', 
    'page': ''}

Next visible page::

    >>> batch.nextpage
    {'current': False, 
    'visible': True, 
    'url': 'http://example.com/', 
    'page': '3'}

Set fourth item selected::

    >>> batch._vocab[1]['current'] = False
    >>> batch._vocab[3]['current'] = True

Previous visible page::

    >>> batch.prevpage
    {'current': False, 
    'visible': True, 
    'url': 'http://example.com/', 
    'page': '1'}

Selected page is last visible page, ``nextpage`` returns dummypage::

    >>> batch.nextpage
    {'current': False, 
    'visible': False, 
    'url': '', 
    'page': ''}

set ``batchrange`` smaller than vocab size::

    >>> batch._batchrange = 3
    >>> len(batch.pages)
    3

Batchrange ends::

    >>> batch.pages[0]
    {'current': False, 
    'visible': False, 
    'url': 'http://example.com/', 
    'page': '2'}

    >>> batch.pages[-1]
    {'current': False, 
    'visible': False, 
    'url': 'http://example.com/', 
    'page': '4'}

    >>> batch.leftellipsis
    u'...'

    >>> batch.rightellipsis
    u''

Batchrange starts::

    >>> batch._vocab[1]['current'] = True
    >>> batch._vocab[3]['current'] = False

    >>> batch.pages[0]
    {'current': False, 
    'visible': False, 
    'url': 'http://example.com/', 
    'page': '0'}

    >>> batch.pages[-1]
    {'current': False, 
    'visible': False, 
    'url': 'http://example.com/', 
    'page': '2'}

    >>> batch.leftellipsis
    u''

    >>> batch.rightellipsis
    u'...'

Batchrange between start and end::

    >>> batch._vocab[0]['visible'] = True
    >>> batch._vocab[2]['visible'] = True
    >>> batch._vocab[4]['visible'] = True

    >>> batch._vocab[1]['current'] = False
    >>> batch._vocab[2]['current'] = True

    >>> batch.pages[0]
    {'current': False, 
    'visible': True, 
    'url': 'http://example.com/', 
    'page': '1'}

    >>> batch.pages[-1]
    {'current': False, 
    'visible': True, 
    'url': 'http://example.com/', 
    'page': '3'}

    >>> batch.leftellipsis
    u'...'

    >>> batch.rightellipsis
    u'...'

Register batch tile::

    >>> @tile('testbatch')
    ... class TestBatch(Batch):
    ... 
    ...     @property
    ...     def vocab(self):
    ...         ret = list()
    ...         path = nodepath(self.model)
    ...         current = self.request.params.get('b_page', '0')
    ...         for i in range(10):
    ...             query = make_query(b_page=str(i))
    ...             url = make_url(self.request, path=path, query=query)
    ...             ret.append({
    ...                 'page': '%i' % i,
    ...                 'current': current == str(i),
    ...                 'visible': True,
    ...                 'url': url,
    ...             })
    ...         return ret

Create dummy model::

    >>> from cone.app.model import BaseNode
    >>> model = BaseNode()

Authenticate::

    >>> layer.login('max')
    >>> request = layer.new_request()

Render batch::
    
    >>> res = render_tile(model, request, 'testbatch')
    >>> res.find('href="http://example.com/?b_page=1"') > -1
    True

    >>> res.find('href="http://example.com/?b_page=2"') > -1
    True

Logout::

    >>> layer.logout()


BatchedItems
------------

``BatchedItems`` tile can be used to create views displaying a batched listing
of items. It renders a header with a search field and a slice size selection,
followed by the slice and a footer with a summary about the current slice
and pagination.

Imports::

    >>> from cone.app.browser.batch import BatchedItems
    >>> from cone.app.browser.batch import BatchedItemsFooter
    >>> from cone.app.browser.batch import BatchedItemsHeader
    >>> from cone.app.browser.batch import BatchedItemsPagination
    >>> from cone.app.browser.batch import BatchedItemsSlice

``BatchedItemsSlice`` is used as base to compute the actual items to display
and render the items between header and footer.::

    >>> batched_items = BatchedItems()
    >>> batched_items.model = BaseNode()
    >>> batched_items.request = layer.new_request()

    >>> slice = BatchedItemsSlice(parent=batched_items)
    >>> slice.item_count
    Traceback (most recent call last):
      ...
    NotImplementedError: Abstract ``BatchedItemsSlice`` does not implement 
    ``item_count``

    >>> slice.items
    Traceback (most recent call last):
      ...
    NotImplementedError: Abstract ``BatchedItemsSlice`` does not implement 
    ``items``

Create concrete ``BatchedItemsSlice`` implementation. ``item_count`` returns
the overall items, ``items`` returns the current slice to display and
``filtered_items`` is used to compute the overall items based on given
search term. This function is no part of the contract, but be aware that
search term needs to be considered, no matter how actual items are computed.

``BatchedItemsSlice`` is also responsible to render the slice, thus either
a ``render`` function or a template ``path`` must be provided::

    >>> class MyBatchedItemsSlice(BatchedItemsSlice):
    ... 
    ...     @property
    ...     def item_count(self):
    ...         return len(self.filtered_items)
    ... 
    ...     @property
    ...     def items(self):
    ...         start, end = self.slice
    ...         return self.filtered_items[start:end]
    ... 
    ...     @property
    ...     def filtered_items(self):
    ...         items = list()
    ...         term = self.parent.filter_term
    ...         term = term.lower() if term else term
    ...         for node in self.model.values():
    ...             if term and node.name.find(term) == -1:
    ...                 continue
    ...             items.append(node)
    ...         return items
    ... 
    ...     def render(self):
    ...         return u'<div id="{}">\n{}\n</div>'.format(
    ...             self.slice_id,
    ...             u'\n'.join([
    ...                 u'  <div>{}</div>'.format(it.name) for it in self.items
    ...             ])
    ...         )

Create a model::

    >>> model = BaseNode(name='container')
    >>> for i in range(35):
    ...     model['child_{}'.format(i)] = BaseNode()

Test custom slice::

    >>> batched_items = BatchedItems()
    >>> batched_items.model = model
    >>> batched_items.request = layer.new_request()

    >>> slice = MyBatchedItemsSlice(parent=batched_items)

Default slice size::

    >>> slice.default_slice_size
    15

Slice ID. Rendering the slice shall set the slice ID on it's root element,
it gets referenced by search field and slice size selection in header as
``aria-controls`` attribute::

    >>> slice.slice_id
    'batched_items_slice'

Current slice to display as tuple:: 

    >>> slice.slice
    (0, 15)

Overall item count::

    >>> slice.item_count
    35

Current slice items::

    >>> slice.items
    [<BaseNode object 'child_0' at ...>, 
    ...
    <BaseNode object 'child_14' at ...>]

Chage current page and check again::

    >>> slice.parent.request = slice.request = layer.new_request()
    >>> slice.request.params['b_page'] = '1'
    >>> slice.slice
    (15, 30)

    >>> slice.items
    [<BaseNode object 'child_15' at ...>, 
    ...
    <BaseNode object 'child_29' at ...>]

Change the slice size::

    >>> slice.parent.request = slice.request = layer.new_request()
    >>> slice.request.params['size'] = '10'
    >>> slice.size
    10

    >>> slice.slice
    (0, 10)

    >>> slice.items
    [<BaseNode object 'child_0' at ...>, 
    ...
    <BaseNode object 'child_9' at ...>]

Change the filter term::

    >>> slice.parent.request = slice.request = layer.new_request()
    >>> slice.request.params['term'] = '1'
    >>> slice.request.params['size'] = '5'
    >>> slice.parent.filter_term
    u'1'

    >>> slice.filtered_items
    [<BaseNode object 'child_1' at ...>, 
    <BaseNode object 'child_10' at ...>, 
    <BaseNode object 'child_11' at ...>, 
    <BaseNode object 'child_12' at ...>, 
    <BaseNode object 'child_13' at ...>, 
    <BaseNode object 'child_14' at ...>, 
    <BaseNode object 'child_15' at ...>, 
    <BaseNode object 'child_16' at ...>, 
    <BaseNode object 'child_17' at ...>, 
    <BaseNode object 'child_18' at ...>, 
    <BaseNode object 'child_19' at ...>, 
    <BaseNode object 'child_21' at ...>, 
    <BaseNode object 'child_31' at ...>]

    >>> slice.slice
    (0, 5)

    >>> slice.items
    [<BaseNode object 'child_1' at ...>, 
    <BaseNode object 'child_10' at ...>, 
    <BaseNode object 'child_11' at ...>, 
    <BaseNode object 'child_12' at ...>, 
    <BaseNode object 'child_13' at ...>]

    >>> slice.request.params['b_page'] = '1'
    >>> slice.slice
    (5, 10)

    >>> slice.items
    [<BaseNode object 'child_14' at ...>, 
    <BaseNode object 'child_15' at ...>, 
    <BaseNode object 'child_16' at ...>, 
    <BaseNode object 'child_17' at ...>, 
    <BaseNode object 'child_18' at ...>]

Render the slice tile::

    >>> request = slice.parent.request = slice.request = layer.new_request()
    >>> print slice(model, request)
    <div id="batched_items_slice">
      <div>child_0</div>
      <div>child_1</div>
      <div>child_2</div>
      <div>child_3</div>
      <div>child_4</div>
      <div>child_5</div>
      <div>child_6</div>
      <div>child_7</div>
      <div>child_8</div>
      <div>child_9</div>
      <div>child_10</div>
      <div>child_11</div>
      <div>child_12</div>
      <div>child_13</div>
      <div>child_14</div>
    </div>

In order to use the slice implementation, a ``BatchedItems`` implementation
need to provide it like so::

    >>> from cone.app.browser.utils import request_property

    >>> class MyBatchedItems(BatchedItems):
    ... 
    ...     @request_property
    ...     def slice(self):
    ...          return MyBatchedItemsSlice(parent=self)

    >>> batched_items = MyBatchedItems()
    >>> batched_items.model = model
    >>> batched_items.request = layer.new_request()

Default template::

    >>> batched_items.path
    'cone.app.browser:templates/batched_items.pt'

The current search filter is provided on ``filter_term`` helper property::

    >>> batched_items.request.params['term'] = 'Search term'
    >>> batched_items.filter_term
    u'Search term'

    >>> batched_items.request = layer.new_request()

The helper function ``make_url`` considers ``query_whitelist`` and shall be
used for URL creation within batched items implementations and related tiles::

    >>> batched_items.query_whitelist = ['a', 'b']
    >>> batched_items.request.params['a'] = 'a'
    >>> batched_items.make_url(dict(c='c'))
    'http://example.com/container?a=a&c=c&b='

    >>> batched_items.request = layer.new_request()

``slice`` and ``rendered_slice``::

    >>> batched_items.slice
    <MyBatchedItemsSlice object at ...>

    >>> print batched_items.rendered_slice
    <div id="batched_items_slice">
      <div>child_0</div>
      ...
      <div>child_14</div>
    </div>

Batched items header::

    >>> header = BatchedItemsHeader(parent=batched_items)
    >>> header.model = batched_items.model
    >>> header.request = batched_items.request

Batched items DOM element ID. Used for bdajax binding. Taken from batched
items implementation::

    >>> batched_items.items_id
    'batched_items'

    >>> header.items_id
    'batched_items'

Slize ID. Used to reference input elements to slice wrapper element. Taken from
slice implementation::

    >>> batched_items.slice.slice_id
    'batched_items_slice'

    >>> header.slice_id
    'batched_items_slice'

Current slice size. Taken from slize implementation::

    >>> batched_items.slice.size
    15

    >>> header.slice_size
    15

Available slice sizes for slice size selection. Calculated from
``default_slice_size`` on slice::

    >>> batched_items.slice.default_slice_size
    15

    >>> header.slice_sizes
    [15, 30, 45, 60]

    >>> header.parent.slice.default_slice_size = 10
    >>> header.slice_sizes
    [10, 20, 30, 40]

``slice_target`` is used to create the target URL passed as ajax target when
triggering the event to rerender the batched items DOM element with a changed
slice size. ``query_whitelist`` from batched items and filter search term are
considered.::

    >>> header.parent.query_whitelist
    ['a', 'b']

    >>> batched_items.request = header.request = layer.new_request()
    >>> header.request.params['a'] = 'a'
    >>> header.request.params['b'] = 'b'
    >>> header.request.params['term'] = 'Hello'

    >>> header.filter_term
    u'Hello'

    >>> target = header.slice_target
    >>> target
    'http://example.com/container?a=a&term=Hello&b=b'

``filter_target`` is used to create the target URL passed as ajax target when
triggering the event to rerender the batched items DOM element with a changed
search term. ``query_whitelist`` from batched items and slice size are
considered.::

    >>> header.filter_target
    'http://example.com/container?a=a&b=b&size=15'

    >>> header.request.params['size'] = '30'
    >>> header.filter_target
    'http://example.com/container?a=a&b=b&size=30'

Default template path::

    >>> header.path
    'cone.app.browser:templates/batched_items_header.pt'

    >>> batched_items.rendered_header
    u'...<div class="panel-heading batched_items_header">...'

Customizing the header is done by overriding the ``rendered_header`` peoperty
on the batched items class. A lot of the settings can be customized by passing
the related settings as keyword arguments to constructor::

    >>> custom_header_kw = {}

    >>> class CustomizedHeaderBatchedItems(MyBatchedItems):
    ... 
    ...     @property
    ...     def rendered_header(self):
    ...         return BatchedItemsHeader(
    ...             parent=self,
    ...             **custom_header_kw
    ...         )(
    ...             model=self.model,
    ...             request=self.request
    ...         )

    >>> batched_items = CustomizedHeaderBatchedItems()
    >>> batched_items.model = model
    >>> batched_items.request = layer.new_request()

Header title. Taken from model.metadata by default::

    >>> header.title
    'container'

Title can be skipped by setting ``show_title`` to False.::

    >>> expected = '<span class="label label-primary">container</span>'
    >>> batched_items.rendered_header.find(expected) > -1
    True

    >>> custom_header_kw = {
    ...     'show_title': False
    ... }

    >>> batched_items.rendered_header.find(expected) > -1
    False

    >>> custom_header_kw = {}

Slice size can be skipped by setting ``show_slice_size`` to False.::

    >>> expected = '<select name="size"'
    >>> batched_items.rendered_header.find(expected) > -1
    True

    >>> custom_header_kw = {
    ...     'show_slice_size': False
    ... }

    >>> batched_items.rendered_header.find(expected) > -1
    False

    >>> custom_header_kw = {}

CSS class set on slice size selection wrapper::

    >>> expected = 'col-xs-4 col-sm3'
    >>> batched_items.rendered_header.find(expected) > -1
    True

    >>> custom_header_kw = {
    ...     'slice_size_css': 'col-xs-3 col-sm2'
    ... }

    >>> batched_items.rendered_header.find(expected) > -1
    False

    >>> custom_header_kw = {}

Flag whether to show search filter::

    >>> expected = '<input name="term"'
    >>> batched_items.rendered_header.find(expected) > -1
    True

    >>> custom_header_kw = {
    ...     'show_filter': False
    ... }

    >>> batched_items.rendered_header.find(expected) > -1
    False

    >>> custom_header_kw = {}

CSS class set on slice search filter::

    >>> expected = 'col-xs-3'
    >>> batched_items.rendered_header.find(expected) > -1
    True

    >>> custom_header_kw = {
    ...     'filter_css': 'col-xs-4'
    ... }

    >>> batched_items.rendered_header.find(expected) > -1
    False

    >>> custom_header_kw = {}

Additional markup displayed in header::

    >>> expected = '<div class="additional">Additional</div>'
    >>> batched_items.rendered_header.find(expected) > -1
    False

    >>> custom_header_kw = {
    ...     'head_additional': expected
    ... }

    >>> batched_items.rendered_header.find(expected) > -1
    True

    >>> custom_header_kw = {}

Batched items pagination::

    >>> batched_items = MyBatchedItems()
    >>> batched_items.model = BaseNode(name='container')
    >>> batched_items.request = layer.new_request()

    >>> pagination = BatchedItemsPagination(parent=batched_items)
    >>> pagination.model = batched_items.model
    >>> pagination.request = batched_items.request

Pagination batch name is created from batched items ``items_id``::

    >>> batched_items.items_id
    'batched_items'

    >>> pagination.name
    'batched_itemsbatch'

By default, search term and slice size request parameters are considered
additional to ``b_page`` when creating the pagination vocab.::

    >>> pagination.query_params
    {'term': None, 'size': 15}

Pagination batch only gets displayed if there are model children.::

    >>> batched_items.slice.item_count
    0

    >>> pagination.vocab
    []

    >>> pagination.display
    False

    >>> batched_items.model = batched_items.slice.model = \
    ...     pagination.model = model

    >>> vocab = pagination.vocab
    >>> len(vocab)
    3

    >>> sorted(vocab[0].items())
    [('current', True), 
    ('page', '1'), 
    ('url', 'http://example.com/container?b_page=0&size=15'), 
    ('visible', True)]

    >>> sorted(vocab[1].items())
    [('current', False), 
    ('page', '2'), 
    ('url', 'http://example.com/container?b_page=1&size=15'), 
    ('visible', True)]

    >>> sorted(vocab[2].items())
    [('current', False), 
    ('page', '3'), 
    ('url', 'http://example.com/container?b_page=2&size=15'), 
    ('visible', True)]

    >>> pagination.display
    True

Pagination object is provided by ``pagination`` property on batched items::

    >>> batched_items.pagination
    <cone.app.browser.batch.BatchedItemsPagination object at ...>

Batched items footer::

    >>> batched_items = MyBatchedItems()
    >>> batched_items.model = model
    >>> batched_items.request = layer.new_request()

    >>> footer = BatchedItemsFooter(parent=batched_items)
    >>> footer.model = batched_items.model
    >>> footer.request = batched_items.request

Current slice. Taken from slize implementation::

    >>> batched_items.slice.slice
    (0, 15)

    >>> footer.slice
    (0, 15)

Current item count. Taken from slize implementation::

    >>> batched_items.slice.item_count
    35

    >>> footer.item_count
    35

Rendered pagination.::

    >>> footer.rendered_pagination
    u'...<ul class="pagination pagination-sm">...'

Default template path::

    >>> footer.path
    'cone.app.browser:templates/batched_items_footer.pt'

    >>> batched_items.rendered_footer
    u'...<div class="panel-footer batched_items_footer">...'

Batched items rendering::

    >>> batched_items = MyBatchedItems()

Check ``items_id`` on batched items.::

    >>> batched_items.items_id
    'batched_items'

    >>> batched_items(model=model, request=layer.new_request())
    u'...<div id="batched_items"...'

    >>> batched_items.items_id = 'my_batched_items'

    >>> batched_items(model=model, request=layer.new_request())
    u'...<div id="my_batched_items"...'

    >>> batched_items.items_id = 'batched_items'

Check ``items_css`` on batched items.::

    >>> batched_items.items_css
    'batched_items panel panel-default'

    >>> batched_items(model=model, request=layer.new_request())
    u'...class="...batched_items ...'

    >>> batched_items.items_css = \
    ...     'my_batched_items batched_items panel panel-default'

    >>> batched_items(model=model, request=layer.new_request())
    u'...class="...my_batched_items batched_items ...'

    >>> batched_items.items_css = 'batched_items panel panel-default'

Check ``bind_events`` on batched items.::

    >>> batched_items.bind_events
    'batchclicked'

    >>> batched_items(model=model, request=layer.new_request())
    u'...ajax:bind="batchclicked"...'

Check ``display_header`` on batched items.::

    >>> batched_items.display_header
    True

    >>> expected = '<div class="panel-heading batched_items_header">'
    >>> rendered = batched_items(model=model, request=layer.new_request())
    >>> rendered.find(expected) > -1
    True

    >>> batched_items.display_header = False
    >>> rendered = batched_items(model=model, request=layer.new_request())
    >>> rendered.find(expected) > -1
    False

    >>> batched_items.display_header = True

Check ``display_footer`` on batched items.::

    >>> batched_items.display_header
    True

    >>> expected = '<div class="panel-footer batched_items_footer">'
    >>> rendered = batched_items(model=model, request=layer.new_request())
    >>> rendered.find(expected) > -1
    True

    >>> batched_items.display_footer = False
    >>> rendered = batched_items(model=model, request=layer.new_request())
    >>> rendered.find(expected) > -1
    False

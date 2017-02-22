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

Imports::

    >>> from cone.app.browser.batch import BatchedItems

Abstract contracts::

    >>> batched_items = BatchedItems()
    >>> batched_items.model = BaseNode()
    >>> batched_items.request = layer.new_request()

    >>> batched_items.item_count
    Traceback (most recent call last):
      ...
    NotImplementedError: Abstract ``BatchedItems`` does not implement 
    ``item_count``

    >>> batched_items.slice_items
    Traceback (most recent call last):
      ...
    NotImplementedError: Abstract ``BatchedItems`` does not implement 
    ``items``

    >>> assert(batched_items.slice_template is None)

Concrete ``BatchedItems`` implementation.::

    >>> class MyBatchedItems(BatchedItems):
    ... 
    ...     @property
    ...     def rendered_slice(self):
    ...         return u'<div id="{}">\n{}\n</div>'.format(
    ...             self.slice_id,
    ...             u'\n'.join([
    ...                 u'  <div>{}</div>'.format(it.name)
    ...                     for it in self.slice_items
    ...             ])
    ...         )
    ... 
    ...     @property
    ...     def item_count(self):
    ...         return len(self.filtered_items)
    ... 
    ...     @property
    ...     def slice_items(self):
    ...         start, end = self.current_slice
    ...         return self.filtered_items[start:end]
    ... 
    ...     @property
    ...     def filtered_items(self):
    ...         items = list()
    ...         term = self.filter_term
    ...         term = term.lower() if term else term
    ...         for node in self.model.values():
    ...             if term and node.name.find(term) == -1:
    ...                 continue
    ...             items.append(node)
    ...         return items

Create model::

    >>> model = BaseNode(name='container')
    >>> for i in range(35):
    ...     model['child_{}'.format(i)] = BaseNode()

Create batched items with model::

    >>> batched_items = MyBatchedItems()
    >>> batched_items.model = model
    >>> batched_items.request = layer.new_request()

The helper function ``make_url`` considers ``query_whitelist`` and is used for
URL creation within batched items implementation.::

    >>> batched_items.query_whitelist
    []

    >>> batched_items.query_whitelist = ['a', 'b']
    >>> batched_items.request.params['a'] = 'a'
    >>> batched_items.make_url(dict(c='c'))
    'http://example.com/container?a=a&c=c&b='

It's also possible to pass a model path to ``make_url`` to avoid multiple
computing of model path::

    >>> from cone.app.browser.utils import nodepath
    >>> path = nodepath(model)
    >>> batched_items.make_url(dict(c='c'), path=path)
    'http://example.com/container?a=a&c=c&b='

    >>> request = batched_items.request = layer.new_request()

Default slice size::

    >>> batched_items.default_slice_size
    15

Current slice size.::

    >>> batched_items.slice_size
    15

Number of available slice slizes::

    >>> batched_items.num_slice_sizes
    4

Available slice sizes for slice size selection.::

    >>> batched_items.slice_sizes
    [15, 30, 45, 60]

    >>> batched_items.default_slice_size = 10
    >>> batched_items.num_slice_sizes = 5
    >>> batched_items.slice_sizes
    [10, 20, 30, 40, 50]

    >>> batched_items.default_slice_size = 15
    >>> batched_items.num_slice_sizes = 4

Test ``slice_target``.::

    >>> batched_items.query_whitelist
    ['a', 'b']

    >>> request = batched_items.request = layer.new_request()
    >>> request.params['a'] = 'a'
    >>> request.params['b'] = 'b'
    >>> request.params['term'] = 'Hello'

    >>> batched_items.filter_term
    u'Hello'

    >>> batched_items.slice_target
    'http://example.com/container?a=a&term=Hello&b=b'

Test ``filter_target``.::

    >>> batched_items.filter_target
    'http://example.com/container?a=a&b=b&size=15'

    >>> request.params['size'] = '30'
    >>> batched_items.filter_target
    'http://example.com/container?a=a&b=b&size=30'

Header template path::

    >>> batched_items.header_template
    'cone.app.browser:templates/batched_items_header.pt'

Rendered header::

    >>> batched_items.rendered_header
    u'...<div class="panel-heading batched_items_header">...'

Header title. Taken from ``model.metadata`` by default::

    >>> batched_items.title
    'container'

Title can be skipped by setting ``show_title`` to False.::

    >>> expected = '<span class="label label-primary">container</span>'
    >>> batched_items.rendered_header.find(expected) > -1
    True

    >>> batched_items.show_title = False
    >>> batched_items.rendered_header.find(expected) > -1
    False

    >>> batched_items.show_title = True

Slice size can be skipped by setting ``show_slice_size`` to False.::

    >>> expected = '<select name="size"'
    >>> batched_items.rendered_header.find(expected) > -1
    True

    >>> batched_items.show_slice_size = False
    >>> batched_items.rendered_header.find(expected) > -1
    False

    >>> batched_items.show_slice_size = True

CSS class set on slice size selection wrapper::

    >>> expected = 'col-xs-4 col-sm3'
    >>> batched_items.rendered_header.find(expected) > -1
    True

    >>> batched_items.slice_size_css = 'col-xs-3 col-sm2'
    >>> batched_items.rendered_header.find(expected) > -1
    False

    >>> batched_items.slice_size_css = 'col-xs-4 col-sm3'

Flag whether to show search filter::

    >>> expected = '<input name="term"'
    >>> batched_items.rendered_header.find(expected) > -1
    True

    >>> batched_items.show_filter = False
    >>> batched_items.rendered_header.find(expected) > -1
    False

    >>> batched_items.show_filter = True

CSS class set on slice search filter::

    >>> expected = 'col-xs-3'
    >>> batched_items.rendered_header.find(expected) > -1
    True

    >>> batched_items.filter_css = 'col-xs-4'
    >>> batched_items.rendered_header.find(expected) > -1
    False

    >>> batched_items.filter_css = 'col-xs-3'

Additional markup displayed in header::

    >>> expected = '<div class="additional">Additional</div>'
    >>> batched_items.rendered_header.find(expected) > -1
    False

    >>> batched_items.head_additional = expected
    >>> batched_items.rendered_header.find(expected) > -1
    True

    >>> batched_items.head_additional = None

Batched items pagination. Pagination object is provided by ``pagination``
property on ``BatchedItems``::

    >>> request = layer.new_request()

    >>> batched_items = MyBatchedItems()
    >>> batched_items.model = BaseNode(name='container')
    >>> batched_items.request = request

    >>> pagination = batched_items.pagination
    >>> pagination
    <cone.app.browser.batch.BatchedItemsBatch object at ...>

    >>> pagination.model = batched_items.model
    >>> pagination.request = batched_items.request

Pagination batch uses ``page_target`` on ``BatchedItems`` for target URL
computing.::

    >>> path = nodepath(batched_items.model)
    >>> page = '1'
    >>> batched_items.page_target(path, page)
    'http://example.com/container?b_page=1&size=15'

Pagination batch name is created from batched items ``items_id``::

    >>> batched_items.items_id
    'batched_items'

    >>> pagination.name
    'batched_itemsbatch'

Pagination batch only gets displayed if there are batched items.::

    >>> batched_items.item_count
    0

    >>> pagination.display
    False

    >>> pagination.vocab
    []

    >>> batched_items.model = pagination.model = model

    >>> batched_items.item_count
    35

    >>> pagination.display
    True

    >>> batched_items.current_page
    0

    >>> request.params['b_page'] = '1'
    >>> batched_items.current_page
    1

    >>> vocab = pagination.vocab
    >>> len(vocab)
    3

    >>> sorted(vocab[0].items())
    [('current', False), 
    ('page', '1'), 
    ('url', 'http://example.com/container?b_page=0&size=15'), 
    ('visible', True)]

    >>> sorted(vocab[1].items())
    [('current', True), 
    ('page', '2'), 
    ('url', 'http://example.com/container?b_page=1&size=15'), 
    ('visible', True)]

    >>> sorted(vocab[2].items())
    [('current', False), 
    ('page', '3'), 
    ('url', 'http://example.com/container?b_page=2&size=15'), 
    ('visible', True)]

Rendered pagination.::

    >>> batched_items.rendered_pagination
    u'...<ul class="pagination pagination-sm">...'

Batched items footer::

    >>> batched_items = MyBatchedItems()
    >>> batched_items.model = model
    >>> batched_items.request = layer.new_request()

Default template path::

    >>> batched_items.footer_template
    'cone.app.browser:templates/batched_items_footer.pt'

    >>> batched_items.rendered_footer
    u'...<div class="panel-footer batched_items_footer">...'

Slice ID.::

    >>> batched_items.slice_id
    'batched_items_slice'

Current slice to display as tuple:: 

    >>> batched_items.current_slice
    (0, 15)

Overall item count::

    >>> batched_items.item_count
    35

Current slice items::

    >>> batched_items.slice_items
    [<BaseNode object 'child_0' at ...>, 
    ...
    <BaseNode object 'child_14' at ...>]

Chage current page and check again::

    >>> request = batched_items.request = layer.new_request()
    >>> request.params['b_page'] = '1'
    >>> batched_items.current_slice
    (15, 30)

    >>> batched_items.slice_items
    [<BaseNode object 'child_15' at ...>, 
    ...
    <BaseNode object 'child_29' at ...>]

Change the slice size::

    >>> request = batched_items.request = layer.new_request()
    >>> request.params['size'] = '10'
    >>> batched_items.slice_size
    10

    >>> batched_items.current_slice
    (0, 10)

    >>> batched_items.slice_items
    [<BaseNode object 'child_0' at ...>, 
    ...
    <BaseNode object 'child_9' at ...>]

Change the filter term::

    >>> request = batched_items.request = layer.new_request()
    >>> request.params['term'] = '1'
    >>> request.params['size'] = '5'
    >>> batched_items.filter_term
    u'1'

    >>> batched_items.filtered_items
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

    >>> batched_items.current_slice
    (0, 5)

    >>> batched_items.slice_items
    [<BaseNode object 'child_1' at ...>, 
    <BaseNode object 'child_10' at ...>, 
    <BaseNode object 'child_11' at ...>, 
    <BaseNode object 'child_12' at ...>, 
    <BaseNode object 'child_13' at ...>]

    >>> request.params['b_page'] = '1'
    >>> batched_items.current_slice
    (5, 10)

    >>> batched_items.slice_items
    [<BaseNode object 'child_14' at ...>, 
    <BaseNode object 'child_15' at ...>, 
    <BaseNode object 'child_16' at ...>, 
    <BaseNode object 'child_17' at ...>, 
    <BaseNode object 'child_18' at ...>]

Test ``rendered_slice``::

    >>> request = batched_items.request = layer.new_request()
    >>> print batched_items.rendered_slice
    <div id="batched_items_slice">
      <div>child_0</div>
      ...
      <div>child_14</div>
    </div>

``BatchItems`` rendering default template.::

    >>> batched_items.path
    'cone.app.browser:templates/batched_items.pt'

Batched items DOM element ID. Used for bdajax binding.::

    >>> batched_items.items_id
    'batched_items'

    >>> batched_items(model=model, request=layer.new_request())
    u'...<div id="batched_items"...'

    >>> batched_items.items_id = 'my_batched_items'

    >>> batched_items(model=model, request=layer.new_request())
    u'...<div id="my_batched_items"...'

    >>> batched_items.items_id = 'batched_items'

Test ``items_css``.::

    >>> batched_items.items_css
    'batched_items panel panel-default'

    >>> batched_items(model=model, request=layer.new_request())
    u'...class="...batched_items ...'

    >>> batched_items.items_css = \
    ...     'my_batched_items batched_items panel panel-default'

    >>> batched_items(model=model, request=layer.new_request())
    u'...class="...my_batched_items batched_items ...'

    >>> batched_items.items_css = 'batched_items panel panel-default'

Test ``bind_events``.::

    >>> batched_items.bind_events
    'batchclicked'

    >>> batched_items(model=model, request=layer.new_request())
    u'...ajax:bind="batchclicked"...'

Test ``bind_selectors``.::

    >>> batched_items.bind_selectors
    'batched_itemsbatchsensitiv'

    >>> batched_items(model=model, request=layer.new_request())
    u'...class="batched_itemsbatchsensitiv...'

Test ``display_header``.::

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

Test ``display_footer``.::

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

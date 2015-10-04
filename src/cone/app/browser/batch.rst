Batches
=======

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

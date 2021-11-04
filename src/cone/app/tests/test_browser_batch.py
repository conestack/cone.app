from cone.app import testing
from cone.app.browser import set_related_view
from cone.app.browser.batch import Batch
from cone.app.browser.batch import BatchedItems
from cone.app.browser.batch import BatchedItemsBatch
from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.app.model import BaseNode
from cone.app.utils import node_path
from cone.tile import render_tile
from cone.tile import tile
from cone.tile.tests import TileTestCase


class TestBrowserBatch(TileTestCase):
    layer = testing.security

    def test_abstract_batch(self):
        # Abstract batch tile. A deriving class must implement the ``vocab``
        # property, which promises to return a list of dict like objects,
        # providing the following keys:
        # - ``page`` - the displayed page name, normally a number, or a
        #              character.
        # - ``current`` - Flag whether page is current page or not.
        # - ``visible`` - Flag whether page is visible or not.
        # - ``href`` - href attribute URL.
        # - ``target`` - ajax target URL.
        # - ``url`` - Target URL. B/C. Use dedicated ``href`` and ``target``.

        # Instanciate directly, base tests
        batch = Batch(None, 'render', 'batch')
        # The dummy page
        self.assertEqual(sorted(batch.dummypage.items()), [
            ('current', False),
            ('href', ''),
            ('page', ''),
            ('target', ''),
            ('url', ''),
            ('visible', False)
        ])
        # Ellipsis to display if ``batchrange`` exceeds
        self.assertEqual(batch.ellipsis, u'...')
        # By default empty ``vocab``, subclass must override
        self.assertEqual(batch.vocab, [])
        # Batches are displayed by default
        self.assertTrue(batch.display)
        # Default ``batchrange`` is 30 items. Defines how many pages are
        # displayed
        self.assertEqual(batch.batchrange, 8)
        # Test ``currentpage`` returns None if no currentpage
        self.assertTrue(batch.currentpage is None)
        # Test ``firstpage`` returns None if empty vocab
        self.assertTrue(batch.firstpage is None)
        # Test ``lastpage`` returns None if empty vocab
        self.assertTrue(batch.lastpage is None)
        # Test ``prevpage`` returns None if empty vocab
        self.assertTrue(batch.prevpage is None)
        # Test ``nextpage`` returns None if empty vocab
        self.assertTrue(batch.nextpage is None)
        # No left or right ellipsis sind no batchrange exceeding
        self.assertEqual(batch.leftellipsis, u'')
        self.assertEqual(batch.rightellipsis, u'')
        # No ``pages`` returned for empty vocab
        self.assertEqual(batch.pages, [])

        # Test edge case ``_position_of_current_in_vocab``
        class BuggyBatch(Batch):
            @property
            def currentpage(self):
                return self.dummypage
        self.assertEqual(BuggyBatch()._position_of_current_in_vocab, -1)

    def test_batch(self):
        # Dummy Batch implementation
        class DummyBatch(Batch):
            _vocab = []
            _batchrange = 5

            @property
            def vocab(self):
                return self._vocab

            @property
            def batchrange(self):
                return self._batchrange

        # Test with all pages invisible
        batch = DummyBatch(None, 'render', 'batch')
        for i in range(3):
            batch._vocab.append({
                'current': False,
                'visible': False,
                'page': str(i),
                'href': 'http://example.com/someview',
                'target': 'http://example.com/'
            })

        # If no visible page, ``firstpage`` returns first page from vocab
        self.assertEqual(sorted(batch.firstpage.items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '0'),
            ('target', 'http://example.com/'),
            ('visible', False)
        ])

        # If no visible page, ``lastpage`` returns last page from vocab
        self.assertEqual(sorted(batch.lastpage.items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '2'),
            ('target', 'http://example.com/'),
            ('visible', False)
        ])

        # No visible pages in vocab return ``dummypage`` on prevpage and
        # nextpage
        self.assertTrue(batch.prevpage == batch.dummypage)
        self.assertTrue(batch.nextpage == batch.dummypage)

        # Test with visible pages
        batch._vocab = list()
        for i in range(5):
            batch._vocab.append({
                'current': False,
                'visible': True,
                'href': 'http://example.com/someview',
                'target': 'http://example.com/',
                'page': str(i),
            })
        batch._vocab[1]['visible'] = False
        batch._vocab[3]['visible'] = False

        # Set first page current
        batch._vocab[0]['current'] = True

        # First vocab item is visible, ``firstpage`` returns it
        self.assertEqual(sorted(batch.firstpage.items()), [
            ('current', True),
            ('href', 'http://example.com/someview'),
            ('page', '0'),
            ('target', 'http://example.com/'),
            ('visible', True)
        ])

        # Last vocab item is visible, ``lastpage`` returns it
        self.assertEqual(sorted(batch.lastpage.items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '4'),
            ('target', 'http://example.com/'),
            ('visible', True)
        ])

        # First item is selected, ``prevpage`` returns dummy page
        self.assertEqual(sorted(batch.prevpage.items()), [
            ('current', False),
            ('href', ''),
            ('page', ''),
            ('target', ''),
            ('url', ''),
            ('visible', False)
        ])

        # ``nextpage`` returns next visible page, vocab[1] is skipped
        self.assertEqual(sorted(batch.nextpage.items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '2'),
            ('target', 'http://example.com/'),
            ('visible', True)
        ])

        # Set last page current
        batch._vocab[0]['current'] = False
        batch._vocab[-1]['current'] = True

        # ``prevpage`` returns next visible page, vocab[3] is skipped
        self.assertEqual(sorted(batch.prevpage.items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '2'),
            ('target', 'http://example.com/'),
            ('visible', True)
        ])

        # Last item is selected, ``nextpage`` returns dummy page
        self.assertEqual(sorted(batch.nextpage.items()), [
            ('current', False),
            ('href', ''),
            ('page', ''),
            ('target', ''),
            ('url', ''),
            ('visible', False)
        ])

        # Set third page current
        batch._vocab[-1]['current'] = False
        batch._vocab[2]['current'] = True

        # ``prevpage`` returns next visible page, vocab[1] is skipped
        self.assertEqual(sorted(batch.prevpage.items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '0'),
            ('target', 'http://example.com/'),
            ('visible', True)
        ])

        # ``nextpage`` returns next visible page, vocab[3] is skipped
        self.assertEqual(sorted(batch.nextpage.items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '4'),
            ('target', 'http://example.com/'),
            ('visible', True)
        ])

        # Inverse visible flags
        batch._vocab[0]['visible'] = False
        batch._vocab[1]['visible'] = True
        batch._vocab[2]['visible'] = False
        batch._vocab[3]['visible'] = True
        batch._vocab[4]['visible'] = False

        # Set second item selected
        batch._vocab[2]['current'] = False
        batch._vocab[1]['current'] = True

        # ``firstpage`` returns first visible page
        self.assertEqual(sorted(batch.firstpage.items()), [
            ('current', True),
            ('href', 'http://example.com/someview'),
            ('page', '1'),
            ('target', 'http://example.com/'),
            ('visible', True)
        ])

        # ``lastpage`` returns last visible page
        self.assertEqual(sorted(batch.lastpage.items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '3'),
            ('target', 'http://example.com/'),
            ('visible', True)
        ])

        # Selected page is first visible page, ``prevpage`` returns dummypage
        self.assertEqual(sorted(batch.prevpage.items()), [
            ('current', False),
            ('href', ''),
            ('page', ''),
            ('target', ''),
            ('url', ''),
            ('visible', False)
        ])

        # Next visible page
        self.assertEqual(sorted(batch.nextpage.items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '3'),
            ('target', 'http://example.com/'),
            ('visible', True)
        ])

        # Set fourth item selected
        batch._vocab[1]['current'] = False
        batch._vocab[3]['current'] = True

        # Previous visible page
        self.assertEqual(sorted(batch.prevpage.items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '1'),
            ('target', 'http://example.com/'),
            ('visible', True)
        ])

        # Selected page is last visible page, ``nextpage`` returns dummypage
        self.assertEqual(sorted(batch.nextpage.items()), [
            ('current', False),
            ('href', ''),
            ('page', ''),
            ('target', ''),
            ('url', ''),
            ('visible', False)
        ])

        # set ``batchrange`` smaller than vocab size
        batch._batchrange = 3
        self.assertEqual(len(batch.pages), 3)

        # Batchrange ends
        self.assertEqual(sorted(batch.pages[0].items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '2'),
            ('target', 'http://example.com/'),
            ('visible', False)
        ])

        self.assertEqual(sorted(batch.pages[-1].items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '4'),
            ('target', 'http://example.com/'),
            ('visible', False)
        ])

        self.assertEqual(batch.leftellipsis, u'...')
        self.assertEqual(batch.rightellipsis, u'')

        # Batchrange starts
        batch._vocab[1]['current'] = True
        batch._vocab[3]['current'] = False

        self.assertEqual(sorted(batch.pages[0].items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '0'),
            ('target', 'http://example.com/'),
            ('visible', False)
        ])

        self.assertEqual(sorted(batch.pages[-1].items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '2'),
            ('target', 'http://example.com/'),
            ('visible', False)
        ])

        self.assertEqual(batch.leftellipsis, u'')
        self.assertEqual(batch.rightellipsis, u'...')

        # Batchrange between start and end
        batch._vocab[0]['visible'] = True
        batch._vocab[2]['visible'] = True
        batch._vocab[4]['visible'] = True

        batch._vocab[1]['current'] = False
        batch._vocab[2]['current'] = True

        self.assertEqual(sorted(batch.pages[0].items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '1'),
            ('target', 'http://example.com/'),
            ('visible', True)
        ])
        self.assertEqual(sorted(batch.pages[-1].items()), [
            ('current', False),
            ('href', 'http://example.com/someview'),
            ('page', '3'),
            ('target', 'http://example.com/'),
            ('visible', True)
        ])

        self.assertEqual(batch.leftellipsis, u'...')
        self.assertEqual(batch.rightellipsis, u'...')

    def test_batch_tile(self):
        # Register batch tile
        with self.layer.hook_tile_reg():
            @tile(name='testbatch')
            class TestBatch(Batch):
                @property
                def vocab(self):
                    ret = list()
                    path = node_path(self.model)
                    current = self.request.params.get('b_page', '0')
                    for i in range(10):
                        query = make_query(b_page=str(i))
                        href = make_url(
                            self.request,
                            path=path,
                            resource='someview',
                            query=query
                        )
                        target = make_url(self.request, path=path, query=query)
                        ret.append({
                            'page': '%i' % i,
                            'current': current == str(i),
                            'visible': True,
                            'href': href,
                            'target': target,
                        })
                    return ret

        with self.layer.authenticated('max'):
            model = BaseNode()
            request = self.layer.new_request()
            res = render_tile(model, request, 'testbatch')

        expected = 'href="http://example.com/someview?b_page=1"'
        self.assertTrue(res.find(expected) > -1)
        expected = 'ajax:target="http://example.com/?b_page=1"'
        self.assertTrue(res.find(expected) > -1)
        expected = 'href="http://example.com/someview?b_page=2"'
        self.assertTrue(res.find(expected) > -1)
        expected = 'ajax:target="http://example.com/?b_page=2"'
        self.assertTrue(res.find(expected) > -1)

    def test_bc_batch_tile(self):
        # Test B/C batch vocab rendering::

        with self.layer.hook_tile_reg():
            @tile('bc_testbatch')
            class BCTestBatch(Batch):
                @property
                def vocab(self):
                    ret = list()
                    path = node_path(self.model)
                    current = self.request.params.get('b_page', '0')
                    for i in range(10):
                        query = make_query(b_page=str(i))
                        url = make_url(self.request, path=path, query=query)
                        ret.append({
                            'page': '%i' % i,
                            'current': current == str(i),
                            'visible': True,
                            'url': url
                        })
                    return ret

        with self.layer.authenticated('max'):
            model = BaseNode()
            request = self.layer.new_request()
            res = render_tile(model, request, 'bc_testbatch')

        expected = 'href="http://example.com/?b_page=1"'
        self.assertTrue(res.find(expected) > -1)
        expected = 'ajax:target="http://example.com/?b_page=1"'
        self.assertTrue(res.find(expected) > -1)
        expected = 'href="http://example.com/?b_page=2"'
        self.assertTrue(res.find(expected) > -1)
        expected = 'ajax:target="http://example.com/?b_page=2"'
        self.assertTrue(res.find(expected) > -1)

    def test_abstract_BatchedItems(self):
        # Abstract contracts
        batched_items = BatchedItems()
        batched_items.model = BaseNode()
        batched_items.request = self.layer.new_request()

        err = self.expectError(
            NotImplementedError,
            lambda: batched_items.item_count
        )
        expected = (
            'Abstract ``BatchedItems`` does not implement ``item_count``'
        )
        self.assertEqual(str(err), expected)

        err = self.expectError(
            NotImplementedError,
            lambda: batched_items.slice_items
        )
        expected = (
            'Abstract ``BatchedItems`` does not implement ``items``'
        )
        self.assertEqual(str(err), expected)

        self.assertTrue(batched_items.slice_template is None)

    def test_BatchedItems(self):
        # Concrete ``BatchedItems`` implementation.
        class MyBatchedItems(BatchedItems):
            slice_template = 'cone.app.testing:dummy_batched_items.pt'

            @property
            def item_count(self):
                return len(self.filtered_items)

            @property
            def slice_items(self):
                start, end = self.current_slice
                return self.filtered_items[start:end]

            @property
            def filtered_items(self):
                items = list()
                term = self.filter_term
                term = term.lower() if term else term
                for node in self.model.values():
                    if term and node.name.find(term) == -1:
                        continue
                    items.append(node)
                return items

        # Create model
        model = BaseNode(name='container')
        for i in range(35):
            model['child_{}'.format(i)] = BaseNode()

        # Create batched items with model
        batched_items = MyBatchedItems()
        batched_items.model = model
        batched_items.request = self.layer.new_request()

        # The helper function ``make_query`` considers ``query_whitelist`` and
        # is used for query creation within batched items implementation.
        self.assertEqual(batched_items.query_whitelist, [])

        batched_items.query_whitelist = ['a', 'b']
        batched_items.request.params['a'] = 'a'

        self.assertEqual(batched_items.make_query({'c': 'c'}), '?a=a&b=&c=c')

        # A query parameter which already exists on request gets overwritten
        self.assertEqual(batched_items.make_query({'a': 'b'}), '?a=b&b=')

        # The helper function ``make_url`` uses ``make_query``, thus considers
        # ``query_whitelist`` as well and is used for URL creation within
        # batched items implementation.
        self.assertEqual(
            batched_items.make_url(dict(c='c')),
            u'http://example.com/container?a=a&b=&c=c'
        )

        # It's also possible to pass a model path to ``make_url`` to avoid
        # multiple computing of model path
        path = node_path(model)
        self.assertEqual(
            batched_items.make_url(dict(c='c'), path=path),
            u'http://example.com/container?a=a&b=&c=c'
        )

        # ``BatchedItems`` plumbs ``RelatedViewConsumer`` and considers
        # ``related_view`` if ``include_view`` passed to ``make_url``
        request = batched_items.request = self.layer.new_request()
        set_related_view(request, 'someview')

        self.assertEqual(
            batched_items.make_url(dict(c='c')),
            u'http://example.com/container?a=&b=&c=c'
        )
        self.assertEqual(
            batched_items.make_url(dict(c='c'), include_view=True),
            u'http://example.com/container/someview?a=&b=&c=c'
        )
        self.assertEqual(
            batched_items.make_url(dict(c='c'), path=path),
            u'http://example.com/container?a=&b=&c=c'
        )
        self.assertEqual(
            batched_items.make_url(dict(c='c'), path=path, include_view=True),
            u'http://example.com/container/someview?a=&b=&c=c'
        )

        # Default slice size
        self.assertEqual(batched_items.default_slice_size, 15)
        # Current slice size
        self.assertEqual(batched_items.slice_size, 15)
        # Number of available slice slizes
        self.assertEqual(batched_items.num_slice_sizes, 4)
        # Available slice sizes for slice size selection
        self.assertEqual(batched_items.slice_sizes, [15, 30, 45, 60])

        batched_items.default_slice_size = 10
        batched_items.num_slice_sizes = 5
        self.assertEqual(batched_items.slice_sizes, [10, 20, 30, 40, 50])

        batched_items.default_slice_size = 15
        batched_items.num_slice_sizes = 4

        # Test ``slice_target``
        self.assertEqual(batched_items.query_whitelist, ['a', 'b'])

        request = batched_items.request = self.layer.new_request()
        request.params['a'] = 'a'
        request.params['b'] = 'b'
        request.params['term'] = 'Hello'

        self.assertEqual(batched_items.filter_term, u'Hello')
        self.assertEqual(
            batched_items.slice_target,
            u'http://example.com/container?a=a&b=b&term=Hello'
        )

        # Test ``filter_target``
        self.assertEqual(
            batched_items.filter_target,
            u'http://example.com/container?a=a&b=b&size=15'
        )

        request.params['size'] = '30'
        self.assertEqual(
            batched_items.filter_target,
            u'http://example.com/container?a=a&b=b&size=30'
        )

        # Header template path
        self.assertEqual(
            batched_items.header_template,
            'cone.app.browser:templates/batched_items_header.pt'
        )

        # Rendered header
        self.checkOutput("""
        ...<div class="panel-heading batched_items_header">...
        """, batched_items.rendered_header)

        # Header title. Taken from ``model.metadata`` by default
        self.assertEqual(batched_items.title, 'container')

        # Title can be skipped by setting ``show_title`` to False
        expected = '<span class="label label-primary">container</span>'
        self.assertTrue(batched_items.rendered_header.find(expected) > -1)

        batched_items.show_title = False
        self.assertFalse(batched_items.rendered_header.find(expected) > -1)

        batched_items.show_title = True

        # Slice size can be skipped by setting ``show_slice_size`` to False
        expected = '<select name="size"'
        self.assertTrue(batched_items.rendered_header.find(expected) > -1)

        batched_items.show_slice_size = False
        self.assertFalse(batched_items.rendered_header.find(expected) > -1)

        batched_items.show_slice_size = True

        # CSS class set on slice size selection wrapper
        expected = 'col-xs-4 col-sm3'
        self.assertTrue(batched_items.rendered_header.find(expected) > -1)

        batched_items.slice_size_css = 'col-xs-3 col-sm2'
        self.assertFalse(batched_items.rendered_header.find(expected) > -1)

        batched_items.slice_size_css = 'col-xs-4 col-sm3'

        # Flag whether to show search filter
        expected = '<input name="term"'
        self.assertTrue(batched_items.rendered_header.find(expected) > -1)

        batched_items.show_filter = False
        self.assertFalse(batched_items.rendered_header.find(expected) > -1)

        batched_items.show_filter = True

        # CSS class set on slice search filter
        expected = 'col-xs-3'
        self.assertTrue(batched_items.rendered_header.find(expected) > -1)

        batched_items.filter_css = 'col-xs-4'
        self.assertFalse(batched_items.rendered_header.find(expected) > -1)

        batched_items.filter_css = 'col-xs-3'

        # Additional markup displayed in header
        expected = '<div class="additional">Additional</div>'
        self.assertFalse(batched_items.rendered_header.find(expected) > -1)

        batched_items.head_additional = expected
        self.assertTrue(batched_items.rendered_header.find(expected) > -1)

        batched_items.head_additional = None

        # Batched items pagination. Pagination object is provided by
        # ``pagination`` property on ``BatchedItems``
        request = self.layer.new_request()
        set_related_view(request, 'someview')

        batched_items = MyBatchedItems()
        batched_items.model = BaseNode(name='container')
        batched_items.request = request

        pagination = batched_items.pagination
        self.assertTrue(isinstance(pagination, BatchedItemsBatch))

        pagination.model = batched_items.model
        pagination.request = batched_items.request

        # Pagination batch uses ``page_target`` on ``BatchedItems`` for target
        # URL computing.
        path = node_path(batched_items.model)
        page = '1'
        self.assertEqual(
            batched_items.page_target(path, page),
            u'http://example.com/container?b_page=1&size=15'
        )

        # Pagination batch name is created from batched items ``items_id``
        self.assertEqual(batched_items.items_id, 'batched_items')
        self.assertEqual(pagination.name, 'batched_itemsbatch')

        # Pagination batch only gets displayed if there are batched items.
        self.assertEqual(batched_items.item_count, 0)
        self.assertFalse(pagination.display)
        self.assertEqual(pagination.vocab, [])

        batched_items.model = pagination.model = model
        self.assertEqual(batched_items.item_count, 35)
        self.assertTrue(pagination.display)
        self.assertEqual(batched_items.current_page, 0)

        request.params['b_page'] = '1'
        self.assertEqual(batched_items.current_page, 1)

        vocab = pagination.vocab
        self.assertEqual(len(vocab), 3)

        self.assertEqual(sorted(vocab[0].items()), [
            ('current', False),
            ('href', u'http://example.com/container/someview?b_page=0&size=15'),
            ('page', '1'),
            ('target', u'http://example.com/container?b_page=0&size=15'),
            ('visible', True)
        ])
        self.assertEqual(sorted(vocab[1].items()), [
            ('current', True),
            ('href', u'http://example.com/container/someview?b_page=1&size=15'),
            ('page', '2'),
            ('target', u'http://example.com/container?b_page=1&size=15'),
            ('visible', True)
        ])
        self.assertEqual(sorted(vocab[2].items()), [
            ('current', False),
            ('href', u'http://example.com/container/someview?b_page=2&size=15'),
            ('page', '3'),
            ('target', u'http://example.com/container?b_page=2&size=15'),
            ('visible', True)
        ])

        # Rendered pagination
        self.checkOutput("""
        ...<ul class="pagination pagination-sm">...
        """, batched_items.rendered_pagination)

        # Batched items footer
        batched_items = MyBatchedItems()
        batched_items.model = model
        batched_items.request = self.layer.new_request()

        # Default template path
        self.assertEqual(
            batched_items.footer_template,
            'cone.app.browser:templates/batched_items_footer.pt'
        )
        self.checkOutput("""
        ...<div class="panel-footer batched_items_footer">...
        """, batched_items.rendered_footer)

        # Slice ID
        self.assertEqual(batched_items.slice_id, 'batched_items_slice')

        # Current slice to display as tuple
        self.assertEqual(batched_items.current_slice, (0, 15))

        # Overall item count
        self.assertEqual(batched_items.item_count, 35)

        # Current slice items
        self.checkOutput("""
        [<BaseNode object 'child_0' at ...>,
        ...
        <BaseNode object 'child_14' at ...>]
        """, str(batched_items.slice_items))

        # Chage current page and check again
        request = batched_items.request = self.layer.new_request()
        request.params['b_page'] = '1'
        self.assertEqual(batched_items.current_slice, (15, 30))
        self.checkOutput("""
        [<BaseNode object 'child_15' at ...>,
        ...
        <BaseNode object 'child_29' at ...>]
        """, str(batched_items.slice_items))

        # Change the slice size
        request = batched_items.request = self.layer.new_request()
        request.params['size'] = '10'
        self.assertEqual(batched_items.slice_size, 10)
        self.assertEqual(batched_items.current_slice, (0, 10))
        self.checkOutput("""
        [<BaseNode object 'child_0' at ...>,
        ...
        <BaseNode object 'child_9' at ...>]
        """, str(batched_items.slice_items))

        # Change the filter term
        request = batched_items.request = self.layer.new_request()
        request.params['term'] = '1'
        request.params['size'] = '5'
        self.assertEqual(batched_items.filter_term, u'1')

        self.checkOutput("""
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
        """, str(batched_items.filtered_items))

        self.assertEqual(batched_items.current_slice, (0, 5))

        self.checkOutput("""
        [<BaseNode object 'child_1' at ...>,
        <BaseNode object 'child_10' at ...>,
        <BaseNode object 'child_11' at ...>,
        <BaseNode object 'child_12' at ...>,
        <BaseNode object 'child_13' at ...>]
        """, str(batched_items.slice_items))

        request.params['b_page'] = '1'
        self.assertEqual(batched_items.current_slice, (5, 10))

        self.checkOutput("""
        [<BaseNode object 'child_14' at ...>,
        <BaseNode object 'child_15' at ...>,
        <BaseNode object 'child_16' at ...>,
        <BaseNode object 'child_17' at ...>,
        <BaseNode object 'child_18' at ...>]
        """, str(batched_items.slice_items))

        # Test ``rendered_slice``
        request = batched_items.request = self.layer.new_request()
        self.checkOutput("""
        <div id="batched_items_slice">
          <div>child_0</div>
          ...
          <div>child_14</div>
        </div>
        """, batched_items.rendered_slice)

        # ``BatchItems`` rendering default template
        self.assertEqual(
            batched_items.path,
            'cone.app.browser:templates/batched_items.pt'
        )

        # Batched items DOM element ID. Used for bdajax binding.
        self.assertEqual(batched_items.items_id, 'batched_items')

        self.checkOutput("""
        ...<div id="batched_items"...
        """, batched_items(model=model, request=self.layer.new_request()))

        batched_items.items_id = 'my_batched_items'

        self.checkOutput("""
        ...<div id="my_batched_items"...
        """, batched_items(model=model, request=self.layer.new_request()))

        batched_items.items_id = 'batched_items'

        # Test ``items_css``
        self.assertEqual(
            batched_items.items_css,
            'batched_items panel panel-default'
        )

        self.checkOutput("""
        ...class="...batched_items ...
        """, batched_items(model=model, request=self.layer.new_request()))

        batched_items.items_css = (
            'my_batched_items batched_items panel panel-default'
        )

        self.checkOutput("""
        ...class="...my_batched_items batched_items ...
        """, batched_items(model=model, request=self.layer.new_request()))

        batched_items.items_css = 'batched_items panel panel-default'

        # Test ``bind_events``
        self.assertEqual(batched_items.bind_events, 'batchclicked')

        self.checkOutput("""
        ...ajax:bind="batchclicked"...
        """, batched_items(model=model, request=self.layer.new_request()))

        # Test ``bind_selectors``
        self.assertEqual(
            batched_items.bind_selectors,
            'batched_itemsbatchsensitiv'
        )

        self.checkOutput("""
        ...class="batched_itemsbatchsensitiv...
        """, batched_items(model=model, request=self.layer.new_request()))

        # Test ``display_header``
        self.assertTrue(batched_items.display_header)

        expected = '<div class="panel-heading batched_items_header">'
        rendered = batched_items(model=model, request=self.layer.new_request())
        self.assertTrue(rendered.find(expected) > -1)

        batched_items.display_header = False
        rendered = batched_items(model=model, request=self.layer.new_request())
        self.assertFalse(rendered.find(expected) > -1)

        batched_items.display_header = True

        # Test ``display_footer``
        self.assertTrue(batched_items.display_header)

        expected = '<div class="panel-footer batched_items_footer">'
        rendered = batched_items(model=model, request=self.layer.new_request())
        self.assertTrue(rendered.find(expected) > -1)

        batched_items.display_footer = False
        rendered = batched_items(model=model, request=self.layer.new_request())
        self.assertFalse(rendered.find(expected) > -1)

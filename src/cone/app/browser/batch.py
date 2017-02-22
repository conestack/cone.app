from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.app.browser.utils import nodepath
from cone.app.browser.utils import request_property
from cone.tile import Tile
from cone.tile import render_template
import urllib2


BATCH_RANGE = 8


class Batch(Tile):
    """An abstract batch tile.

    A subclass has to implement 'self.vocab' and may override
    'self.batchrange', 'self.display' and 'self.batchname'.
    """

    dummypage = {
        'page': '',
        'current': False,
        'visible': False,
        'url': '',
    }

    path = 'cone.app.browser:templates/batch.pt'
    """Path to batch template.
    """

    ellipsis = u'...'
    """Ellipsis string if number of pages exceeds batch range.
    """

    trigger_event = 'batchclicked'
    """JS event triggered when page clicked.
    """

    @property
    def trigger_selector(self):
        """CSS selector to trigger JS event to.
        """
        return '.{}sensitiv'.format(self.name)

    @property
    def vocab(self):
        """Batch vocabulary.
        """
        return []

    @property
    def display(self):
        """Flag whether to display the batch.
        """
        return True

    @property
    def batchrange(self):
        """Defines how many pages are displayed.
        """
        return BATCH_RANGE

    @property
    def currentpage(self):
        """Current page in batch.
        """
        for page in self.vocab:
            if page['current']:
                return page
        return None

    @property
    def firstpage(self):
        """First page in batch.
        """
        firstpage = None
        for page in self.vocab:
            if page['visible']:
                firstpage = page
                break
        if not firstpage and self.vocab:
            firstpage = self.vocab[0]
        return firstpage

    @property
    def lastpage(self):
        """Last page in batch.
        """
        lastpage = None
        count = len(self.vocab)
        while count > 0:
            count -= 1
            page = self.vocab[count]
            if page['visible']:
                lastpage = self.vocab[count]
                break
        if not lastpage and self.vocab:
            lastpage = self.vocab[len(self.vocab) - 1]
        return lastpage

    @property
    def prevpage(self):
        """Previous page in batch.
        """
        prevpage = None
        position = self._getPositionOfCurrentInVocab() - 1
        while position >= 0:
            page = self.vocab[position]
            if page['visible']:
                prevpage = self.vocab[position]
                break
            position -= 1
        if not prevpage and self.vocab:
            prevpage = self.dummypage
        return prevpage

    @property
    def nextpage(self):
        """Next page in batch.
        """
        nextpage = self.dummypage
        position = self._getPositionOfCurrentInVocab() + 1
        if position == 0 and self.vocab:
            return nextpage
        if position == 0 and not self.vocab:
            return None
        while position < len(self.vocab):
            page = self.vocab[position]
            if page['visible']:
                nextpage = self.vocab[position]
                break
            position += 1
        return nextpage

    @property
    def leftellipsis(self):
        """Left ellipsis string.
        """
        return self._leftOverDiff < 0 and self.ellipsis or u''

    @property
    def rightellipsis(self):
        """Right ellipsis string.
        """
        return self._rightOverDiff < 0 and self.ellipsis or u''

    @property
    def pages(self):
        """Pages to display.
        """
        pos = self._getPositionOfCurrentInVocab()
        count = len(self.vocab)
        start = max(pos - self._siderange - max(self._rightOverDiff, 0), 0)
        end = min(pos + self._siderange + max(self._leftOverDiff, 0) + 1,
                  count)
        return self.vocab[start:end]

    @property
    def _siderange(self):
        return self.batchrange / 2

    @property
    def _leftOverDiff(self):
        currentPosition = self._getPositionOfCurrentInVocab()
        return self._siderange - currentPosition

    @property
    def _rightOverDiff(self):
        position = self._getPositionOfCurrentInVocab()
        count = len(self.vocab)
        return position + self._siderange - count + 1

    def _getPositionOfCurrentInVocab(self):
        #TODO: wildcard handling
        current = self.currentpage
        if current is None:
            return -1
        pointer = 0
        for page in self.vocab:
            if page['page'] == current['page']:
                return pointer
            pointer += 1
        # reached if subclass implementation bug
        return -1                                           #pragma NO COVERAGE


class BatchedItemsSlice(Tile):
    """Recent batched items slice.
    """

    path = None
    """Path to slice template.
    """

    parent = None
    """Parent tile, usually ``BatchedItems`` instance.
    """

    def __init__(self, parent):
        """Create batched items slice.
        """
        self.parent = parent
        self.path = parent.slice_template

    @property
    def slice_id(self):
        """CSS ID of the slice container DOM element.
        """
        return self.parent.slice_id

    @property
    def size(self):
        """Current slice size.
        """
        return self.parent.slice_size

    @property
    def slice(self):
        """Current slice as (start, end) tuple.
        """
        return self.parent.current_slice

    @property
    def items(self):
        """Current slice items.
        """
        return self.parent.slice_items


class BatchedItemsBatch(Batch):
    """Displays batched items pagination.
    """

    def __init__(self, parent):
        """Create batched items batch.
        """
        self.parent = parent
        self.name = parent.items_id + 'batch'

    @property
    def display(self):
        """Flag whether to display the batch.
        """
        return len(self.vocab) > 1

    @property
    def vocab(self):
        """Batch vocabulary.
        """
        ret = list()
        path = nodepath(self.model)
        count = self.parent.item_count
        slice_size = self.parent.slice.size
        pages = count / slice_size
        if count % slice_size != 0:
            pages += 1
        current = self.parent.current_page
        for i in range(pages):
            url = self.parent.page_target(path, str(i))
            ret.append({
                'page': '%i' % (i + 1),
                'current': current == i,
                'visible': True,
                'url': url,
            })
        return ret


class BatchedItems(Tile):
    """Base tile for displaying searchable, batched items.
    """

    path = 'cone.app.browser:templates/batched_items.pt'
    """Template rendering the batched items tile.
    """

    header_template = 'cone.app.browser:templates/batched_items_header.pt'
    """Template rendering the slice header.
    """

    footer_template = 'cone.app.browser:templates/batched_items_footer.pt'
    """Template rendering the slice footer.
    """

    slice_template = None
    """Template rendering the slice items. Passed to ``slice_factory``.
    """

    items_id = 'batched_items'
    """CSS ID of the batched items container DOM element.
    """

    items_css = 'batched_items panel panel-default'
    """CSS classes of the batched items container DOM element.
    """

    query_whitelist = []
    """Additional incoming request parameters to consider when creating URL's.
    """

    display_header = True
    """Flag whether to display the slice header.
    """

    display_footer = True
    """Flag whether to display the slice footer.
    """

    default_slice_size = 15
    """Default slice size.
    """

    show_title = True
    """Flag whether to show title in slice header.
    """

    show_slice_size = True
    """Flag whether to display the slice size selection in slice header.
    """

    slice_size_css = 'col-xs-4 col-sm3'
    """CSS classes to set on slice size selection container DOM element.
    """

    show_filter = True
    """Flag whether to display the search filter input in slice header.
    """

    filter_css = 'col-xs-3'
    """CSS classes to set on search filter input container DOM element.
    """

    head_additional = None
    """Additional markup to render in slice header.
    """

    num_slice_sizes = 4
    """Number of available slice sizes in slice size selection.
    """

    slice_factory = BatchedItemsSlice
    """Factory to instantiate the ``BatchedItemsSlice`` object.
    """

    @property
    def title(self):
        """Batched items title.
        """
        return self.model.metadata.title

    @property
    def bind_selectors(self):
        """CSS selector to bind the batched items container DOM element to.
        """
        return '{}sensitiv'.format(self.pagination.name)

    @property
    def bind_events(self):
        """JS events to bind the batched items container DOM element to.
        """
        return self.pagination.trigger_event

    @property
    def trigger_selector(self):
        """CSS selector to trigger JS event to when changing slice size or
        entering search filter term.
        """
        return self.pagination.trigger_selector

    @property
    def trigger_event(self):
        """JS event triggered when changing slice size or entering search
        filter term.
        """
        return self.pagination.trigger_event

    @property
    def rendered_header(self):
        """Rendered slice header.
        """
        if not self.display_header:
            return u''
        return render_template(
            self.header_template,
            request=self.request,
            model=self.model,
            context=self
        )

    @property
    def rendered_footer(self):
        """Rendered slice footer.
        """
        if not self.display_footer:
            return u''
        return render_template(
            self.footer_template,
            request=self.request,
            model=self.model,
            context=self
        )

    @property
    def rendered_pagination(self):
        """Rendered pagination batch.
        """
        return self.pagination(
            model=self.model,
            request=self.request
        )

    @property
    def rendered_slice(self):
        """Rendered slice.
        """
        return self.slice(model=self.model, request=self.request)

    @request_property
    def slice(self):
        """``BatchedItemsSlice`` instance.
        """
        return self.slice_factory(parent=self)

    @request_property
    def pagination(self):
        """``BatchedItemsBatch`` instance.
        """
        return BatchedItemsBatch(parent=self)

    @property
    def current_page(self):
        """Current batch page.
        """
        return int(self.request.params.get('b_page', '0'))

    def page_target(self, path, page):
        """Create page target.
        """
        params = {
            'b_page': page,
            'size': self.slice_size,
            'term': self.filter_term,
        }
        return self.make_url(params, path=path)

    @property
    def slice_id(self):
        """CSS ID of the slice container DOM element.
        """
        return '{}_slice'.format(self.items_id)

    @property
    def slice_size(self):
        """Current slice size.
        """
        return int(self.request.params.get('size', self.default_slice_size))

    @property
    def slice_sizes(self):
        """Available slice sices as list.
        """
        return [i * self.default_slice_size
            for i in range(1, self.num_slice_sizes + 1)]

    @property
    def current_slice(self):
        """Current slice as (start, end) tuple.
        """
        start = self.current_page * self.slice_size
        end = start + self.slice_size
        return start, end

    @property
    def slice_target(self):
        """Slice size selection target URL.
        """
        return self.make_url({
            'term': self.filter_term,
        })

    @property
    def filter_target(self):
        """Search filter input target URL.
        """
        return self.make_url({
            'size': self.slice_size,
        })

    @request_property
    def filter_term(self):
        """Current search filter term.
        """
        term = self.request.params.get('term')
        return urllib2.unquote(str(term)).decode('utf-8') if term else term

    def make_url(self, params, path=None):
        """Create URL considering ``query_whitelist``.
        """
        for param in self.query_whitelist:
            params[param] = self.request.params.get(param, '')
        query = make_query(**params)
        if path:
            return make_url(self.request, path=path, query=query)
        return make_url(self.request, node=self.model, query=query)

    @property
    def item_count(self):
        """Overall slice items count.
        """
        raise NotImplementedError(
            "Abstract ``BatchedItems`` does not implement ``item_count``")

    @property
    def slice_items(self):
        """Current slice items.
        """
        raise NotImplementedError(
            "Abstract ``BatchedItems`` does not implement ``items``")

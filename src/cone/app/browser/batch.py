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

    XXX: Rename to ``Pagination``.
    """
    path = 'cone.app.browser:templates/batch.pt'
    dummypage = {
        'page': '',
        'current': False,
        'visible': False,
        'url': '',
    }
    ellipsis = u'...'

    @property
    def vocab(self):
        return []

    @property
    def display(self):
        return True

    @property
    def batchrange(self):
        return BATCH_RANGE

    @property
    def currentpage(self):
        for page in self.vocab:
            if page['current']:
                return page
        return None

    @property
    def firstpage(self):
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
        return self._leftOverDiff < 0 and self.ellipsis or u''

    @property
    def rightellipsis(self):
        return self._rightOverDiff < 0 and self.ellipsis or u''

    @property
    def pages(self):
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


class BatchedItemsHeader(Tile):
    """Displayed above the actual item slice. Contains title, search field and
    slice size selection.
    """
    path = 'cone.app.browser:templates/batched_items_header.pt'
    show_title = True
    show_slice_size = True
    slice_size_css = 'col-xs-4 col-sm3'
    show_filter = True
    filter_css = 'col-xs-3'
    head_additional = None

    def __init__(self, parent, **kw):
        self.parent = parent
        self.__dict__.update(**kw)

    @property
    def title(self):
        return self.model.metadata.title

    @property
    def items_id(self):
        return self.parent.items_id

    @property
    def slice_id(self):
        return self.parent.slice.slice_id

    @property
    def slice_size(self):
        return self.parent.slice.size

    @property
    def slice_sizes(self):
        return [i * self.parent.slice.default_slice_size for i in range(1, 5)]

    @property
    def slice_target(self):
        return self.parent.make_url({
            'term': self.filter_term,
        })

    @property
    def filter_target(self):
        return self.parent.make_url({
            'size': self.slice_size,
        })

    @property
    def filter_term(self):
        return self.parent.filter_term


class BatchedItemsFooter(Tile):
    """Displayed below the actual item slice. Contains information about the
    recent slice and pagination.
    """
    path = 'cone.app.browser:templates/batched_items_footer.pt'

    def __init__(self, parent, **kw):
        self.parent = parent
        self.__dict__.update(**kw)

    @property
    def rendered_pagination(self):
        return self.parent.pagination(
            model=self.model,
            request=self.request
        )

    @property
    def slice(self):
        return self.parent.slice.slice

    @property
    def item_count(self):
        return self.parent.slice.item_count


class BatchedItemsSlice(Tile):
    """Displays the actual slice items.
    """
    default_slice_size = 15

    def __init__(self, parent, **kw):
        self.parent = parent
        self.model = parent.model
        self.request = parent.request
        self.__dict__.update(**kw)

    @property
    def slice_id(self):
        return '{}_slice'.format(self.parent.items_id)

    @property
    def size(self):
        return int(self.request.params.get('size', self.default_slice_size))

    @property
    def slice(self):
        current = int(self.request.params.get('b_page', '0'))
        start = current * self.size
        end = start + self.size
        return start, end

    @property
    def item_count(self):
        raise NotImplementedError(
            "Abstract ``BatchedItemsSlice`` does not implement ``item_count``")

    @property
    def items(self):
        raise NotImplementedError(
            "Abstract ``BatchedItemsSlice`` does not implement ``items``")


class BatchedItemsPagination(Batch):
    """Displays batched items pagination.
    """

    def __init__(self, parent):
        self.parent = parent
        self.name = parent.items_id + 'batch'

    @property
    def display(self):
        return len(self.vocab) > 1

    @property
    def query_params(self):
        return {
            'size': self.parent.slice.size,
            'term': self.parent.filter_term,
        }

    @property
    def vocab(self):
        ret = list()
        path = nodepath(self.model)
        count = self.parent.slice.item_count
        slice_size = self.parent.slice.size
        pages = count / slice_size
        if count % slice_size != 0:
            pages += 1
        current = self.request.params.get('b_page', '0')
        params = self.query_params
        for term in self.parent.query_whitelist:
            params[term] = self.request.params.get(term, '')
        for i in range(pages):
            params['b_page'] = str(i)
            query = make_query(**params)
            url = make_url(self.request, path=path, query=query)
            ret.append({
                'page': '%i' % (i + 1),
                'current': current == str(i),
                'visible': True,
                'url': url,
            })
        return ret


class BatchedItems(Tile):
    """Base tile for displaying searchable, batched items.
    """
    path = 'cone.app.browser:templates/batched_items.pt'
    items_id = 'batched_items'
    items_css = 'batched_items panel panel-default'
    bind_events = 'batchclicked'
    query_whitelist = []
    display_header = True
    display_footer = True
    header_factory = BatchedItemsHeader
    footer_factory = BatchedItemsFooter
    slice_factory = BatchedItemsSlice
    pagination_factory = BatchedItemsPagination

    @property
    def rendered_header(self):
        if not self.display_header:
            return u''
        return self.header_factory(parent=self)(
            model=self.model,
            request=self.request
        )

    @property
    def rendered_slice(self):
        return self.slice(
            model=self.model,
            request=self.request
        )

    @property
    def rendered_footer(self):
        if not self.display_footer:
            return u''
        return self.footer_factory(parent=self)(
            model=self.model,
            request=self.request
        )

    @request_property
    def slice(self):
        return self.slice_factory(parent=self)

    @request_property
    def pagination(self):
        return self.pagination_factory(parent=self)

    @request_property
    def filter_term(self):
        term = self.request.params.get('term')
        return urllib2.unquote(str(term)).decode('utf-8') if term else term

    def make_url(self, params):
        for param in self.query_whitelist:
            params[param] = self.request.params.get(param, '')
        query = make_query(**params)
        return make_url(self.request, node=self.model, query=query)

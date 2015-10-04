from cone.app.browser.batch import Batch
from cone.app.browser.utils import format_date
from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.app.browser.utils import nodepath
from cone.tile import Tile
import urllib2


class RowData(dict):

    def __init__(self, selectable=False, target=None, css=''):
        self.selectable = selectable
        self.target = target
        self.css = css


class Table(Tile):
    """Abstract table tile. Provides rendering of sortable, batched tables.

    A subclass of this tile must be registered under the same name as defined
    at ``self.table_tile_name``, normally bound to template
    ``cone.app:browser/templates/table.pt``
    """
    wrapper_binding = 'batchclicked sortclicked'
    table_id = 'table'
    table_tile_name = 'table'
    col_defs = []
    default_sort = None
    default_order = None
    default_slicesize = 15
    query_whitelist = []
    show_title = True
    show_filter = False
    show_slicesize = True
    head_additional = None
    display_table_header = True
    display_table_footer = True

    table_length_size = 'col-xs-4 col-sm3'
    table_filter_size = 'col-xs-3'

    @property
    def slice(self):
        return TableSlice(self, self.model, self.request)

    @property
    def batch(self):
        return TableBatch(self)(self.model, self.request)

    @property
    def slicesize(self):
        return int(self.request.params.get('size', self.default_slicesize))

    @property
    def slicesizes(self):
        return [i * self.default_slicesize for i in range(1, 5)]

    @property
    def table_title(self):
        return self.model.metadata.title

    @property
    def slice_target(self):
        return self.make_url({
            'sort': self.sort_column,
            'order': self.sort_order,
            'term': self.filter_term,
        })

    @property
    def filter_target(self):
        return self.make_url({
            'sort': self.sort_column,
            'order': self.sort_order,
            'size': self.slicesize,
        })

    @property
    def filter_term(self):
        term = self.request.params.get('term')
        if term:
            term = urllib2.unquote(str(term)).decode('utf-8')
        return term

    @property
    def sort_column(self):
        return self.request.params.get('sort', self.default_sort)

    @property
    def sort_order(self):
        return self.request.params.get('order', self.default_order)

    @property
    def sort_index(self):
        """Index of recent sort column.
        """
        col = self.sort_column
        idx = 0
        for col_def in self.col_defs:
            key = col_def.get('sort_key')
            if key == col:
                return idx
            idx += 1

    def make_url(self, params):
        for param in self.query_whitelist:
            params[param] = self.request.params.get(param, '')
        query = make_query(**params)
        return make_url(self.request, node=self.model, query=query)

    def format_date(self, dt):
        return format_date(dt)

    def th_defs(self, sortkey):
        cur_sort = self.sort_column
        cur_order = self.sort_order
        selected = cur_sort == sortkey
        alter = selected and cur_order == 'desc'
        order = alter and 'asc' or 'desc'
        params = {
            'b_page': self.request.params.get('b_page', '0'),
            'sort': sortkey,
            'order': order,
            'size': self.slicesize,
            'term': self.filter_term,
        }
        url = self.make_url(params)
        css = selected and order or ''
        return css, url

    @property
    def item_count(self):
        raise NotImplementedError("Abstract table does not implement "
                                  "``item_count``.")

    def sorted_rows(self, start, end, sort, order):
        raise NotImplementedError("Abstract table does not implement "
                                  "``sorted_rows``.")


class TableSlice(object):

    def __init__(self, table_tile, model, request):
        self.table_tile = table_tile
        self.model = model
        self.request = request

    @property
    def slice(self):
        current = int(self.request.params.get('b_page', '0'))
        start = current * self.table_tile.slicesize
        end = start + self.table_tile.slicesize
        return start, end

    @property
    def rows(self):
        start, end = self.slice
        return self.table_tile.sorted_rows(
            start, end,
            self.table_tile.sort_column,
            self.table_tile.sort_order)


class TableBatch(Batch):

    def __init__(self, table_tile):
        self.table_tile = table_tile
        self.name = table_tile.table_id + 'batch'
        self.path = None
        self.attribute = 'render'

    @property
    def display(self):
        return len(self.vocab) > 1

    @property
    def vocab(self):
        ret = list()
        path = nodepath(self.model)
        count = self.table_tile.item_count
        slicesize = self.table_tile.slicesize
        pages = count / slicesize
        if count % slicesize != 0:
            pages += 1
        current = self.request.params.get('b_page', '0')
        params = {
            'sort': self.table_tile.sort_column,
            'order': self.table_tile.sort_order,
            'size': slicesize,
            'term': self.table_tile.filter_term,
        }
        for term in self.table_tile.query_whitelist:
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

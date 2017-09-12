from cone.app.browser import RelatedViewConsumer
from cone.app.browser.batch import Batch
from cone.app.browser.utils import format_date
from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.app.browser.utils import node_path
from cone.app.browser.utils import safe_decode
from cone.tile import Tile
from plumber import plumbing
import urllib2


class RowData(dict):

    def __init__(self, selectable=False, target=None, css=''):
        self.selectable = selectable
        self.target = target
        self.css = css


@plumbing(RelatedViewConsumer)
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
    ajax_path = None
    ajax_path_event = None

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
        return urllib2.unquote(
            term.encode('utf-8')).decode('utf-8') if term else term

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

    def make_query(self, params):
        """Create query considering ``query_whitelist``.

        :param params: Dictionary with query parameters.
        :return: Query as string.
        """
        p = dict()
        for param in self.query_whitelist:
            p[param] = self.request.params.get(param, '')
        p.update(params)
        return make_query(**p)

    def make_url(self, params, path=None, include_view=False):
        """Create URL considering ``query_whitelist``.

        :param params: Dictionary with query parameters.
        :param path: Optional model path, if ``None``, path gets taken from
            ``self.model``
        :param include_view: Boolean whether to include
            ``self.related_view`` to URL.
        :return: URL as string.
        """
        return safe_decode(make_url(
            self.request,
            path=path,
            node=None if path else self.model,
            resource=self.related_view if include_view else None,
            query=self.make_query(params)))

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
        self.related_view = table_tile.related_view
        self.ajax_path = self.ajax_path
        self.ajax_path_event = self.ajax_path_event

    @property
    def display(self):
        return len(self.vocab) > 1

    @property
    def vocab(self):
        ret = list()
        path = node_path(self.model)
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
            url = make_url(
                self.request,
                path=path,
                #resource=self.related_view,
                query=query
            )
            ret.append({
                'page': '%i' % (i + 1),
                'current': current == str(i),
                'visible': True,
                'url': url,
            })
        return ret

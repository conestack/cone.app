import datetime
from cone.tile import (
    tile,
    Tile,
    render_tile,
)
from cone.app.browser.batch import Batch
from cone.app.browser.utils import (
    nodepath, 
    make_query, 
    make_url,
    format_date,
)


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
    
    @property
    def slice(self):
        return TableSlice(self, self.model, self.request)
    
    @property
    def batch(self):
        return TableBatch(self)(self.model, self.request)
    
    @property
    def slicesize(self):
        return self.request.params.get('size', self.default_slicesize)
    
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
    
    @property
    def item_count(self):
        raise NotImplementedError("Abstract table does not implement "
                                  "``item_count``.")
    
    def sorted_rows(self, start, end, sort, order):
        raise NotImplementedError("Abstract table does not implement "
                                  "``sorted_rows``.")
    
    def format_date(self, dt):
        return format_date(dt)
    
    def th_defs(self, sortkey):
        b_page = self.request.params.get('b_page', '0')
        cur_sort = self.sort_column
        cur_order = self.sort_order
        selected = cur_sort == sortkey
        alter = selected and cur_order == 'desc'
        order = alter and 'asc' or 'desc'
        params = {
            'b_page': b_page,
            'sort': sortkey,
            'order': order,
        }
        for term in self.query_whitelist:
            params[term] = self.request.params.get(term, '')
        query = make_query(**params)
        url = make_url(self.request, node=self.model, query=query)
        css = selected and order or ''
        return css, url


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
            start, end, self.table_tile.sort_column, self.table_tile.sort_order)


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
        pages = count / self.table_tile.slicesize
        if count % self.table_tile.slicesize != 0:
            pages += 1
        current = self.request.params.get('b_page', '0')
        sort = self.request.params.get('sort', self.table_tile.default_sort)
        order = self.request.params.get('order', self.table_tile.default_order)
        params = {
            'sort': sort,
            'order': order,
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
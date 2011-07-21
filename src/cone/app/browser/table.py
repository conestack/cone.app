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
    pass


class Item(object):
    
    def __init__(self,
                 value=None,
                 link=None,
                 target=None,
                 action=None,
                 event=None,
                 actions=[]):
        """Item definition.
        
        value
            item value
        
        link
            item href attribute
        
        target
            item ajax:target attribute
        
        action
            item ajax:action attribute
        
        event
            item ajax:event attribute
        
        actions
            item actions, list of Action instances
        """
        self.value = value
        self.link = link
        self.target = target
        self.action = action
        self.event = event
        self.actions = actions


class Action(object):
    
    def __init__(self,
                 title=None,
                 link=None,
                 target=None,
                 action=None,
                 event=None,
                 css=None,
                 confirm=None,
                 rendered=None):
        """Action definition.
        
        title
            action title
        
        link
            action href attribute
        
        target
            action ajax:target attribute
        
        action
            action ajax:action attribute
        
        event
            action ajax:event attribute
        
        css
            action class attribute
        
        confirm
            Conform message for action if desired
        
        rendered
            an already rendered action. if set, ignore all other attributes
            and use contents of this attribute for rendering
        """
        self.title = title
        self.link = link
        self.target = target
        self.action = action
        self.event = event
        self.css = css
        self.confirm = confirm
        self.rendered = rendered


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
    slicesize = 10
    
    @property
    def slice(self):
        return TableSlice(self, self.model, self.request)
    
    @property
    def batch(self):
        return TableBatch(self)(self.model, self.request)
    
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
        cur_sort = self.request.params.get('sort')
        cur_order = self.request.params.get('order', self.default_order)
        base_url = '%s?b_page=%s' % (self.nodeurl, b_page)
        selected = cur_sort == sortkey
        alter = selected and cur_order == 'desc'
        order = alter and 'asc' or 'desc'
        sorturl = '%s&amp;sort=%s&amp;order=%s' % (base_url, sortkey, order)
        css = selected and order or ''
        return css, sorturl


class TableSlice(object):
    
    def __init__(self, table_tile, model, request):
        self.table_tile = table_tile
        self.model = model
        self.request = request
    
    @property
    def sort(self):
        return self.request.params.get('sort', self.table_tile.default_sort)
    
    @property
    def order(self):
        return self.request.params.get('order', self.table_tile.default_order)
    
    @property
    def slice(self):
        current = int(self.request.params.get('b_page', '0'))
        start = current * self.table_tile.slicesize
        end = start + self.table_tile.slicesize
        return start, end
    
    @property
    def rows(self):
        start, end = self.slice
        return self.table_tile.sorted_rows(start, end, self.sort, self.order)


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
        sort = self.request.params.get('sort', '')
        for i in range(pages):
            query = make_query(b_page=str(i), sort=sort)
            url = make_url(self.request, path=path, query=query)
            ret.append({
                'page': '%i' % (i + 1),
                'current': current == str(i),
                'visible': True,
                'url': url,
            })
        return ret
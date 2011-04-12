import datetime
from cone.tile import (
    tile,
    Tile,
    render_tile,
)
from cone.app.browser.table import (
    Table,
    RowData,
    Item,
    Action,
)
#from cone.app.browser.batch import Batch
from cone.app.browser.utils import (
    nodepath, 
    make_query, 
    make_url,
    format_date,
)

FAR_PAST = datetime.datetime(2000, 1, 1)

@tile('contents', 'templates/table.pt', permission='view')
class ContentsTile(Table):
    
    table_id = 'contents'
    table_tile_name = 'contents'
    col_defs = [
        {
            'id': 'actions',
            'title': 'Actions',
            'sort_key': None,
            'sort_title': None,
            'content': 'actions',
            'link': False,
        },
        {
            'id': 'title',
            'title': 'Title',
            'sort_key': 'title',
            'sort_title': 'Sort on title',
            'content': 'string',
            'link': True,
        },
        {
            'id': 'creator',
            'title': 'Creator',
            'sort_key': 'creator',
            'sort_title': 'Sort on creator',
            'content': 'string',
            'link': False,
        },
        {
            'id': 'created',
            'title': 'Created',
            'sort_key': 'created',
            'sort_title': 'Sort on created',
            'content': 'datetime',
            'link': False,
        },
        {
            'id': 'modified',
            'title': 'Modified',
            'sort_key': 'modified',
            'sort_title': 'Sort on modified',
            'content': 'datetime',
            'link': False,
        },
    ]
    default_sort = 'created'
    default_order = 'desc'
    slicesize = 10
    
    sort_keys = {
        'title': lambda x: x.metadata.title.lower(),
        'creator': lambda x: x.metadata.creator.lower(),
        'created': lambda x: x.metadata.created \
                      and x.metadata.created or FAR_PAST,
        'modified': lambda x: x.metadata.modified \
                      and x.metadata.modified or FAR_PAST,
    }
    
    @property
    def item_count(self):
        return len(self.model.keys())
    
    def sorted_rows(self, start, end, sort, order):
        children = self.sorted_children(sort, order)
        rows = list()
        for child in children[start:end]:
            row_data = RowData()
            row_data['actions'] = Item(actions=self.create_actions(child))
            value = child.metadata.get('title', child.__name__)
            link = target = make_url(node=child)
            row_data['title'] = Item(value, link, target)
            row_data['creator'] = Item(child.metadata.get('creator', 'unknown'))
            row_data['created'] = Item(child.metadata.get('created'))
            row_data['modified'] = Item(child.metadata.get('modified'))
            rows.append(row_data)
        return rows
    
    def sorted_children(self, sort, order):
        children = [self.model[key] for key in self.model.keys()]
        if sort in self.sort_keys:
            children = sorted(children, key=self.sort_keys[sort])
            if order == 'asc':
                children.reverse()
        return children
    
    def create_actions(self, node):
        actions = list()
        link = target = make_url(node=node)
        actions.append(Action('View', link, target, 'view16_16'))
        if node.properties.editable:
            query = make_query(came_from='parent')
            link = target = make_url(node=node, query=query)
            actions.append(Action('Edit', link, target, 'edit16_16'))
        return actions


#@tile('contents', 'templates/contents.pt', permission='view')
#class ContentsTile(Tile):
#    
#    @property
#    def contents(self):
#        return Contents(self.model, self.request)
#    
#    @property
#    def batch(self):
#        return ContentsBatch(self.contents)(self.model, self.request)
#    
#    def format_date(self, dt):
#        return format_date(dt)
#    
#    def th_defs(self, sortkey):
#        b_page = self.request.params.get('b_page', '0')
#        cur_sort = self.request.params.get('sort')
#        cur_order = self.request.params.get('order', 'desc')
#        base_url = '%s?b_page=%s' % (self.nodeurl, b_page)
#        selected = cur_sort == sortkey
#        alter = selected and cur_order == 'desc'
#        order = alter and 'asc' or 'desc'
#        sorturl = '%s&amp;sort=%s&amp;order=%s' % (base_url, sortkey, order)
#        css = selected and order or ''
#        return css, sorturl
#
#
#FAR_PAST = datetime.datetime(2000, 1, 1)
#
#class Contents(object):
#    
#    farpast = datetime.datetime(2000, 1, 1)
#    
#    sortkeys = {
#        'title': lambda x: x.metadata.title.lower(),
#        'creator': lambda x: x.metadata.creator.lower(),
#        'created': lambda x: x.metadata.created \
#                      and x.metadata.created or FAR_PAST,
#        'modified': lambda x: x.metadata.modified \
#                      and x.metadata.modified or FAR_PAST,
#    }
#    
#    def __init__(self, model, request):
#        self.model = model
#        self.request = request
#        self.slicesize = 10
#    
#    @property
#    def sort(self):
#        return self.request.params.get('sort', 'created')
#    
#    @property
#    def sorted(self):
#        items = [self.model[key] for key in self.model.keys()]
#        if self.sort in self.sortkeys:
#            items = sorted(items, key=self.sortkeys[self.sort])
#            if self.request.params.get('order') == 'asc':
#                items.reverse()
#        return items
#    
#    @property
#    def slice(self):
#        current = int(self.request.params.get('b_page', '0'))
#        start = current * self.slicesize
#        end = start + self.slicesize
#        return start, end
#    
#    @property
#    def items(self):
#        start, end = self.slice
#        #if not self.sort:
#        #    return [self.model[key] for key in self.model.keys()[start:end]]
#        return self.sorted[start:end]
#
#
#class ContentsBatch(Batch):
#    
#    def __init__(self, contents):
#        self.name = 'contentsbatch'
#        self.path = None
#        self.attribute = 'render'
#        self.contents = contents
#    
#    @property
#    def display(self):
#        return len(self.vocab) > 1
#    
#    @property
#    def vocab(self):
#        ret = list()
#        path = nodepath(self.model)
#        count = len(self.model.keys())
#        pages = count / self.contents.slicesize
#        if count % self.contents.slicesize != 0:
#            pages += 1
#        current = self.request.params.get('b_page', '0')
#        sort = self.request.params.get('sort', '')
#        for i in range(pages):
#            query = make_query(b_page=str(i), sort=sort)
#            url = make_url(self.request, path=path, query=query)
#            ret.append({
#                'page': '%i' % (i + 1),
#                'current': current == str(i),
#                'visible': True,
#                'url': url,
#            })
#        return ret
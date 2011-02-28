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


@tile('contents', 'templates/contents.pt', strict=False)
class ContentsTile(Tile):
    
    @property
    def contents(self):
        return Contents(self.model, self.request)
    
    @property
    def batch(self):
        return ContentsBatch(self.contents)(self.model, self.request)
    
    def format_date(self, dt):
        return format_date(dt)
    
    def th_defs(self, sortkey):
        b_page = self.request.params.get('b_page', '0')
        cur_sort = self.request.params.get('sort')
        cur_order = self.request.params.get('order', 'desc')
        base_url = '%s?b_page=%s' % (self.nodeurl, b_page)
        selected = cur_sort == sortkey
        alter = selected and cur_order == 'desc'
        order = alter and 'asc' or 'desc'
        sorturl = '%s&amp;sort=%s&amp;order=%s' % (base_url, sortkey, order)
        css = selected and order or ''
        return css, sorturl


FAR_PAST = datetime.datetime(2000, 1, 1)

class Contents(object):
    
    farpast = datetime.datetime(2000, 1, 1)
    
    sortkeys = {
        'title': lambda x: x.metadata.title.lower(),
        'creator': lambda x: x.metadata.creator.lower(),
        'created': lambda x: x.metadata.created \
                      and x.metadata.created or FAR_PAST,
        'modified': lambda x: x.metadata.modified \
                      and x.metadata.modified or FAR_PAST,
    }
    
    def __init__(self, model, request):
        self.model = model
        self.request = request
        self.slicesize = 10
    
    @property
    def sort(self):
        return self.request.params.get('sort', 'created')
    
    @property
    def sorted(self):
        items = [self.model[key] for key in self.model.keys()]
        if self.sort in self.sortkeys:
            items = sorted(items, key=self.sortkeys[self.sort])
            if self.request.params.get('order') == 'asc':
                items.reverse()
        return items
    
    @property
    def slice(self):
        current = int(self.request.params.get('b_page', '0'))
        start = current * self.slicesize
        end = start + self.slicesize
        return start, end
    
    @property
    def items(self):
        start, end = self.slice
        #if not self.sort:
        #    return [self.model[key] for key in self.model.keys()[start:end]]
        return self.sorted[start:end]


class ContentsBatch(Batch):
    
    def __init__(self, contents):
        self.name = 'contentsbatch'
        self.path = None
        self.attribute = 'render'
        self.contents = contents
    
    @property
    def display(self):
        return len(self.vocab) > 1
    
    @property
    def vocab(self):
        ret = list()
        path = nodepath(self.model)
        count = len(self.model.keys())
        pages = count / self.contents.slicesize
        if count % self.contents.slicesize != 0:
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
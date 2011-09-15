import datetime
from pyramid.security import has_permission
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
            value = child.metadata.get('title', child.name)
            link = target = make_url(self.request, node=child)
            action = 'content:#content:inner'
            event = 'contextchanged:.contextsensitiv'
            row_data['title'] = Item(value, link, target, action, event)
            row_data['creator'] = Item(child.metadata.get('creator', 'unknown'))
            row_data['created'] = Item(child.metadata.get('created'))
            row_data['modified'] = Item(child.metadata.get('modified'))
            rows.append(row_data)
        return rows
    
    def sorted_children(self, sort, order):
        children = list()
        for node in self.model.values():
            if not has_permission('view', node, self.request):
                continue
            children.append(node)
        if sort in self.sort_keys:
            children = sorted(children, key=self.sort_keys[sort])
            if order == 'asc':
                children.reverse()
        return children
    
    def create_actions(self, node):
        actions = list()
        link = target = make_url(self.request, node=node)
        action = 'content:#content:inner'
        event = 'contextchanged:.contextsensitiv'
        actions.append(Action('View', link, target, action, event, 'view16_16'))
        if node.properties.editable:
            query = make_query(came_from='parent')
            link = make_url(
                self.request, node=node, resource='edit', query=query)
            target = make_url(self.request, node=node, query=query)
            action = 'edit:#content:inner'
            event = 'contextchanged:.contextsensitiv'
            actions.append(
                Action('Edit', link, target, action, event, 'edit16_16'))
        if node.properties.deletable:
            link = make_url(
                self.request, node=node, resource='delete')
            target = make_url(self.request, node=node)
            action = 'delete:NONE:NONE'
            confirm = 'Do you really want to delete this item?'
            actions.append(Action('Delete', link, target, action,
                                  None, 'delete16_16', confirm))
        return actions
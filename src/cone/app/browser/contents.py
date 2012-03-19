import datetime
from node.utils import instance_property
from pyramid.security import has_permission
from cone.tile import (
    tile,
    Tile,
    render_tile,
)
from cone.app.interfaces import ICopySupport
from cone.app.browser.table import (
    Table,
    RowData,
)
from cone.app.browser.copysupport import extract_copysupport_cookie
from cone.app.browser.actions import (
    Toolbar,
    ActionView,
    ViewLink,
    ActionEdit,
    ActionDelete,
)
from cone.app.browser.utils import (
    nodepath, 
    make_query, 
    make_url,
    format_date,
)


FAR_PAST = datetime.datetime(2000, 1, 1)


class ContentsActionView(ActionView):
    event = 'contextchanged:.contextsensitiv'


class ContentsActionEdit(ActionEdit):
    event = 'contextchanged:.contextsensitiv'


class ContentsActionDelete(ActionDelete):
    """Delete action for contents table.
    """
    
    @property
    def display(self):
        return self.model.properties.action_delete \
            and has_permission('delete', self.model.parent, self.request) \
            and self.permitted('delete') \


class ContentsViewLink(ViewLink):
    """Ciew link for contents table.
    """
    event = 'contextchanged:.contextsensitiv'
    
    @property
    def action(self):
        contenttile = 'content'
        if self.model.properties.default_content_tile:
            contenttile = self.model.properties.default_content_tile
        return '%s:#content:inner' % contenttile


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
            'content': 'structure',
        },
        {
            'id': 'title',
            'title': 'Title',
            'sort_key': 'title',
            'sort_title': 'Sort on title',
            'content': 'structure',
        },
        {
            'id': 'creator',
            'title': 'Creator',
            'sort_key': 'creator',
            'sort_title': 'Sort on creator',
            'content': 'string',
        },
        {
            'id': 'created',
            'title': 'Created',
            'sort_key': 'created',
            'sort_title': 'Sort on created',
            'content': 'datetime',
        },
        {
            'id': 'modified',
            'title': 'Modified',
            'sort_key': 'modified',
            'sort_title': 'Sort on modified',
            'content': 'datetime',
        },
    ]
    default_sort = 'created'
    default_order = 'desc'
    
    sort_keys = {
        'title': lambda x: x.metadata.title.lower(),
        'creator': lambda x: x.metadata.creator.lower(),
        'created': lambda x: x.metadata.created \
                      and x.metadata.created or FAR_PAST,
        'modified': lambda x: x.metadata.modified \
                      and x.metadata.modified or FAR_PAST,
    }
    
    show_filter = True
    
    @property
    def item_count(self):
        return len(self.filtered_children)
    
    @instance_property
    def row_actions(self):
        row_actions = Toolbar()
        row_actions['view'] = ContentsActionView()
        row_actions['edit'] = ContentsActionEdit()
        row_actions['delete'] = ContentsActionDelete()
        return row_actions
    
    @instance_property
    def view_link(self):
        return ContentsViewLink()
    
    def sorted_rows(self, start, end, sort, order):
        children = self.sorted_children(sort, order)
        rows = list()
        cut_urls = extract_copysupport_cookie(self.request, 'cut')
        for child in children[start:end]:
            row_data = RowData()
            row_data['actions'] = self.row_actions(child, self.request)
            value = child.metadata.get('title', child.name)
            target = make_url(self.request, node=child)
            if ICopySupport.providedBy(child):
                row_data.selectable = True
                row_data.target = target
                row_data.css = 'copysupportitem'
                if target in cut_urls:
                    row_data.css += ' copysupport_cut'
            row_data['title'] = self.view_link(child, self.request)
            row_data['creator'] = child.metadata.get('creator', 'unknown')
            row_data['created'] = child.metadata.get('created')
            row_data['modified'] = child.metadata.get('modified')
            rows.append(row_data)
        return rows
    
    @property
    def filtered_children(self):
        if self.request.environ.has_key('_filtered_children'):
            return self.request.environ['_filtered_children']
        children = list()
        term = self.filter_term
        if term:
            term = term.lower()
        for node in self.model.values():
            if not has_permission('view', node, self.request):
                continue
            if term:
                md = node.metadata
                if md.get('title', '').lower().find(term) == -1 and \
                  md.get('creator', 'unknown').lower().find(term) == -1:
                    continue
            children.append(node)
        self.request.environ['_filtered_children'] = children
        return children
    
    def sorted_children(self, sort, order):
        children = self.filtered_children
        if sort in self.sort_keys:
            children = sorted(children, key=self.sort_keys[sort])
            if order == 'asc':
                children.reverse()
        return children
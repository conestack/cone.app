import datetime
from node.utils import instance_property
from pyramid.security import has_permission
from pyramid.i18n import TranslationStringFactory
from cone.tile import tile
from ..interfaces import (
    ICopySupport,
    IWorkflowState,
)
from .table import (
    Table,
    RowData,
)
from .copysupport import extract_copysupport_cookie
from .actions import (
    Toolbar,
    ActionView,
    ViewLink,
    ActionEdit,
    ActionDelete,
)
from .utils import make_url

_ = TranslationStringFactory('cone.app')

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
            and self.permitted('delete')


class ContentsViewLink(ViewLink):
    """Ciew link for contents table.
    """
    css = 'title'
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
    col_defs = [{
            'id': 'actions',
            'title': _('actions', 'Actions'),
            'sort_key': None,
            'sort_title': None,
            'content': 'structure'
        }, {
            'id': 'title',
            'title': _('title', 'Title'),
            'sort_key': 'title',
            'sort_title': _('sort_on_title', 'Sort on title'),
            'content': 'structure'}, {
            'id': 'creator',
            'title': _('creator', 'Creator'),
            'sort_key': 'creator',
            'sort_title': _('sort_on_creator', 'Sort on creator'),
            'content': 'string'
        }, {
            'id': 'created',
            'title': _('created', 'Created'),
            'sort_key': 'created',
            'sort_title': _('sort_on_created', 'Sort on created'),
            'content': 'datetime'
        }, {
            'id': 'modified',
            'title': _('modified', 'Modified'),
            'sort_key': 'modified',
            'sort_title': _('sort_on_modified', 'Sort on modified'),
            'content': 'datetime'}]
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

    def row_data(self, node):
        row_data = RowData()
        row_data['actions'] = self.row_actions(node, self.request)
        row_data['title'] = self.view_link(node, self.request)
        row_data['creator'] = node.metadata.get('creator', 'unknown')
        row_data['created'] = node.metadata.get('created')
        row_data['modified'] = node.metadata.get('modified')
        return row_data

    def sorted_rows(self, start, end, sort, order):
        children = self.sorted_children(sort, order)
        rows = list()
        cut_urls = extract_copysupport_cookie(self.request, 'cut')
        for child in children[start:end]:
            row_data = self.row_data(child)
            target = make_url(self.request, node=child)
            if ICopySupport.providedBy(child):
                row_data.selectable = True
                row_data.target = target
                row_data.css = 'copysupportitem'
                if target in cut_urls:
                    row_data.css += ' copysupport_cut'
            if IWorkflowState.providedBy(child):
                row_data.css += ' state-%s' % child.state
            if hasattr(child, 'node_info_name') and child.node_info_name:
                row_data.css += ' node-type-%s' % child.node_info_name
            rows.append(row_data)
        return rows

    @property
    def listable_children(self):
        return self.model.values()

    @property
    def filtered_children(self):
        if '_filtered_children' in self.request.environ:
            return self.request.environ['_filtered_children']
        children = list()
        term = self.filter_term
        if term:
            term = term.lower()
        for node in self.listable_children:
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

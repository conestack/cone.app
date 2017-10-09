from cone.app.browser import RelatedViewProvider
from cone.app.browser import get_related_view
from cone.app.browser import render_main_template
from cone.app.browser.actions import ActionDelete
from cone.app.browser.actions import ActionEdit
from cone.app.browser.actions import ActionView
from cone.app.browser.actions import Toolbar
from cone.app.browser.actions import ViewLink
from cone.app.browser.copysupport import extract_copysupport_cookie
from cone.app.browser.table import RowData
from cone.app.browser.table import Table
from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.app.interfaces import ICopySupport
from cone.app.interfaces import IWorkflowState
from cone.tile import Tile
from cone.tile import tile
from node.interfaces import ILeaf
from node.utils import instance_property
from plumber import plumbing
from pyramid.i18n import TranslationStringFactory
from pyramid.security import has_permission
from pyramid.view import view_config
import datetime


_ = TranslationStringFactory('cone.app')


FAR_PAST = datetime.datetime(2000, 1, 1)


class ContentsActionView(ActionView):
    title = ActionView.text
    text = None
    action = None
    event = 'contextchanged:#layout'


class ContentsActionEdit(ActionEdit):
    title = ActionEdit.text
    text = None
    action = None
    event = 'contextchanged:#layout'

    @property
    def target(self):
        query = make_query(contenttile='edit')
        return make_url(self.request, node=self.model, query=query)


class ContentsActionDelete(ActionDelete):
    """Delete action for contents table.
    """
    title = ActionDelete.text
    text = None

    @property
    def display(self):
        return self.model.properties.action_delete \
            and has_permission('delete', self.model.parent, self.request) \
            and self.permitted('delete')


class ContentsViewLink(ViewLink):
    """View link for contents table.
    """
    css = 'title'
    event = 'contextchanged:#layout'
    action = None

    @property
    def target(self):
        related_view = get_related_view(self.request)
        if related_view and not ILeaf.providedBy(self.model):
            query = make_query(contenttile=related_view)
            return make_url(self.request, node=self.model, query=query)
        return super(ContentsViewLink, self).target


@tile('contents', 'templates/table.pt', permission='list')
class ContentsTile(Table):
    table_id = 'contents'
    table_tile_name = 'contents'
    col_defs = [{
            'id': 'actions',
            'title': _('actions', default='Actions'),
            'sort_key': None,
            'sort_title': None,
            'content': 'structure'
        }, {
            'id': 'title',
            'title': _('title', default='Title'),
            'sort_key': 'title',
            'sort_title': _('sort_on_title', default='Sort on title'),
            'content': 'structure'
        }, {
            'id': 'creator',
            'title': _('creator', default='Creator'),
            'sort_key': 'creator',
            'sort_title': _('sort_on_creator', default='Sort on creator'),
            'content': 'string'
        }, {
            'id': 'created',
            'title': _('created', default='Created'),
            'sort_key': 'created',
            'sort_title': _('sort_on_created', default='Sort on created'),
            'content': 'datetime'
        }, {
            'id': 'modified',
            'title': _('modified', default='Modified'),
            'sort_key': 'modified',
            'sort_title': _('sort_on_modified', default='Sort on modified'),
            'content': 'datetime'
        }
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
                metadata = node.metadata
                title = metadata.get('title')
                title = title.lower() if title else ''
                creator = metadata.get('creator')
                creator = creator.lower() if creator else ''
                if title.find(term) == -1 and creator.find(term) == -1:
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


@tile(name='listing', path='templates/listing.pt', permission='list')
@plumbing(RelatedViewProvider)
class ListingTile(Tile):
    """Tile rendering the listing.
    """
    related_view = 'listing'


@view_config('listing', permission='list')
def listing(model, request):
    """Listing view
    """
    return render_main_template(model, request, 'listing')

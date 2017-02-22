from cone.app.browser.actions import LinkAction
from cone.app.browser.actions import Toolbar
from cone.app.browser.contents import ContentsTile
from cone.app.browser.layout import PathBar
from cone.app.browser.table import RowData
from cone.app.browser.utils import make_query
from cone.app.browser.utils import request_property
from cone.app.browser.utils import make_url
from cone.app.interfaces import INavigationLeaf
from cone.tile import Tile
from cone.tile import registerTile
from cone.tile import render_tile
from cone.tile import tile
from node.interfaces import IUUIDAware
from node.utils import LocationIterator
from node.utils import instance_property
from node.utils import node_by_path
from pyramid.i18n import TranslationStringFactory
from yafowil.base import UNSET
from yafowil.base import factory
from yafowil.base import fetch_value
from yafowil.common import generic_extractor
from yafowil.common import generic_required_extractor
from yafowil.common import select_display_renderer
from yafowil.common import select_edit_renderer
from yafowil.common import select_extractor
from yafowil.utils import Tag
from yafowil.utils import cssclasses
from yafowil.utils import cssid
import types


_ = TranslationStringFactory('cone.app')


# XXX: define i18n translation callback for app
tag = Tag(lambda x: x)


def make_refbrowser_query(request, **kw):
    params = {
        'root': request.params['root'],
        'referencable': request.params['referencable'],
        'selected': request.params['selected'],
    }
    params.update(kw)
    return make_query(**params)


class ReferenceBrowserModelMixin(object):

    @request_property
    def referencable_root(self):
        return node_by_path(
            self.model.root,
            self.request.params['root'].strip('/')
        )

    @request_property
    def referencebrowser_model(self):
        root = self.referencable_root
        if root in LocationIterator(self.model):
            return self.model
        return root


@tile('referencebrowser', 'templates/referencebrowser.pt', permission='view')
class ReferenceBrowser(Tile, ReferenceBrowserModelMixin):

    @property
    def referencebrowser_pathbar(self):
        return render_tile(
            self.referencebrowser_model,
            self.request,
            'referencebrowser_pathbar'
        )

    @property
    def referencelisting(self):
        return render_tile(
            self.referencebrowser_model,
            self.request,
            'referencelisting'
        )


@tile('referencebrowser_pathbar', 'templates/referencebrowser_pathbar.pt',
      permission='view')
class ReferenceBrowserPathBar(PathBar, ReferenceBrowserModelMixin):

    @property
    def items(self):
        return self.items_for(
            self.referencebrowser_model,
            breakpoint=self.referencable_root
        )

    def item_url(self, node):
        query = make_refbrowser_query(self.request)
        return make_url(self.request, node=node, query=query)

    def item_target(self, node):
        query = make_refbrowser_query(
            self.request, contenttile=node.properties.default_content_tile)
        return make_url(self.request, node=node, query=query)


class ReferenceAction(LinkAction):
    target = None
    href = LinkAction.target

    @property
    def selected_uids(self):
        return self.request.params['selected'].split(',')

    @property
    def id(self):
        return 'ref-%s' % self.model.uuid

    @property
    def display(self):
        referencable = self.request.params['referencable']
        referencable = referencable.find(',') > -1 \
            and referencable.split(',') or [referencable]
        return IUUIDAware.providedBy(self.model) \
            and self.model.node_info_name in referencable

    def render(self):
        rendered = LinkAction.render(self)
        attrs = {
            'class_': 'reftitle',
            'style': 'display:none;',
        }
        title = self.model.metadata.get('title', self.model.name)
        return rendered + tag('span', title, **attrs)


class ActionAddReference(ReferenceAction):
    css = 'addreference'
    title = _('add_reference', default='Add reference')
    icon = 'ion-plus-round'

    @property
    def enabled(self):
        if IUUIDAware.providedBy(self.model):
            return not str(self.model.uuid) in self.selected_uids
        return False


class ActionRemoveReference(ReferenceAction):
    css = 'removereference'
    title = _('remove_reference', default='Remove reference')
    icon = 'ion-minus-round'

    @property
    def enabled(self):
        if IUUIDAware.providedBy(self.model):
            return str(self.model.uuid) in self.selected_uids
        return False


class ReferencableChildrenLink(LinkAction):
    event = 'contextchanged:.refbrowsersensitiv'

    def __init__(self, table_tile_name, table_id):
        self.table_tile_name = table_tile_name
        self.table_id = table_id

    @property
    def target(self):
        return '%s%s' % (super(ReferencableChildrenLink, self).target,
                         make_refbrowser_query(self.request))

    @property
    def text(self):
        return self.model.metadata.get('title', self.model.name)

    @property
    def action(self):
        return '%s:#%s:replace' % (self.table_tile_name, self.table_id)

    @property
    def display(self):
        return self.permitted('view')

    @property
    def icon(self):
        return self.model.nodeinfo.icon

    def render(self):
        if INavigationLeaf.providedBy(self.model):
            return u'{}&nbsp;{}'.format(
                tag('span', class_=self.icon),
                tag('span', self.text)
            )
        return LinkAction.render(self)


@tile('referencelisting', 'templates/table.pt', permission='view')
class ReferenceListing(ContentsTile):
    table_id = 'referencebrowser'
    table_tile_name = 'referencelisting'
    col_defs = [
        {
            'id': 'actions',
            'title': _('table_actions', default='Actions'),
            'sort_key': None,
            'sort_title': None,
            'content': 'structure',
        },
        {
            'id': 'title',
            'title': _('title', default='Title'),
            'sort_key': None,
            'sort_title': None,
            'content': 'structure',
        },
    ]
    query_whitelist = ['root', 'referencable', 'selected']

    @instance_property
    def row_actions(self):
        row_actions = Toolbar()
        row_actions['add'] = ActionAddReference()
        row_actions['remove'] = ActionRemoveReference()
        return row_actions

    @instance_property
    def referencable_children_link(self):
        return ReferencableChildrenLink(self.table_tile_name, self.table_id)

    def sorted_rows(self, start, end, sort, order):
        children = self.sorted_children(sort, order)
        rows = list()
        for child in children[start:end]:
            row_data = RowData()
            row_data['actions'] = self.row_actions(child, self.request)
            row_data['title'] = \
                self.referencable_children_link(child, self.request)
            rows.append(row_data)
        return rows


def reference_extractor(widget, data):
    if widget.attrs.get('multivalued'):
        return select_extractor(widget, data)
    return data.request.get('%s.uid' % widget.dottedpath)


def wrap_ajax_target(rendered, widget, data):
    if widget.attrs.get('target'):
        target = widget.attrs.get('target')
        if callable(target):
            target = target()
        referencable = widget.attrs['referencable']
        if callable(referencable):
            referencable = referencable()
        if type(referencable) in [types.ListType, types.TupleType]:
            referencable = ','.join(referencable)
        root = widget.attrs['root']
        if callable(root):
            root = root()
        selected = ''
        if widget.attrs['multivalued'] and data.value:
            selected = ','.join(data.value)
        elif data.value and data.value[0]:
            selected = data.value[0]
        query = make_query(**{
            'root': root,
            'referencable': referencable,
            'selected': selected,
        })
        target = '%s%s' % (target, query)
        attrs = {
            'ajax:target': target,
        }
        return tag('span', rendered, **attrs)
    return rendered


def reference_edit_renderer(widget, data):
    """Properties:

    multivalued
        flag whether reference field is multivalued.

    vocabulary
        if multivalued, provide a vocabulary mapping uids to node names.

    target
        ajax target for reference browser triggering.

    root
        path of reference browser root. Defaults to '/'

    referencable
        list of node info names which are referencable.  Defaults to '',
        which means all objects are referencable, given they provide
        ``IUUIDAware`` and a node info.
    """
    if widget.attrs.get('multivalued'):
        rendered = select_edit_renderer(widget, data)
        return wrap_ajax_target(rendered, widget, data)
    value = ['', '']
    if data.extracted is not UNSET:
        value = [data.extracted, data.request.get(widget.dottedpath)]
    elif data.request.get('%s.uid' % widget.dottedpath):
        value = [
            data.request.get('%s.uid' % widget.dottedpath),
            data.request.get(widget.dottedpath),
        ]
    elif data.value is not UNSET and data.value is not None:
        value = data.value
    text_attrs = {
        'type': 'text',
        'value': value[1],
        'name_': widget.dottedpath,
        'id': cssid(widget, 'input'),
        'class_': cssclasses(widget, data),
        'readonly': 'readonly',
    }
    hidden_attrs = {
        'type': 'hidden',
        'value': value[0],
        'name_': '%s.uid' % widget.dottedpath,
    }
    rendered = tag('input', **text_attrs) + tag('input', **hidden_attrs)
    return wrap_ajax_target(rendered, widget, data)


def reference_display_renderer(widget, data):
    if widget.attrs.get('multivalued'):
        return select_display_renderer(widget, data)
    value = fetch_value(widget, data)
    if value in [UNSET, u'', None]:
        value = u''
    else:
        value = value[1]
    attrs = {
        'id': cssid(widget, 'display'),
        'class_': 'display-%s' % widget.attrs['class'] or 'generic'
    }
    return data.tag('div', value, **attrs)


factory.register(
    'reference',
    extractors=[generic_extractor, generic_required_extractor,
                reference_extractor],
    edit_renderers=[reference_edit_renderer],
    display_renderers=[reference_display_renderer])

factory.defaults['reference.required_class'] = 'required'

factory.defaults['reference.default'] = ''

factory.defaults['reference.format'] = 'block'

factory.defaults['reference.class'] = 'referencebrowser'

factory.defaults['reference.multivalued'] = False

factory.defaults['reference.root'] = '/'

factory.defaults['reference.referencable'] = ''

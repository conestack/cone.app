from cone.app import compat
from cone.app import get_root
from cone.app.browser.actions import LinkAction
from cone.app.browser.actions import Toolbar
from cone.app.browser.contents import ContentsTile
from cone.app.browser.layout import PathBar
from cone.app.browser.table import RowData
from cone.app.browser.utils import make_query
from cone.app.browser.utils import make_url
from cone.app.browser.utils import request_property
from cone.app.interfaces import INavigationLeaf
from cone.tile import render_tile
from cone.tile import Tile
from cone.tile import tile
from node.interfaces import IUUID
from node.utils import instance_property
from node.utils import LocationIterator
from node.utils import node_by_path
from pyramid.i18n import TranslationStringFactory
from pyramid.threadlocal import get_current_request
from yafowil.base import factory
from yafowil.base import UNSET
from yafowil.common import generic_required_extractor
from yafowil.common import select_display_renderer
from yafowil.common import select_edit_renderer
from yafowil.common import select_extractor
from yafowil.utils import attr_value
from yafowil.utils import cssclasses
from yafowil.utils import cssid
from yafowil.utils import managedprops
from yafowil.utils import Tag
from yafowil.utils import vocabulary


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


@tile(name='referencebrowser',
      path='templates/referencebrowser.pt',
      permission='view')
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


@tile(name='referencebrowser_pathbar',
      path='templates/referencebrowser_pathbar.pt',
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
        return [it for it in self.request.params['selected'].split(',') if it]

    @property
    def id(self):
        return 'ref-{}'.format(self.model.uuid)

    @property
    def display(self):
        if not IUUID.providedBy(self.model):
            return False
        referencable = self.request.params['referencable']
        if not referencable:
            return True
        referencable = [it for it in referencable.split(',') if it]
        return self.model.node_info_name in referencable

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
    icon = 'glyphicons glyphicons-plus-sign'

    @property
    def enabled(self):
        if IUUID.providedBy(self.model):
            return not str(self.model.uuid) in self.selected_uids
        return False


class ActionRemoveReference(ReferenceAction):
    css = 'removereference'
    title = _('remove_reference', default='Remove reference')
    icon = 'glyphicons glyphicons-minus-sign'

    @property
    def enabled(self):
        if IUUID.providedBy(self.model):
            return str(self.model.uuid) in self.selected_uids
        return False


class ReferencableChildrenLink(LinkAction):
    event = 'contextchanged:.refbrowsersensitiv'

    def __init__(self, table_tile_name, table_id):
        self.table_tile_name = table_tile_name
        self.table_id = table_id

    @property
    def target(self):
        return '{}{}'.format(
            super(ReferencableChildrenLink, self).target,
            make_refbrowser_query(self.request))

    @property
    def text(self):
        return self.model.metadata.get('title', self.model.name)

    @property
    def action(self):
        return '{}:#{}:replace'.format(self.table_tile_name, self.table_id)

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


@tile(name='referencelisting', path='templates/table.pt', permission='view')
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


def fetch_reference_value(widget, data):
    if data.extracted is not UNSET:
        return data.extracted
    if data.value is not UNSET:
        if widget.attrs.get('multivalued'):
            return data.value
        else:
            return data.value[0]
    return attr_value('default', widget, data)


@managedprops('multivalued')
def reference_extractor(widget, data):
    if widget.attrs.get('multivalued'):
        return select_extractor(widget, data)
    if widget.dottedpath not in data.request:
        return UNSET
    return data.request['{}.uid'.format(widget.dottedpath)]


def wrap_ajax_target(rendered, widget, data):
    target = widget.attrs['target']
    if not target:
        request = data.request.request
        request = request if request else get_current_request()
        target = make_url(request, node=get_root())
    if callable(target):
        target = target(widget, data)
    referencable = widget.attrs['referencable']
    if callable(referencable):
        referencable = referencable(widget, data)
    if type(referencable) in compat.ITER_TYPES:
        referencable = ','.join(referencable)
    if not referencable:
        referencable = ''
    root = widget.attrs['root']
    if callable(root):
        root = root(widget, data)
    value = fetch_reference_value(widget, data)
    selected = ''
    if widget.attrs['multivalued'] and value:
        selected = ','.join(value)
    elif value:
        selected = value
    query = make_query(**{
        'root': root,
        'referencable': referencable,
        'selected': selected,
    })
    target = '{}{}'.format(target, query)
    attrs = {
        'ajax:target': target,
    }
    return tag('span', rendered, **attrs)


def reference_trigger_renderer(widget, data):
    attrs = {
        'class': 'referencebrowser_trigger',
        'data-reference-name': widget.dottedpath
    }
    return data.tag(
        'span',
        tag('i', '', class_='ion-android-share'),
        _('browse', default='Browse'),
        **attrs
    )


def multivalued_reference_vocab(widget, data):
    vocab = list()
    bc_vocab = attr_value('bc_vocabulary', widget, data)
    if bc_vocab:
        for uuid_, label in vocabulary(bc_vocab):
            vocab.append((uuid_, label))
        return vocab
    if widget.dottedpath in data.request:
        value = data.request[widget.dottedpath]
        if isinstance(value, compat.STR_TYPE):
            value = [value]
    else:
        if callable(widget.getter):
            value = widget.getter(widget, data)
        else:
            value = widget.getter
    if not value:
        value = list()
    lookup = widget.attrs.get('lookup')
    for uuid_ in value:
        vocab.append((uuid_, lookup(uuid_) if lookup else uuid_))
    return vocab


def prepare_vocab_property(widget, data):
    if 'vocabulary' in widget.attrs and 'bc_vocabulary' not in widget.attrs:
        widget.attrs['bc_vocabulary'] = widget.attrs['vocabulary']
        del widget.attrs['vocabulary']
    if 'vocabulary' not in widget.attrs:
        widget.attrs['vocabulary'] = multivalued_reference_vocab(widget, data)


def fetch_reference_label(widget, data):
    label = ''
    if widget.dottedpath in data.request:
        label = data.request[widget.dottedpath]
    elif data.value is not UNSET:
        label = data.value[1]
    return label


@managedprops(
    'multivalued', 'vocabulary', 'target',
    'root', 'referencable', 'lookup')
def reference_edit_renderer(widget, data):
    if widget.attrs.get('multivalued'):
        prepare_vocab_property(widget, data)
        rendered = select_edit_renderer(widget, data)
        trigger = reference_trigger_renderer(widget, data)
        return wrap_ajax_target(rendered + trigger, widget, data)
    label = fetch_reference_label(widget, data)
    value = fetch_reference_value(widget, data)
    text_attrs = {
        'type': 'text',
        'value': label,
        'name_': widget.dottedpath,
        'id': cssid(widget, 'input'),
        'class_': cssclasses(widget, data),
        'readonly': 'readonly',
    }
    hidden_attrs = {
        'type': 'hidden',
        'value': value if value else '',
        'name_': '{}.uid'.format(widget.dottedpath),
    }
    rendered = tag('input', **text_attrs) + tag('input', **hidden_attrs)
    trigger = reference_trigger_renderer(widget, data)
    return wrap_ajax_target(rendered + trigger, widget, data)


def reference_display_renderer(widget, data):
    if widget.attrs.get('multivalued'):
        prepare_vocab_property(widget, data)
        return select_display_renderer(widget, data)
    label = fetch_reference_label(widget, data)
    attrs = {
        'id': cssid(widget, 'display'),
        'class_': 'display-{}'.format(widget.attrs['class'] or 'generic')
    }
    return data.tag('div', label, **attrs)


factory.register(
    'reference',
    extractors=[
        reference_extractor,
        generic_required_extractor
    ],
    edit_renderers=[reference_edit_renderer],
    display_renderers=[reference_display_renderer])

factory.defaults['reference.required_class'] = 'required'

factory.defaults['reference.default'] = ''

factory.defaults['reference.format'] = 'block'

factory.defaults['reference.class'] = 'referencebrowser form-control'

factory.defaults['reference.target'] = None
factory.doc['props']['reference.target'] = """\
Ajax target for reference browser triggering. If not defined, application root
is used.
"""

factory.defaults['reference.root'] = '/'
factory.doc['props']['reference.root'] = """\
Path of reference browser root. Defaults to '/'
"""

factory.defaults['reference.referencable'] = None
factory.doc['props']['reference.referencable'] = """\
Node info name or list of node info names which are referencable. Defaults to
None which means all objects are referenceable, given they implement
``node.interfaces.IUUID`` and provide a node info.
"""

factory.defaults['reference.multivalued'] = False
factory.doc['props']['reference.multivalued'] = """\
Flag whether reference field is multivalued.
"""

factory.defaults['reference.lookup'] = None
factory.doc['props']['reference.lookup'] = """\
Callback accepting reference uid as argument. It is used to lookup the label of
referenced items if multivalued.
"""

factory.doc['props']['reference.vocabulary'] = """\
This property is deprecated and only kept for B/C reasons. Use ``lookup``
instead. If multivalued, provide a vocabulary mapping uids to node names.
"""

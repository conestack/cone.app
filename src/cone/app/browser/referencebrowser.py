from node.interfaces import IUUIDAware
from node.utils import (
    instance_property,
    LocationIterator,
)
from cone.tile import (
    tile,
    registerTile,
)
from cone.app.browser.layout import PathBar
from cone.app.browser.table import RowData
from cone.app.browser.contents import ContentsTile
from cone.app.browser.actions import LinkAction
from cone.app.browser.utils import make_url
from yafowil.base import (
    factory,
    UNSET,
    fetch_value,
)
from yafowil.common import (
    generic_extractor,
    generic_required_extractor,
    select_edit_renderer,
    select_display_renderer,
    select_extractor,
)
from yafowil.utils import (
    Tag,
    cssid,
    cssclasses,
)


# XXX: define i18n translation callback for app
tag = Tag(lambda x: x)


registerTile('referencebrowser',
             'cone.app:browser/templates/referencebrowser.pt',
             permission='view')


@tile('referencebrowser_pathbar', 'templates/referencebrowser_pathbar.pt',
      permission='view')
class ReferenceBrowserPathBar(PathBar):

    @property
    def items(self):
        breakpoint = None
        for node in LocationIterator(self.model):
            if node.properties.referenceable_root:
                breakpoint = node
                break
        return self.items_for(self.model, breakpoint)


class ActionAddReference(LinkAction):
    css = 'add16_16 addreference'
    title = 'Add reference'
    target = None
    href = LinkAction.target

    @property
    def id(self):
        return 'ref-%s' % self.model.uuid

    @property
    def display(self):
        return IUUIDAware.providedBy(self.model) \
            and self.model.properties.action_add_reference

    def render(self):
        rendered = LinkAction.render(self)
        attrs = {
            'class_': 'reftitle',
            'style': 'display:none;',
        }
        title = self.model.metadata.get('title', self.model.name)
        return rendered + tag('span', title, **attrs)


class ReferencableChildrenLink(LinkAction):
    event = 'contextchanged:.refbrowsersensitiv'

    def __init__(self, table_tile_name, table_id):
        self.table_tile_name = table_tile_name
        self.table_id = table_id

    @property
    def text(self):
        return self.model.metadata.get('title', self.model.name)

    @property
    def action(self):
        return '%s:#%s:replace' % (self.table_tile_name, self.table_id)

    @property
    def display(self):
        return self.permitted('view')

    def render(self):
        if not self.model.properties.get('leaf'):  # XXX: IAppLeaf
            return LinkAction.render(self)
        return self.text


@tile('referencelisting', 'templates/table.pt', permission='view')
class ReferenceListing(ContentsTile):

    table_id = 'referencebrowser'
    table_tile_name = 'referencelisting'
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

    @instance_property
    def action_add_reference(self):
        return ActionAddReference()

    @instance_property
    def referencable_children_link(self):
        return ReferencableChildrenLink(self.table_tile_name, self.table_id)

    def sorted_rows(self, start, end, sort, order):
        children = self.sorted_children(sort, order)
        rows = list()
        for child in children[start:end]:
            row_data = RowData()
            row_data['actions'] = self.action_add_reference(
                child, self.request)
            row_data['title'] = \
                self.referencable_children_link(child, self.request)
            row_data['created'] = child.metadata.get('created')
            row_data['modified'] = child.metadata.get('modified')
            rows.append(row_data)
        return rows


def reference_extractor(widget, data):
    if widget.attrs.get('multivalued'):
        return select_extractor(widget, data)
    return data.request.get('%s.uid' % widget.dottedpath)


def wrap_ajax_target(rendered, widget):
    if widget.attrs.get('target'):
        target = widget.attrs.get('target')
        if callable(target):
            target = target()
        attrs = {
            'ajax:target': target,
        }
        return tag('span', rendered, **attrs)
    return rendered


def reference_edit_renderer(widget, data):
    """Properties:

    multivalued
        flag whether reference field is multivalued

    target
        ajax target for reference browser triggering
    """
    if widget.attrs.get('multivalued'):
        return wrap_ajax_target(select_edit_renderer(widget, data), widget)
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
    }
    hidden_attrs = {
        'type': 'hidden',
        'value': value[0],
        'name_': '%s.uid' % widget.dottedpath,
    }
    return wrap_ajax_target(
        tag('input', **text_attrs) + tag('input', **hidden_attrs), widget)


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

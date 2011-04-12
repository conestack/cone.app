from cone.tile import (
    tile,
    registerTile,
)
from cone.app.browser.layout import PathBar
from cone.app.browser.contents import (
    ContentsTile,
    ContentsBatch,
)
from yafowil.base import (
    factory,
    UNSET,
    ExtractionError,
)
from yafowil.common import (
    generic_extractor,
    generic_required_extractor,
    select_renderer,
    select_extractor,
)
from yafowil.utils import (
    tag,
    cssid,
    cssclasses,
)


registerTile('referencebrowser',
             'cone.app:browser/templates/referencebrowser.pt',
             permission='view')


registerTile('referencebrowser_pathbar',
             'cone.app:browser/templates/referencebrowser_pathbar.pt',
             permission='view',
             class_=PathBar)


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
    
    def sorted_rows(self, start, end, sort, order):
        children = self.sorted_children(sort, order)
        rows = list()
        for child in children[start:end]:
            row_data = RowData()
            row_data['actions'] = Item(actions=self.create_actions(child))
            value = child.metadata.get('title', child.__name__)
            if not child.properties.get('leaf'):
                link = target = make_url(node=child)
                title = Item(value, link, target)
            else:
                title = Item(value)
            row_data['title'] = title
            row_data['created'] = Item(child.metadata.get('created'))
            row_data['modified'] = Item(child.metadata.get('modified'))
            rows.append(row_data)
        return rows
    
    def create_actions(self, node):
        actions = list()
        if not node.properties.get('referencable'):
            return actions
        url = make_url(node=node)
        attrs = {
            'href': url,
            'id': 'ref-%s' % node.metadata.get('uid', ''),
            'title': 'Add reference',
            'class_': 'add16_16 addreference',
        }
        rendered = tag('a', '&nbsp;', **attrs)
        attrs = {
            'class_': 'reftitle',
            'style': 'display:none;',
        }
        title = node.metadata.get('title', node.__name__)
        rendered += tag('span', title, **attrs)
        actions.append(Action(rendered=rendered))
        return actions


#@tile('referencelisting', 'templates/referencelisting.pt', permission='view')
#class ReferenceListing(ContentsTile):
#    
#    @property
#    def batch(self):
#        batch = ContentsBatch(self.contents)
#        batch.name = 'referencebatch'
#        return batch(self.model, self.request)


def reference_extractor(widget, data):
    if widget.attrs.get('multivalued'):
        return select_extractor(widget, data)
    return data.request.get('%s.uid' % widget.dottedpath)


def wrap_ajax_target(rendered, widget):
    if widget.attrs.get('target'):
        attrs = {
            'ajax:target': widget.attrs.get('target'),
        }
        return tag('span', rendered, **attrs)
    return rendered


def reference_renderer(widget, data):
    """Properties:
    
    ``multivalued``: flag whether reference field is multivalued
    ``target``: ajax target for reference browser triggering
    """
    if widget.attrs.get('multivalued'):
        return wrap_ajax_target(select_renderer(widget, data), widget)
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


factory.defaults['reference.required_class'] = 'required'
factory.defaults['reference.default'] = ''
factory.defaults['reference.format'] = 'block'
factory.defaults['reference.class'] = 'referencebrowser'
factory.register(
    'reference', 
    [
        generic_extractor,
        generic_required_extractor,
        reference_extractor,
    ], 
    [
        reference_renderer,
    ],
)
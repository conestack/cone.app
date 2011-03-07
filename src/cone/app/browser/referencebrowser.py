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
             permission='view',
             strict=False)


registerTile('referencebrowser_pathbar',
             'cone.app:browser/templates/referencebrowser_pathbar.pt',
             permission='view',
             class_=PathBar,
             strict=False)


@tile('referencelisting', 'templates/referencelisting.pt', 
      permission='view', strict=False)
class ReferenceListing(ContentsTile):
    
    @property
    def batch(self):
        batch = ContentsBatch(self.contents)
        batch.name = 'referencebatch'
        return batch(self.model, self.request)


def reference_extractor(widget, data):
    if widget.attrs.get('multivalued'):
        return select_extractor(widget, data)
    return data.request.get('%s.uid' % widget.dottedpath)


def reference_renderer(widget, data):
    if widget.attrs.get('multivalued'):
        return select_renderer(widget, data)
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
    return tag('input', **text_attrs) + tag('input', **hidden_attrs)


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
from cone.app import cfg
from node.utils import UNSET
from yafowil.base import factory
from yafowil.base import Widget
from yafowil.compound import compound_renderer
from yafowil.utils import managedprops


@managedprops()
def translation_extractor(widget, data):
    return data.extracted


def filtered_chain(chain, keep):
    return [cb for cb in chain if cb[0] == keep]


def duplicate_widget(widget, keep):
    return Widget(
        widget.blueprints,
        filtered_chain(widget.extractors, keep),
        filtered_chain(widget.edit_renderers, keep),
        filtered_chain(widget.display_renderers, keep),
        widget.preprocessors,
        properties=widget.properties,
        custom=widget.custom,
        defaults=widget.defaults,
        mode=widget.mode
    )


def translation_tabs_renderer(widget, data):
    li = list()
    for idx, lang in enumerate(widget.attrs['languages']):
        a = data.tag('a', lang, href=u'#input-{}-{}'.format(
            widget.dottedpath.replace(u'.', u'-'),
            lang
        ))
        li.append(data.tag('li', a, class_='active' if idx == 0 else None))
    return data.tag('ul', *li, class_='nav nav-tabs')


factory.register(
    'translationtabs',
    edit_renderers=[
        translation_tabs_renderer
    ],
    display_renderers=[
        translation_tabs_renderer
    ]
)


@managedprops()
def translation_edit_renderer(widget, data):
    widget['tabs'] = factory(
        'translationtabs',
        props={
            'structural': True,
            'languages': cfg.available_languages
        }
    )
    for lang in cfg.available_languages:
        translation = widget[lang] = duplicate_widget(
            widget,
            widget.blueprints[-1]
        )
        translation.getter = widget.getter.get(lang, UNSET) if widget.getter else UNSET


@managedprops()
def translation_display_renderer(widget, data):
    return u''


factory.register(
    'translation',
    extractors=[
        translation_extractor
    ],
    edit_renderers=[
        translation_edit_renderer,
        compound_renderer
    ],
    display_renderers=[
        translation_display_renderer
    ]
)

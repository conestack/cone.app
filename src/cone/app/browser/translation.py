from cone.app import cfg
from node.utils import UNSET
from yafowil.base import factory
from yafowil.base import Widget
from yafowil.compound import compound_extractor
from yafowil.compound import compound_renderer
from yafowil.utils import managedprops


@managedprops('factory')
def translation_extractor(widget, data):
    widget()
    compound_extractor(widget, data)
    translation_factory = widget.attrs.get('factory', dict)
    extracted = translation_factory()
    errors = list()
    for lang in cfg.available_languages:
        lang_data = data[lang]
        value = lang_data.extracted
        if value is UNSET:
            extracted = UNSET
            break
        extracted[lang] = lang_data.extracted
        errors += lang_data.errors
    if errors:
        # Raise first occured error. If we encounter a case where we need
        # to display multiple error messages, we need to hook them up to
        # data.errors directly here
        raise errors[0]
    return extracted


def filtered_chain(chain, keep):
    return [cb for cb in chain if cb[0] == keep]


def duplicate_widget(widget, keep):
    return Widget(
        widget.blueprints,
        filtered_chain(widget.extractors, keep),
        filtered_chain(widget.edit_renderers, keep),
        filtered_chain(widget.display_renderers, keep),
        filtered_chain(widget.preprocessors, keep),
        properties=widget.properties,
        custom=widget.custom,
        defaults=widget.defaults,
        mode=widget.mode
    )


def translation_tabs_renderer(widget, data):
    li = list()
    for idx, lang in enumerate(cfg.available_languages):
        lang_data = data.get(lang)
        has_errors = lang_data and lang_data.has_errors
        lang_text = lang.upper()
        if has_errors:
            lang_text = u'* {}'.format(lang_text)
        a = data.tag('a', lang_text, href=u'#translation-{}-{}'.format(
            widget.dottedpath.replace(u'.', u'-'),
            lang
        ))
        li_css = ['active'] if idx == 0 else []
        if has_errors:
            li_css.append('error')
        li_css = ' '.join(li_css) if li_css else None
        li.append(data.tag('li', a, class_=li_css))
    return data.tag('ul', *li, class_='nav nav-pills translation-nav')


factory.register(
    'translationtabs',
    edit_renderers=[
        translation_tabs_renderer
    ],
    display_renderers=[
        translation_tabs_renderer
    ]
)


def translation_edit_renderer(widget, data):
    widget['tabs'] = factory(
        'translationtabs',
        props={
            'structural': True,
        }
    )
    translations = widget['translations'] = factory(
        'div',
        props={
            'class': 'translation-fields',
            'structural': True
        })
    for lang in cfg.available_languages:
        translation = translations['translation_{}'.format(lang)] = factory(
            'div',
            props={
                'id': 'translation-{}-{}'.format(
                    widget.dottedpath.replace(u'.', u'-'),
                    lang
                ),
                'structural': True
            })
        translation[lang] = duplicate_widget(widget, widget.blueprints[-1])


def translation_display_renderer(widget, data):
    translation_edit_renderer(widget, data)
    translations = widget['translations']
    for lang in cfg.available_languages:
        translation = translations['translation_{}'.format(lang)]
        translation[lang].mode = 'display'


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
        translation_display_renderer,
        compound_renderer
    ]
)

factory.doc['blueprint']['translation'] = """\
Widget for rendering translations.
"""

factory.defaults['translation.factory'] = None
factory.doc['props']['translation.factory'] = """\
A class used as factory for creating translations at extraction time.
"""

from cone.app.browser import RelatedViewProvider
from cone.app.browser.authoring import ContentAddForm
from cone.app.browser.authoring import ContentEditForm
from cone.app.browser.form import AddFormTarget
from cone.app.browser.form import EditFormTarget
from cone.app.browser.form import Form
from cone.app.browser.form import YAMLAddFormTarget
from cone.app.browser.form import YAMLEditFormTarget
from cone.app.browser.form import YAMLForm
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import choose_name
from cone.app.browser.utils import make_url
from cone.app.utils import add_creation_metadata
from cone.app.utils import update_creation_metadata
from cone.example.model import Translation
from cone.example.model import _
from cone.example.wiki.model import Wiki
from cone.example.wiki.model import WikiPage
from cone.tile import tile
from cone.tile import Tile
from node.utils import UNSET
from plumber import plumbing
from pyramid.i18n import TranslationStringFactory
from yafowil.base import factory
from yafowil.persistence import write_mapping_writer
import os


# View tile for Wiki container
@tile(name='view',
      path='cone.example.wiki:templates/wiki_container_view.pt',
      interface=Wiki,
      permission='login')
class WikiContainerView(ProtectedContentTile):
    pass


# View tile for WikiPage
@tile(name='content',
      path='cone.example.wiki:templates/wiki_view.pt',
      interface=WikiPage,
      permission='login')
class WikiPageView(ProtectedContentTile):

    @property
    def references(self):
        """Resolve reference UUIDs to actual nodes for display."""
        refs = self.model.attrs.get('references', [])
        if not refs:
            return []
        result = []
        # Walk up to find wiki container to search for referenced pages
        wiki = self.model.parent
        for page in wiki.values():
            if hasattr(page, 'uuid') and str(page.uuid) in refs:
                result.append({
                    'title': page.metadata.title,
                    'target': make_url(self.request, node=page),
                    'icon': page.metadata.icon or 'bi-journal-text',
                })
        return result


# WikiPage form using standard yafowil factory
class WikiPageForm(Form):

    def prepare(self):
        self.form = form = factory(
            'form',
            name='wikipageform',
            props={
                'action': self.form_action,
                'persist_writer': write_mapping_writer
            })
        form['title'] = factory(
            'field:label:help:error:translation:text',
            value=self.model.attrs.get('title', UNSET),
            props={
                'factory': Translation,
                'label': _('title', default='Title'),
                'help': _('wiki_title_help', default='Enter a page title'),
                'required': _('title_required', default='Title is required')
            })
        form['description'] = factory(
            'field:label:help:error:translation:textarea',
            value=self.model.attrs.get('description', UNSET),
            props={
                'factory': Translation,
                'label': _('description', default='Description'),
                'help': _('wiki_desc_help', default='Short description'),
                'rows': 2
            })
        form['body'] = factory(
            'field:label:help:error:textarea',
            value=self.model.attrs.get('body', UNSET),
            props={
                'label': _('body', default='Content'),
                'help': _('wiki_body_help', default='Enter wiki page content'),
                'rows': 10
            })
        # Reference browser widget for linking to other wiki pages
        form['references'] = factory(
            'field:label:help:error:reference',
            value=self.reference_value,
            props={
                'label': _('references', default='Related Pages'),
                'help': _('references_help',
                          default='Select related wiki pages'),
                'multivalued': True,
                'target': self.reference_target,
                'root': self.reference_root,
                'referencable': 'wiki_page',
                'lookup': self.reference_lookup,
            })
        form['save'] = factory(
            'submit',
            props={
                'action': 'save',
                'expression': True,
                'handler': self.save,
                'next': self.next,
                'label': _('save', default='Save')
            })
        form['cancel'] = factory(
            'submit',
            props={
                'action': 'cancel',
                'expression': True,
                'skip': True,
                'next': self.next,
                'label': _('cancel', default='Cancel')
            })

    @property
    def reference_value(self):
        refs = self.model.attrs.get('references')
        if refs:
            return refs
        return []

    @property
    def reference_target(self):
        return make_url(self.request, node=self.model.root)

    @property
    def reference_root(self):
        # Find the wiki container
        wiki = self.model.parent
        return '/' + '/'.join(wiki.path[1:]) if wiki else '/'

    def reference_lookup(self, uuid):
        """Lookup label for a reference UUID."""
        wiki = self.model.parent
        for page in wiki.values():
            if hasattr(page, 'uuid') and str(page.uuid) == uuid:
                return page.metadata.title
        return uuid

    def save(self, widget, data):
        # Extract references separately since reference widget has special
        # extraction
        refs = data.fetch('wikipageform.references')
        if refs.extracted:
            self.model.attrs['references'] = refs.extracted
        # Write other fields
        data.write(self.model.attrs)


@plumbing(AddFormTarget)
class WikiPageAddForm(WikiPageForm):

    def save(self, widget, data):
        add_creation_metadata(self.request, self.model.attrs)
        super(WikiPageAddForm, self).save(widget, data)
        parent = self.model.parent
        parent[choose_name(parent, self.model.metadata.title)] = self.model


@plumbing(EditFormTarget)
class WikiPageEditForm(WikiPageForm):

    def save(self, widget, data):
        update_creation_metadata(self.request, self.model.attrs)
        super(WikiPageEditForm, self).save(widget, data)


@tile(name='addform', interface=WikiPage, permission='add')
@plumbing(ContentAddForm)
class WikiPageContentAddForm(WikiPageAddForm):
    ...


@tile(name='editform', interface=WikiPage, permission='edit')
@plumbing(ContentEditForm)
class WikiPageContentEditForm(WikiPageEditForm):
    ...


# Edit form for Wiki container (just title/description)
@tile(name='editform', interface=Wiki, permission='edit')
@plumbing(ContentEditForm, EditFormTarget)
class WikiEditForm(Form):

    def prepare(self):
        self.form = form = factory(
            'form',
            name='wikiform',
            props={
                'action': self.form_action,
                'persist_writer': write_mapping_writer
            })
        form['title'] = factory(
            'field:label:help:error:translation:text',
            value=self.model.attrs.get('title', UNSET),
            props={
                'factory': Translation,
                'label': _('title', default='Title'),
                'required': _('title_required', default='Title is required')
            })
        form['description'] = factory(
            'field:label:help:error:translation:textarea',
            value=self.model.attrs.get('description', UNSET),
            props={
                'factory': Translation,
                'label': _('description', default='Description'),
                'rows': 3
            })
        form['save'] = factory(
            'submit',
            props={
                'action': 'save',
                'expression': True,
                'handler': self.save,
                'next': self.next,
                'label': _('save', default='Save')
            })
        form['cancel'] = factory(
            'submit',
            props={
                'action': 'cancel',
                'expression': True,
                'skip': True,
                'next': self.next,
                'label': _('cancel', default='Cancel')
            })

    def save(self, widget, data):
        update_creation_metadata(self.request, self.model.attrs)
        data.write(self.model.attrs)


# tutorial

@tile(
    name='tutorial_content',
    path='templates/tutorial_wiki.pt',
    interface=Wiki,
    permission='view',
    strict=False,
)
class WikiContainerTutorial(Tile):
    ...


@tile(
    name='tutorial_content',
    path='templates/tutorial_page.pt',
    interface=WikiPage,
    permission='view',
    strict=False,
)
class WikiPageTutorial(Tile):
    ...

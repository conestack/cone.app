from cone.app.browser.authoring import ContentAddForm
from cone.app.browser.authoring import ContentEditForm
from cone.app.browser.content import content_view_action
from cone.app.browser.content import content_view_tile
from cone.app.browser.form import AddFormTarget
from cone.app.browser.form import EditFormTarget
from cone.app.browser.form import Form
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import choose_name
from cone.app.utils import add_creation_metadata
from cone.app.utils import update_creation_metadata
from cone.example.document.model import Document
from cone.example.document.model import DocumentFolder
from cone.example.document.model import DocumentLibrary
from cone.example.model import Translation
from cone.example.model import _
from cone.tile import tile
from cone.tile import Tile
from node.utils import UNSET
from plumber import plumbing
from yafowil.base import factory
from yafowil.persistence import write_mapping_writer
from cone.example.browser.utils import code_block


# View tile for DocumentLibrary
@tile(name='view',
      path='cone.example.document:templates/library_view.pt',
      interface=DocumentLibrary,
      permission='login')
class DocumentLibraryView(ProtectedContentTile):
    pass


# View tile for DocumentFolder
@tile(name='view',
      path='cone.example.browser:templates/view.pt',
      interface=DocumentFolder,
      permission='login')
class DocumentFolderView(ProtectedContentTile):
    pass


# Content view tile for Document - main view
@content_view_tile(
    name='content',
    path='cone.example.document:templates/document_view.pt',
    interface=Document,
    permission='login')
@content_view_action(
    name='view',
    tilename='content',
    interface=Document,
    permission='view',
    text=_('view', default='View'),
    icon='bi-eye',
    css='dropdown-item')
class DocumentView(ProtectedContentTile):
    pass


# Content view tile for Document - source/raw view
@content_view_tile(
    name='source',
    path='cone.example.document:templates/document_source.pt',
    interface=Document,
    permission='login')
@content_view_action(
    name='source',
    tilename='source',
    interface=Document,
    permission='edit',
    text=_('source', default='Source'),
    icon='bi-code',
    css='dropdown-item')
class DocumentSourceView(ProtectedContentTile):
    pass


# Base form for Document types
class DocumentForm(Form):

    def prepare(self):
        self.form = form = factory(
            'form',
            name='documentform',
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
                'help': _('title_help', default='Enter a title'),
                'required': _('title_required', default='Title is required')
            })
        form['description'] = factory(
            'field:label:help:error:translation:textarea',
            value=self.model.attrs.get('description', UNSET),
            props={
                'factory': Translation,
                'label': _('description', default='Description'),
                'help': _('description_help', default='Enter a description'),
                'rows': 3
            })
        form['body'] = factory(
            'field:label:help:error:textarea',
            value=self.model.attrs.get('body', UNSET),
            props={
                'label': _('body', default='Body'),
                'help': _('body_help', default='Enter the document body'),
                'rows': 10
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
        data.write(self.model.attrs)


# Folder form (title + description only)
class FolderForm(Form):

    def prepare(self):
        self.form = form = factory(
            'form',
            name='folderform',
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
                'help': _('title_help', default='Enter a title'),
                'required': _('title_required', default='Title is required')
            })
        form['description'] = factory(
            'field:label:help:error:translation:textarea',
            value=self.model.attrs.get('description', UNSET),
            props={
                'factory': Translation,
                'label': _('description', default='Description'),
                'help': _('description_help', default='Enter a description'),
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
        data.write(self.model.attrs)


@plumbing(AddFormTarget)
class DocumentAddForm(DocumentForm):

    def save(self, widget, data):
        add_creation_metadata(self.request, self.model.attrs)
        super(DocumentAddForm, self).save(widget, data)
        parent = self.model.parent
        parent[choose_name(parent, self.model.metadata.title)] = self.model


@plumbing(EditFormTarget)
class DocumentEditForm(DocumentForm):

    def save(self, widget, data):
        update_creation_metadata(self.request, self.model.attrs)
        super(DocumentEditForm, self).save(widget, data)


@plumbing(AddFormTarget)
class FolderAddForm(FolderForm):

    def save(self, widget, data):
        add_creation_metadata(self.request, self.model.attrs)
        super(FolderAddForm, self).save(widget, data)
        parent = self.model.parent
        parent[choose_name(parent, self.model.metadata.title)] = self.model


@plumbing(EditFormTarget)
class FolderEditForm(FolderForm):

    def save(self, widget, data):
        update_creation_metadata(self.request, self.model.attrs)
        super(FolderEditForm, self).save(widget, data)


# Add forms
@tile(name='addform', interface=Document, permission='add')
@plumbing(ContentAddForm)
class DocumentContentAddForm(DocumentAddForm):
    ...


@tile(name='addform', interface=DocumentFolder, permission='add')
@plumbing(ContentAddForm)
class FolderContentAddForm(FolderAddForm):
    ...


# Edit forms
@tile(name='editform', interface=Document, permission='edit')
@plumbing(ContentEditForm)
class DocumentContentEditForm(DocumentEditForm):
    ...


@tile(name='editform', interface=DocumentLibrary, permission='edit')
@tile(name='editform', interface=DocumentFolder, permission='edit')
@plumbing(ContentEditForm)
class FolderContentEditForm(FolderEditForm):
    ...


# tutorial

@tile(
    name='tutorial_content',
    path='templates/tutorial_library.pt',
    interface=DocumentLibrary,
    permission='view',
    strict=False,
)
class DocumentLibraryTutorial(Tile):
    ...


@tile(
    name='tutorial_content',
    path='templates/tutorial_folder.pt',
    interface=DocumentFolder,
    permission='view',
    strict=False,
)
class DocumentFolderTutorial(Tile):
    ...


@tile(
    name='tutorial_content',
    path='templates/tutorial_document.pt',
    interface=Document,
    permission='view',
    strict=False,
)
class DocumentTutorial(Tile):
    workflow_code = """\
class Document(WorkflowNode):
    workflow_name = 'document_workflow'
    # states: draft, published, ...
"""

    def example_workflow(self):
        return code_block(self.workflow_code, "python")

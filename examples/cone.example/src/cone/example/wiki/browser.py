from cone.app.browser.authoring import ContentAddForm
from cone.app.browser.authoring import ContentEditForm
from cone.app.browser.form import AddFormTarget
from cone.app.browser.form import EditFormTarget
from cone.app.browser.form import Form
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import choose_name
from cone.app.browser.utils import make_url
from cone.app.utils import add_creation_metadata
from cone.app.utils import update_creation_metadata
from cone.example.browser.utils import code_block
from cone.example.model import Translation
from cone.example.model import _
from cone.example.wiki.model import Wiki
from cone.example.wiki.model import WikiFolder
from cone.example.wiki.model import WikiPage
from cone.tile import tile
from cone.tile import Tile
from node.utils import UNSET
from plumber import plumbing
from yafowil.base import factory
from yafowil.persistence import write_mapping_writer


# View tile for Wiki container
@tile(name='content',
      path='cone.example.wiki:templates/wiki_container_view.pt',
      interface=Wiki,
      permission='login')
class WikiContainerView(ProtectedContentTile):
    pass


# View tile for WikiFolder
@tile(name='content',
      path='cone.example.wiki:templates/wiki_folder_view.pt',
      interface=WikiFolder,
      permission='login')
class WikiFolderView(ProtectedContentTile):
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
        wiki = self._find_wiki_root()
        if wiki:
            self._collect_references(wiki, refs, result)
        return result

    def _find_wiki_root(self):
        """Find the wiki root container."""
        node = self.model.parent
        while node is not None:
            if isinstance(node, Wiki):
                return node
            node = getattr(node, 'parent', None)
        return None

    def _collect_references(self, container, refs, result):
        """Recursively collect referenced pages from container and subfolders."""
        for child in container.values():
            if isinstance(child, WikiFolder):
                self._collect_references(child, refs, result)
            elif hasattr(child, 'uuid') and str(child.uuid) in refs:
                result.append({
                    'title': child.metadata.title,
                    'target': make_url(self.request, node=child),
                    'icon': child.metadata.icon or 'bi-journal-text',
                })


# WikiFolder form
class WikiFolderForm(Form):

    def prepare(self):
        self.form = form = factory(
            'form',
            name='wikifolderform',
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
                'help': _('folder_title_help', default='Enter a folder title'),
                'required': _('title_required', default='Title is required')
            })
        form['description'] = factory(
            'field:label:help:error:translation:textarea',
            value=self.model.attrs.get('description', UNSET),
            props={
                'factory': Translation,
                'label': _('description', default='Description'),
                'help': _('folder_desc_help', default='Short description'),
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
class WikiFolderAddForm(WikiFolderForm):

    def save(self, widget, data):
        add_creation_metadata(self.request, self.model.attrs)
        super(WikiFolderAddForm, self).save(widget, data)
        parent = self.model.parent
        parent[choose_name(parent, self.model.metadata.title)] = self.model


@plumbing(EditFormTarget)
class WikiFolderEditForm(WikiFolderForm):

    def save(self, widget, data):
        update_creation_metadata(self.request, self.model.attrs)
        super(WikiFolderEditForm, self).save(widget, data)


@tile(name='addform', interface=WikiFolder, permission='add')
@plumbing(ContentAddForm)
class WikiFolderContentAddForm(WikiFolderAddForm):
    ...


@tile(name='editform', interface=WikiFolder, permission='edit')
@plumbing(ContentEditForm)
class WikiFolderContentEditForm(WikiFolderEditForm):
    ...


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
        wiki = self._find_wiki_root()
        return '/' + '/'.join(wiki.path[1:]) if wiki else '/'

    def _find_wiki_root(self):
        """Find the wiki root container."""
        node = self.model.parent
        while node is not None:
            if isinstance(node, Wiki):
                return node
            node = getattr(node, 'parent', None)
        return self.model.parent

    def reference_lookup(self, uuid):
        """Lookup label for a reference UUID."""
        wiki = self._find_wiki_root()
        return self._lookup_in_container(wiki, uuid)

    def _lookup_in_container(self, container, uuid):
        """Recursively lookup page by UUID in container and subfolders."""
        for child in container.values():
            if isinstance(child, WikiFolder):
                result = self._lookup_in_container(child, uuid)
                if result != uuid:
                    return result
            elif hasattr(child, 'uuid') and str(child.uuid) == uuid:
                return child.metadata.title
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

    code_wiki_container = """\
@node_info(
    name='wiki',
    addables=['wiki_folder', 'wiki_page'])
class Wiki(BaseContainer):
    ..."""

    code_node_info = """\
@node_info(
    name='wiki',
    title=_('wiki', default='Example Wiki'),
    icon='bi-book',
    addables=['wiki_folder', 'wiki_page'])"""

    def example_wiki_container(self):
        return code_block(self.code_wiki_container, 'python')

    def example_node_info(self):
        return code_block(self.code_node_info, 'python')


@tile(
    name='tutorial_content',
    path='templates/tutorial_folder.pt',
    interface=WikiFolder,
    permission='view',
    strict=False,
)
class WikiFolderTutorial(Tile):

    code_wiki_folder = """\
@node_info(
    name='wiki_folder',
    title=_('wiki_folder', default='Wiki Folder'),
    icon='bi-folder',
    addables=['wiki_folder', 'wiki_page'])
class WikiFolder(BaseContainer):
    # Nested containers for organization"""

    def example_wiki_folder(self):
        return code_block(self.code_wiki_folder, 'python')


@tile(
    name='tutorial_content',
    path='templates/tutorial_page.pt',
    interface=WikiPage,
    permission='view',
    strict=False,
)
class WikiPageTutorial(Tile):

    code_workflow = """\
class WikiPage(WorkflowNode):
    workflow_name = 'wiki_workflow'
    # States: draft, review, published, archived"""

    code_protected_properties = """\
@property
def protected_properties(self):
    props = ProtectedProperties(
        self,
        permissions={'body': ['edit']})
    props.body = self.attrs.get('body', '')
    return props"""

    code_reference_browser = """\
form['references'] = factory(
    'field:...:reference',
    props={
        'multivalued': True,
        'referencable': 'wiki_page',
        'root': '/wiki',
    })"""

    code_uuid_attribute_aware = """\
@plumbing(UUIDAttributeAware, ...)
class WikiPage:
    # self.uuid reads/writes attrs"""

    code_navigation_leaf = """\
@implementer(INavigationLeaf)
class WikiPage:
    ..."""

    def example_workflow(self):
        return code_block(self.code_workflow, 'python')

    def example_protected_properties(self):
        return code_block(self.code_protected_properties, 'python')

    def example_reference_browser(self):
        return code_block(self.code_reference_browser, 'python')

    def example_uuid_attribute_aware(self):
        return code_block(self.code_uuid_attribute_aware, 'python')

    def example_navigation_leaf(self):
        return code_block(self.code_navigation_leaf, 'python')

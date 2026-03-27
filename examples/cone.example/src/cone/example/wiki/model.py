from cone.app.interfaces import INavigationLeaf
from cone.app.model import Categories
from cone.app.model import Metadata
from cone.app.model import node_info
from cone.app.model import Properties
from cone.app.model import ProtectedProperties
from cone.app.model import UUIDAttributeAware
from cone.app.security import OwnerSupport
from cone.app.security import PrincipalACL
from cone.example.model import _
from cone.example.model import BaseContainer
from cone.example.model import DEFAULT_EXAMPLE_ACL
from cone.example.model import WorkflowNode
from node.utils import instance_property
from plumber import plumbing
from zope.interface import implementer


@node_info(
    name='wiki',
    title=_('wiki', default='Example Wiki'),
    icon='bi-book',
    addables=['wiki_folder', 'wiki_page'])
class Wiki(BaseContainer):
    """Entry container for wiki pages and folders.

    Acts as the reference browser root for WikiPage references.
    Demonstrates hierarchical content organization with workflow support.
    """

    @property
    def properties(self):
        props = super(Wiki, self).properties
        props.mainmenu_display_children = False
        return props


@node_info(
    name='wiki_folder',
    title=_('wiki_folder', default='Wiki Folder'),
    icon='bi-folder',
    addables=['wiki_folder', 'wiki_page'])
class WikiFolder(BaseContainer):
    """Folder for organizing wiki pages hierarchically.

    Demonstrates nested container hierarchy within wiki.
    """

    @property
    def properties(self):
        props = super(WikiFolder, self).properties
        props.action_delete = True
        return props


@node_info(
    name='wiki_page',
    title=_('wiki_page', default='Wiki Page'),
    icon='bi-journal-text')
@plumbing(OwnerSupport, PrincipalACL, UUIDAttributeAware, Categories)
@implementer(INavigationLeaf)
class WikiPage(WorkflowNode):
    """Wiki page with workflow, categories, and reference support.

    Demonstrates:
    - WorkflowNode: State management (draft, review, published, archived)
    - Categories: Categorization with translation strings
    - UUIDAttributeAware: UUID stored in node attributes
    - OwnerSupport: Owner tracking on pages
    - PrincipalACL: Permission/ACL support
    - ProtectedProperties: Body field restricted by edit permission
    - Reference browser: Link to other wiki pages
    """
    workflow_name = 'wiki_workflow'
    role_inheritance = True

    categories = [
        _('cat_general', default='General'),
        _('cat_technical', default='Technical'),
        _('cat_howto', default='How-To')
    ]

    @instance_property
    def principal_roles(self):
        return {}

    @property
    def properties(self):
        props = Properties()
        props.in_navtree = True
        props.action_up = True
        props.action_view = True
        props.action_edit = True
        props.action_delete = True
        props.action_sharing = True
        return props

    @property
    def metadata(self):
        md = Metadata()
        md.icon = 'bi-journal-text'
        title = self.attrs.get('title')
        md.title = title.value if title else self.name
        description = self.attrs.get('description')
        md.description = description.value if description else ''
        md.creator = self.attrs.get('creator', '')
        md.created = self.attrs.get('created')
        md.modified = self.attrs.get('modified')
        return md

    @property
    def protected_properties(self):
        """Demonstrates ProtectedProperties - body requires edit permission."""
        props = ProtectedProperties(
            self,
            permissions={
                'body': ['edit'],
            })
        props.body = self.attrs.get('body', '')
        return props

    def __call__(self):
        ...

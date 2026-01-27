from cone.app.interfaces import INavigationLeaf
from cone.app.model import Metadata
from cone.app.model import node_info
from cone.app.model import Properties
from cone.app.model import ProtectedProperties
from cone.app.model import UUIDAttributeAware
from cone.app.security import OwnerSupport
from cone.app.security import PrincipalACL
from cone.example.model import _
from cone.example.model import BaseContainer
from cone.example.model import Translation
from cone.example.model import WorkflowNode
from node.utils import instance_property
from plumber import plumbing
from zope.interface import implementer


@node_info(
    name='document_library',
    title=_('document_library', default='Document Library'),
    icon='bi-collection',
    addables=['document_folder', 'document'])
class DocumentLibrary(BaseContainer):

    @property
    def properties(self):
        props = super(DocumentLibrary, self).properties
        props.mainmenu_display_children = False
        return props


@node_info(
    name='document_folder',
    title=_('document_folder', default='Document Folder'),
    icon='bi-folder',
    addables=['document_folder', 'document'])
class DocumentFolder(BaseContainer):

    @property
    def properties(self):
        props = super(DocumentFolder, self).properties
        props.action_delete = True
        return props


@node_info(
    name='document',
    title=_('document', default='Document'),
    icon='bi-file-earmark-text')
@plumbing(OwnerSupport, PrincipalACL, UUIDAttributeAware)
@implementer(INavigationLeaf)
class Document(WorkflowNode):
    workflow_name = 'document_workflow'
    role_inheritance = True

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
        md.icon = self.nodeinfo.icon
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

from cone.app.model import AppNode
from cone.app.model import CopySupport
from cone.app.model import FactoryNode
from cone.app.model import Metadata
from cone.app.model import node_info
from cone.app.model import Properties
from cone.app.model import Translation as TranslationBehavior
from cone.app.security import PrincipalACL
from cone.app.workflow import WorkflowACL
from cone.app.workflow import WorkflowState
from node.behaviors import Attributes
from node.behaviors import DictStorage
from node.behaviors import MappingAdopt
from node.behaviors import MappingNode
from node.behaviors import NodeInit
from node.behaviors import OdictStorage
from node.utils import instance_property
from plumber import plumbing
from pyramid.i18n import TranslationStringFactory
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Allow
from pyramid.security import Deny
from pyramid.security import Everyone


_ = TranslationStringFactory('cone.example')


@plumbing(PrincipalACL)
class ExampleNode(FactoryNode):
    factories = dict()

    @property
    def principal_roles(self):
        return dict(
            max=['manager'],
            sepp=['editor']
        )

    @property
    def properties(self):
        props = super(ExampleNode, self).properties
        props.in_navtree = True
        props.default_content_tile = 'listing'
        props.action_up = True
        props.action_view = True
        props.action_edit = True
        props.action_sharing = True
        return props
    
    @property
    def metadata(self):
        md = super(ExampleNode, self).metadata
        md.title = self.name.replace('_', ' ').capitalize()
        return md

for i in range(40):
    ExampleNode.factories[f'node_{i}'] = ExampleNode


@plumbing(
    NodeInit,
    MappingNode,
    DictStorage,
    TranslationBehavior)
class Translation:
    ...


@plumbing(
    AppNode,
    WorkflowState,
    WorkflowACL,
    MappingAdopt,
    Attributes,
    NodeInit,
    MappingNode,
    OdictStorage)
class PublicationWorkflowNode:
    workflow_name = 'publication'
    workflow_tsf = staticmethod(_)
    default_acl = [
        (Allow, 'system.Authenticated', ['view']),
        (Allow, 'role:viewer', ['view', 'list']),
        (Allow, 'role:editor', [
            'view', 'list', 'add', 'edit', 'cut', 'copy', 'paste'
        ]),
        (Allow, 'role:admin', [
            'view', 'list', 'add', 'edit', 'delete', 'cut', 'copy', 'paste',
            'change_state', 'manage_permissions'
        ]),
        (Allow, 'role:manager', [
            'view', 'list', 'add', 'edit', 'delete', 'cut', 'copy', 'paste',
            'change_state', 'manage_permissions', 'manage'
        ]),
        (Allow, Everyone, ['login']),
        (Deny, Everyone, ALL_PERMISSIONS),
    ]

    def __call__(self):
        ...


@plumbing(PrincipalACL, CopySupport)
class BaseContainer(PublicationWorkflowNode):
    role_inheritance = True

    @instance_property
    def principal_roles(self):
        return {}

    @property
    def properties(self):
        props = Properties()
        props.in_navtree = True
        props.default_content_tile = 'listing'
        props.action_up = True
        props.action_add = True
        props.action_list = True
        props.action_sharing = True
        return props

    @property
    def metadata(self):
        md = Metadata()
        md.title = self.attrs['title'].value
        md.icon = self.nodeinfo.icon
        return md


@node_info(
    name='entry_folder',
    title=_('folder', default='Folder'),
    icon='bi bi-folder',
    addables=['folder'])
class EntryFolder(BaseContainer):

    def __init__(self, name=None, parent=None):
        super().__init__(name=name, parent=parent)
        title = self.attrs['title'] = Translation()
        title['en'] = f'Folder {name[name.rfind("_") + 1:]}'
        title['de'] = f'Ordner {name[name.rfind("_") + 1:]}'


@node_info(
    name='folder',
    title=_('folder', default='Folder'),
    icon='bi bi-folder',
    addables=['folder'])
class Folder(BaseContainer):

    @property
    def properties(self):
        props = super().properties
        props.action_edit = True
        props.action_delete = True
        return props

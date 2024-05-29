from cone.app.browser.utils import make_url
from cone.app.interfaces import IApplicationNode
from cone.app.interfaces import ILiveSearch
from cone.app.interfaces import INavigationLeaf
from cone.app.model import AppNode
from cone.app.model import CopySupport
from cone.app.model import Metadata
from cone.app.model import node_info
from cone.app.model import Properties
from cone.app.model import Translation as TranslationBehavior
from cone.app.security import PrincipalACL
from cone.app.utils import add_creation_metadata
from cone.app.workflow import WorkflowACL
from cone.app.workflow import WorkflowState
from node.behaviors import Attributes
from node.behaviors import DictStorage
from node.behaviors import MappingAdopt
from node.behaviors import MappingNode
from node.behaviors import MappingOrder
from node.behaviors import NodeInit
from node.behaviors import OdictStorage
from node.utils import instance_property
from plumber import plumbing
from pyramid.i18n import TranslationStringFactory
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Allow
from pyramid.security import Deny
from pyramid.security import Everyone
from pyramid.threadlocal import get_current_request
from zope.component import adapter
from zope.interface import implementer


_ = TranslationStringFactory('cone.example')


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
    MappingOrder,
    OdictStorage)
class PublicationWorkflowNode:
    workflow_name = 'publication'
    workflow_tsf = staticmethod(_)
    default_acl = [
        (Allow, 'system.Authenticated', ['view']),
        (Allow, 'role:viewer', ['view', 'list']),
        (Allow, 'role:editor', [
            'view', 'list', 'add', 'edit', 'cut', 'copy', 'paste',
            'change_order'
        ]),
        (Allow, 'role:admin', [
            'view', 'list', 'add', 'edit', 'delete', 'cut', 'copy', 'paste',
            'change_order', 'change_state', 'manage_permissions'
        ]),
        (Allow, 'role:manager', [
            'view', 'list', 'add', 'edit', 'delete', 'cut', 'copy', 'paste',
            'change_order', 'change_state', 'manage_permissions', 'manage'
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
        props.action_view = True
        props.action_edit = True
        props.action_list = True
        props.action_sharing = True
        props.action_move = True
        props.action_add = True
        return props

    @property
    def metadata(self):
        md = Metadata()
        md.icon = self.nodeinfo.icon
        md.title = self.attrs['title'].value
        md.description = self.attrs['description'].value
        md.creator = self.attrs['creator']
        md.created = self.attrs['created']
        md.modified = self.attrs['modified']
        return md


@node_info(
    name='entry_folder',
    title=_('folder', default='Folder'),
    icon='bi-folder',
    addables=['folder', 'item'])
class EntryFolder(BaseContainer):

    def __init__(self, name=None, parent=None):
        super().__init__(name=name, parent=parent)
        create_content(self)


@node_info(
    name='folder',
    title=_('folder', default='Folder'),
    icon='bi-folder',
    addables=['folder', 'item'])
class Folder(BaseContainer):

    @property
    def properties(self):
        props = super().properties
        props.action_delete = True
        return props


@node_info(
    name='item',
    title=_('item', default='Item'),
    icon='bi-file')
@plumbing(PrincipalACL)
@implementer(INavigationLeaf)
class Item(PublicationWorkflowNode):
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
        md.title = self.attrs['title'].value
        md.description = self.attrs['description'].value
        md.creator = self.attrs['creator']
        md.created = self.attrs['created']
        md.modified = self.attrs['modified']
        return md


def create_content(node):
    request = get_current_request()
    name = node.name

    add_creation_metadata(request, node.attrs)

    title = node.attrs['title'] = Translation()
    title['en'] = f'Folder {name[name.rfind("_") + 1:]}'
    title['de'] = f'Ordner {name[name.rfind("_") + 1:]}'

    description = node.attrs['description'] = Translation()
    description['en'] = f'Folder Description'
    description['de'] = f'Ordner Beschreibung'

    for i in range(1, 21):
        folder = node[f'folder_{i}'] = Folder()
        add_creation_metadata(request, folder.attrs)

        title = folder.attrs['title'] = Translation()
        title['en'] = f'Folder {i}'
        title['de'] = f'Ordner {i}'

        description = folder.attrs['description'] = Translation()
        description['en'] = f'Folder Description'
        description['de'] = f'Ordner Beschreibung'

        for j in range(1, 21):
            item = folder[f'item_{j}'] = Item()
            add_creation_metadata(request, item.attrs)

            title = item.attrs['title'] = Translation()
            title['en'] = f'Item {j}'
            title['de'] = f'Object {j}'

            description = item.attrs['description'] = Translation()
            description['en'] = f'Item Description'
            description['de'] = f'Object Beschreibung'


@implementer(ILiveSearch)
@adapter(IApplicationNode)
class LiveSearch(object):

    def __init__(self, model):
        self.model = model

    def search(self, request, query):
        result = []
        for child in self.model.values():
            md = child.metadata
            if (
                md.title.lower().find(query.lower()) > -1 or
                md.description.lower().find(query.lower()) > -1
            ):
                result.append({
                    'value': md.title,
                    'target': make_url(request, node=child),
                    'icon': md.icon,
                    'description': md.description,
                })
        return result

from cone.app.browser.utils import make_url
from cone.app.interfaces import IApplicationNode
from cone.app.interfaces import ILiveSearch
from cone.app.model import AppNode
from cone.app.model import CopySupport
from cone.app.model import Metadata
from cone.app.model import Properties
from cone.app.model import Translation as TranslationBehavior
from cone.app.security import PrincipalACL
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
from zope.component import adapter
from zope.interface import implementer


_ = TranslationStringFactory('cone.example')


# Translation-aware string storage.
# Stores values per language key (e.g., 'en', 'de'). The ``value`` property
# returns the translation for the current request locale.
@plumbing(
    NodeInit,
    MappingNode,
    DictStorage,
    TranslationBehavior)
class Translation:
    ...


# Default ACL shared across example node types.
DEFAULT_EXAMPLE_ACL = [
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


# Base node with workflow support, ordered storage, and attributes.
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
class WorkflowNode:
    workflow_name = None
    workflow_tsf = staticmethod(_)
    default_acl = DEFAULT_EXAMPLE_ACL

    def __call__(self):
        ...


# Base node without workflow, ordered storage, and attributes.
@plumbing(
    AppNode,
    MappingAdopt,
    Attributes,
    NodeInit,
    MappingNode,
    MappingOrder,
    OdictStorage)
class ContainerNode:
    default_acl = DEFAULT_EXAMPLE_ACL

    def __call__(self):
        ...


# Container base with PrincipalACL and CopySupport.
@plumbing(PrincipalACL, CopySupport)
class BaseContainer(ContainerNode):
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
        title = self.attrs.get('title')
        if title:
            md.title = title.value
        elif self.nodeinfo.title:
            md.title = self.nodeinfo.title
        else:
            md.title = self.name
        description = self.attrs.get('description')
        md.description = description.value if description else ''
        md.creator = self.attrs.get('creator', '')
        md.created = self.attrs.get('created')
        md.modified = self.attrs.get('modified')
        return md


@implementer(ILiveSearch)
@adapter(IApplicationNode)
class LiveSearch(object):
    """Live search adapter.

    Searches child node metadata for title and description matches.
    """

    def __init__(self, model):
        self.model = model

    def search(self, request, query):
        result = []
        for child in self.model.values():
            md = child.metadata
            title = md.title or ''
            description = md.description or ''
            if (
                title.lower().find(query.lower()) > -1
                or description.lower().find(query.lower()) > -1
            ):
                result.append({
                    'value': title,
                    'target': make_url(request, node=child),
                    'icon': md.icon,
                    'description': description,
                })
        return result

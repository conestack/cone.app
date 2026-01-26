from cone.app.interfaces import INavigationLeaf
from cone.app.model import AdapterNode
from cone.app.model import AppNode
from cone.app.model import BaseNode
from cone.app.model import Categories
from cone.app.model import FactoryNode
from cone.app.model import Metadata
from cone.app.model import NamespaceUUID
from cone.app.model import Properties
from cone.app.model import UUIDAsName
from cone.app.model import node_info
from cone.app.security import PrincipalACL
from cone.app.workflow import WorkflowACL
from cone.app.workflow import WorkflowState
from cone.example.model import _
from cone.example.model import DEFAULT_EXAMPLE_ACL
from cone.example.model import Translation
from node.behaviors import Attributes
from node.behaviors import MappingAdopt
from node.behaviors import MappingNode
from node.behaviors import MappingOrder
from node.behaviors import NodeInit
from node.behaviors import OdictStorage
from node.utils import instance_property
from odict import odict
from plumber import plumbing
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Allow
from pyramid.security import Deny
from pyramid.security import Everyone
from zope.interface import implementer


@node_info(
    name='project_board',
    title=_('project_board', default='Project Board'),
    icon='bi-kanban',
    addables=['project'])
class ProjectBoard(FactoryNode):
    """Entry container using FactoryNode pattern.

    FactoryNode lazily instantiates children from the ``factories`` dict.
    Children are volatile and recreated on invalidation.
    """
    factories = odict()

    @property
    def properties(self):
        props = Properties()
        props.in_navtree = True
        props.default_content_tile = 'listing'
        props.action_up = True
        props.action_view = True
        props.action_edit = False
        props.action_list = True
        props.action_add = True
        return props

    @property
    def metadata(self):
        md = Metadata()
        md.title = _('project_board', default='Project Board')
        md.description = _('project_board_desc',
                           default='Manage projects and tasks')
        md.icon = 'bi-kanban'
        return md


@node_info(
    name='project',
    title=_('project', default='Project'),
    icon='bi-clipboard',
    addables=['task'])
@plumbing(NamespaceUUID, PrincipalACL, Categories, AppNode,
          MappingAdopt, Attributes, NodeInit, MappingNode,
          MappingOrder, OdictStorage)
class Project:
    """Container demonstrating NamespaceUUID and Categories.

    NamespaceUUID: UUID is calculated from node path + namespace.
    Categories: provides a list of categorization translation strings.
    """
    categories = [
        _('cat_development', default='Development'),
        _('cat_design', default='Design')
    ]
    role_inheritance = True
    default_acl = DEFAULT_EXAMPLE_ACL

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
        props.action_delete = True
        props.action_list = True
        props.action_sharing = True
        props.action_add = True
        return props

    @property
    def metadata(self):
        md = Metadata()
        md.icon = 'bi-clipboard'
        title = self.attrs.get('title')
        md.title = title.value if title else self.name
        description = self.attrs.get('description')
        md.description = description.value if description else ''
        md.creator = self.attrs.get('creator', '')
        md.created = self.attrs.get('created')
        md.modified = self.attrs.get('modified')
        return md

    def __call__(self):
        ...


# Internal data model for Task - demonstrates that AdapterNode wraps
# a simpler data model.
@plumbing(NodeInit, MappingNode, Attributes, OdictStorage)
class TaskData:
    """Simple data node wrapped by TaskAdapter."""
    ...


@node_info(
    name='task',
    title=_('task', default='Task'),
    icon='bi-check2-square')
@plumbing(UUIDAsName, WorkflowState, WorkflowACL, PrincipalACL, Categories)
@implementer(INavigationLeaf)
class Task(AdapterNode):
    """Leaf node demonstrating UUIDAsName, AdapterNode wrapping,
    and a custom task workflow.

    UUIDAsName: The node's __name__ is its UUID string.
    AdapterNode: Wraps a TaskData instance, proxying attrs.
    WorkflowState: Workflow state stored in attrs['state'].
    Categories: Categorization support.
    """
    workflow_name = 'task_workflow'
    workflow_tsf = staticmethod(_)
    role_inheritance = True
    categories = [
        _('cat_development', default='Development'),
        _('cat_design', default='Design')
    ]
    default_acl = DEFAULT_EXAMPLE_ACL

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
        md.icon = 'bi-check2-square'
        title = self.attrs.get('title')
        md.title = title.value if title else str(self.uuid) if self.uuid else self.name
        description = self.attrs.get('description')
        md.description = description.value if description else ''
        md.creator = self.attrs.get('creator', '')
        md.created = self.attrs.get('created')
        md.modified = self.attrs.get('modified')
        return md

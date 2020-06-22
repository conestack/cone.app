from cone.app.interfaces import ILayout
from cone.app.model import AppNode
from cone.app.model import BaseNode
from cone.app.model import CopySupport
from cone.app.model import Layout
from cone.app.model import Properties
from cone.app.security import DEFAULT_ACL
from cone.app.security import PrincipalACL
from cone.app.workflow import WorkflowACL
from cone.app.workflow import WorkflowState
from node.behaviors import Adopt
from node.behaviors import Attributes
from node.behaviors import DefaultInit
from node.behaviors import Nodespaces
from node.behaviors import Nodify
from node.behaviors import OdictStorage
from node.utils import instance_property
from plumber import plumbing
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Allow
from pyramid.security import Deny
from pyramid.security import Everyone
from pyramid.static import static_view
from zope.component import adapter
from zope.interface import implementer
from zope.interface import Interface


static_resources = static_view('static', use_subpath=True)


@plumbing(WorkflowState, WorkflowACL)
class WorkflowNode(BaseNode):
    workflow_name = u'dummy'
    workflow_tsf = None

    @property
    def properties(self):
        props = Properties()
        props.in_navtree = True
        return props

    def __call__(self):
        pass


class InexistentWorkflowNode(WorkflowNode):
    workflow_name = u'inexistent'
    workflow_tsf = None


class StateACLWorkflowNode(WorkflowNode):
    state_acls = {
        'initial': [
            (Allow, 'role:manager', ['manage', 'edit', 'change_state']),
            (Allow, Everyone, ['login']),
            (Deny, Everyone, ALL_PERMISSIONS),
        ],
        'final': [
            (Allow, 'role:manager', ['view', 'edit', 'change_state']),
            (Deny, Everyone, ALL_PERMISSIONS),
        ],
    }


class IWorkflowNode(Interface):
    pass


@plumbing(WorkflowState)
@implementer(IWorkflowNode)
class InterfaceWorkflowNode(BaseNode):
    workflow_name = u'dummy'
    workflow_tsf = None


@plumbing(
    PrincipalACL,
    AppNode,
    Adopt,
    Nodespaces,
    Attributes,
    DefaultInit,
    Nodify,
    OdictStorage)
class SharingNode(object):

    @property
    def __acl__(self):
        return DEFAULT_ACL

    @instance_property
    def principal_roles(self):
        return dict()


@plumbing(CopySupport)
class CopySupportNode(BaseNode):

    def __init__(self, name=None, parent=None):
        super(CopySupportNode, self).__init__(name=name, parent=parent)
        self.messages = []

    def __call__(self):
        self.messages.append('Called: {}'.format(self.name))


###############################################################################
# B/C
###############################################################################

@implementer(ILayout)
@adapter(Interface)
def default_layout(context):
    config = Layout()
    config.mainmenu = True
    config.mainmenu_fluid = False
    config.livesearch = True
    config.personaltools = True
    config.columns_fluid = False
    config.pathbar = True
    config.sidebar_left = ['navtree']
    config.sidebar_left_grid_width = 3
    config.content_grid_width = 9
    return config


class LayoutConfigNode(BaseNode):

    @property
    def layout(self):
        return default_layout(self)

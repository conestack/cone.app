from cone.app.interfaces import IWorkflowState
from plumber import Behavior
from plumber import default
from plumber import override
from plumber import plumb
from pyramid.security import ALL_PERMISSIONS
from pyramid.security import Allow
from pyramid.security import Deny
from pyramid.security import Everyone
from repoze.workflow import get_workflow
from zope.interface import implementer
import logging


logger = logging.getLogger('cone.workflow')


def lookup_workflow(node):
    """Lookup workflow. Original get_workflow expects class if workflow was
    registered for class or instance if workflow was registered for interface.
    """
    workflow_name = node.workflow_name
    workflow = get_workflow(node.__class__, workflow_name)
    if not workflow:
        workflow = get_workflow(node, workflow_name)
    return workflow


def lookup_state_data(node):
    """Lookup state data of current workflow state for node.
    """
    workflow = lookup_workflow(node)
    if not workflow:
        return {}
    return workflow._state_data[node.state]


def initialize_workflow(node, force=False):
    workflow = lookup_workflow(node)
    if not workflow:
        return
    if force or not node.state:
        workflow.initialize(node)


def persist_state(node, info):
    """Transition callback for repoze.workflow.

    Persist state to ``node.state`` and call node.
    """
    node.state = info.transition[u'to_state']
    node()


def permission_checker(permission, node, request):
    """Callback for repoze.workflow to check permissions.

    Necessary since pyramid 1.8, where ``pyramid.security.has_permission``
    has been removed
    """
    return request.has_permission(permission, node)


@implementer(IWorkflowState)
class WorkflowState(Behavior):
    """Behavior for nodes providing workflow states.

    This implementation persists to self.attrs['state']
    """
    workflow_tsf = default(None)
    workflow_name = default(None)

    @plumb
    def __init__(_next, self, *args, **kw):
        _next(self, *args, **kw)
        initialize_workflow(self)

    @plumb
    def copy(_next, self):
        """Set initial state for copied node and all children providing
        ``cone.app.interfaces.IWorkflowState``.
        """
        ret = _next(self)

        def recursiv_initial_state(node):
            if IWorkflowState.providedBy(node):
                initialize_workflow(node, force=True)
                for child in node.values():
                    recursiv_initial_state(child)
        recursiv_initial_state(ret)
        return ret

    @property
    def state(self):
        return self.attrs.get('state', None)

    @default
    @state.setter
    def state(self, val):
        self.attrs['state'] = val


class WorkflowACL(Behavior):
    """Behavior providing ACL's by worfklow state.

    Requires ``WorkflowState`` behavior.
    """
    state_acls = default(dict())
    default_acl = default([
        (Allow, 'system.Authenticated', ['view']),
        (Allow, 'role:viewer', ['view']),
        (Allow, 'role:editor', ['view', 'add', 'edit']),
        (Allow, 'role:owner', ['view', 'add', 'edit', 'delete',
                               'change_state', 'manage_permissions']),
        (Allow, 'role:admin', ['view', 'add', 'edit', 'delete',
                               'change_state', 'manage_permissions']),
        (Allow, 'role:manager', ['view', 'add', 'edit', 'delete',
                                 'change_state', 'manage_permissions',
                                 'manage']),
        (Allow, Everyone, ['login']),
        (Deny, Everyone, ALL_PERMISSIONS),
    ])

    @override
    @property
    def __acl__(self):
        acl = self.state_acls.get(self.state, self.default_acl)
        if not acl:
            raise ValueError(u"No ACL found for state '%s'" % self.state)
        if acl is self.default_acl:
            logger.warning(u"No ACL found for state "
                           u"'%s'. Using default" % self.state)
        return acl

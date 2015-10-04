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


def initialize_workflow(node, force=False):
    workflow = get_workflow(node.__class__, node.workflow_name)
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

    def _get_state(self):
        return self.attrs.get('state', None)

    def _set_state(self, val):
        self.attrs['state'] = val

    state = default(property(_get_state, _set_state))


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

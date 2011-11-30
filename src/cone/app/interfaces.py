from zope.interface import (
    Interface,
    Attribute,
)
from zope.interface.common.mapping import IReadMapping
from node.interfaces import INode
from node.interfaces import IAttributes


class ISecured(Interface):
    """Secured object.
    """
    __acl__ = Attribute(u"ACL")


class IApplicationNode(ISecured, INode, IAttributes):
    """Application Node interface.
    """
    properties = Attribute(u"cone.app.interfaces.IProperties providing object")
    metadata = Attribute(u"cone.app.interfaces.IMetadata implementation")
    nodeinfo = Attribute(u"cone.app.interfaces.INodeInfo providing object")


class IFactoryNode(IApplicationNode):
    """Application node for static children.
    """
    factories = Attribute(u"Dict containing available keys and the Node class "
                          u"used to create child.")


class IAdapterNode(IApplicationNode):
    """Application node which acts as adapter on any context.
    
    XXX: - currently designed to adapt nodes, more generic
         - no attrs on this interface
         - self.context insetad of self.model
    """
    attrs = Attribute(u"Return self.model.attrs")
    
    def __init__(model, name, parent):
        """Name and parent are used to hook the correct application hierarchy.
        """


class IProperties(IReadMapping):
    """Interface for providing any kind of properties.
    """
    def __getattr__(name):
        """Return property by attribute access.
        
        Never throws an AttributeError if attribute does not exists, return
        None instead.
        """
    
    def __setattr__(name, value):
        """Set property by attribute access.
        """
    
    def keys():
        """Return available properties
        """


class IMetadata(IProperties):
    """Interface for providing metadata for application nodes.
    """


class INodeInfo(IProperties):
    """Interface for providing node information.
    """
    title = Attribute(u"Node meta title.")
    description = Attribute(u"Node meta description.")
    node = Attribute(u"Node implementing class.")
    factory = Attribute(u"Add model factory.")
    addables = Attribute(u"List of valid children node info names.")
    icon = Attribute(u"Node icon.")


class IUIDAware(INode, IAttributes):
    """UID aware node.
    """
    uid_handling_recursiv = Attribute(u"Flag whether to set UID recursiv.")
    
    def set_uid_for(node, override=False):
        """Set uid for given node.
        """


class IWorkflowState(INode, IAttributes):
    """Workflow support on nodes.
    """
    state = Attribute(u"Current workflow state.")


class IPrincipalACL(ISecured):
    """Principal specific roles on nodes.
    
    Plumbs __acl__ property.
    """
    role_inheritance = Attribute(u"Flag whether principal roles are "
                                 u"additionally aggregated from parent.")
    principal_roles = Attribute(u"Attribute containing principal roles for "
                                u"secured object.")
    aggregated_roles = Attribute(u"Aggregated roles.")
    
    def aggregated_roles_for(principal_id):
        """Return aggregated roles for principal by principal_id.
        """


class ICopySupport(INode):
    """Copysupport for nodes.
    """
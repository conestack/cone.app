from zope.interface import Attribute
from zope.interface.common.mapping import IReadMapping
from node.interfaces import INode
from node.interfaces import IAttributes


class IApplicationNode(INode, IAttributes):
    """Application Node interface.
    """
    
    __acl__ = Attribute(u"ACL")
    
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
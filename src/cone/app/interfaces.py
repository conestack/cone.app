from zope.interface import Attribute
from zope.interface.common.mapping import IReadMapping
from zodict.interfaces import IAttributedNode

class IApplicationNode(IAttributedNode):
    """Application Node interface.
    """
    
    __acl__ = Attribute(u"ACL")
    
    properties = Attribute(u"IProperties providing object")
    
    metadata = Attribute(u"IMetadata implementation")
    
    nodeinfo = Attribute(u"INodeInfo providing object")

class IFactoryNode(IApplicationNode):
    """Application node for static children.
    """
    
    factories = Attribute(u"Dict containing available keys and the Node class "
                          u"used to create this child.")

class IAdapterNode(IApplicationNode):
    """Interface to adapt any dict like object which should be hooked to
    application model.
    """
    
    attrs = Attribute(u"Return attrs.")
    
    def __init__(model, name, parent):
        """Name and parent are used to hook the correct application hierarchy.
        """

class IProperties(IReadMapping):
    """Interface for providing any kind of properties.
    """
    
    def __getattr__(name):
        """Return metadata by attribute access.
        
        Never throws an AttributeError if attribute does not exists, return
        None instead.
        """
    
    def __setattr__(name, value):
        """Set metadata by attribute access.
        """

class IMetadata(IProperties):
    """Interface for providing metadata for application nodes.
    """

class INodeInfo(IProperties):
    """Interface for providing node information.
    """
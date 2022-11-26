from node.interfaces import IAttributes
from node.interfaces import IChildFactory
from node.interfaces import ILeaf
from node.interfaces import INode
from node.interfaces import ISchema
from node.interfaces import IUUIDAware
from zope.interface import Attribute
from zope.interface import Interface
from zope.interface.common.mapping import IReadMapping


class ISecured(Interface):
    """Secured object."""
    __acl__ = Attribute(u'ACL')


class IApplicationEnvironment(Interface):
    """Application environment."""
    request = Attribute(u'The current request if any.')
    registry = Attribute(u'The current registry.')


class IApplicationNode(ISecured, INode, IAttributes):
    """Application Node interface."""
    properties = Attribute(u'cone.app.interfaces.IProperties providing object')
    metadata = Attribute(u'cone.app.interfaces.IMetadata implementation')
    nodeinfo = Attribute(u'cone.app.interfaces.INodeInfo providing object')


class ILeafNode(IApplicationNode, ILeaf):
    """Application node with no children."""

    def __getitem__(name):
        """Raise ``KeyError``"""

    def __setitem__(name, value):
        """Raise ``KeyError``"""

    def __delitem__(name):
        """Raise ``KeyError``"""

    def __iter__():
        """Empty iterator."""


class IFactoryNode(IApplicationNode, IChildFactory):
    """Application node for static children."""


class IAdapterNode(IApplicationNode):
    """Application node which acts as adapter on any context.

    XXX: - currently designed to adapt nodes, more generic
         - no attrs on this interface
         - self.context instead of self.model
    """
    attrs = Attribute(u'Return self.model.attrs')

    def __init__(model, name, parent):
        """Name and parent are used to hook the correct application hierarchy.
        """


class IProperties(IReadMapping):
    """Interface for providing any kind of properties."""

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


class ILayoutConfig(IProperties):
    """Layout configuration."""
    mainmenu = Attribute(u'Flag whether to display mainmenu')
    mainmenu_fluid = Attribute(u'Flag whether mainmenu is fluid')
    livesearch = Attribute(u'Flag whether to display livesearch')
    personaltools = Attribute(u'Flag whether to display personaltools')
    columns_fluid = Attribute(u'Flag whether columns are fluid')
    pathbar = Attribute(u'Flag whether to display pathbar')
    sidebar_left = Attribute(u'Tiles which should be rendered in sidebar')
    sidebar_left_grid_width = Attribute(u'Sidebar grid width')
    content_grid_width = Attribute(u'Content grid width')


# B/C, removed as of cone.app 1.1
ILayout = ILayoutConfig


class IMetadata(IProperties):
    """Interface for providing metadata for application nodes."""


class INodeInfo(IProperties):
    """Interface for providing node information."""
    title = Attribute(u'Node meta title.')
    description = Attribute(u'Node meta description.')
    node = Attribute(u'Node implementing class.')
    factory = Attribute(u'Add model factory.')
    addables = Attribute(u'List of valid children node info names.')
    icon = Attribute(u'Node icon.')


class INavigationLeaf(ILeaf):
    """Marker interface for nodes which have no navigatable children."""


class IWorkflowState(INode):
    """Workflow support on nodes."""
    workflow_name = Attribute(u'Name of registered workflow.')
    workflow_tsf = Attribute(u'Translation string factory used to translate '
                             u'states and transitions')
    state = Attribute(u'Current workflow state.')


class IOwnerSupport(ISecured):
    """Interface for providing ownership information.

    Plumbs __acl__ property.
    """
    owner_attribute_name = Attribute(u'Attribute name of the owner field.')
    owner = Attribute(u'User id of node owner')


class IPrincipalACL(ISecured):
    """Principal specific roles on nodes.

    Plumbs __acl__ property.
    """
    role_inheritance = Attribute(u'Flag whether principal roles are '
                                 u'additionally aggregated from parent.')
    principal_roles = Attribute(u'Attribute containing principal roles for '
                                u'secured object.')
    aggregated_roles = Attribute(u'Aggregated roles.')

    def aggregated_roles_for(principal_id):
        """Return aggregated roles for principal by principal_id.
        """


class IACLAdapter(Interface):
    """Interface for providing ACL as adapter."""
    acl = Attribute(u'ACL')


class IAdapterACL(ISecured):
    """ACL from ``IACLAdapter`` on nodes."""
    default_acl = Attribute(u'Default ACL if no ``IAclAdapter`` found for node')


class ICopySupport(INode):
    """Copysupport for nodes."""

    supports_cut = Attribute(u'Supports cut')
    supports_copy = Attribute(u'Supports copy')
    supports_paste = Attribute(u'Supports paste')


class IUUIDAsName(IUUIDAware):
    """Exposes ``self.uuid`` as ``self.__name__``. Considers key changes in
    node trees at copy time.
    """


class ITranslation(ISchema):
    """A translation."""
    value = Attribute(u'The translated value according to the curren language')


class ILiveSearch(Interface):
    """Livesearch adapter."""

    def search(request, query):
        """Return search result for query.

        Return value is a list of dicts. Each result dict must contain at least
        the key ``value`` which contains the display value for the suggestions
        dropdown. Any other keys are optional, they are accessible in the JS
        callback when ``typeahead:selected`` gets triggered.
        """


class IAuthenticator(Interface):
    """Authenticator utility.

    If application ini file defines ``cone.authenticator`` setting, a named
    utility of IAuthenticator gets looked up and principal authentication
    happens against it.
    """

    def authenticate(login, password):
        """Authenticate principal.

        Return principal id if authentication is successful, else None.
        """

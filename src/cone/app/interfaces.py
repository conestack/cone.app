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
    __acl__ = Attribute('ACL')


class IApplicationEnvironment(Interface):
    """Application environment."""
    request = Attribute('The current request if any.')
    registry = Attribute('The current registry.')


class IApplicationNode(ISecured, INode, IAttributes):
    """Application Node interface."""
    properties = Attribute('cone.app.interfaces.IProperties providing object')
    metadata = Attribute('cone.app.interfaces.IMetadata implementation')
    nodeinfo = Attribute('cone.app.interfaces.INodeInfo providing object')


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


class ISettingsNode(ILeafNode):
    """Application node for managing plugin specific settings."""
    category = Attribute('Settings category as (translation) string.')
    display = Attribute('Flag whether to display the settings node in UI')


class IFactoryNode(IApplicationNode, IChildFactory):
    """Application node for static children."""


class IAdapterNode(IApplicationNode):
    """Application node which acts as adapter on any context.

    XXX: - currently designed to adapt nodes, more generic
         - no attrs on this interface
         - self.context instead of self.model
    """
    attrs = Attribute('Return self.model.attrs')

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
    mainmenu = Attribute('Flag whether to display mainmenu')
    livesearch = Attribute('Flag whether to display livesearch')
    personaltools = Attribute('Flag whether to display personaltools')
    limit_content_width = Attribute('Flag whether content width should be limited on large screens')
    limit_page_width = Attribute('Flag whether page width should be limited on large screens')
    center_content = Attribute('Flag whether to center the content area (used with limit_content_width)')
    pathbar = Attribute('Flag whether to display pathbar')
    sidebar_left = Attribute('Tiles which should be rendered in sidebar')
    sidebar_left_min_width = Attribute('Min width of sidebar left in px')
    sidebar_left_static = Attribute('Flag whether sidebar left overlays content instead of pushing it')
    sidebar_right = Attribute('Tiles which should be rendered in sidebar')
    sidebar_right_min_width = Attribute('Min width of sidebar right in px')
    sidebar_right_static = Attribute('Flag whether sidebar right overlays content instead of pushing it')


# B/C, removed as of cone.app 1.1
ILayout = ILayoutConfig


class IMetadata(IProperties):
    """Interface for providing metadata for application nodes."""


class INodeInfo(IProperties):
    """Interface for providing node information."""
    title = Attribute('Node meta title.')
    description = Attribute('Node meta description.')
    node = Attribute('Node implementing class.')
    factory = Attribute('Add model factory.')
    addables = Attribute('List of valid children node info names.')
    icon = Attribute('Node icon.')


class INavigationLeaf(ILeaf):
    """Marker interface for nodes which have no navigatable children."""


class IWorkflowState(INode):
    """Workflow support on nodes."""
    workflow_name = Attribute('Name of registered workflow.')
    workflow_tsf = Attribute('Translation string factory used to translate '
                             'states and transitions')
    state = Attribute('Current workflow state.')


class IOwnerSupport(ISecured):
    """Interface for providing ownership information.

    Plumbs __acl__ property.
    """
    owner_attribute_name = Attribute('Attribute name of the owner field.')
    owner = Attribute('User id of node owner')


class IPrincipalACL(ISecured):
    """Principal specific roles on nodes.

    Plumbs __acl__ property.
    """
    role_inheritance = Attribute('Flag whether principal roles are '
                                 'additionally aggregated from parent.')
    principal_roles = Attribute('Attribute containing principal roles for '
                                'secured object.')
    aggregated_roles = Attribute('Aggregated roles.')

    def aggregated_roles_for(principal_id):
        """Return aggregated roles for principal by principal_id.
        """


class IACLAdapter(Interface):
    """Interface for providing ACL as adapter."""
    acl = Attribute('ACL')


class IAdapterACL(ISecured):
    """ACL from ``IACLAdapter`` on nodes."""
    default_acl = Attribute('Default ACL if no ``IAclAdapter`` found for node')


class ICopySupport(INode):
    """Copysupport for nodes."""

    supports_cut = Attribute('Supports cut')
    supports_copy = Attribute('Supports copy')
    supports_paste = Attribute('Supports paste')


class IUUIDAsName(IUUIDAware):
    """Exposes ``self.uuid`` as ``self.__name__``. Considers key changes in
    node trees at copy time.
    """


class ITranslation(ISchema):
    """A translation."""
    value = Attribute('The translated value according to the curren language')


class ILiveSearch(Interface):
    """Livesearch adapter."""

    def search(request, query):
        """Return search result for query.

        Return value is a list of dicts. Each dict is a suggestion. The default
        live search implementation expects the keys ``value``, ``icon`` and
        ``target`` in the suggestion dicts.
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

class ICategories(Interface):
    """List of translation strings"""
    categories = Attribute('Categories as (translation) string.')
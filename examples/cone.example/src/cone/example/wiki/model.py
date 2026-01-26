from cone.app.interfaces import INavigationLeaf
from cone.app.model import AppNode
from cone.app.model import Categories
from cone.app.model import Metadata
from cone.app.model import Properties
from cone.app.model import UUIDAttributeAware
from cone.app.model import node_info
from cone.app.security import PrincipalACL
from cone.example.model import _
from cone.example.model import BaseContainer
from cone.example.model import DEFAULT_EXAMPLE_ACL
from cone.example.model import Translation
from node.behaviors import Attributes
from node.behaviors import MappingAdopt
from node.behaviors import MappingNode
from node.behaviors import MappingOrder
from node.behaviors import NodeInit
from node.behaviors import OdictStorage
from node.utils import instance_property
from plumber import plumbing
from zope.interface import implementer


@node_info(
    name='wiki',
    title=_('wiki', default='Wiki'),
    icon='bi-book',
    addables=['wiki_page'])
class Wiki(BaseContainer):
    """Entry container for wiki pages.

    Acts as the reference browser root for WikiPage references.
    """

    @property
    def properties(self):
        props = super().properties
        props.mainmenu_display_children = False
        return props


@node_info(
    name='wiki_page',
    title=_('wiki_page', default='Wiki Page'),
    icon='bi-journal-text')
@plumbing(UUIDAttributeAware, PrincipalACL, Categories, AppNode,
          MappingAdopt, Attributes, NodeInit, MappingNode,
          MappingOrder, OdictStorage)
@implementer(INavigationLeaf)
class WikiPage:
    """Leaf node demonstrating Categories, UUIDAttributeAware,
    and reference browser widget for linking to other pages.

    Categories: Categorization support with translation strings.
    UUIDAttributeAware: UUID stored in node attributes.
    Reference browser: Used in the form to select related pages.
    """
    categories = [
        _('cat_general', default='General'),
        _('cat_technical', default='Technical'),
        _('cat_howto', default='How-To')
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
        props.action_up = True
        props.action_view = True
        props.action_edit = True
        props.action_delete = True
        props.action_sharing = True
        return props

    @property
    def metadata(self):
        md = Metadata()
        md.icon = 'bi-journal-text'
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

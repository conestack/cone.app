from cone.app.model import AppNode
from cone.app.model import FactoryNode
from cone.app.model import node_info
from cone.app.model import Metadata
from cone.app.model import Properties
from cone.app.model import Translation as TranslationBehavior
from cone.app.security import PrincipalACL
from node.behaviors import Attributes
from node.behaviors import MappingAdopt
from node.behaviors import MappingNode
from node.behaviors import NodeInit
from node.behaviors import OdictStorage
from node.behaviors import DictStorage
from plumber import plumbing


@plumbing(PrincipalACL)
class ExampleNode(FactoryNode):
    factories = dict()

    @property
    def principal_roles(self):
        return dict(
            max=['manager'],
            sepp=['editor']
        )

    @property
    def properties(self):
        props = super(ExampleNode, self).properties
        props.in_navtree = True
        props.default_content_tile = 'listing'
        props.action_up = True
        props.action_view = True
        props.action_edit = True
        props.action_sharing = True
        return props
    
    @property
    def metadata(self):
        md = super(ExampleNode, self).metadata
        md.title = self.name.replace('_', ' ').capitalize()
        return md

for i in range(40):
    ExampleNode.factories[f'node_{i}'] = ExampleNode


@plumbing(
    NodeInit,
    MappingNode,
    DictStorage,
    TranslationBehavior)
class Translation:
    ...


@plumbing(
    AppNode,
    MappingAdopt,
    Attributes,
    NodeInit,
    MappingNode,
    OdictStorage)
class BaseContainer:

    @property
    def properties(self):
        props = Properties()
        props.in_navtree = True
        props.default_content_tile = 'listing'
        props.action_up = True
        props.action_view = True
        props.action_edit = True
        props.action_sharing = True
        return props

    @property
    def metadata(self):
        md = Metadata()
        md.title = self.attrs['title'].value
        return md


class EntryFolder(BaseContainer):
    ...


@node_info(
    name='container')
class Container(BaseContainer):
    ...

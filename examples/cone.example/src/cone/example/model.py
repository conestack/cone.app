from cone.app.model import BaseNode
from cone.app.security import PrincipalACL
from plumber import plumbing
from cone.app.model import FactoryNode

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

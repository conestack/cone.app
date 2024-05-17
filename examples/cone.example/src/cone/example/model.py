from cone.app.model import BaseNode
from cone.app.security import PrincipalACL
from plumber import plumbing


@plumbing(PrincipalACL)
class ExamplePlugin(BaseNode):

    @property
    def principal_roles(self):
        return dict(
            max=['manager'],
            sepp=['editor']
        )

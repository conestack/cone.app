from cone.app.testing import Security as BaseSecurityLayer
from yafowil.base import factory
from yafowil.bootstrap import configure_factory


class ExampleSecurity(BaseSecurityLayer):
    """Test layer for cone.example.

    Extends the base cone.app security layer to include cone.example
    as a plugin. This ensures all entry nodes, settings, browser
    registrations, and ZCML workflows are loaded.
    """

    def make_app(self, **kw):
        kw.setdefault('cone.plugins', 'node.ext.ugm\ncone.example')
        super().make_app(**kw)

    def setUp(self, args=None):
        self.make_app()
        factory.push_state()
        configure_factory('bootstrap5')


security = ExampleSecurity()

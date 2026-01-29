from cone.app.browser.layout import Layout
from cone.tile import tile

@tile(name='layout', path='templates/layout.pt', permission='login')
class ExampleLayout(Layout):
    """Override a Layout py extending or replacing an existing node."""
    ...
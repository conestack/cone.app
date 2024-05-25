from cone.app.browser.layout import ProtectedContentTile
from cone.example.model import ExampleNode
from cone.tile import tile


@tile(name='content',
      path='templates/example.pt',
      interface=ExampleNode,
      permission='login')
class ExamplePluginContent(ProtectedContentTile):
    pass

from cone.app.browser.layout import ProtectedContentTile
from cone.example.model import ExamplePlugin
from cone.tile import tile


@tile(name='content',
      path='templates/example.pt',
      interface=ExamplePlugin,
      permission='login')
class ExamplePluginContent(ProtectedContentTile):
    pass

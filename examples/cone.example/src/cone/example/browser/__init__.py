from cone.app.browser.layout import ProtectedContentTile
from cone.tile import registerTile
from cone.example.model import ExamplePlugin


registerTile(
    name='content',
    path='cone.example:browser/templates/example.pt',
    interface=ExamplePlugin,
    class_=ProtectedContentTile,
    permission='login')

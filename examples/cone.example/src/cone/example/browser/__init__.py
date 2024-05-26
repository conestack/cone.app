from cone.app.browser.layout import ProtectedContentTile
from cone.example.model import EntryFolder
from cone.example.model import Folder
from cone.example.model import Item
from cone.tile import tile
import webresource as wr
import os


resources_dir = os.path.join(os.path.dirname(__file__), 'static')
cone_example_resources = wr.ResourceGroup(
    name='cone.example',
    directory=resources_dir,
    path='example'
)
cone_example_resources.add(wr.StyleResource(
    name='cone-example-css',
    resource='cone.example.css'
))


def configure_resources(config, settings):
    config.register_resource(cone_example_resources)
    config.set_resource_include('cone-example-css', 'authenticated')


@tile(name='content',
      path='templates/view.pt',
      interface=EntryFolder,
      permission='login')
@tile(name='content',
      path='templates/view.pt',
      interface=Folder,
      permission='login')
@tile(name='content',
      path='templates/view.pt',
      interface=Item,
      permission='login')
class DefaultContent(ProtectedContentTile):
    pass

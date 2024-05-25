from cone.app import main_hook
from cone.app import get_root
from cone.app import register_entry
from cone.example.model import Translation
from cone.example.model import ExampleNode
from cone.example.model import EntryFolder
import uuid


def create_app_data():
    """Create example application data"""
    # register plugin entry nodes
    root = get_root()
    for i in range(10):
        name = str(uuid.uuid4())[:8]
        register_entry(name, EntryFolder)
        folder = root[name]
        title = folder.attrs['title'] = Translation()
        title['en'] = f'Folder {i}'
        title['de'] = f'Ordner {i}'


@main_hook
def example_main_hook(config, global_config, local_config):
    """Function which gets called at application startup to initialize
    this plugin.
    """
    create_app_data()

    # register plugin entry node
    #for i in range(10):
    #    register_entry(f'node_{i}', ExampleNode)

    # scan browser package
    config.scan('cone.example.browser')

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
    for i in range(1, 11):
        register_entry(f'folder_{i}', EntryFolder)


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

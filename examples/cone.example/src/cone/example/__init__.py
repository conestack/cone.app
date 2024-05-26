from cone.app import main_hook
from cone.app import register_entry
from cone.example.model import EntryFolder
from cone.example.browser import configure_resources


@main_hook
def example_main_hook(config, global_config, settings):
    """Function which gets called at application startup to initialize
    this plugin.
    """
    # add translation
    config.add_translation_dirs('cone.example:locale/')

    # register plugin entry nodes
    for i in range(1, 11):
        register_entry(f'folder_{i}', EntryFolder)

    # static resources
    configure_resources(config, settings)

    # scan browser package
    config.scan('cone.example.browser')

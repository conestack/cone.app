from cone.app import register_entry
from cone.app import register_main_hook
from cone.example.model import ExamplePlugin


def example_main_hook(config, global_config, local_config):
    """Function which gets called at application startup to initialize
    this plugin.
    """
    # register plugin entry node
    register_entry('example', ExamplePlugin)

    # scan browser package
    config.scan('cone.example.browser')

# register the main hook for this plugin
register_main_hook(example_main_hook)

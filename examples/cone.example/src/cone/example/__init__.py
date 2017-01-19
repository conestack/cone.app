from cone.app import register_entry
from cone.app import register_main_hook
from cone.example.model import ExamplePlugin


def example_main_hook(config, global_config, local_config):
    # register plugin entry node
    register_entry('example', ExamplePlugin)

    # scan browser package
    config.scan('cone.example.browser')

register_main_hook(example_main_hook)

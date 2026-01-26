from cone.app import main_hook
from cone.app import register_config
from cone.app import register_entry
from cone.example.browser import _configure_layout_configs
from cone.example.browser import configure_resources
from cone.example.model import LiveSearch


@main_hook
def example_main_hook(config, global_config, settings):
    """Application startup hook.

    Registers all entry nodes, settings, search adapters, static resources,
    and scans browser packages for tiles and views.
    """
    # Register live search adapter
    config.registry.registerAdapter(LiveSearch)

    # Add translation directories
    config.add_translation_dirs('cone.example:locale/')

    # Register entry nodes in the main menu
    from cone.example.document.model import DocumentLibrary
    from cone.example.project.model import ProjectBoard
    from cone.example.wiki.model import Wiki
    from cone.example.ajax.browser import AjaxPlayground

    register_entry('documents', DocumentLibrary)
    register_entry('projects', ProjectBoard)
    register_entry('wiki', Wiki)
    register_entry('ajax_playground', AjaxPlayground)

    # Register settings node
    from cone.example.settings.model import ExampleSettings
    register_config('example_settings', ExampleSettings)

    # Register custom add model factory for Task
    from cone.app.model import get_node_info
    from cone.example.project.browser import task_addmodel_factory
    task_info = get_node_info('task')
    if task_info:
        task_info.factory = task_addmodel_factory

    # Static resources
    configure_resources(config, settings)

    # Register layout configs (deferred to avoid circular imports)
    _configure_layout_configs()

    # Scan browser packages for tile and view registrations
    config.scan('cone.example.browser')
    config.scan('cone.example.document.browser')
    config.scan('cone.example.project.browser')
    config.scan('cone.example.wiki.browser')
    config.scan('cone.example.settings.browser')
    config.scan('cone.example.ajax.browser')

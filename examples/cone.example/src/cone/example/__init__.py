from cone.app import main_hook
from cone.app import register_config
from cone.app import register_entry
from cone.example.browser import _configure_layout_configs
from cone.example.browser import configure_resources
from cone.example.model import LiveSearch
from pyramid.session import SignedCookieSessionFactory


@main_hook
def example_main_hook(config, global_config, settings):
    """Application startup hook.

    Registers all entry nodes, settings, search adapters, static resources,
    and scans browser packages for tiles and views.
    """
    # Configure session factory for storing user preferences
    session_factory = SignedCookieSessionFactory('cone.example.secret')
    config.set_session_factory(session_factory)

    # Register live search adapter
    config.registry.registerAdapter(LiveSearch)

    # Add translation directories
    config.add_translation_dirs('cone.example:locale/')

    # Register entry nodes in the main menu
    from cone.example.layout.model import LayoutDemo
    from cone.example.wiki.model import Wiki
    from cone.example.ajax.browser import AjaxPlayground
    from cone.example.populate import populate_wiki

    def make_wiki():
        wiki = Wiki()
        populate_wiki(wiki)
        return wiki

    register_entry('layout', LayoutDemo)
    register_entry('wiki', make_wiki)
    register_entry('ajax_playground', AjaxPlayground)

    # Register settings node
    from cone.example.settings.model import ExampleSettings
    register_config('example_settings', ExampleSettings)

    # Static resources
    configure_resources(config, settings)

    # Register layout configs (deferred to avoid circular imports)
    _configure_layout_configs()

    # add static view for example images
    config.add_static_view(
        name='example-images',
        path='cone.example.browser:static/images'
    )

    # Scan browser packages for tile and view registrations
    config.scan('cone.example.browser')
    config.scan('cone.example.wiki.browser')
    config.scan('cone.example.layout.browser')
    config.scan('cone.example.settings.browser')
    config.scan('cone.example.ajax.browser')

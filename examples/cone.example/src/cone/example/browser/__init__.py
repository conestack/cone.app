from cone.app import DefaultLayoutConfig
from cone.app import layout_config
from cone.app.browser.actions import LinkAction
from cone.app.browser.ajax import ajax_continue
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.contextmenu import context_menu_group
from cone.app.browser.contextmenu import context_menu_item
from cone.app.browser.contextmenu import ContextMenuToolbar
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import make_url
from cone.app.browser.utils import request_property
from cone.app.model import AppRoot
from cone.example.model import _
from cone.tile import tile
from cone.tile import Tile
import os
import webresource as wr


###############################################################################
# Static Resources
###############################################################################

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
# Pygments theme switcher script
# Dynamically loads pygments-light.css or pygments-dark.css based on data-bs-theme
cone_example_resources.add(wr.ScriptResource(
    name='pygments-theme-js',
    resource='pygments-theme.js'
))


def configure_resources(config, settings):
    config.register_resource(cone_example_resources)
    config.set_resource_include('cone-example-css', 'authenticated')
    config.set_resource_include('pygments-theme-js', 'authenticated')


###############################################################################
# Layout Configs
#
# Layout configs control the appearance of the page for different node types.
# They determine which sidebar tiles are rendered, whether the main menu,
# search bar, and path bar are shown, etc.
###############################################################################

# Import model classes here to avoid circular imports at module level.
# layout_config decorators register factories looked up by model class.


# Default layout settings for LayoutDemo page (stored in session)
LAYOUT_DEMO_DEFAULTS = {
    'mainmenu': True,
    'livesearch': True,
    'personaltools': True,
    'pathbar': True,
    'sidebar_left': ['navtree'],
    'sidebar_left_static': False,
    'sidebar_left_min_width': 150,
    'sidebar_right': ['tutorial'],
    'sidebar_right_static': False,
    'sidebar_right_min_width': 150,
    'limit_content_width': True,
    'limit_page_width': False,
    'center_content': False
}


class ExampleLayoutConfig(DefaultLayoutConfig):
    """Base layout config with standard sidebar configuration."""

    def __init__(self, model=None, request=None):
        super(ExampleLayoutConfig, self).__init__(model=model, request=request)
        self.sidebar_left = ['navtree']
        self.sidebar_right = ['tutorial']
        self.sidebar_right_min_width = 400


class DynamicLayoutConfig(DefaultLayoutConfig):
    """Layout config that reads all settings from session.

    Used only for the LayoutDemo page to demonstrate dynamic layout changes.
    """

    def __init__(self, model=None, request=None):
        super(DynamicLayoutConfig, self).__init__(model=model, request=request)
        if request:
            session = request.session
            self.mainmenu = session.get('layout.mainmenu', LAYOUT_DEMO_DEFAULTS['mainmenu'])
            self.livesearch = session.get('layout.livesearch', LAYOUT_DEMO_DEFAULTS['livesearch'])
            self.personaltools = session.get('layout.personaltools', LAYOUT_DEMO_DEFAULTS['personaltools'])
            self.pathbar = session.get('layout.pathbar', LAYOUT_DEMO_DEFAULTS['pathbar'])
            self.sidebar_left = session.get('layout.sidebar_left', LAYOUT_DEMO_DEFAULTS['sidebar_left'])
            self.sidebar_left_static = session.get('layout.sidebar_left_static', LAYOUT_DEMO_DEFAULTS['sidebar_left_static'])
            self.sidebar_left_min_width = session.get('layout.sidebar_left_min_width', LAYOUT_DEMO_DEFAULTS['sidebar_left_min_width'])
            self.sidebar_right = session.get('layout.sidebar_right', LAYOUT_DEMO_DEFAULTS['sidebar_right'])
            self.sidebar_right_static = session.get('layout.sidebar_right_static', LAYOUT_DEMO_DEFAULTS['sidebar_right_static'])
            self.sidebar_right_min_width = session.get('layout.sidebar_right_min_width', LAYOUT_DEMO_DEFAULTS['sidebar_right_min_width'])
            self.limit_content_width = session.get('layout.limit_content_width', LAYOUT_DEMO_DEFAULTS['limit_content_width'])
            self.limit_page_width = session.get('layout.limit_page_width', LAYOUT_DEMO_DEFAULTS['limit_page_width'])
            self.center_content = session.get('layout.center_content', LAYOUT_DEMO_DEFAULTS['center_content'])


@tile(name='toggle_layout_bool', permission='view')
class ToggleLayoutBoolTile(Tile):
    """Toggle a boolean layout setting via session (for LayoutDemo page only)."""

    def render(self):
        setting = self.request.params.get('setting')
        if setting in (
            'mainmenu', 'livesearch', 'personaltools', 'pathbar',
            'limit_content_width', 'limit_page_width', 'sidebar_left_static',
            'sidebar_right_static', 'center_content'):
            session = self.request.session
            key = f'layout.{setting}'
            current = session.get(key, LAYOUT_DEMO_DEFAULTS.get(setting, True))
            session[key] = not current
        url = make_url(self.request, node=self.model)
        ajax_continue(self.request, [
            AjaxEvent(url, 'contextchanged', '#layout')
        ])
        return ''


@tile(name='toggle_sidebar_tile', permission='view')
class ToggleSidebarTileTile(Tile):
    """Toggle a tile in sidebar_left or sidebar_right (for LayoutDemo page only)."""

    def render(self):
        sidebar = self.request.params.get('sidebar')  # 'left' or 'right'
        tile_name = self.request.params.get('tile')
        if sidebar in ('left', 'right') and tile_name:
            session = self.request.session
            key = f'layout.sidebar_{sidebar}'
            default = LAYOUT_DEMO_DEFAULTS.get(f'sidebar_{sidebar}', [])
            current = list(session.get(key, default))
            if tile_name in current:
                current.remove(tile_name)
            else:
                current.append(tile_name)
            session[key] = current
        url = make_url(self.request, node=self.model)
        ajax_continue(self.request, [
            AjaxEvent(url, 'contextchanged', '#layout')
        ])
        return ''


@tile(name='set_layout_number', permission='view')
class SetLayoutNumberTile(Tile):
    """Set a numeric layout setting via session (for LayoutDemo page only)."""

    def render(self):
        setting = self.request.params.get('setting')
        value = self.request.params.get('value')
        if setting in ('sidebar_left_min_width', 'sidebar_right_min_width') and value:
            try:
                value = int(value)
                session = self.request.session
                key = f'layout.{setting}'
                session[key] = value
            except ValueError:
                pass
        url = make_url(self.request, node=self.model)
        ajax_continue(self.request, [
            AjaxEvent(url, 'contextchanged', '#layout')
        ])
        return ''


@tile(name='reset_layout', permission='view')
class ResetLayoutTile(Tile):
    """Reset all layout settings to defaults (for LayoutDemo page only)."""

    def render(self):
        session = self.request.session
        for key in list(session.keys()):
            if key.startswith('layout.'):
                del session[key]
        url = make_url(self.request, node=self.model)
        ajax_continue(self.request, [
            AjaxEvent(url, 'contextchanged', '#layout')
        ])
        return ''


def _configure_layout_configs():
    """Register layout configs after model classes are available."""
    from cone.example.layout.model import LayoutDemo
    from cone.example.wiki.model import Wiki
    from cone.example.wiki.model import WikiFolder
    from cone.example.wiki.model import WikiPage
    from cone.example.ajax.browser import AjaxPlayground

    @layout_config(Wiki, WikiFolder, WikiPage)
    class WikiLayoutConfig(ExampleLayoutConfig):
        pass

    @layout_config(LayoutDemo)
    class LayoutDemoLayoutConfig(DynamicLayoutConfig):
        """Layout config for LayoutDemo that reads settings from session."""
        pass

    @layout_config(AppRoot)
    class RootLayoutConfig(ExampleLayoutConfig):
        def __init__(self, model=None, request=None):
            super(RootLayoutConfig, self).__init__(model=model, request=request)
            self.sidebar_left = []
            self.limit_content_width = False

    @layout_config(AjaxPlayground)
    class AjaxPlaygroundLayoutConfig(ExampleLayoutConfig):
        pass


###############################################################################
# Landing Page (Root Content Tile)
###############################################################################

@tile(name='content',
      path='cone.example.browser:templates/landing.pt',
      interface=AppRoot,
      permission='login')
class LandingPage(ProtectedContentTile):

    @property
    def layout_url(self):
        return make_url(self.request, node=self.model['layout'])

    @property
    def wiki_url(self):
        return make_url(self.request, node=self.model['wiki'])

    @property
    def ajax_url(self):
        return make_url(self.request, node=self.model['ajax_playground'])


###############################################################################
# Custom Context Menu Group
#
# Adds a custom group to the context menu with custom actions.
###############################################################################

@context_menu_group(name='example_tools')
class ExampleToolsToolbar(ContextMenuToolbar):
    """Custom context menu toolbar group for example-specific actions."""


@context_menu_item(group='example_tools', name='example_action')
class ExampleContextAction(LinkAction):
    """Custom context menu action demonstrating LinkAction in context menu."""
    css = 'nav-link'
    text = _('refresh', default='Refresh')
    icon = 'bi-arrow-clockwise'
    event = 'contextchanged:#layout'

    @property
    def target(self):
        return make_url(self.request, node=self.model)

    @property
    def href(self):
        return make_url(self.request, node=self.model)

    @property
    def display(self):
        return self.permitted('view')


###############################################################################
# request_property Demo
#
# request_property caches a computed value for the duration of a single
# request, avoiding redundant computation.
###############################################################################

class RequestPropertyDemo:
    """Demonstrates request_property decorator.

    The decorated method is called once per request and the result is cached.
    Subsequent access returns the cached value.
    """

    @request_property
    def expensive_computation(self):
        """This would only be computed once per request."""
        return {'computed': True, 'data': [1, 2, 3]}

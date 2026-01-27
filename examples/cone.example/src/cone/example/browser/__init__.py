from cone.app import DefaultLayoutConfig
from cone.app import layout_config
from cone.app.browser.actions import LinkAction
from cone.app.browser.contextmenu import context_menu_group
from cone.app.browser.contextmenu import context_menu_item
from cone.app.browser.contextmenu import ContextMenuToolbar
from cone.app.browser.layout import personal_tools_action
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import make_url
from cone.app.browser.utils import request_property
from cone.app.model import AppRoot
from cone.example.model import _
from cone.tile import tile
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


def configure_resources(config, settings):
    config.register_resource(cone_example_resources)
    config.set_resource_include('cone-example-css', 'authenticated')


###############################################################################
# Layout Configs
#
# Layout configs control the appearance of the page for different node types.
# They determine which sidebar tiles are rendered, whether the main menu,
# search bar, and path bar are shown, etc.
###############################################################################

# Import model classes here to avoid circular imports at module level.
# layout_config decorators register factories looked up by model class.

def _configure_layout_configs():
    """Register layout configs after model classes are available."""
    from cone.example.document.model import Document
    from cone.example.document.model import DocumentFolder
    from cone.example.document.model import DocumentLibrary
    from cone.example.project.model import ProjectBoard
    from cone.example.project.model import Task
    from cone.example.wiki.model import Wiki
    from cone.example.wiki.model import WikiPage
    from cone.example.ajax.browser import AjaxPlayground

    @layout_config(DocumentLibrary, DocumentFolder)
    class DocumentContainerLayoutConfig(DefaultLayoutConfig):
        def __init__(self, model=None, request=None):
            super(DocumentContainerLayoutConfig, self).__init__(model=model, request=request)
            self.sidebar_left = ['navtree']
            self.sidebar_right = ['tutorial']

    @layout_config(Document)
    class DocumentLayoutConfig(DefaultLayoutConfig):
        def __init__(self, model=None, request=None):
            super(DocumentLayoutConfig, self).__init__(model=model, request=request)
            self.sidebar_left = ['navtree']
            self.sidebar_right = ['tutorial']

    @layout_config(ProjectBoard)
    class ProjectBoardLayoutConfig(DefaultLayoutConfig):
        def __init__(self, model=None, request=None):
            super(ProjectBoardLayoutConfig, self).__init__(model=model, request=request)
            self.sidebar_left = ['navtree']
            self.sidebar_right = ['tutorial']

    @layout_config(Task)
    class TaskLayoutConfig(DefaultLayoutConfig):
        def __init__(self, model=None, request=None):
            super(TaskLayoutConfig, self).__init__(model=model, request=request)
            self.sidebar_left = ['navtree']
            self.sidebar_right = ['tutorial']

    @layout_config(Wiki, WikiPage)
    class WikiLayoutConfig(DefaultLayoutConfig):
        def __init__(self, model=None, request=None):
            super(WikiLayoutConfig, self).__init__(model=model, request=request)
            self.sidebar_left = ['navtree']
            self.sidebar_right = ['tutorial']

    @layout_config(AppRoot)
    class RootLayoutConfig(DefaultLayoutConfig):
        def __init__(self, model=None, request=None):
            super(RootLayoutConfig, self).__init__(model=model, request=request)
            self.sidebar_left = []
            self.limit_content_width = False
            self.sidebar_right = ['tutorial']

    @layout_config(AjaxPlayground)
    class AjaxPlaygroundLayoutConfig(DefaultLayoutConfig):
        def __init__(self, model=None, request=None):
            super(AjaxPlaygroundLayoutConfig, self).__init__(model=model, request=request)
            self.sidebar_left = []
            self.sidebar_right = ['tutorial']


###############################################################################
# Landing Page (Root Content Tile)
###############################################################################

@tile(name='content',
      path='cone.example.browser:templates/landing.pt',
      interface=AppRoot,
      permission='login')
class LandingPage(ProtectedContentTile):

    @property
    def documents_url(self):
        return make_url(self.request, node=self.model['documents'])

    @property
    def projects_url(self):
        return make_url(self.request, node=self.model['projects'])

    @property
    def wiki_url(self):
        return make_url(self.request, node=self.model['wiki'])

    @property
    def ajax_url(self):
        return make_url(self.request, node=self.model['ajax_playground'])


###############################################################################
# Custom Personal Tools Action
#
# Adds a custom item to the personal tools dropdown menu (top right).
###############################################################################

@personal_tools_action(name='example_info')
class ExampleInfoAction(LinkAction):
    """Custom personal tools action - shows a link in the user dropdown."""
    text = _('example_info', default='Example Info')
    icon = 'bi-info-circle'
    event = 'contextchanged:#layout'
    path = 'href'

    @property
    def target(self):
        return make_url(self.request, node=self.model.root)

    href = target

    @property
    def display(self):
        return bool(self.request.authenticated_userid)


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

from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import make_url
from cone.example.browser import LAYOUT_DEMO_DEFAULTS
from cone.example.browser.utils import code_block
from cone.example.layout.model import LayoutDemo
from cone.tile import tile
from cone.tile import Tile


@tile(
    name='content',
    path='templates/layout_view.pt',
    interface=LayoutDemo,
    permission='login')
class LayoutDemoView(ProtectedContentTile):

    @property
    def ajax_url(self):
        return make_url(self.request, node=self.model)

    def get_setting(self, name):
        """Get current layout setting from session."""
        return self.request.session.get(
            f'layout.{name}',
            LAYOUT_DEMO_DEFAULTS.get(name)
        )

    @property
    def mainmenu(self):
        return self.get_setting('mainmenu')

    @property
    def livesearch(self):
        return self.get_setting('livesearch')

    @property
    def personaltools(self):
        return self.get_setting('personaltools')

    @property
    def pathbar(self):
        return self.get_setting('pathbar')

    @property
    def sidebar_left(self):
        return self.get_setting('sidebar_left') or []

    @property
    def sidebar_right(self):
        return self.get_setting('sidebar_right') or []

    @property
    def has_navtree(self):
        return 'navtree' in self.sidebar_left

    @property
    def has_tutorial(self):
        return 'tutorial' in self.sidebar_right

    @property
    def limit_content_width(self):
        return self.get_setting('limit_content_width')

    @property
    def sidebar_left_static(self):
        return self.get_setting('sidebar_left_static')

    @property
    def sidebar_left_min_width(self):
        return self.get_setting('sidebar_left_min_width')

    @property
    def sidebar_right_static(self):
        return self.get_setting('sidebar_right_static')

    @property
    def sidebar_right_min_width(self):
        return self.get_setting('sidebar_right_min_width')

    @property
    def center_content(self):
        return self.get_setting('center_content')

# tutorial

@tile(
    name='tutorial_content',
    path='templates/tutorial_content.pt',
    interface=LayoutDemo,
    permission='view',
    strict=False,
)
class LayoutDemoTutorial(Tile):

    code_layout_config = """\
@layout_config(MyNode)
class MyLayoutConfig(DefaultLayoutConfig):
    def __init__(self, model, request):
        super().__init__(model, request)
        self.sidebar_right = ['tutorial']"""

    code_session_state = """\
if request.session.get('show_tutorial', True):
    self.sidebar_right = ['tutorial']
else:
    self.sidebar_right = []"""

    code_ajax_event = """\
ajax_continue(request, [
    AjaxEvent(url, 'contextchanged', '#layout')
])"""

    def example_layout_config(self):
        return code_block(self.code_layout_config, 'python')

    def example_session_state(self):
        return code_block(self.code_session_state, 'python')

    def example_ajax_event(self):
        return code_block(self.code_ajax_event, 'python')

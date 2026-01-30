from cone.app.browser.ajax import ajax_continue
from cone.app.browser.ajax import ajax_message
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.ajax import AjaxMessage
from cone.app.browser.ajax import AjaxPath
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import make_url
from cone.app.model import BaseNode
from cone.app.model import Metadata
from cone.app.model import node_info
from cone.app.model import Properties
from cone.app.utils import node_path
from cone.example.browser.utils import code_block
from cone.example.model import _
from cone.tile import tile
from cone.tile import Tile
from node.utils import instance_property


@node_info(
    name='ajax_playground',
    title=_('ajax_playground', default='AJAX Playground'),
    icon='bi-lightning')
class AjaxPlayground(BaseNode):
    """Entry node for demonstrating all AJAX operation types.

    This node provides tiles that trigger each of the six AJAX
    continuation operations available in cone.app:
    - AjaxPath: Set browser URL path
    - AjaxAction: Render tile into DOM element
    - AjaxEvent: Trigger JS event
    - AjaxMessage: Display a message
    - AjaxOverlay: Show/close overlay
    - ajax_continue: Send multiple operations
    """

    @instance_property
    def properties(self):
        props = Properties()
        props.in_navtree = True
        props.action_up = True
        props.action_view = True
        return props

    @instance_property
    def metadata(self):
        md = Metadata()
        md.title = _('ajax_playground', default='AJAX Playground')
        md.description = _(
            'ajax_playground_desc',
            default='Demonstrates all AJAX operation types')
        md.icon = 'bi-lightning'
        return md


@tile(name='content',
      path='cone.example.ajax:templates/ajax_playground.pt',
      interface=AjaxPlayground,
      permission='login')
class AjaxPlaygroundView(ProtectedContentTile):

    @property
    def ajax_path_url(self):
        return make_url(self.request, node=self.model)

    @property
    def ajax_action_url(self):
        return make_url(self.request, node=self.model)


# Tile triggered by AjaxAction demo
@tile(name='ajax_demo_content',
      interface=AjaxPlayground,
      permission='view')
class AjaxDemoContent(ProtectedContentTile):

    def render(self):
        return '<div class="alert alert-success">' \
               '<strong>AjaxAction worked!</strong> ' \
               'This content was loaded via AjaxAction and inserted ' \
               'into the DOM.</div>'


# Tile for AjaxPath demo
@tile(name='ajax_path_demo',
      interface=AjaxPlayground,
      permission='view')
class AjaxPathDemo(ProtectedContentTile):

    def render(self):
        # Simulate navigating to a "subsection" by appending to path
        path = '/'.join(node_path(self.model)) + '/demo-section'
        url = make_url(self.request, node=self.model)
        ajax_continue(self.request, [
            AjaxPath(path=path, target=url, event=None),
            AjaxAction(url, 'ajax_path_result', 'inner', '#ajax-demo-target'),
            AjaxMessage('Browser URL updated! Check your address bar.', 'info', None),
        ])
        return ''


# Result tile shown after AjaxPath demo
@tile(name='ajax_path_result',
      interface=AjaxPlayground,
      permission='view')
class AjaxPathResult(ProtectedContentTile):

    def render(self):
        return '<div class="alert alert-info">' \
               '<strong>AjaxPath worked!</strong> ' \
               'The browser URL was updated without a page reload. ' \
               'Check the address bar - it now shows "/demo-section" appended.</div>'


# Tile for AjaxEvent demo
@tile(name='ajax_event_demo',
      interface=AjaxPlayground,
      permission='view')
class AjaxEventDemo(ProtectedContentTile):

    def render(self):
        url = make_url(self.request, node=self.model)
        # Trigger a custom event on the demo target element.
        # The template includes JS that listens for this event.
        ajax_continue(self.request, [
            AjaxEvent(url, 'demo:highlight', '#ajax-event-target'),
            AjaxMessage(
                'AjaxEvent triggered! The target element received a custom event.',
                'info',
                None
            ),
        ])
        return ''


# Tile for AjaxMessage demo
@tile(name='ajax_message_demo',
      interface=AjaxPlayground,
      permission='view')
class AjaxMessageDemo(ProtectedContentTile):

    def render(self):
        ajax_message(
            self.request,
            'This is a demo message from AjaxMessage!',
            'info',
            'modal-lg',
            'Demo Message'
        )
        return ''


# Tile for AjaxAction demo
@tile(name='ajax_action_demo',
      interface=AjaxPlayground,
      permission='view')
class AjaxActionDemo(ProtectedContentTile):

    def render(self):
        url = make_url(self.request, node=self.model)
        ajax_continue(self.request, [
            AjaxAction(url, 'ajax_demo_content', 'inner', '#ajax-demo-target')
        ])
        return ''


# Tile for combined operations demo
@tile(name='ajax_combined_demo',
      interface=AjaxPlayground,
      permission='view')
class AjaxCombinedDemo(ProtectedContentTile):

    def render(self):
        url = make_url(self.request, node=self.model)
        path = '/'.join(node_path(self.model)) + '/combined'
        # Demonstrate multiple operations working together:
        # 1. Update content in the demo target area
        # 2. Show a success message
        # 3. Update the browser URL
        # 4. Trigger a custom event on another element
        ajax_continue(self.request, [
            AjaxAction(url, 'ajax_combined_result', 'inner', '#ajax-demo-target'),
            AjaxMessage('Combined operations executed successfully!', 'success', None),
            AjaxPath(path=path, target=url, event=None),
            AjaxEvent(url, 'demo:highlight', '#ajax-event-target'),
        ])
        return ''


# Result tile shown after combined demo
@tile(name='ajax_combined_result',
      interface=AjaxPlayground,
      permission='view')
class AjaxCombinedResult(ProtectedContentTile):

    def render(self):
        return '<div class="alert alert-success">' \
               '<strong>Combined operations worked!</strong> ' \
               'This response triggered: content update (here), ' \
               'a message notification, URL path change, and a custom event.</div>'


# tutorial

@tile(
    name='tutorial_content',
    path='templates/tutorial_content.pt',
    interface=AjaxPlayground,
    permission='view',
    strict=False,
)
class AjaxTutorial(Tile):

    code_ajax_path = """\
AjaxPath(
    path='/node/path',
    target=url,
    event=None  # or 'eventname:#selector'
)"""

    code_ajax_action = """\
AjaxAction(
    url, 'tile_name', 'inner', '#target'
)"""

    code_ajax_event = """\
AjaxEvent(
    url, 'custom:event', '#target'
)"""

    code_ajax_message = """\
ajax_message(request, 'Hello!', 'info')"""

    code_ajax_continue = """\
ajax_continue(request, [
    AjaxAction(...),
    AjaxMessage(...),
    AjaxPath(...),
])"""

    def example_ajax_path(self):
        return code_block(self.code_ajax_path, 'python')

    def example_ajax_action(self):
        return code_block(self.code_ajax_action, 'python')

    def example_ajax_event(self):
        return code_block(self.code_ajax_event, 'python')

    def example_ajax_message(self):
        return code_block(self.code_ajax_message, 'python')

    def example_ajax_continue(self):
        return code_block(self.code_ajax_continue, 'python')

from cone.app.browser.ajax import ajax_continue
from cone.app.browser.ajax import ajax_message
from cone.app.browser.ajax import ajax_status_message
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.ajax import AjaxMessage
from cone.app.browser.ajax import AjaxOverlay
from cone.app.browser.ajax import AjaxPath
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import make_url
from cone.app.model import AppNode
from cone.app.model import BaseNode
from cone.app.model import Metadata
from cone.app.model import Properties
from cone.app.model import node_info
from cone.example.model import _
from cone.tile import tile
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
        url = make_url(self.request, node=self.model)
        ajax_continue(self.request, [
            AjaxPath(
                path='/'.join(self.model.path),
                target=url,
                event='contextchanged:#layout'
            )
        ])
        return ''


# Tile for AjaxEvent demo
@tile(name='ajax_event_demo',
      interface=AjaxPlayground,
      permission='view')
class AjaxEventDemo(ProtectedContentTile):

    def render(self):
        url = make_url(self.request, node=self.model)
        ajax_continue(self.request, [
            AjaxEvent(url, 'contextchanged', '#layout')
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
            'info'
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
        ajax_continue(self.request, [
            AjaxAction(url, 'ajax_demo_content', 'inner', '#ajax-demo-target'),
            AjaxMessage('Combined: action + message + event!', 'success'),
            AjaxEvent(url, 'contextchanged', '#layout'),
        ])
        return ''

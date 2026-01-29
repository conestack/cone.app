from cone.app.model import BaseNode
from cone.app.model import Metadata
from cone.app.model import node_info
from cone.app.model import Properties
from cone.example.model import _


@node_info(
    name='layout_demo',
    title=_('layout_demo', default='Layout'),
    icon='bi-layout-sidebar-inset-reverse')
class LayoutDemo(BaseNode):
    """Demonstrates dynamic LayoutConfig changes.

    This node shows how to:
    - Toggle sidebar visibility via session state
    - Use ExampleLayoutConfig to check session
    - Trigger layout refresh via AjaxEvent
    """

    @property
    def properties(self):
        props = Properties()
        props.in_navtree = True
        props.action_up = True
        props.action_view = True
        return props

    @property
    def metadata(self):
        md = Metadata()
        md.title = _('layout_demo', default='Layout')
        md.description = _('layout_demo_desc',
                           default='Demonstrates dynamic layout configuration')
        md.icon = 'bi-layout-sidebar-inset-reverse'
        return md

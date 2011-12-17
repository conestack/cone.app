from odict import odict
from cone.tile import (
    tile,
    Tile,
)
from cone.app.browser.utils import make_url
from cone.app.browser.actions import (
    Toolbar,
    ActionUp,
    ActionView,
    ActionList,
    ActionSharing,
    ActionState,
    ActionAdd,
    ActionEdit,
    ActionDelete,
    ActionDeleteChildren,
    ActionCut,
    ActionCopy,
    ActionPaste,
)


context_menu = odict()

context_menu['navigation'] = Toolbar()
context_menu['navigation']['up'] = ActionUp()

context_menu['contentviews'] = Toolbar()
context_menu['contentviews']['list'] = ActionList()
context_menu['contentviews']['view'] = ActionView()
context_menu['contentviews']['edit'] = ActionEdit()
context_menu['contentviews']['sharing'] = ActionSharing()

context_menu['contextactions'] = Toolbar()
context_menu['contextactions']['delete'] = ActionDelete()
context_menu['contextactions']['change_state'] = ActionState()

context_menu['childactions'] = Toolbar()
context_menu['childactions']['add'] = ActionAdd()
context_menu['childactions']['cut'] = ActionCut()
context_menu['childactions']['copy'] = ActionCopy()
context_menu['childactions']['paste'] = ActionPaste()
#context_menu['childactions']['delete'] = ActionDeleteChildren()


@tile('contextmenu', 'templates/contextmenu.pt', permission='view')
class ContextMenu(Tile):
    
    @property
    def toolbars(self):
        return context_menu.values()
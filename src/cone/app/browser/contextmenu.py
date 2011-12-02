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
context_menu['general'] = Toolbar()
context_menu['general']['up'] = ActionUp()
context_menu['general']['list'] = ActionList()
context_menu['general']['view'] = ActionView()
context_menu['object'] = Toolbar()
context_menu['object']['edit'] = ActionEdit()
context_menu['object']['change_state'] = ActionState()
context_menu['object']['sharing'] = ActionSharing()
context_menu['object']['delete'] = ActionDelete() # XXX: remove here
context_menu['children'] = Toolbar()
context_menu['children']['add'] = ActionAdd()
context_menu['children']['cut'] = ActionCut()
context_menu['children']['copy'] = ActionCopy()
context_menu['children']['paste'] = ActionPaste()
#context_menu['children']['delete'] = ActionDeleteChildren()


@tile('contextmenu', 'templates/contextmenu.pt', permission='view')
class ContextMenu(Tile):
    
    @property
    def toolbars(self):
        return context_menu.values()
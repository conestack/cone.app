from odict import odict
from cone.tile import (
    tile,
    Tile,
)
from .actions import (
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
context_menu['navigation']['up'] = ActionUp(True)

context_menu['contentviews'] = Toolbar()
context_menu['contentviews']['list'] = ActionList(True)
context_menu['contentviews']['view'] = ActionView(True)
context_menu['contentviews']['edit'] = ActionEdit(True)
context_menu['contentviews']['sharing'] = ActionSharing(True)

context_menu['contextactions'] = Toolbar()
context_menu['contextactions']['delete'] = ActionDelete(True)
context_menu['contextactions']['change_state'] = ActionState()

context_menu['childactions'] = Toolbar()
context_menu['childactions']['add'] = ActionAdd()
context_menu['childactions']['cut'] = ActionCut(True)
context_menu['childactions']['copy'] = ActionCopy(True)
context_menu['childactions']['paste'] = ActionPaste(True)
#context_menu['childactions']['delete'] = ActionDeleteChildren(True)


@tile('contextmenu', 'templates/contextmenu.pt', permission='view')
class ContextMenu(Tile):

    @property
    def toolbars(self):
        return context_menu.values()

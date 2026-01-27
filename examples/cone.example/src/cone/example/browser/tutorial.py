from cone.tile import tile
from cone.tile import Tile
from cone.app import get_root
from cone.app.model import AppRoot

@tile(
    name='tutorial',
    path='templates/tutorial.pt',
    permission='view',
    strict=False,
)
class SidebarTutorial(Tile):

    @property
    def root_view(self):
        root = get_root(self.model)
        return self.model is root

# tutorial

@tile(
    name='tutorial_content',
    path='templates/tutorial_content.pt',
    interface=AppRoot,
    permission='view',
    strict=False,
)
class DocumentTutorial(Tile):
    ...
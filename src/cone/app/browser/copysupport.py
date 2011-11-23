from cone.tile import (
    tile,
    Tile,
)

@tile('cut', permission="delete")
class CutAction(Tile):
    
    def render(self):
        model = self.model
        return u''


@tile('copy', permission="edit")
class CopyAction(Tile):
    
    def render(self):
        model = self.model
        return u''


@tile('paste', permission="add")
class PasteAction(Tile):
    
    def render(self):
        model = self.model
        return u''
from cone.tile import (
    tile,
    Tile,
)

@tile('cut', permission="delete")
class CutAction(Tile):
    
    def render(self):
        #print 'cut'
        model = self.model
        request = self.request
        return u''


@tile('copy', permission="edit")
class CopyAction(Tile):
    
    def render(self):
        #print 'copy'
        model = self.model
        request = self.request
        return u''


@tile('paste', permission="add")
class PasteAction(Tile):
    
    def render(self):
        #print 'paste'
        model = self.model
        request = self.request
        return u''
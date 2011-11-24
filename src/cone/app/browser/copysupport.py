import urllib
from cone.tile import (
    tile,
    Tile,
)


def extract_copysupport_cookie(request, name):
    cookie = request.cookies.get('cone.app.copysupport.%s' % name, '')
    cookie = urllib.unquote(cookie)
    paths = cookie.split('::')
    return paths


@tile('paste', permission="add")
class PasteAction(Tile):
    
    def render(self):
        cut_paths = extract_copysupport_cookie(self.request, 'cut')
        copy_path = extract_copysupport_cookie(self.request, 'copy')
        #print cut_paths
        #print copy_path
        # XXX: extend cone.tile for deleting cookies
        return u''
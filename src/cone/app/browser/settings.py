from cone.tile import (
    tile,
    Tile,
    render_tile,
)
from cone.app.model import AppSettings

@tile('content', 'templates/settings.pt',
      interface=AppSettings, permission='manage')
class AppSettings(Tile):
    
    @property
    def tabs(self):
        ret = list()
        for key, value in self.model.items():
            ret.append({
                'title': value.metadata.title,
                'content': render_tile(value, self.request, 'content'),
            })
        return ret
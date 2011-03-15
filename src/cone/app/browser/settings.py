from plumber import (
    Part,
    default,
)
from cone.tile import (
    tile,
    Tile,
    render_tile,
)
from webob.exc import HTTPFound
from cone.app.model import AppSettings
from cone.app.browser.utils import make_url
from cone.app.browser.ajax import AjaxAction


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
                'css': value.__name__,
            })
        return ret


class SettingsPart(Part):
    """Particular settings object form part.
    """
    
    @default
    def next(self, request):
        url = make_url(request.request, node=self.model)
        if self.ajax_request:
            url = make_url(request.request, node=self.model)
            selector = '.%s' % self.model.__name__
            return [
                AjaxAction(url, 'content', 'inner', selector),
            ]
        url = make_url(request.request, node=self.model.__parent__)
        return HTTPFound(location=url)
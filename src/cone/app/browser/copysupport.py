import urllib
import urlparse
from cone.tile import (
    tile,
    Tile,
)
from cone.app.browser.ajax import ajax_message
from cone.app.browser.utils import choose_name


def extract_copysupport_cookie(request, name):
    cookie = request.cookies.get('cone.app.copysupport.%s' % name, '')
    cookie = urllib.unquote(cookie)
    paths = cookie.split('::')
    return [path for path in paths if path]


def paths_from_urls(urls):
    ret = list()
    for url in urls:
        splitted = urlparse.urlparse(url).path.split('/')
        ret.append([part for part in splitted if part])
    return ret


@tile('paste', permission="add")
class PasteAction(Tile):
    
    def render(self):
        cut = extract_copysupport_cookie(self.request, 'cut')
        copy = extract_copysupport_cookie(self.request, 'copy')
        if not cut and not copy:
            ajax_message(self.request, u"Nothing to paste")
            return u''
        urls = copy and copy or cut
        paths = paths_from_urls(urls)
        call_sources = set()
        errors = list()
        success = 0
        for path in paths:
            node = self.model.root
            for key in path:
                node = node[key]
            if not node.node_info_name:
                errors.append(u"Cannot paste '%s'. Unknown source" % node.name)
                continue
            if not self.model.node_info_name:
                errors.append(
                    u"Cannot paste to '%s'. Unknown target" % self.model.name)
                continue
            if not node.node_info_name in self.model.nodeinfo.addables:
                message = u"Violation. '%s' is not allowed to contain '%s'"
                message = message % (self.model.nodeinfo.title,
                                     node.nodeinfo.title)
                errors.append(message)
                continue
            source = node.parent
            if copy:
                node = source[node.name].copy()
            else:
                node = source.detach(node.name)
            self.model[choose_name(self.model, node.name)] = node
            if cut:
                call_sources.add(source)
            success += 1
        if success > 0:
            self.model()
        for source in call_sources:
            source()
        message = "Pasted %i items." % success
        if errors:
            failed = "<br /><strong>Pasting of %i items failed:</strong>"
            failed = failed % len(errors)
            message += "<br />".join([failed] + errors)
        ajax_message(self.request, message)
        # XXX: delete cookies (extend cone.tile for deleting cookies)
        return u''
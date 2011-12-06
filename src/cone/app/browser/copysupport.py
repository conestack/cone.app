import urllib
import urlparse
from node.utils import LocationIterator
from cone.tile import (
    tile,
    Tile,
)
from cone.app.browser.ajax import (
    ajax_message,
    ajax_continue,
    AjaxAction,
    AjaxEvent,
)
from cone.app.browser.utils import (
    choose_name,
    make_url,
)


def cookie_name(name):
    return u'cone.app.copysupport.%s' % name


def extract_copysupport_cookie(request, name):
    cookie = request.cookies.get(cookie_name(name), '')
    cookie = urllib.unquote(cookie)
    paths = cookie.split('::')
    return [path for path in paths if path]


def paths_from_urls(urls):
    ret = list()
    for url in urls:
        splitted = urlparse.urlparse(url).path.split('/')
        ret.append([part for part in splitted if part])
    return ret


@tile('paste', permission="paste")
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
                in_model = False
                for parent in LocationIterator(self.model):
                    if parent is node:
                        message = u"Cannot paste cut object to child of it: %s"
                        message = message % parent.name
                        errors.append(message)
                        in_model = True
                        break
                if in_model:
                    continue
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
        url = make_url(self.request, node=self.model)
        action = AjaxAction(url, 'content', 'inner', '#content')
        event = AjaxEvent(url, 'contextchanged', '.contextsensitiv')
        continuation = [action, event]
        ajax_continue(self.request, continuation)
        res = self.request.response
        res.delete_cookie(cookie_name(copy and 'copy' or 'cut'))
        return u''
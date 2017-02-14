from cone.app.browser.ajax import AjaxAction
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.ajax import ajax_continue
from cone.app.browser.ajax import ajax_message
from cone.app.browser.utils import choose_name
from cone.app.browser.utils import make_url
from cone.tile import Tile
from cone.tile import tile
from node.utils import LocationIterator
from pyramid.i18n import TranslationStringFactory
from pyramid.i18n import get_localizer
import urllib
import urlparse


_ = TranslationStringFactory('cone.app')


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
        localizer = get_localizer(self.request)
        if not cut and not copy:
            message = localizer.translate(
                _('nothing_to_paste', default='Nothing to paste'))
            ajax_message(self.request, message)
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
                message = localizer.translate(
                    _('cannot_paste_unknown_source',
                      default="Cannot paste '${name}'. Unknown source"),
                      mapping={'name': node.name})
                errors.append(message)
                continue
            if not self.model.node_info_name:
                message = localizer.translate(
                    _('cannot_paste_unknown_target',
                      default="Cannot paste to '${name}'. Unknown target"),
                      mapping={'name': self.model.name})
                errors.append(message)
                continue
            if not node.node_info_name in self.model.nodeinfo.addables:
                message = localizer.translate(
                    _('cannot_paste_cardinality_violation',
                      default="Violation. '${target}' is not allowed to "
                              "contain '${source}'"),
                      mapping={
                          'target': self.model.nodeinfo.title,
                          'source': node.nodeinfo.title})
                errors.append(message)
                continue
            source = node.parent
            if copy:
                node = source[node.name].deepcopy()
            else:
                in_model = False
                for parent in LocationIterator(self.model):
                    if parent is node:
                        message = localizer.translate(
                            _('cannot_paste_self_containment',
                              default="Cannot paste cut object to child "
                                      "of it: ${name}"),
                              mapping={'name': parent.name})
                        errors.append(message)
                        in_model = True
                        break
                if in_model:
                    continue
                node = source.detach(node.name)
            node.__parent__ = self.model
            self.model[choose_name(self.model, node.name)] = node
            if cut:
                call_sources.add(source)
            success += 1
        if success > 0:
            self.model()
        for source in call_sources:
            source()
        message = localizer.translate(
            _('pasted_items',
              default="Pasted ${count} items"),
              mapping={'count': success})
        if errors:
            failed = localizer.translate(
                _('pasting_items_failed',
                  default="Pasting of ${count} items failed"),
                  mapping={'count': len(errors)})
            failed = "<br /><strong>%s</strong>" % failed
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

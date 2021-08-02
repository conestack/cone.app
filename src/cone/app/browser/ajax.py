from cone.app.browser.actions import ActionContext
from cone.app.browser.utils import format_traceback
from cone.app.interfaces import ILiveSearch
from cone.tile import render_tile
from node.utils import safe_encode
from pyramid.exceptions import Forbidden
from pyramid.response import Response
from pyramid.view import view_config
import json
import logging


@view_config(name='ajaxaction', accept='application/json', renderer='json')
def ajax_tile(model, request):
    """Treibstoff ajax ``ajaxaction`` implementation for cone.

    * Renders tile with name ``ajax.action``.

    * Uses definitions from ``request.environ['cone.app.continuation']``
      for continuation definitions.
    """
    try:
        name = request.params['ajax.action']
        ActionContext(model, request, name)
        rendered = render_tile(model, request, name)
        continuation = request.environ.get('cone.app.continuation')
        if continuation:
            continuation = AjaxContinue(continuation).definitions
        else:
            continuation = False
        return {
            'mode': request.params.get('ajax.mode'),
            'selector': request.params.get('ajax.selector'),
            'payload': rendered,
            'continuation': continuation,
        }
    except Forbidden:
        request.response.status = 403
        return {}
    except Exception:
        logging.exception('Error within ajax tile')
        tb = format_traceback()
        continuation = AjaxContinue(
            [AjaxMessage(tb, 'error', None)]).definitions
        return {
            'mode': 'NONE',
            'selector': 'NONE',
            'payload': '',
            'continuation': continuation,
        }


def ajax_continue(request, continuation):
    """Set ajax continuation on environ.

    continuation
        list of continuation definition objects or single continuation
        definition.
    """
    if request.environ.get('cone.app.continuation', None) is None:
        request.environ['cone.app.continuation'] = list()
    if isinstance(continuation, list):
        existent = request.environ['cone.app.continuation']
        request.environ['cone.app.continuation'] = existent + continuation
    else:
        request.environ['cone.app.continuation'].append(continuation)


def ajax_message(request, payload, flavor='message'):
    """Convenience to add ajax message definition to ajax continuation
    definitions.
    """
    ajax_continue(request, AjaxMessage(payload, flavor, None))


def ajax_status_message(request, payload):
    """Convenience to add ajax status message definition to ajax continuation
    definitions.
    """
    ajax_continue(request, AjaxMessage(payload, None, '#status_message'))


class AjaxPath(object):
    """Ajax path configuration. Used to define continuation path for
    client side.
    """

    def __init__(self, path, target=None,
                 action=None, event=None,
                 overlay=None, overlay_css=None):
        self.path = path
        self.target = target
        self.action = action
        self.event = event
        self.overlay = overlay
        self.overlay_css = overlay_css

    def as_json(self):
        return {
            'type': 'path',
            'path': self.path,
            'target': self.target,
            'action': self.action,
            'event': self.event,
            'overlay': self.overlay,
            'overlay_css': self.overlay_css
        }


class AjaxAction(object):
    """Ajax action configuration. Used to define continuation actions for
    client side.
    """

    def __init__(self, target, name, mode, selector):
        self.target = target
        self.name = name
        self.mode = mode
        self.selector = selector

    def as_json(self):
        return {
            'type': 'action',
            'target': self.target,
            'name': self.name,
            'mode': self.mode,
            'selector': self.selector
        }


class AjaxEvent(object):
    """Ajax event configuration. Used to define continuation events for
    client side.
    """

    def __init__(self, target, name, selector, data=None):
        self.target = target
        self.name = name
        self.selector = selector
        self.data = data

    def as_json(self):
        return {
            'type': 'event',
            'target': self.target,
            'name': self.name,
            'selector': self.selector,
            'data': self.data
        }


class AjaxMessage(object):
    """Ajax Message configuration. Used to define continuation messages for
    client side.
    """

    def __init__(self, payload, flavor, selector):
        self.payload = payload
        self.flavor = flavor
        self.selector = selector

    def as_json(self):
        return {
            'type': 'message',
            'payload': self.payload,
            'flavor': self.flavor,
            'selector': self.selector
        }


class AjaxOverlay(object):
    """Ajax overlay configuration. Used to display or close overlays on client
    side.
    """

    def __init__(self, selector=None, action=None, target=None,
                 close=False, content_selector=None, css=None, uid=None,
                 title=None):
        if selector or content_selector:
            msg = '``selector`` and ``content_selector`` no longer supported.'
            raise ValueError(msg)
        if close and not uid:
            msg = 'overlay ``uid`` must be given if ``close`` is True.'
            raise ValueError(msg)
        self.css = css
        self.action = action
        self.target = target
        self.close = close
        self.uid = uid
        self.title = title

    def as_json(self):
        return {
            'type': 'overlay',
            'css': self.css,
            'action': self.action,
            'target': self.target,
            'close': self.close,
            'uid': self.uid,
            'title': self.title
        }


class AjaxContinue(object):
    """Convert ``AjaxPath``, ``AjaxAction``, ``AjaxEvent``, ``AjaxMessage``
    and  ``AjaxOverlay ``instances to JSON response definitions for treibstoff
    ajax continuation.
    """

    def __init__(self, continuation):
        self.continuation = continuation

    @property
    def definitions(self):
        """Continuation definitions as list of dicts for JSON serialization.
        """
        if not self.continuation:
            return
        continuation = list()
        for definition in self.continuation:
            continuation.append(definition.as_json())
        return continuation

    def dump(self):
        """Return a JSON dump of continuation definitions.
        """
        ret = self.definitions
        if not ret:
            return
        return json.dumps(ret)


class AjaxFormContinue(AjaxContinue):
    """Ajax form continuation computing. Used by ``render_ajax_form``.
    """

    def __init__(self, result, continuation):
        self.result = result
        AjaxContinue.__init__(self, continuation)

    @property
    def form(self):
        """Return rendered form tile result if no continuation actions.
        """
        if not self.continuation:
            return self.result
        return ''

    @property
    def next(self):
        """Return 'false' if no continuation actions, otherwise a JSON dump of
        continuation definitions.
        """
        ret = self.dump()
        if not ret:
            return 'false'
        return ret


def ajax_form_fiddle(request, selector, mode):
    """Define ajax form fiddle mode and selector. Used on client side to
    determine form location in replacement mode for rendered ajax form.
    """
    request.environ['cone.app.form.selector'] = selector
    request.environ['cone.app.form.mode'] = mode


ajax_form_template = """\
<div id="ajaxform">
    %(form)s
</div>
<script language="javascript" type="text/javascript">
    var container = document.getElementById('ajaxform');
    var child = container.firstChild;
    while(child != null && child.nodeType == 3) {
        child = child.nextSibling;
    }
    parent.ts.ajax.form({
        payload: child,
        selector: '%(selector)s',
        mode: '%(mode)s',
        next: %(next)s,
        error: %(error)s
    });
</script>
"""


def render_ajax_form(model, request, name):
    """Render ajax form.
    """
    try:
        result = render_tile(model, request, name)
        selector = request.environ.get('cone.app.form.selector', '#content')
        mode = request.environ.get('cone.app.form.mode', 'inner')
        continuation = request.environ.get('cone.app.continuation')
        form_continue = AjaxFormContinue(result, continuation)
        rendered_form = form_continue.form
        rendered = ajax_form_template % dict(
            form=rendered_form,
            selector=selector,
            mode=mode,
            next=form_continue.next,
            error='false'
        )
        request.response.body = safe_encode(rendered)
        return request.response
    except Exception:
        result = '<div>Form rendering error</div>'
        selector = request.environ.get('cone.app.form.selector', '#content')
        mode = request.environ.get('cone.app.form.mode', 'inner')
        tb = format_traceback()
        continuation = AjaxMessage(tb, 'error', None)
        form_continue = AjaxFormContinue(result, [continuation])
        rendered = ajax_form_template % dict(
            form=form_continue.form.replace(u'\n', u' '),
            selector=selector,
            mode=mode,
            next=form_continue.next,
            error='true'
        )
        return Response(rendered)


@view_config(name='livesearch', accept='application/json', renderer='json')
def livesearch(model, request):
    adapter = request.registry.queryAdapter(model, ILiveSearch)
    if not adapter:
        return list()
    return adapter.search(request, request.params['term'])

from cone.app.browser.actions import ActionContext
from cone.app.browser.utils import bdajax_warning
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

    * Renders tile with name found on request ``ajax.action``.

    * Uses operations from ``request.environ['cone.app.continuation']``
      for continuation.
    """
    try:
        if 'bdajax.action' in request.params:
            bdajax_warning('action')
            name = request.params['bdajax.action']
        else:
            name = request.params['ajax.action']
        ActionContext(model, request, name)
        rendered = render_tile(model, request, name)
        operations = request.environ.get('cone.app.continuation', [])
        continuation = AjaxContinue(operations)
        if 'bdajax.mode' in request.params:
            bdajax_warning('mode')
            mode = request.params['bdajax.mode']
        else:
            mode = request.params.get('ajax.mode')
        if 'bdajax.selector' in request.params:
            bdajax_warning('selector')
            selector = request.params['bdajax.selector']
        else:
            selector = request.params.get('ajax.selector')
        return dict(
            mode=mode,
            selector=selector,
            payload=rendered,
            continuation=continuation.operations,
        )
    except Forbidden:
        request.response.status = 403
        return {}
    except Exception:
        logging.exception('Error within ajax tile')
        tb = format_traceback()
        continuation = AjaxContinue([AjaxMessage(tb, 'error', None)])
        return dict(
            mode='NONE',
            selector='NONE',
            payload='',
            continuation=continuation.operations
        )


def ajax_continue(request, operations):
    """Set ajax continuation on environ.

    operations
        list of continuation operation objects or single continuation
        operation.
    """
    if request.environ.get('cone.app.continuation', None) is None:
        request.environ['cone.app.continuation'] = list()
    if isinstance(operations, list):
        existent = request.environ['cone.app.continuation']
        request.environ['cone.app.continuation'] = existent + operations
    else:
        request.environ['cone.app.continuation'].append(operations)


def ajax_message(request, payload, flavor='message'):
    """Convenience to add ajax message operation to ajax continuation
    operations.
    """
    ajax_continue(request, AjaxMessage(payload, flavor, None))


def ajax_status_message(request, payload):
    """Convenience to add ajax status message operation to ajax continuation
    operations.
    """
    ajax_continue(request, AjaxMessage(payload, None, '#status_message'))


class AjaxPath(object):
    """Ajax path continuation operation.
    """

    def __init__(self, path, target=None, action=None, event=None,
                 overlay=None, overlay_css=None, overlay_uid=None,
                 overlay_title=None):
        """Create ajax path continuation operation.

        :param path: Browser path to be set.
        :param target: Traversable target URL without trailing server view.
        :param action: Name of action which should be performed.
        :param event: Event to trigger.
        :param overlay: Overlay to display.
        :param overlay_css: Additional overlay CSS class.
        :param overlay_uid: UID of the overlay
        :param overlay_title: Title of the overlay.
        """
        self.path = path
        self.target = target
        self.action = action
        self.event = event
        self.overlay = overlay
        self.overlay_css = overlay_css
        self.overlay_uid = overlay_uid
        self.overlay_title = overlay_title

    def as_json(self):
        return {
            'type': 'path',
            'path': self.path,
            'target': self.target,
            'action': self.action,
            'event': self.event,
            'overlay': self.overlay,
            'overlay_css': self.overlay_css,
            'overlay_uid': self.overlay_uid,
            'overlay_title': self.overlay_title
        }


class AjaxAction(object):
    """Ajax action continuation operation.
    """

    def __init__(self, target, name, mode, selector):
        """Create ajax action continuation operation.

        :param target: Traversable target URL without trailing server view.
        :param name: Action name.
        :param mode: DOM modification mode. Either ``inner`` and ``replace``.
        :param selector: DOM modification selector.
        """
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
    """Ajax event continuation operation.
    """

    def __init__(self, target, name, selector, data=None):
        """Create ajax event continuation operation.

        :param target: Traversable target URL without trailing server view.
        :param name: Event name.
        :param selector: Selector of DOM elements on which to trigger the event
        :param data: Optional data set on event.
        """
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
    """Ajax message continuation operation.
    """

    def __init__(self, payload, flavor, selector):
        """Create ajax message continuation operation.

        :param payload: Message payload as text or markup.
        :param flavor: XOR with ``selector``. One out of ``message``, ``info``,
            ``warning`` or ``error``.
        :param selector: XOR with ``flavor``. If given, render message to DOM
            element found by selector.
        """
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
    """Ajax overlay continuation operation.
    """

    def __init__(self, selector=None, action=None, target=None,
                 close=False, content_selector=None, css=None, uid=None,
                 title=None):
        """Create ajax overlay continuation operation.

        :param action: Name of action which should be displayed in overlay.
        :param target: Traversable target URL without trailing server view.
        :param close: Flag whether to close an open overlay.
        :param css: Additional overlay CSS class.
        :param uid: Overlay UID. Must be given if ``close`` is ``True``. The
            overlay UID gets passed on request as ``ajax.overlay-uid`` parameter
            if the overlay was displayed with ``ajax:overlay`` in the browser.
        :param title: Overlay title.
        """
        if selector or content_selector:
            msg = '``selector`` and ``content_selector`` no longer supported.'
            raise ValueError(msg)
        if close and not uid:
            msg = 'overlay ``uid`` must be given if ``close`` is True.'
            raise ValueError(msg)
        self.action = action
        self.target = target
        self.close = close
        self.css = css
        self.uid = uid
        self.title = title

    def as_json(self):
        return {
            'type': 'overlay',
            'action': self.action,
            'target': self.target,
            'close': self.close,
            'css': self.css,
            'uid': self.uid,
            'title': self.title
        }


class AjaxContinue(object):
    """Ajax continuation operations provider.
    """

    def __init__(self, operations):
        self._operations = operations

    @property
    def operations(self):
        """Continuation operations as list of dicts for JSON serialization.
        """
        if self._operations is None:
            return []
        return [op.as_json() for op in self._operations]

    def dump(self):
        """JSON dump of continuation operations.
        """
        ret = self.operations
        return json.dumps(ret)


class AjaxFormContinue(AjaxContinue):
    """Ajax form continuation operation computing. Used by ``render_ajax_form``.
    """

    def __init__(self, result, operations):
        self.result = result
        AjaxContinue.__init__(self, operations)

    @property
    def form(self):
        """Return rendered form tile result if no continuation operations.
        """
        if not self._operations:
            return self.result
        return ''

    @property
    def next(self):
        """JSON dump of ajax continuation operations.
        """
        return self.dump()


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
        operations = request.environ.get('cone.app.continuation')
        form_continue = AjaxFormContinue(result, operations)
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
        operations = AjaxMessage(tb, 'error', None)
        form_continue = AjaxFormContinue(result, [operations])
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

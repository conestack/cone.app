import sys
import types
import json
import traceback
import logging
from pyramid.response import Response
from pyramid.view import view_config
from cone.tile import (
    registerTile,
    render_tile,
)
from cone.app.browser.actions import ActionContext


def format_traceback():
    etype, value, tb = sys.exc_info()
    ret = ''.join(traceback.format_exception(etype, value, tb))
    return '<pre>%s</pre>' % ret


@view_config(context=Exception, accept='application/json', renderer='json')
def ajax_internal_server_error(request):
    tb = format_traceback()
    continuation = AjaxContinue([AjaxMessage(tb, 'error', None)]).definitions
    return {
        'mode': 'NONE',
        'selector': 'NONE',
        'payload': '',
        'continuation': continuation,
    }


registerTile('bdajax', 'bdajax:bdajax.pt', permission='login')


@view_config(name='ajaxaction', accept='application/json', renderer='json')
def ajax_tile(model, request):
    """bdajax ``ajaxaction`` implementation for cone.
    
    * Renders tile with name ``bdajax.action``.
    
    * Uses definitions from ``request.environ['cone.app.continuation']``
      for continuation definitions.
    """
    try:
        name = request.params.get('bdajax.action')
        action_context = ActionContext(model, request, name)
        rendered = render_tile(model, request, action_context.scope)
        continuation = request.environ.get('cone.app.continuation')
        if continuation:
            continuation = AjaxContinue(continuation).definitions
        else:
            continuation = False
        return {
            'mode': request.params.get('bdajax.mode'),
            'selector': request.params.get('bdajax.selector'),
            'payload': rendered,
            'continuation': continuation,
        }
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
    if type(continuation) is types.ListType:
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


class AjaxAction(object):
    """Ajax action configuration. Used to define continuation actions for
    client side.
    """
    
    def __init__(self, target, name, mode, selector):
        self.target = target
        self.name = name
        self.mode = mode
        self.selector = selector


class AjaxEvent(object):
    """Ajax event configuration. Used to define continuation events for
    client side.
    """
    
    def __init__(self, target, name, selector):
        self.target = target
        self.name = name
        self.selector = selector


class AjaxMessage(object):
    """Ajax Message configuration. Used to define continuation messages for
    client side.
    """
    
    def __init__(self, payload, flavor, selector):
        self.payload = payload
        self.flavor = flavor
        self.selector = selector


# XXX
#class AjaxOverlay(object):
#    """Ajax overlay configuration
#    """


class AjaxContinue(object):
    """Convert ``AjaxAction`` and ``AjaxEvent`` instances to JSON response
    definitions for bdajax continuation.
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
            if isinstance(definition, AjaxAction):
                continuation.append({
                    'type': 'action',
                    'target': definition.target,
                    'name': definition.name,
                    'mode': definition.mode,
                    'selector': definition.selector,
                })
            if isinstance(definition, AjaxEvent):
                continuation.append({
                    'type': 'event',
                    'target': definition.target,
                    'name': definition.name,
                    'selector': definition.selector,
                })
            if isinstance(definition, AjaxMessage):
                continuation.append({
                    'type': 'message',
                    'payload': definition.payload,
                    'flavor': definition.flavor,
                    'selector': definition.selector,
                })
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
<script language="javascript" type="text/javascript">
    parent.cone.ajaxformrender('%(form)s', '%(selector)s', '%(mode)s');
    parent.bdajax.continuation(%(next)s);
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
        rendered = ajax_form_template % {
            'form': form_continue.form.replace(u'\n', u' '),
            'selector': selector,
            'mode': mode,
            'next': form_continue.next,
        }
        return Response(rendered)
    except Exception:
        result = '<div>Form rendering error</div>'
        selector = request.environ.get('cone.app.form.selector', '#content')
        mode = request.environ.get('cone.app.form.mode', 'inner')
        tb = format_traceback()
        continuation = AjaxMessage(tb, 'error', None)
        form_continue = AjaxFormContinue(result, [continuation])
        rendered = ajax_form_template % {
            'form': form_continue.form.replace(u'\n', u' '), # XXX: why replace
            'selector': selector,
            'mode': mode,
            'next': form_continue.next,
        }
        return Response(rendered)


def dummy_livesearch_callback(model, request):
    """Dummy callback for Livesearch. Set as default.
    
    We receive the search term at ``request.params['term']``.
    
    Livesearch expects a list of dicts with keys:
        ``label`` - Label of found item
        ``value`` - The value re-inserted in input. This is normally ``term``
        ``target`` - The target URL for rendering the content tile.
    """
    term = request.params['term']
    return [
        {
            'label': 'Root',
            'value': term,
            'target': request.application_url,
        },
    ]


# Overwrite this with your own implementation on application startup
LIVESEARCH_CALLBACK = dummy_livesearch_callback

@view_config(name='livesearch', accept='application/json', renderer='json')
def livesearch(model, request):
    """Call ``LIVESEARCH_CALLBACK`` and return its results.
    """
    return LIVESEARCH_CALLBACK(model, request)
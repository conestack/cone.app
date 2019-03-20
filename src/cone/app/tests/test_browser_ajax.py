from cone.app import root
from cone.app import testing
from cone.app.browser.ajax import ajax_continue
from cone.app.browser.ajax import ajax_form_template
from cone.app.browser.ajax import ajax_message
from cone.app.browser.ajax import ajax_status_message
from cone.app.browser.ajax import ajax_tile
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.ajax import AjaxFormContinue
from cone.app.browser.ajax import AjaxMessage
from cone.app.browser.ajax import AjaxOverlay
from cone.app.browser.ajax import AjaxPath
from cone.app.browser.ajax import livesearch
from cone.app.browser.ajax import render_ajax_form
from cone.app.browser.form import Form
from cone.app.interfaces import ILiveSearch
from cone.tile import Tile
from cone.tile import tile
from cone.tile.tests import TileTestCase
from webob.exc import HTTPFound
from yafowil.base import factory
from zope.component import adapter
from zope.interface import implementer
from zope.interface import Interface


class TestBrowserAjax(TileTestCase):
    layer = testing.security

    def test_ajax_tile(self):
        # ``ajax_tile`` is the server side bdajax implementation for cone.
        # Using ``bdajax.action`` with cone renders tiles by action name.
        with self.layer.hook_tile_reg():
            @tile(name='testtile')
            class TestTile(Tile):
                def render(self):
                    return 'rendered test tile'

        request = self.layer.new_request()
        request.params['bdajax.action'] = 'testtile'
        request.params['bdajax.mode'] = 'replace'
        request.params['bdajax.selector'] = '.foo'

        # Fails unauthenticated, since default permission for tiles is 'view'
        self.assertEqual(ajax_tile(root, request), {})
        self.assertEqual(request.response.status, '403 Forbidden')

        # Authenticate and test again
        with self.layer.authenticated('max'):
            self.assertEqual(ajax_tile(root, request), {
                'continuation': False,
                'payload': 'rendered test tile',
                'mode': 'replace',
                'selector': '.foo'
            })

    def test_AjaxAction(self):
        target = 'http://example.com'
        actionname = 'tilename'
        mode = 'replace'
        selector = '.someselector'
        action = AjaxAction(target, actionname, mode, selector)
        self.assertEqual(
            (action.name, action.selector, action.mode, action.target),
            (actionname, selector, mode, target)
        )

    def test_AjaxEvent(self):
        target = 'http://example.com'
        eventname = 'contextchanged'
        selector = '.contextsensitiv'
        event = AjaxEvent(target, eventname, selector)
        self.assertEqual(
            (event.name, event.selector, event.target),
            (eventname, selector, target)
        )

    def test_AjaxMessage(self):
        payload = 'Some info message'
        flavor = 'info'
        selector = 'None'
        message = AjaxMessage(payload, flavor, selector)
        self.assertEqual(
            (message.payload, message.flavor, message.selector),
            (payload, flavor, selector)
        )

    def test_AjaxOverlay(self):
        selector = '#ajax-overlay'
        action = None
        target = None
        close = False
        content_selector = '.overlay_content'
        css = None
        overlay = AjaxOverlay()
        self.assertEqual(
            (
                overlay.selector, overlay.action, overlay.target,
                overlay.close, overlay.content_selector, overlay.css
            ),
            (selector, action, target, close, content_selector, css),
        )

        selector = '#ajax-overlay'
        action = 'someaction'
        target = 'http://example.com'
        close = False
        content_selector = '.overlay_content'
        css = 'additional-css-class'
        overlay = AjaxOverlay(
            selector, action, target, close, content_selector, css
        )
        self.assertEqual(
            (
                overlay.selector, overlay.action, overlay.target,
                overlay.close, overlay.content_selector, overlay.css
            ),
            (selector, action, target, close, content_selector, css),
        )

    def test_AjaxPath(self):
        path = 'foo/bar'
        target = None
        action = None
        event = None
        overlay = None
        overlay_css = None
        apath = AjaxPath(path)
        self.assertEqual(
            (
                apath.path, apath.target, apath.action, apath.event,
                apath.overlay, apath.overlay_css
            ),
            (path, target, action, event, overlay, overlay_css)
        )

        path = 'foo/bar'
        target = 'http://example.com/foo/bar'
        action = 'layout:#layout:replace'
        event = 'contextchanged:#someid'
        overlay = 'acionname:#custom-overlay:.custom_overlay_content'
        overlay_css = 'additional-overlay-css-class'
        apath = AjaxPath(
            'foo/bar',
            target=target,
            action=action,
            event=event,
            overlay=overlay,
            overlay_css=overlay_css
        )
        self.assertEqual(
            (
                apath.path, apath.target, apath.action, apath.event,
                apath.overlay, apath.overlay_css
            ),
            (path, target, action, event, overlay, overlay_css)
        )

"""
Use ``ajax_continue`` in your tile passing the request and an instance or a
list of instances to set continuation actions::

    >>> layer.hook_tile_reg()

    >>> @tile(name='testtile2')
    ... class TestTile(Tile):
    ...     def render(self):
    ...         ajax_continue(self.request,
    ...                       AjaxAction('target', 'name', 'mode', 'selector'))
    ...         return u''

    >>> layer.unhook_tile_reg()

    >>> request.params['bdajax.action'] = 'testtile2'
    >>> ajax_tile(root, request)
    {'continuation': 
    [{'mode': 'mode', 
    'selector': 'selector', 
    'type': 'action', 
    'target': 'target', 
    'name': 'name'}], 
    'payload': u'', 
    'mode': 'replace', 
    'selector': '.foo'}

    >>> layer.logout()

Use ``ajax_message`` as shortcut for settings continuation message::

    >>> request = layer.new_request()
    >>> ajax_message(request, 'payload')
    >>> request.environ['cone.app.continuation']
    [<cone.app.browser.ajax.AjaxMessage object at ...>]

Use ``ajax_status_message`` as shortcut for settings continuation statu 
message::

    >>> request = layer.new_request()
    >>> ajax_status_message(request, 'payload')
    >>> request.environ['cone.app.continuation']
    [<cone.app.browser.ajax.AjaxMessage object at ...>]


Ajax form support
-----------------

Ajax form support is done with a hidden iframe, where forms are committed to
if an ajax form is detected. On server side we have to consider this at some 
places.

- The view mapping to submitted form action must check whether ajax flag is set
  on request and return results of ``render_ajax_form`` if so. If not, return
  results of ``render_main_template``.
  XXX: really ``render_main_template`` in all cases?

- The view mapping to submitted form action must call ``ajax_form_fiddle``,
  which defines ajax mode and selector to use when re-rendering forms if form
  controller ``next`` returns nothing.

- The form implementing tiles have to return a list of ``AjaxAction`` and or
  ``AjaxEvent`` and or ``AjaxMessage`` instances by ``next`` function if ajax 
  flag is set. ``AjaxAction``, ``AjaxEvent`` and ``AjaxMessage`` each represent
  either a ``bdajax.action``, a ``bdajax.trigger`` or a ``bdajax.message`` call
  on the client side, and are executed in order. If no ajax flag is set, the
  form's next function normally returns a ``HTTPFound`` instance.

AjaxFormContinue object. This object is used by ``render_ajax_form``::

    >>> result = ''
    >>> continuation = []
    >>> afc = AjaxFormContinue(result, continuation)
    >>> afc.form
    ''

    >>> afc.next
    'false'

If no continuation definitions, ``form`` returns result and ``next`` returns 
'false'::

    >>> result = 'rendered form'
    >>> afc = AjaxFormContinue(result, [])
    >>> afc.form
    'rendered form'

    >>> afc.next
    'false'

If continuation definitions and result, ``form`` returns empty string, because
form processing was successful. ``next`` returns a JSON dump of given actions,
which gets interpreted and executed on client side::

    >>> continuation = [action, event, message, overlay, path]
    >>> afc = AjaxFormContinue(result, continuation)
    >>> afc.form
    ''

    >>> afc.next
    '[{"mode": "replace", 
    "selector": ".someselector", 
    "type": "action", 
    "target": "http://example.com", 
    "name": "tilename"}, 
    {"selector": ".contextsensitiv", 
    "type": "event", 
    "target": "http://example.com", 
    "name": "contextchanged"}, 
    {"flavor": "info", 
    "type": "message", 
    "payload": "Some info message", 
    "selector": "None"}, 
    {"target": "http://example.com", 
    "content_selector": ".overlay_content", 
    "selector": "#ajax-overlay", 
    "action": "someaction", 
    "close": false, 
    "type": "overlay", 
    "css": "additional-css-class"}, 
    {"overlay_css": "additional-overlay-css-class", 
    "target": "http://example.com/foo/bar", 
    "overlay": "acionname:#custom-overlay:.custom_overlay_content", 
    "action": "layout:#layout:replace", 
    "path": "foo/bar", 
    "type": "path", 
    "event": "contextchanged:#someid"}]'

AjaxFormContinue information is used by ``render_ajax_form`` for rendering
the response::

    >>> print ajax_form_template.split('\n')
    ['<div id="ajaxform">', 
    '    %(form)s', 
    '</div>', 
    '<script language="javascript" type="text/javascript">', 
    "    var container = document.getElementById('ajaxform');", 
    '    var child = container.firstChild;', 
    '    while(child != null && child.nodeType == 3) {', 
    '        child = child.nextSibling;', 
    '    }', 
    "    parent.bdajax.render_ajax_form(child, '%(selector)s', '%(mode)s', %(next)s);", 
    '</script>', 
    '']

Test ``render_ajax_form``. Provide a dummy Form::

    >>> layer.hook_tile_reg()

    >>> @tile(name='ajaxtestform')
    ... class AjaxTestForm(Form):
    ...     
    ...     def prepare(self):
    ...         self.form = factory(
    ...             'form',
    ...             name='ajaxtestform',
    ...             props={
    ...                 'action': 'http://example.com/foo',
    ...             })
    ...         self.form['foo'] = factory(
    ...             'field:error:text',
    ...             props={
    ...                 'required': 1,
    ...             })
    ...         self.form['save'] = factory(
    ...             'submit',
    ...             props = {
    ...                 'action': 'save',
    ...                 'expression': True,
    ...                 'handler': self.save,
    ...                 'next': self.next,
    ...                 'label': 'Save',
    ...             })
    ...     
    ...     def save(self, widget, data):
    ...         pass
    ...     
    ...     def next(self, request):
    ...         url = 'http://example.com'
    ...         if self.ajax_request:
    ...             return [
    ...                 AjaxAction(url, 'content', 'inner', '#content'),
    ...                 AjaxEvent(url, 'contextchanged', '.contextsensitiv')
    ...             ]
    ...         return HTTPFound(location=url)

    >>> layer.unhook_tile_reg()

Test unauthorized::

    >>> request = layer.new_request()
    >>> res = render_ajax_form(root, request, 'ajaxtestform')
    >>> res.body
    '<div id="ajaxform">\n    \n</div>\n<script language="javascript" 
    ...HTTPForbidden: Unauthorized: tile <AjaxTestForm object at ...> 
    failed permission check...

Test authorized with form extraction failure::

    >>> layer.login('max')
    >>> request.params['ajax'] = '1'
    >>> request.params['ajaxtestform.foo'] = ''
    >>> request.params['action.ajaxtestform.save'] = 1
    >>> response = render_ajax_form(root, request, 'ajaxtestform')
    >>> result = str(response)

    >>> result.find('<div class="errormessage">') != -1
    True

    >>> result.find('<script language="javascript"') != -1
    True

    >>> result.find('parent.bdajax.render_ajax_form(child, ') != -1
    True

Test with form perocessing passing::

    >>> request.params['ajaxtestform.foo'] = 'foo'
    >>> response = render_ajax_form(root, request, 'ajaxtestform')
    >>> result = str(response)
    >>> expected = 'parent.bdajax.render_ajax_form(child, \'#content\', \'inner\', [{'
    >>> result.find(expected) != -1
    True

    >>> layer.logout()


Livesearch
----------

Cone provides a livesearch view, but no referring ``ILiveSearch`` implementing
adapter for it::

    >>> request = layer.new_request()
    >>> request.params['term'] = 'foo'
    >>> livesearch(root, request)
    []

Provide dummy adapter::

    >>> @implementer(ILiveSearch)
    ... @adapter(Interface)
    ... class LiveSearch(object):
    ...     def __init__(self, model):
    ...         self.model = model
    ...     def search(self, request, query):
    ...         return [{'value': 'Value'}]

    >>> registry = request.registry
    >>> registry.registerAdapter(LiveSearch)

    >>> livesearch(root, request)
    [{'value': 'Value'}]

"""
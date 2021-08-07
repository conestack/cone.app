from cone.app import get_root
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
from yafowil.base import factory
from zope.component import adapter
from zope.interface import implementer
from zope.interface import Interface
import json


class TestBrowserAjax(TileTestCase):
    layer = testing.security

    def test_ajax_tile(self):
        # ``ajax_tile`` is the server side treibstoff ajax implementation for
        # cone. Using ``ts.ajax.action`` with cone renders tiles by action name.
        with self.layer.hook_tile_reg():
            @tile(name='testtile')
            class TestTile(Tile):
                def render(self):
                    return 'rendered test tile'

        root = get_root()
        request = self.layer.new_request()
        request.params['ajax.action'] = 'testtile'
        request.params['ajax.mode'] = 'replace'
        request.params['ajax.selector'] = '.foo'

        # Fails unauthenticated, since default permission for tiles is 'view'
        self.assertEqual(ajax_tile(root, request), {})
        self.assertEqual(request.response.status, '403 Forbidden')

        # Authenticate and test again
        with self.layer.authenticated('max'):
            res = ajax_tile(root, request)
        self.assertEqual(res, {
            'continuation': [],
            'payload': 'rendered test tile',
            'mode': 'replace',
            'selector': '.foo'
        })

        # Test bdajax warning
        request = self.layer.new_request()
        request.params['bdajax.action'] = 'testtile'
        request.params['bdajax.mode'] = 'replace'
        request.params['bdajax.selector'] = '.foo'

        with self.layer.authenticated('max'):
            res = ajax_tile(root, request)
        self.assertEqual(res, {
            'continuation': [],
            'payload': 'rendered test tile',
            'mode': 'replace',
            'selector': '.foo'
        })

        # Test with error raising tile
        with self.layer.hook_tile_reg():
            @tile(name='errortile')
            class ErrorTile(Tile):
                def render(self):
                    raise Exception('Error while rendering')

        request = self.layer.new_request()
        request.params['ajax.action'] = 'errortile'
        request.params['ajax.mode'] = 'replace'
        request.params['ajax.selector'] = '.foo'

        with self.layer.authenticated('max'):
            res = ajax_tile(root, request)
        self.assertEqual(res['payload'], '')
        self.assertEqual(res['mode'], 'NONE')
        self.assertEqual(res['selector'], 'NONE')
        self.assertEqual(res['continuation'][0]['flavor'], 'error')
        self.assertEqual(res['continuation'][0]['type'], 'message')
        self.assertEqual(res['continuation'][0]['selector'], None)
        expected = 'Exception: Error while rendering'
        self.assertTrue(res['continuation'][0]['payload'].find(expected) > -1)

    def test_AjaxAction(self):
        target = 'http://example.com'
        actionname = 'tilename'
        mode = 'replace'
        selector = '.someselector'

        action = AjaxAction(
            target=target,
            name=actionname,
            mode=mode,
            selector=selector
        )

        self.assertEqual(
            (action.name, action.selector, action.mode, action.target),
            (actionname, selector, mode, target)
        )

        self.assertEqual(action.as_json(), {
            'type': 'action',
            'target': target,
            'name': actionname,
            'mode': mode,
            'selector': selector
        })

    def test_AjaxEvent(self):
        target = 'http://example.com'
        eventname = 'contextchanged'
        selector = '.contextsensitiv'
        data = {'key': 'value'}

        event = AjaxEvent(
            target=target,
            name=eventname,
            selector=selector,
            data=data
        )

        self.assertEqual(
            (event.name, event.selector, event.target, event.data),
            (eventname, selector, target, data)
        )

        self.assertEqual(event.as_json(), {
            'type': 'event',
            'target': target,
            'name': eventname,
            'selector': selector,
            'data': data
        })

    def test_AjaxMessage(self):
        payload = 'Some info message'
        flavor = 'info'
        selector = 'None'

        message = AjaxMessage(
            payload=payload,
            flavor=flavor,
            selector=selector
        )

        self.assertEqual(
            (message.payload, message.flavor, message.selector),
            (payload, flavor, selector)
        )

        self.assertEqual(message.as_json(), {
            'type': 'message',
            'payload': payload,
            'flavor': flavor,
            'selector': selector
        })

    def test_AjaxOverlay(self):
        self.assertRaises(ValueError, AjaxOverlay, selector='foo')
        self.assertRaises(ValueError, AjaxOverlay, content_selector='foo')
        self.assertRaises(ValueError, AjaxOverlay, close=True)

        action = 'someaction'
        target = 'http://example.com'
        close = False
        css = 'css-class'
        uid = '1234'
        title = 'Overlay Title'

        overlay = AjaxOverlay(
            action=action,
            target=target,
            close=close,
            css=css,
            uid=uid,
            title=title
        )

        self.assertEqual((
            overlay.action,
            overlay.target,
            overlay.close,
            overlay.css,
            overlay.uid,
            overlay.title
        ), (action, target, close, css, uid, title))

        self.assertEqual(overlay.as_json(), {
            'type': 'overlay',
            'action': action,
            'target': target,
            'close': close,
            'css': css,
            'uid': uid,
            'title': title
        })

    def test_AjaxPath(self):
        path = 'foo/bar'
        target = None
        action = None
        event = None
        overlay = None
        overlay_css = None
        overlay_uid = None
        overlay_title = None

        apath = AjaxPath(path=path)
        self.assertEqual((
            apath.path, apath.target, apath.action, apath.event,
            apath.overlay, apath.overlay_css, apath.overlay_uid,
            apath.overlay_title
        ), (
            path, target, action, event, overlay, overlay_css,
            overlay_uid, overlay_title
        ))

        path = 'foo/bar'
        target = 'http://example.com/foo/bar'
        action = 'layout:#layout:replace'
        event = 'contextchanged:#someid'
        overlay = 'acionname'
        overlay_css = 'css-class'
        overlay_uid = '1234'
        overlay_title = 'Overlay Title'
        apath = AjaxPath(
            path=path,
            target=target,
            action=action,
            event=event,
            overlay=overlay,
            overlay_css=overlay_css,
            overlay_uid=overlay_uid,
            overlay_title=overlay_title
        )
        self.assertEqual((
            apath.path, apath.target, apath.action, apath.event,
            apath.overlay, apath.overlay_css, apath.overlay_uid,
            apath.overlay_title
        ), (
            path, target, action, event, overlay, overlay_css,
            overlay_uid, overlay_title
        ))

    def test_ajax_continue(self):
        with self.layer.hook_tile_reg():
            @tile(name='testtile2')
            class TestTile(Tile):
                def render(self):
                    ajax_continue(
                        self.request,
                        AjaxAction('target', 'name', 'mode', 'selector')
                    )
                    return u''

        root = get_root()
        request = self.layer.new_request()
        request.params['ajax.action'] = 'testtile2'
        request.params['ajax.mode'] = 'replace'
        request.params['ajax.selector'] = '.foo'

        with self.layer.authenticated('max'):
            self.assertEqual(ajax_tile(root, request), {
                'continuation': [{
                    'mode': 'mode',
                    'selector': 'selector',
                    'type': 'action',
                    'target': 'target',
                    'name': 'name'
                }],
                'payload': u'',
                'mode': 'replace',
                'selector': '.foo'
            })

    def test_ajax_message(self):
        # ``ajax_message`` is a shortcut for settings continuation message
        request = self.layer.new_request()
        ajax_message(request, 'payload')
        messages = request.environ['cone.app.continuation']
        self.assertTrue(len(messages) == 1)
        message = messages[0]
        self.assertTrue(isinstance(message, AjaxMessage))
        self.assertEqual(
            (message.payload, message.flavor, message.selector),
            ('payload', 'message', None)
        )

    def test_ajax_status_message(self):
        # ``ajax_status_message`` is a shortcut for settings continuation
        # status message
        request = self.layer.new_request()
        ajax_status_message(request, 'payload')
        messages = request.environ['cone.app.continuation']
        self.assertTrue(len(messages) == 1)
        message = messages[0]
        self.assertTrue(isinstance(message, AjaxMessage))
        self.assertEqual(
            (message.payload, message.flavor, message.selector),
            ('payload', None, '#status_message')
        )

    def test_AjaxFormContinue(self):
        # AjaxFormContinue object. This object is used by ``render_ajax_form``
        result = ''
        continuation = []
        afc = AjaxFormContinue(result, continuation)
        self.assertEqual(afc.form, '')
        self.assertEqual(afc.next, '[]')

        # If no continuation operations, ``form`` returns result and ``next``
        # returns '[]'
        result = 'rendered form'
        afc = AjaxFormContinue(result, [])
        self.assertEqual(afc.form, 'rendered form')
        self.assertEqual(afc.next, '[]')

        # If continuation operations and result, ``form`` returns empty
        # string, because form processing was successful. ``next`` returns a
        # JSON dump of given actions, which gets interpreted and executed on
        # client side
        action = AjaxAction(
            target='http://example.com',
            name='tilename',
            mode='replace',
            selector='.someselector'
        )
        event = AjaxEvent(
            target='http://example.com',
            name='contextchanged',
            selector='.contextsensitiv',
            data=dict(key='value')
        )
        message = AjaxMessage(
            payload='Some info message',
            flavor='info',
            selector='None'
        )
        overlay = AjaxOverlay(
            action='someaction',
            target='http://example.com',
            close=False,
            css='css-class',
            uid='1234',
            title='Overlay Title'
        )
        path = AjaxPath(
            path='foo/bar',
            target='http://example.com/foo/bar',
            action='layout:#layout:replace',
            event='contextchanged:#someid',
            overlay='acionname',
            overlay_css='css-class',
            overlay_uid='1234',
            overlay_title='Overlay Title'
        )

        continuation = [action, event, message, overlay, path]
        afc = AjaxFormContinue(result, continuation)
        self.assertEqual(afc.form, '')

        afc_next = json.loads(afc.next)
        self.assertEqual(afc_next, [{
            'type': 'action',
            'target': 'http://example.com',
            'name': 'tilename',
            'selector': '.someselector',
            'mode': 'replace'
        }, {
            'type': 'event',
            'target': 'http://example.com',
            'name': 'contextchanged',
            'selector': '.contextsensitiv',
            'data': {'key': 'value'}
        }, {
            'type': 'message',
            'payload': 'Some info message',
            'flavor': 'info',
            'selector': 'None'
        }, {
            'type': 'overlay',
            'action': 'someaction',
            'target': 'http://example.com',
            'close': False,
            'css': 'css-class',
            'uid': '1234',
            'title': 'Overlay Title'
        }, {
            'type': 'path',
            'path': 'foo/bar',
            'target': 'http://example.com/foo/bar',
            'action': 'layout:#layout:replace',
            'event': 'contextchanged:#someid',
            'overlay': 'acionname',
            'overlay_css': 'css-class',
            'overlay_uid': '1234',
            'overlay_title': 'Overlay Title'
        }])

    def test_render_ajax_form(self):
        self.assertEqual(ajax_form_template.split('\n'), [
            '<div id="ajaxform">',
            '    %(form)s',
            '</div>',
            '<script language="javascript" type="text/javascript">',
            "    var container = document.getElementById('ajaxform');",
            '    var child = container.firstChild;',
            '    while(child != null && child.nodeType == 3) {',
            '        child = child.nextSibling;',
            '    }',
            '    parent.ts.ajax.form({',
            '        payload: child,',
            "        selector: '%(selector)s',",
            "        mode: '%(mode)s',",
            '        next: %(next)s,',
            '        error: %(error)s',
            '    });',
            '</script>',
            ''
        ])

        # Provide a dummy Form
        with self.layer.hook_tile_reg():
            @tile(name='ajaxtestform')
            class AjaxTestForm(Form):
                def prepare(self):
                    self.form = factory(
                        'form',
                        name='ajaxtestform',
                        props={
                            'action': 'http://example.com/foo',
                        })
                    self.form['foo'] = factory(
                        'field:error:text',
                        props={
                            'required': 1,
                        })
                    self.form['save'] = factory(
                        'submit',
                        props={
                            'action': 'save',
                            'expression': True,
                            'handler': self.save,
                            'next': self.next,
                            'label': 'Save',
                        })

                def save(self, widget, data):
                    pass

                def next(self, request):
                    url = 'http://example.com'
                    return [
                        AjaxAction(url, 'content', 'inner', '#content'),
                        AjaxEvent(url, 'contextchanged', '.contextsensitiv')
                    ]

        # Test unauthorized
        root = get_root()
        request = self.layer.new_request()
        res = render_ajax_form(root, request, 'ajaxtestform')
        self.checkOutput("""
        <div id="ajaxform">
        </div>
        <script language="javascript"
        ...HTTPForbidden: Unauthorized: tile <...AjaxTestForm object at ...>
        failed permission check...
        """, res.text)

        # Test authorized with form extraction failure
        with self.layer.authenticated('max'):
            request.params['ajax'] = '1'
            request.params['ajaxtestform.foo'] = ''
            request.params['action.ajaxtestform.save'] = 1
            response = render_ajax_form(root, request, 'ajaxtestform')
            result = str(response)

        self.assertTrue(result.find('<div class="errormessage">') != -1)
        self.assertTrue(result.find('<script language="javascript"') != -1)
        self.assertTrue(result.find('parent.ts.ajax.form({\n') != -1)

        # Test with form processing passing
        with self.layer.authenticated('max'):
            request.params['ajaxtestform.foo'] = 'foo'
            response = render_ajax_form(root, request, 'ajaxtestform')
            result = str(response)

        expected = (
            '    parent.ts.ajax.form({\n'
            '        payload: child,\n'
            '        selector: \'#content\',\n'
            '        mode: \'inner\',\n'
            '        next: [{'
        )
        self.assertTrue(result.find(expected) != -1)

    def test_livesearch(self):
        # Cone provides a livesearch view, but no referring ``ILiveSearch``
        # implementing adapter for it
        root = get_root()
        request = self.layer.new_request()
        request.params['term'] = 'foo'
        self.assertEqual(livesearch(root, request), [])

        # Provide dummy adapter
        @implementer(ILiveSearch)
        @adapter(Interface)
        class LiveSearch(object):
            def __init__(self, model):
                self.model = model

            def search(self, request, query):
                return [{'value': 'Value'}]

        registry = request.registry
        registry.registerAdapter(LiveSearch)

        self.assertEqual(livesearch(root, request), [{'value': 'Value'}])

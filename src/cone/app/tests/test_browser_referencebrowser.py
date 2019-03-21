from cone.app import testing
from cone.app.browser.referencebrowser import ActionAddReference
from cone.app.browser.referencebrowser import ReferencableChildrenLink
from cone.app.model import BaseNode
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from datetime import datetime
from datetime import timedelta
from node.behaviors import UUIDAware
from plumber import plumbing
from pyramid.httpexceptions import HTTPForbidden
from yafowil.base import ExtractionError
from yafowil.base import factory
import cone.app.browser.referencebrowser
import yafowil.loader


@plumbing(UUIDAware)
class UUIDNode(BaseNode):
    node_info_name = 'dummy'


class TestBrowserReferenceBrowser(TileTestCase):
    layer = testing.security

    def test_single_valued(self):
        # Render without any value
        widget = factory(
            'reference',
            'ref',
            props={
                'label': 'Reference',
                'multivalued': False,
                'target': lambda: 'http://example.com/foo',
                'referencable': 'dummy',
            })
        self.checkOutput("""
        <span
        ajax:target="http://example.com/foo?selected=&root=/&referencable=dummy"><input
        class="referencebrowser" id="input-ref" name="ref" readonly="readonly"
        type="text" value="" /><input name="ref.uid" type="hidden" value="" /></span>
        """, widget())

        # Render required with empty value
        widget = factory(
            'reference',
            'ref',
            props={
                'label': 'Reference',
                'multivalued': False,
                'required': 'Ref Required',
                'target': 'http://example.com/foo',
                'referencable': 'dummy',
            })

        request = self.layer.new_request()
        request.params['ref'] = ''
        request.params['ref.uid'] = ''

        data = widget.extract(request)
        self.assertEqual(data.extracted, '')
        self.assertEqual(data.errors, [ExtractionError('Ref Required')])

        self.checkOutput("""
        <span ajax:target="http://example.com/foo?selected=&root=/&referencable=dummy"><input
        class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text"
        value="" /><input name="ref.uid" type="hidden" value="" /></span>
        """, widget(data=data))

        # Required with valid value
        request.params['ref'] = 'Title'
        request.params['ref.uid'] = '123'
        data = widget.extract(request)
        self.assertEqual(data.extracted, '123')
        self.assertEqual(data.errors, [])

        self.checkOutput("""
        <span ajax:target="http://example.com/foo?selected=&root=/&referencable=dummy"><input
        class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text"
        value="Title" /><input name="ref.uid" type="hidden" value="123" /></span>
        """, widget(data=data))

        # Single valued expects 2-tuple as value with (uid, label)
        widget = factory(
            'reference',
            'ref',
            value=('uid', 'Label'),
            props={
                'label': 'Reference',
                'multivalued': False,
                'required': 'Ref Required',
                'target': 'http://example.com/foo',
                'referencable': 'dummy',
            })
        self.checkOutput("""
        <span ajax:target="http://example.com/foo?selected=uid&root=/&referencable=dummy"><input
        class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text"
        value="Label" /><input name="ref.uid" type="hidden" value="uid" /></span>
        """, widget())

        # Extract from request and render widget with data
        data = widget.extract(request)
        self.checkOutput("""
        <span ajax:target="http://example.com/foo?selected=uid&root=/&referencable=dummy"><input
        class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text"
        value="Title" /><input name="ref.uid" type="hidden" value="123" /></span>
        """, widget(data=data))

        # Render widget with request
        self.checkOutput("""
        <span ajax:target="http://example.com/foo?selected=uid&root=/&referencable=dummy"><input
        class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text"
        value="Title" /><input name="ref.uid" type="hidden" value="123" /></span>
        """, widget(request=request))

        # Single value display renderer
        widget = factory(
            'reference',
            'ref',
            props={
                'label': 'Reference',
                'multivalued': False,
                'target': 'http://example.com/foo',
                'referencable': 'dummy',
            },
            mode='display')
        self.assertEqual(
            widget(),
            u'<div class="display-referencebrowser" id="display-ref"></div>'
        )

        widget = factory(
            'reference',
            'ref',
            value=('uid', 'Label'),
            props={
                'label': 'Reference',
                'multivalued': False,
                'target': 'http://example.com/foo',
                'referencable': 'dummy',
            },
            mode='display')
        self.assertEqual(
            widget(),
            u'<div class="display-referencebrowser" id="display-ref">Label</div>'
        )

    def test_multi_valued(self):
        # Render without any value
        widget = factory(
            'reference',
            'ref',
            props={
                'label': 'Reference',
                'multivalued': True,
                'target': 'http://example.com/foo',
                'referencable': 'dummy',
            })
        self.checkOutput("""
        <span ajax:target="http://example.com/foo?selected=&root=/&referencable=dummy"><input
        id="exists-ref" name="ref-exists" type="hidden" value="exists" /><select
        class="referencebrowser" id="input-ref" multiple="multiple"
        name="ref" /></span>
        """, widget())

        # Render required with empty value
        widget = factory(
            'reference',
            'ref',
            props={
                'label': 'Reference',
                'multivalued': True,
                'required': 'Ref Required',
                'target': 'http://example.com/foo',
                'referencable': 'dummy',
                'vocabulary': [
                    ('uid1', 'Title1'),
                    ('uid2', 'Title2'),
                ],
            })

        request = self.layer.new_request()
        request.params['ref'] = ''

        data = widget.extract(request)
        self.assertEqual(data.extracted, '')
        self.assertEqual(data.errors, [ExtractionError('Ref Required',)])

        self.checkOutput("""
        <span ajax:target="http://example.com/foo?selected=&root=/&referencable=dummy"><input
        id="exists-ref" name="ref-exists" type="hidden" value="exists" /><select
        class="referencebrowser required" id="input-ref" multiple="multiple"
        name="ref" required="required"><option
        id="input-ref-uid1" value="uid1">Title1</option><option
        id="input-ref-uid2" value="uid2">Title2</option></select></span>
        """, widget(data=data))

        # Required with valid value
        request.params['ref'] = ['uid1', 'uid2']
        data = widget.extract(request)
        self.assertEqual(data.extracted, ['uid1', 'uid2'])
        self.assertEqual(data.errors, [])

        self.checkOutput("""
        <span ajax:target="http://example.com/foo?selected=&root=/&referencable=dummy"><input
        id="exists-ref" name="ref-exists" type="hidden" value="exists" /><select
        class="referencebrowser required" id="input-ref"
        multiple="multiple" name="ref" required="required"><option
        id="input-ref-uid1" selected="selected" value="uid1">Title1</option><option
        id="input-ref-uid2" selected="selected"
        value="uid2">Title2</option></select></span>
        """, widget(data=data))

        # Multi value display renderer
        widget = factory(
            'reference',
            'ref',
            value=['uid1', 'uid2'],
            props={
                'label': 'Reference',
                'target': 'http://example.com/foo',
                'referencable': 'dummy',
                'multivalued': True,
                'vocabulary': [
                    ('uid1', 'Title1'),
                    ('uid2', 'Title2'),
                ],
            },
            mode='display')
        self.checkOutput("""
        <ul class="display-referencebrowser"
        id="display-ref"><li>Title1</li><li>Title2</li></ul>
        """, widget())

    def test_ActionAddReference(self):
        model = BaseNode()
        request = self.layer.new_request()
        request.params['referencable'] = 'dummy'
        request.params['selected'] = ''
        request.params['root'] = '/'

        action = ActionAddReference()
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('manager'):
            self.assertEqual(action(model, request), u'')

        model = UUIDNode(name='model')
        self.checkOutput("""
        ...<a
        id="ref-..."
        href="http://example.com/model"
        class="addreference"
        title="Add reference"
        data-toggle="tooltip"
        data-placement="top"\
        ajax:bind="click"
        ><span class="ion-plus-round"></span></a>\n\n\n<span class="reftitle"
        style="display:none;">model</span>
        """, action(model, request))

    def test_ReferencableChildrenLink(self):
        model = UUIDNode(name='model')
        request = self.layer.new_request()
        request.params['referencable'] = 'dummy'
        request.params['selected'] = ''
        request.params['root'] = '/'

        action = ReferencableChildrenLink('tabletile', 'tableid')
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('manager'):
            rendered = action(model, request)
        self.checkOutput("""
        ...<a
        href="#"
        ajax:bind="click"
        ajax:target="http://example.com/model?selected=&amp;root=/&amp;referencable=dummy"
        ajax:event="contextchanged:.refbrowsersensitiv"
        ajax:action="tabletile:#tableid:replace"
        ><span class="glyphicon glyphicon-asterisk"></span
        >&nbsp;model</a>...
        """, rendered)

    def test_reference_pathbar(self):
        model = UUIDNode()
        model['a'] = UUIDNode()
        model['a']['b'] = UUIDNode()
        model['z'] = UUIDNode()
        node = model['a']['b']['c'] = UUIDNode()

        request = self.layer.new_request()
        request.params['referencable'] = 'dummy'
        request.params['selected'] = ''
        request.params['root'] = '/'

        # Case Unauthorized
        err = self.expectError(
            HTTPForbidden,
            render_tile,
            node,
            request,
            'referencebrowser_pathbar'
        )
        self.checkOutput("""
        Unauthorized: tile
        <cone.app.browser.referencebrowser.ReferenceBrowserPathBar object at ...>
        failed permission check
        """, str(err))

        # Case reference root is application root
        request = self.layer.new_request()
        request.params['referencable'] = 'dummy'
        request.params['selected'] = ''
        request.params['root'] = '/'
        with self.layer.authenticated('max'):
            res = render_tile(node, request, 'referencebrowser_pathbar')
        self.assertTrue(res.find('"http://example.com/?') > -1)
        self.assertTrue(res.find('"http://example.com/a?') > -1)
        self.assertTrue(res.find('"http://example.com/a/b?') > -1)

        # Case reference root is in current sub tree
        request = self.layer.new_request()
        request.params['referencable'] = 'dummy'
        request.params['selected'] = ''
        request.params['root'] = 'a'
        with self.layer.authenticated('max'):
            res = render_tile(node, request, 'referencebrowser_pathbar')
        self.assertFalse(res.find('"http://example.com/?') > -1)
        self.assertTrue(res.find('"http://example.com/a?') > -1)
        self.assertTrue(res.find('"http://example.com/a/b?') > -1)

        # Case reference root is in sibling sub tree
        request = self.layer.new_request()
        request.params['referencable'] = 'dummy'
        request.params['selected'] = ''
        request.params['root'] = '/z'
        with self.layer.authenticated('max'):
            res = render_tile(node, request, 'referencebrowser_pathbar')
        self.assertFalse(res.find('"http://example.com/?') > -1)
        self.assertFalse(res.find('"http://example.com/a?') > -1)
        self.assertFalse(res.find('"http://example.com/a/b?') > -1)
        self.assertTrue(res.find('<strong>z</strong>') > -1)

    def test_reference_listing(self):
        created = datetime(2011, 3, 15)
        delta = timedelta(1)
        modified = created + delta

        model = UUIDNode()
        for i in range(20):
            model[str(i)] = UUIDNode()
            # set listing display metadata
            model[str(i)].metadata.title = str(i)
            model[str(i)].metadata.created = created
            model[str(i)].metadata.modified = modified
            if i % 2 == 0:
                # make node referencable
                model[str(i)].properties.action_add_reference = True
                # do not render link to children
                model[str(i)].properties.leaf = True
            created = created + delta
            modified = modified + delta

        # Unauthorized fails
        request = self.layer.new_request()
        request.params['referencable'] = 'dummy'
        request.params['selected'] = ''
        request.params['root'] = '/'

        err = self.expectError(
            HTTPForbidden,
            render_tile,
            model,
            request,
            'referencelisting'
        )
        self.checkOutput("""
            Unauthorized: tile
            <cone.app.browser.referencebrowser.ReferenceListing object at ...>
            failed permission check
        """, str(err))

        # Authorized
        with self.layer.authenticated('max'):
            res = render_tile(model, request, 'referencelisting')
        self.assertTrue(res.find('id="referencebrowser"') > -1)
        self.checkOutput('...<div id="referencebrowser"...', res)

        # Referencable nodes renders add reference action related markup
        self.checkOutput("""
        ...
        <a
        id="ref-..."
        href="http://example.com/1"
        class="addreference"
        title="Add reference"
        data-toggle="tooltip"
        data-placement="top"
        ajax:bind="click"
        ><span class="ion-plus-round"></span></a>...
        """, res)

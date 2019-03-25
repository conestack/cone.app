from cone.app import testing
from cone.app.browser.actions import LinkAction
from cone.app.browser.referencebrowser import ActionAddReference
from cone.app.browser.referencebrowser import ActionRemoveReference
from cone.app.browser.referencebrowser import ReferencableChildrenLink
from cone.app.browser.referencebrowser import ReferenceAction
from cone.app.browser.referencebrowser import ReferenceBrowserModelMixin
from cone.app.browser.referencebrowser import wrap_ajax_target
from cone.app.interfaces import INavigationLeaf
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
from yafowil.base import RuntimeData
from yafowil.base import Widget
from zope.interface import implementer


@plumbing(UUIDAware)
class RefNode(BaseNode):
    node_info_name = 'ref_node'


class TestBrowserReferenceBrowser(TileTestCase):
    layer = testing.security

    def test_single_valued(self):
        # Render without any value
        widget = factory(
            'reference',
            name='ref',
            props={
                'label': 'Reference',
                'multivalued': False,
                'target': 'http://example.com/foo',
                'referencable': 'ref_node',
            })
        self.checkOutput("""
        <span
        ajax:target="http://example.com/foo?referencable=ref_node&root=/&selected="><input
        class="referencebrowser" id="input-ref" name="ref" readonly="readonly"
        type="text" value="" /><input name="ref.uid" type="hidden" value="" /></span>
        """, widget())

        # Render required with empty value
        widget = factory(
            'reference',
            name='ref',
            props={
                'label': 'Reference',
                'multivalued': False,
                'required': 'Ref Required',
                'target': 'http://example.com/foo',
                'referencable': 'ref_node',
            })

        request = self.layer.new_request()
        request.params['ref'] = ''
        request.params['ref.uid'] = ''

        data = widget.extract(request)
        self.assertEqual(data.extracted, '')
        self.assertEqual(data.errors, [ExtractionError('Ref Required')])

        self.checkOutput("""
        <span ajax:target="http://example.com/foo?referencable=ref_node&root=/&selected="><input
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
        <span ajax:target="http://example.com/foo?referencable=ref_node&root=/&selected="><input
        class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text"
        value="Title" /><input name="ref.uid" type="hidden" value="123" /></span>
        """, widget(data=data))

        # Single valued expects 2-tuple as value with (uid, label)
        widget = factory(
            'reference',
            name='ref',
            value=('uid', 'Label'),
            props={
                'label': 'Reference',
                'multivalued': False,
                'required': 'Ref Required',
                'target': 'http://example.com/foo',
                'referencable': 'ref_node',
            })
        self.checkOutput("""
        <span ajax:target="http://example.com/foo?referencable=ref_node&root=/&selected=uid"><input
        class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text"
        value="Label" /><input name="ref.uid" type="hidden" value="uid" /></span>
        """, widget())

        # Extract from request and render widget with data
        data = widget.extract(request)
        self.checkOutput("""
        <span ajax:target="http://example.com/foo?referencable=ref_node&root=/&selected=uid"><input
        class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text"
        value="Title" /><input name="ref.uid" type="hidden" value="123" /></span>
        """, widget(data=data))

        # Render widget with request
        self.checkOutput("""
        <span ajax:target="http://example.com/foo?referencable=ref_node&root=/&selected=uid"><input
        class="referencebrowser required" id="input-ref" name="ref" readonly="readonly" type="text"
        value="Title" /><input name="ref.uid" type="hidden" value="123" /></span>
        """, widget(request=request))

        # Single value display renderer
        widget = factory(
            'reference',
            name='ref',
            props={
                'label': 'Reference',
                'multivalued': False,
                'target': 'http://example.com/foo',
                'referencable': 'ref_node',
            },
            mode='display')
        self.assertEqual(
            widget(),
            u'<div class="display-referencebrowser" id="display-ref"></div>'
        )

        widget = factory(
            'reference',
            name='ref',
            value=('uid', 'Label'),
            props={
                'label': 'Reference',
                'multivalued': False,
                'target': 'http://example.com/foo',
                'referencable': 'ref_node',
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
            name='ref',
            props={
                'label': 'Reference',
                'multivalued': True,
                'target': 'http://example.com/foo',
                'referencable': 'ref_node',
            })
        self.checkOutput("""
        <span ajax:target="http://example.com/foo?referencable=ref_node&root=/&selected="><input
        id="exists-ref" name="ref-exists" type="hidden" value="exists" /><select
        class="referencebrowser" id="input-ref" multiple="multiple"
        name="ref" /></span>
        """, widget())

        # Render required with empty value
        widget = factory(
            'reference',
            name='ref',
            props={
                'label': 'Reference',
                'multivalued': True,
                'required': 'Ref Required',
                'target': 'http://example.com/foo',
                'referencable': 'ref_node',
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
        <span ajax:target="http://example.com/foo?referencable=ref_node&root=/&selected="><input
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
        <span ajax:target="http://example.com/foo?referencable=ref_node&root=/&selected="><input
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
            name='ref',
            value=['uid1', 'uid2'],
            props={
                'label': 'Reference',
                'target': 'http://example.com/foo',
                'referencable': 'ref_node',
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

    def test_wrap_ajax_target(self):
        widget = Widget(
            blueprints='dummy',
            extractors=[],
            edit_renderers=[],
            display_renderers=[],
            preprocessors=[],
            uniquename='dummy')
        data = RuntimeData()

        # XXX: referencebrowser not works without target, check if case
        #      necessary
        rendered = wrap_ajax_target('rendered', widget, data)
        self.assertEqual(rendered, 'rendered')

        widget.attrs['multivalued'] = False
        widget.attrs['target'] = 'http://example.com'
        widget.attrs['referencable'] = 'ref_node'
        widget.attrs['root'] = '/'
        expected = (
            '<span ajax:target='
            '"http://example.com?referencable=ref_node&root=/&selected="'
            '>rendered</span>'
        )
        rendered = wrap_ajax_target('rendered', widget, data)
        self.assertEqual(rendered, expected)

        def callable_target(widget, data):
            return 'http://example.com'
        widget.attrs['target'] = callable_target

        def callable_referencable(widget, data):
            return 'ref_node'
        widget.attrs['referencable'] = callable_referencable

        def callable_root(widget, data):
            return '/'
        widget.attrs['root'] = callable_root

        rendered = wrap_ajax_target('rendered', widget, data)
        self.assertEqual(rendered, expected)

        widget.attrs['referencable'] = ['ref_node']
        rendered = wrap_ajax_target('rendered', widget, data)
        self.assertEqual(rendered, expected)

        widget.attrs['referencable'] = ['ref_node', 'ref_node_2']
        expected = (
            '<span ajax:target='
            '"http://example.com?referencable=ref_node,ref_node_2&root=/&selected="'
            '>rendered</span>'
        )
        rendered = wrap_ajax_target('rendered', widget, data)
        self.assertEqual(rendered, expected)

        widget.attrs['referencable'] = 'ref_node'
        data.value = ('sel_ref', 'Selected Reference')
        expected = (
            '<span ajax:target='
            '"http://example.com?referencable=ref_node&root=/&selected=sel_ref"'
            '>rendered</span>'
        )
        rendered = wrap_ajax_target('rendered', widget, data)
        self.assertEqual(rendered, expected)

        widget.attrs['multivalued'] = True
        data.value = ('sel_ref', 'sel_ref_2')
        expected = (
            '<span ajax:target='
            '"http://example.com?referencable=ref_node&root=/&selected=sel_ref,sel_ref_2"'
            '>rendered</span>'
        )
        rendered = wrap_ajax_target('rendered', widget, data)
        self.assertEqual(rendered, expected)

    def test_ReferenceBrowserModelMixin(self):
        model = BaseNode()
        a = model['a'] = BaseNode()
        aa = model['a']['a'] = BaseNode()
        b = model['b'] = BaseNode()

        ref_model_mixin = ReferenceBrowserModelMixin()
        ref_model_mixin.model = model

        request = ref_model_mixin.request = self.layer.new_request()
        request.params['root'] = '/'
        self.assertEqual(ref_model_mixin.referencable_root, model)

        request = ref_model_mixin.request = self.layer.new_request()
        request.params['root'] = ''
        self.assertEqual(ref_model_mixin.referencable_root, model)

        request = ref_model_mixin.request = self.layer.new_request()
        request.params['root'] = '/a'
        self.assertEqual(ref_model_mixin.referencable_root, a)

        request = ref_model_mixin.request = self.layer.new_request()
        request.params['root'] = '/a/a'
        self.assertEqual(ref_model_mixin.referencable_root, aa)

        request = ref_model_mixin.request = self.layer.new_request()
        request.params['root'] = 'b'
        self.assertEqual(ref_model_mixin.referencable_root, b)

        request = ref_model_mixin.request = self.layer.new_request()
        request.params['root'] = 'c'
        self.expectError(
            KeyError,
            lambda: ref_model_mixin.referencable_root
        )

        ref_model_mixin.model = aa

        request = ref_model_mixin.request = self.layer.new_request()
        request.params['root'] = 'a/a'
        self.assertEqual(ref_model_mixin.referencebrowser_model, aa)

        request = ref_model_mixin.request = self.layer.new_request()
        request.params['root'] = 'a'
        self.assertEqual(ref_model_mixin.referencebrowser_model, aa)

        request = ref_model_mixin.request = self.layer.new_request()
        request.params['root'] = ''
        self.assertEqual(ref_model_mixin.referencebrowser_model, aa)

        ref_model_mixin.model = b

        request = ref_model_mixin.request = self.layer.new_request()
        request.params['root'] = ''
        self.assertEqual(ref_model_mixin.referencebrowser_model, b)

        request = ref_model_mixin.request = self.layer.new_request()
        request.params['root'] = 'a'
        self.assertEqual(ref_model_mixin.referencebrowser_model, a)

    def test_ReferenceAction(self):
        model = RefNode()
        request = self.layer.new_request()

        action = ReferenceAction()
        action.model = model
        action.request = request

        request.params['selected'] = ''
        self.assertEqual(action.selected_uids, [])
        request.params['selected'] = 'foo'
        self.assertEqual(action.selected_uids, ['foo'])
        request.params['selected'] = 'foo,bar'
        self.assertEqual(action.selected_uids, ['foo', 'bar'])

        request.params['referencable'] = 'ref_node,ref_node_2'
        self.assertTrue(action.display)
        request.params['referencable'] = 'ref_node'
        self.assertTrue(action.display)
        request.params['referencable'] = 'ref_node_2'
        self.assertFalse(action.display)
        request.params['referencable'] = ''
        self.assertFalse(action.display)

        self.checkOutput('ref-...', action.id)
        self.checkOutput("""
        ...<a
        id="ref-..."
        href="http://example.com/"
        data-toggle="tooltip"
        data-placement="top"
        ajax:bind="click"
        ></a>...
        """, action.render())

        model = BaseNode()
        model.node_info_name = 'nouuid'
        request.params['referencable'] = 'nouuid'

        action.model = model
        self.assertFalse(action.display)

    def test_ActionAddReference(self):
        model = BaseNode()
        request = self.layer.new_request()
        request.params['referencable'] = 'ref_node'
        request.params['selected'] = ''
        request.params['root'] = '/'

        action = ActionAddReference()
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('manager'):
            self.assertEqual(action(model, request), u'')

        model = RefNode(name='model')
        rendered = action(model, request)
        expected = 'class="addreference"'
        self.assertTrue(rendered.find(expected) > -1)
        expected = 'title="Add reference"'
        self.assertTrue(rendered.find(expected) > -1)
        expected = '<span class="ion-plus-round">'
        self.assertTrue(rendered.find(expected) > -1)
        expected = '<span class="reftitle" style="display:none;">model</span>'
        self.assertTrue(rendered.find(expected) > -1)

        request.params['selected'] = str(model.uuid)
        rendered = action(model, request)
        expected = 'class="addreference disabled"'
        self.assertTrue(rendered.find(expected) > -1)

        action = ActionAddReference()
        action.model = BaseNode(name='model')
        action.request = self.layer.new_request()
        self.assertFalse(action.enabled)

    def test_ActionRemoveReference(self):
        model = BaseNode()
        request = self.layer.new_request()
        request.params['referencable'] = 'ref_node'
        request.params['selected'] = ''
        request.params['root'] = '/'

        action = ActionRemoveReference()
        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('manager'):
            self.assertEqual(action(model, request), u'')

        model = RefNode(name='model')
        rendered = action(model, request)
        expected = 'class="removereference disabled"'
        self.assertTrue(rendered.find(expected) > -1)
        expected = 'title="Remove reference"'
        self.assertTrue(rendered.find(expected) > -1)
        expected = '<span class="ion-minus-round">'
        self.assertTrue(rendered.find(expected) > -1)
        expected = '<span class="reftitle" style="display:none;">model</span>'
        self.assertTrue(rendered.find(expected) > -1)

        request.params['selected'] = str(model.uuid)
        rendered = action(model, request)
        expected = 'class="removereference"'
        self.assertTrue(rendered.find(expected) > -1)

        action = ActionRemoveReference()
        action.model = BaseNode(name='model')
        action.request = self.layer.new_request()
        self.assertFalse(action.enabled)

    def test_ReferencableChildrenLink(self):
        model = BaseNode(name='model')
        model.metadata.title = 'My Node'
        request = self.layer.new_request()
        request.params['referencable'] = 'ref_node'
        request.params['selected'] = ''
        request.params['root'] = '/'

        table_tile_name = 'tabletile'
        table_id = 'tableid'

        action = ReferencableChildrenLink(table_tile_name, table_id)
        action.model = model
        action.request = request

        self.assertTrue(isinstance(action, LinkAction))

        expected = 'http://example.com/model?referencable=ref_node&root=/&selected='
        self.assertEqual(action.target, expected)

        expected = 'My Node'
        self.assertEqual(action.text, expected)

        expected = 'tabletile:#tableid:replace'
        self.assertEqual(action.action, expected)

        expected = 'contextchanged:.refbrowsersensitiv'
        self.assertEqual(action.event, expected)

        self.assertFalse(action.display)
        with self.layer.authenticated('max'):
            self.assertTrue(action.display)

        expected = 'glyphicon glyphicon-asterisk'
        self.assertEqual(action.icon, expected)

        self.assertEqual(action(model, request), u'')

        with self.layer.authenticated('manager'):
            rendered = action(model, request)
        expected = '<a'
        self.assertTrue(rendered.find(expected) > -1)
        expected = '&nbsp;My Node</a>'
        self.assertTrue(rendered.find(expected) > -1)

        @implementer(INavigationLeaf)
        class LeafNode(BaseNode):
            pass

        model = LeafNode(name='leaf')
        with self.layer.authenticated('manager'):
            rendered = action(model, request)
        expected = '<span class="glyphicon glyphicon-asterisk" />&nbsp;<span>leaf</span>'
        self.assertEqual(rendered, expected)

    def test_reference_pathbar(self):
        model = BaseNode()
        model['a'] = RefNode()
        model['a']['b'] = RefNode()
        model['z'] = RefNode()
        node = model['a']['b']['c'] = RefNode()

        request = self.layer.new_request()
        request.params['referencable'] = 'ref_node'
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
        request.params['referencable'] = 'ref_node'
        request.params['selected'] = ''
        request.params['root'] = '/'
        with self.layer.authenticated('max'):
            res = render_tile(node, request, 'referencebrowser_pathbar')
        self.assertTrue(res.find('"http://example.com/?') > -1)
        self.assertTrue(res.find('"http://example.com/a?') > -1)
        self.assertTrue(res.find('"http://example.com/a/b?') > -1)

        # Case reference root is in current sub tree
        request = self.layer.new_request()
        request.params['referencable'] = 'ref_node'
        request.params['selected'] = ''
        request.params['root'] = 'a'
        with self.layer.authenticated('max'):
            res = render_tile(node, request, 'referencebrowser_pathbar')
        self.assertFalse(res.find('"http://example.com/?') > -1)
        self.assertTrue(res.find('"http://example.com/a?') > -1)
        self.assertTrue(res.find('"http://example.com/a/b?') > -1)

        # Case reference root is in sibling sub tree
        request = self.layer.new_request()
        request.params['referencable'] = 'ref_node'
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

        model = BaseNode()
        for i in range(20):
            model[str(i)] = RefNode()
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
        request.params['referencable'] = 'ref_node'
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

    def test_referencebrowser(self):
        model = BaseNode()
        model['a'] = RefNode()

        request = self.layer.new_request()
        request.params['referencable'] = 'ref_node'
        request.params['selected'] = ''
        request.params['root'] = '/'

        # Case unauthorized
        err = self.expectError(
            HTTPForbidden,
            render_tile,
            model,
            request,
            'referencebrowser'
        )
        self.checkOutput("""
            Unauthorized: tile
            <cone.app.browser.referencebrowser.ReferenceBrowser object at ...>
            failed permission check
        """, str(err))

        # Case authorized
        with self.layer.authenticated('max'):
            res = render_tile(model, request, 'referencebrowser')
        self.assertTrue(res.find('<div class="referencebrowser">') > -1)
        self.assertTrue(res.find('<div id="referencebrowser_pathbar"') > -1)
        self.assertTrue(res.find('<div id="referencebrowser"') > -1)

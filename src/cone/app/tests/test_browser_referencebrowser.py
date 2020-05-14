from cone.app import testing
from cone.app.browser.actions import LinkAction
from cone.app.browser.referencebrowser import ActionAddReference
from cone.app.browser.referencebrowser import ActionRemoveReference
from cone.app.browser.referencebrowser import ReferencableChildrenLink
from cone.app.browser.referencebrowser import ReferenceAction
from cone.app.browser.referencebrowser import ReferenceBrowserModelMixin
from cone.app.interfaces import INavigationLeaf
from cone.app.model import BaseNode
from cone.tile import render_tile
from cone.tile.tests import TileTestCase
from datetime import datetime
from datetime import timedelta
from node.behaviors import UUIDAware
from node.utils import UNSET
from plumber import plumbing
from pyramid.httpexceptions import HTTPForbidden
from yafowil.base import ExtractionError
from yafowil.base import factory
from zope.interface import implementer


@plumbing(UUIDAware)
class RefNode(BaseNode):
    node_info_name = 'ref_node'


class TestBrowserReferenceBrowser(TileTestCase):
    layer = testing.security

    def test_reference_render(self):
        self.layer.new_request()
        widget = factory('reference', name='ref')
        self.checkOutput("""
        <span ajax:target="http://example.com/?referencable=&root=/&selected=">
          <input class="form-control referencebrowser"
                 id="input-ref" name="ref" readonly="readonly"
                 type="text" value="" />
          <input name="ref.uid" type="hidden" value="" />
          <span class="referencebrowser_trigger" data-reference-name='ref'>
            <i class="ion-android-share">
            </i>
          browse</span>
        </span>
        """, '>\n'.join(widget().split('>')))

        widget.attrs['multivalued'] = True
        self.checkOutput("""
        <span ajax:target="http://example.com/?referencable=&root=/&selected=">
          <input id="exists-ref" name="ref-exists" type="hidden" value="exists" />
          <select class="form-control referencebrowser"
                  id="input-ref" multiple="multiple" name="ref">
          </select>
          <span class="referencebrowser_trigger" data-reference-name='ref'>
            <i class="ion-android-share">
            </i>
            browse</span>
        </span>
        """, '>\n'.join(widget().split('>')))

    def test_reference_root(self):
        self.layer.new_request()
        widget = factory('reference', name='ref')
        expected = 'http://example.com/?referencable=&root=/&selected='
        self.assertTrue(widget().find(expected) > -1)

        widget.attrs['root'] = '/container'
        expected = 'http://example.com/?referencable=&root=/container&selected='
        self.assertTrue(widget().find(expected) > -1)

        def root_callable(widget, data):
            return '/computed_root'

        widget.attrs['root'] = root_callable
        expected = 'http://example.com/?referencable=&root=/computed_root&selected='
        self.assertTrue(widget().find(expected) > -1)

    def test_reference_referencable(self):
        self.layer.new_request()
        widget = factory('reference', name='ref')
        expected = 'http://example.com/?referencable=&root=/&selected='
        self.assertTrue(widget().find(expected) > -1)

        widget.attrs['referencable'] = 'foo'
        expected = 'http://example.com/?referencable=foo&root=/&selected='
        self.assertTrue(widget().find(expected) > -1)

        widget.attrs['referencable'] = ['foo', 'bar']
        expected = 'http://example.com/?referencable=foo,bar&root=/&selected='
        self.assertTrue(widget().find(expected) > -1)

        widget.attrs['referencable'] = 'foo,bar'
        expected = 'http://example.com/?referencable=foo,bar&root=/&selected='
        self.assertTrue(widget().find(expected) > -1)

        def referencable_callable(widget, data):
            return 'computed'

        widget.attrs['referencable'] = referencable_callable
        expected = 'http://example.com/?referencable=computed&root=/&selected='
        self.assertTrue(widget().find(expected) > -1)

    def test_reference_target(self):
        self.layer.new_request()
        widget = factory('reference', name='ref')
        expected = 'ajax:target="http://example.com/?referencable=&root=/&selected="'
        self.assertTrue(widget().find(expected) > -1)

        widget.attrs['target'] = 'http://domain.com/'
        expected = 'ajax:target="http://domain.com/?referencable=&root=/&selected="'
        self.assertTrue(widget().find(expected) > -1)

        def target_callable(widget, data):
            return 'http://computed.com/'

        widget.attrs['target'] = target_callable
        expected = 'ajax:target="http://computed.com/?referencable=&root=/&selected="'
        self.assertTrue(widget().find(expected) > -1)

    def test_reference_selected(self):
        request = self.layer.new_request()

        widget = factory('reference', name='ref')
        data = widget.extract(request)
        self.assertTrue(widget(data=data).find(
            'ajax:target="http://example.com/?referencable=&root=/&selected="'
        ) > -1)

        widget.getter = ['3604702a-b177-42de-8694-d81e2d993633', 'Label']
        data = widget.extract(request)
        self.assertTrue(widget(data=data).find(
            'ajax:target="http://example.com/?referencable=&root=/&'
            'selected=3604702a-b177-42de-8694-d81e2d993633"'
        ) > -1)

        request.params['ref'] = 'Item'
        request.params['ref.uid'] = '745dd2ed-74ad-449b-b55b-b240709b2b0e'
        data = widget.extract(request)
        self.assertTrue(widget(data=data).find(
            'ajax:target="http://example.com/?referencable=&root=/&'
            'selected=745dd2ed-74ad-449b-b55b-b240709b2b0e"'
        ) > -1)

        request = self.layer.new_request()

        widget = factory('reference', name='ref', props={'multivalued': True})
        data = widget.extract(request)
        self.assertTrue(widget(data=data).find(
            'ajax:target="http://example.com/?referencable=&root=/&selected="'
        ) > -1)
        del widget.attrs['vocabulary']

        widget.getter = ['5f94f75c-4aea-4dc7-a31b-6152e8f89d00']
        data = widget.extract(request)
        self.assertTrue(widget(data=data).find(
            'ajax:target="http://example.com/?referencable=&root=/&'
            'selected=5f94f75c-4aea-4dc7-a31b-6152e8f89d00"'
        ) > -1)
        del widget.attrs['vocabulary']

        request.params['ref-exists'] = 'exists'
        request.params['ref'] = ['e2121521-60a9-4fe6-babf-0f86881c3d6a']
        data = widget.extract(request)
        self.assertTrue(widget(data=data).find(
            'ajax:target="http://example.com/?referencable=&root=/&'
            'selected=e2121521-60a9-4fe6-babf-0f86881c3d6a"'
        ) > -1)

    def test_multivalued_reference_vocab(self):
        self.layer.new_request()
        widget = factory(
            'reference',
            name='ref',
            props={
                'multivalued': True
            })

        # when widget gets called on multivalued reference, vocabulaty gets
        # set on widget props for proper functioning of selection
        # renderer/extractor
        widget()
        self.assertTrue('vocabulary' in widget.attrs)
        self.assertEqual(widget.attrs['vocabulary'], [])
        del widget.attrs['vocabulary']

        # case no preset value and value passed on request.
        # no lookup function given, label is uuid
        self.assertEqual(widget.getter, UNSET)
        request = self.layer.new_request()
        request.params['ref'] = 'f5c4f643-1bbd-481e-a8b0-8a47ca070184'
        widget(request=request)
        self.assertEqual(widget.attrs['vocabulary'], [(
            'f5c4f643-1bbd-481e-a8b0-8a47ca070184',
            'f5c4f643-1bbd-481e-a8b0-8a47ca070184'
        )])
        del widget.attrs['vocabulary']

        # case preset value and no value passed on request.
        # no lookup function given, label is uuid
        request = self.layer.new_request()
        widget.getter = ['94790e41-1441-44b3-b196-7c4d73bb9cca']
        widget(request=request)
        self.assertEqual(widget.attrs['vocabulary'], [(
            '94790e41-1441-44b3-b196-7c4d73bb9cca',
            '94790e41-1441-44b3-b196-7c4d73bb9cca'
        )])
        del widget.attrs['vocabulary']

        # case preset value and value passed on request.
        # request value takes precedence
        # no lookup function given, label is uuid
        request = self.layer.new_request()
        request.params['ref'] = ['2faba3ab-5af0-4240-b457-8c65ac87b8fa']
        widget.getter = ['180eb583-239f-48dc-b304-6302296939a5']
        widget(request=request)
        self.assertEqual(widget.attrs['vocabulary'], [(
            '2faba3ab-5af0-4240-b457-8c65ac87b8fa',
            '2faba3ab-5af0-4240-b457-8c65ac87b8fa'
        )])
        del widget.attrs['vocabulary']

        # case preset value and empty value passed on request.
        # request value takes precedence
        # no lookup function given, label is uuid
        request = self.layer.new_request()
        request.params['ref'] = []
        widget.getter = ['286abf9d-f690-4c34-bfc3-600722e955d3']
        widget(request=request)
        self.assertEqual(widget.attrs['vocabulary'], [])
        del widget.attrs['vocabulary']

        # case preset value is a callable.
        def value_getter(widget, data):
            return ['d9908598-e592-45df-9e6a-f88512dddf29']

        request = self.layer.new_request()
        widget.getter = value_getter
        widget(request=request)
        self.assertEqual(widget.attrs['vocabulary'], [(
            'd9908598-e592-45df-9e6a-f88512dddf29',
            'd9908598-e592-45df-9e6a-f88512dddf29'
        )])
        del widget.attrs['vocabulary']

        # dummy lookup function
        def label_lookup(uuid_):
            return {
                '8208af4f-522f-436e-93b3-37e4e736984d': 'Item 1',
                'bb6a21f9-fb35-4d76-9063-1b0007a9df52': 'Item 2'
            }.get(uuid_, uuid_)

        # case lookup function, preset value and no value passed on request
        request = self.layer.new_request()
        widget.attrs['lookup'] = label_lookup
        widget.getter = [
            '8208af4f-522f-436e-93b3-37e4e736984d',
            'bb6a21f9-fb35-4d76-9063-1b0007a9df52'
        ]
        widget(request=request)
        self.assertEqual(widget.attrs['vocabulary'], [
            ('8208af4f-522f-436e-93b3-37e4e736984d', 'Item 1'),
            ('bb6a21f9-fb35-4d76-9063-1b0007a9df52', 'Item 2')
        ])
        del widget.attrs['vocabulary']

        # case lookup function, preset value and empty value passed on request
        request = self.layer.new_request()
        request.params['ref'] = []
        widget(request=request)
        self.assertEqual(widget.attrs['vocabulary'], [])
        del widget.attrs['vocabulary']

        # case lookup function, preset value and value passed on request
        request = self.layer.new_request()
        request.params['ref'] = ['8208af4f-522f-436e-93b3-37e4e736984d']
        widget(request=request)
        self.assertEqual(widget.attrs['vocabulary'], [
            ('8208af4f-522f-436e-93b3-37e4e736984d', 'Item 1')
        ])
        del widget.attrs['vocabulary']

        # case lookup function, preset value and unknown value passed on request
        request = self.layer.new_request()
        request.params['ref'] = ['c1cfaa74-48e8-46e8-a16c-fba52ed8c3d4']
        widget(request=request)
        self.assertEqual(widget.attrs['vocabulary'], [(
            'c1cfaa74-48e8-46e8-a16c-fba52ed8c3d4',
            'c1cfaa74-48e8-46e8-a16c-fba52ed8c3d4'
        )])
        del widget.attrs['vocabulary']

        # case B/C vocabulary
        del widget.attrs['lookup']
        request = self.layer.new_request()
        widget.attrs['vocabulary'] = [
            ('81fc7ba9-5c68-4590-a1e7-18d4309bfb1e', 'B/C Item 1'),
            ('8b190a62-f530-4ce8-9736-ec45c5de9a59', 'B/C Item 2')
        ]
        widget(request=request)
        self.assertEqual(widget.attrs['vocabulary'], [
            ('81fc7ba9-5c68-4590-a1e7-18d4309bfb1e', 'B/C Item 1'),
            ('8b190a62-f530-4ce8-9736-ec45c5de9a59', 'B/C Item 2')
        ])
        self.assertEqual(widget.attrs['bc_vocabulary'], [
            ('81fc7ba9-5c68-4590-a1e7-18d4309bfb1e', 'B/C Item 1'),
            ('8b190a62-f530-4ce8-9736-ec45c5de9a59', 'B/C Item 2')
        ])
        del widget.attrs['vocabulary']
        del widget.attrs['bc_vocabulary']

    def test_single_reference(self):
        # no preset value
        widget = factory('reference', name='ref')

        request = self.layer.new_request()
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [UNSET, UNSET, []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<input name="ref.uid" type="hidden" value="" />'
        ) > -1)
        self.assertTrue(rendered.find(
            '<input class="form-control referencebrowser" id="input-ref" '
            'name="ref" readonly="readonly" type="text" value="" />'
        ) > -1)

        request.params['ref'] = ''
        request.params['ref.uid'] = ''
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [UNSET, '', []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<input name="ref.uid" type="hidden" value="" />'
        ) > -1)
        self.assertTrue(rendered.find(
            '<input class="form-control referencebrowser" id="input-ref" '
            'name="ref" readonly="readonly" type="text" value="" />'
        ) > -1)

        request.params['ref'] = 'Reference Item'
        request.params['ref.uid'] = '378657f5-c435-4678-886b-a3eefb3141b5'
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [UNSET, '378657f5-c435-4678-886b-a3eefb3141b5', []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<input name="ref.uid" type="hidden" '
            'value="378657f5-c435-4678-886b-a3eefb3141b5" />'
        ) > -1)
        self.assertTrue(rendered.find(
            '<input class="form-control referencebrowser" id="input-ref" '
            'name="ref" readonly="readonly" type="text" value="Reference Item" />'
        ) > -1)

        # preset value
        value = ['482ba322-169b-40ef-b632-6e92f29fe0ba', 'Reference Item']
        widget = factory('reference', name='ref', value=value)

        request = self.layer.new_request()
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [value, UNSET, []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<input name="ref.uid" type="hidden" '
            'value="482ba322-169b-40ef-b632-6e92f29fe0ba" />'
        ) > -1)
        self.assertTrue(rendered.find(
            '<input class="form-control referencebrowser" id="input-ref" '
            'name="ref" readonly="readonly" type="text" value="Reference Item" />'
        ) > -1)

        request.params['ref'] = ''
        request.params['ref.uid'] = ''
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [value, '', []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<input name="ref.uid" type="hidden" value="" />'
        ) > -1)
        self.assertTrue(rendered.find(
            '<input class="form-control referencebrowser" id="input-ref" '
            'name="ref" readonly="readonly" type="text" value="" />'
        ) > -1)

        request.params['ref'] = 'Other Item'
        request.params['ref.uid'] = '81fc0e53-5551-41d4-a1bd-6064e34face5'
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [value, '81fc0e53-5551-41d4-a1bd-6064e34face5', []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<input name="ref.uid" type="hidden" '
            'value="81fc0e53-5551-41d4-a1bd-6064e34face5" />'
        ) > -1)
        self.assertTrue(rendered.find(
            '<input class="form-control referencebrowser" id="input-ref" '
            'name="ref" readonly="readonly" type="text" value="Other Item" />'
        ) > -1)

        # required value
        widget = factory('reference', name='ref', props={'required': True})

        request = self.layer.new_request()
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [UNSET, UNSET, []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<input name="ref.uid" type="hidden" value="" />'
        ) > -1)
        self.assertTrue(rendered.find(
            '<input class="form-control referencebrowser required" '
            'id="input-ref" name="ref" readonly="readonly" type="text" '
            'value="" />'
        ) > -1)

        request = self.layer.new_request()
        request.params['ref'] = ''
        request.params['ref.uid'] = ''
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [UNSET, '', [ExtractionError('Mandatory field was empty')]]
        )

        request.params['ref'] = 'Item'
        request.params['ref.uid'] = '5a65bc60-3420-43ce-bf99-9190e2ea4c02'
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [UNSET, '5a65bc60-3420-43ce-bf99-9190e2ea4c02', []]
        )

    def test_multi_reference(self):
        # no preset value
        widget = factory('reference', name='ref', props={'multivalued': True})

        request = self.layer.new_request()
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [UNSET, UNSET, []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<input id="exists-ref" name="ref-exists" '
            'type="hidden" value="exists" />'
        ) > -1)
        self.assertTrue(rendered.find(
            '<select class="form-control referencebrowser" id="input-ref" '
            'multiple="multiple" name="ref"> </select>'
        ) > -1)
        del widget.attrs['vocabulary']

        request.params['ref-exists'] = 'exists'
        request.params['ref'] = []
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [UNSET, [], []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<select class="form-control referencebrowser" id="input-ref" '
            'multiple="multiple" name="ref"> </select>'
        ) > -1)
        del widget.attrs['vocabulary']

        request.params['ref-exists'] = 'exists'
        request.params['ref'] = ['292cd228-4095-4381-9ac3-2a8680ac4669']
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [UNSET, ['292cd228-4095-4381-9ac3-2a8680ac4669'], []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<option id="input-ref-292cd228-4095-4381-9ac3-2a8680ac4669" '
            'selected="selected" value="292cd228-4095-4381-9ac3-2a8680ac4669">'
            '292cd228-4095-4381-9ac3-2a8680ac4669</option>'
        ) > -1)

        # preset value
        value = ['0bed1aa2-103d-405c-84bc-039152e4738e']
        widget = factory(
            'reference',
            name='ref',
            value=value,
            props={
                'multivalued': True
            })

        request = self.layer.new_request()
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [value, UNSET, []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<option id="input-ref-0bed1aa2-103d-405c-84bc-039152e4738e" '
            'selected="selected" value="0bed1aa2-103d-405c-84bc-039152e4738e">'
            '0bed1aa2-103d-405c-84bc-039152e4738e</option>'
        ) > -1)
        del widget.attrs['vocabulary']

        request.params['ref-exists'] = 'exists'
        request.params['ref'] = []
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [value, [], []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<select class="form-control referencebrowser" id="input-ref" '
            'multiple="multiple" name="ref"> </select>'
        ) > -1)
        del widget.attrs['vocabulary']

        request.params['ref-exists'] = 'exists'
        request.params['ref'] = ['cfaed2ab-f39b-4c70-bd56-b6d9f4f0d849']
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [value, ['cfaed2ab-f39b-4c70-bd56-b6d9f4f0d849'], []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<option id="input-ref-cfaed2ab-f39b-4c70-bd56-b6d9f4f0d849" '
            'selected="selected" value="cfaed2ab-f39b-4c70-bd56-b6d9f4f0d849">'
            'cfaed2ab-f39b-4c70-bd56-b6d9f4f0d849</option>'
        ) > -1)

        # required value
        widget = factory(
            'reference',
            name='ref',
            props={
                'required': True,
                'multivalued': True
            })

        request = self.layer.new_request()
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [UNSET, UNSET, []]
        )
        rendered = widget(data=data)
        self.assertTrue(rendered.find(
            '<select class="form-control referencebrowser required" '
            'id="input-ref" multiple="multiple" name="ref" '
            'required="required"> </select>'
        ) > -1)
        del widget.attrs['vocabulary']

        request = self.layer.new_request()
        request.params['ref-exists'] = 'exists'
        request.params['ref'] = []
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [UNSET, [], [ExtractionError('Mandatory field was empty')]]
        )

        request.params['ref-exists'] = 'exists'
        request.params['ref'] = ['8944998c-b80c-4232-a70d-7d8b426961f8']
        data = widget.extract(request)
        self.assertEqual(
            [data.value, data.extracted, data.errors],
            [UNSET, ['8944998c-b80c-4232-a70d-7d8b426961f8'], []]
        )

    def test_display_renderer(self):
        self.layer.new_request()

        # Single value display renderer
        widget = factory(
            'reference',
            name='ref',
            mode='display')
        self.assertEqual(widget(), (
            '<div class="display-referencebrowser form-control" '
            'id="display-ref"></div>'
        ))

        widget = factory(
            'reference',
            name='ref',
            value=('00c753e6-2284-4118-a286-b43d743f1259', 'Label'),
            mode='display')
        self.assertEqual(widget(), (
            '<div class="display-referencebrowser form-control" '
            'id="display-ref">Label</div>'
        ))

        # Multi value display renderer
        def lookup_label(uuid):
            return {
                '1900f873-8442-4046-9f08-c94a0a0cdf51': 'Item 1',
                '2a1aea50-f48f-479a-abe9-4b0a962f8243': 'Item 2'
            }[uuid]

        widget = factory(
            'reference',
            name='ref',
            value=[
                '1900f873-8442-4046-9f08-c94a0a0cdf51',
                '2a1aea50-f48f-479a-abe9-4b0a962f8243'
            ],
            props={
                'multivalued': True,
                'lookup': lookup_label
            },
            mode='display')
        self.assertEqual(widget(), (
            '<ul class="display-referencebrowser form-control" '
            'id="display-ref"><li>Item 1</li><li>Item 2</li></ul>'
        ))

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

        request.params['referencable'] = ''
        self.assertTrue(action.display)
        request.params['referencable'] = 'ref_node,ref_node_2'
        self.assertTrue(action.display)
        request.params['referencable'] = 'ref_node'
        self.assertTrue(action.display)
        request.params['referencable'] = 'ref_node_2'
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
        expected = '<span class="glyphicons glyphicons-plus-sign">'
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
        expected = '<span class="glyphicons glyphicons-minus-sign">'
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
        ><span class="glyphicons glyphicons-plus-sign"></span></a>...
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

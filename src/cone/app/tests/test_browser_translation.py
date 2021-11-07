from cone.app import testing
from yafowil.tests import NodeTestCase
from plumber import plumbing
from cone.app.model import BaseNode
from cone.app.model import Translation
from yafowil.base import factory
from yafowil.tests import fxml
from cone.app.compat import UNICODE_TYPE
from node.utils import UNSET


@plumbing(Translation)
class TranslationNode(BaseNode):
    allow_non_node_children = True


class TestBrowserTranslation(NodeTestCase):
    layer = testing.security

    def test_translation_edit_renderer_no_value(self):
        widget = factory(
            'field:translation:text',
            'field',
            props={
                'label': 'Field'
            })
        self.checkOutput("""
        <div class="field" id="field-field">
          <ul class="nav nav-tabs translation-nav">
            <li class="active">
              <a href="#input-field-en">en</a>
            </li>
            <li>
              <a href="#input-field-de">de</a>
            </li>
          </ul>
          <input class="text" id="input-field-en" name="field.en" type="text" value=""/>
          <input class="text" id="input-field-de" name="field.de" type="text" value=""/>
        </div>
        """, fxml(widget()))

    # def test_translation_edit_renderer_preset_value(self):
    #     model = BaseNode()
    #     model['field'] = TranslationNode()

    #     widget = factory(
    #         'field:translation:text',
    #         'field',
    #         value=model['field'],
    #         props={
    #             'label': 'Field'
    #         })
    #     self.checkOutput("""
    #     """, fxml(widget()))

    def test_translation_extractor(self):
        widget = factory(
            'translation:text',
            name='field',
            props={
                'label': 'Field',
                'datatype': UNICODE_TYPE
            })

        request = self.layer.new_request()
        request.params['field.en'] = u'Value EN'
        request.params['field.de'] = u'Value DE'

        data = widget.extract(request)
        self.assertIsInstance(data.extracted, dict)
        self.assertEqual(data.extracted, {
            'en': u'Value EN',
            'de': u'Value DE'
        })

    def test_translation_extractor_factory(self):
        widget = factory(
            'translation:text',
            name='field',
            props={
                'label': 'Field',
                'factory': TranslationNode,
                'datatype': UNICODE_TYPE
            })

        request = self.layer.new_request()
        request.params['field.en'] = u'Value EN'
        request.params['field.de'] = u'Value DE'

        data = widget.extract(request)
        self.assertIsInstance(data.extracted, TranslationNode)
        self.assertEqual(data.extracted.items(), [
            ('en', u'Value EN'),
            ('de', u'Value DE')
        ])

    def test_extraction_preset_value(self):
        widget = factory(
            'translation:text',
            name='field',
            value={
                'en': u'Value EN',
                'de': u'Value DE'
            },
            props={
                'label': 'Field',
                'datatype': UNICODE_TYPE
            })

        request = self.layer.new_request()

        data = widget.extract(request)
        self.assertEqual(data.extracted, {
            'en': UNSET,
            'de': UNSET
        })

        request.params['field.en'] = u'Value EN'
        request.params['field.de'] = u'Value DE'
        data = widget.extract(request)
        self.assertEqual(data.extracted, {
            'en': u'Value EN',
            'de': u'Value DE'
        })

    def test_extraction_preset_value_factory(self):
        value = TranslationNode()
        value['en'] = u'Value EN'
        value['de'] = u'Value DE'
        widget = factory(
            'translation:text',
            name='field',
            value=value,
            props={
                'label': 'Field',
                'factory': TranslationNode,
                'datatype': UNICODE_TYPE
            })

        request = self.layer.new_request()

        data = widget.extract(request)
        self.assertIsInstance(data.extracted, TranslationNode)
        self.assertEqual(data.extracted.items(), [
            ('en', UNSET),
            ('de', UNSET)
        ])

        request.params['field.en'] = u'Value EN'
        request.params['field.de'] = u'Value DE'
        data = widget.extract(request)
        self.assertEqual(data.extracted.items(), [
            ('en', u'Value EN'),
            ('de', u'Value DE')
        ])

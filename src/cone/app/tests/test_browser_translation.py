from cone.app import testing
from cone.app.model import BaseNode
from cone.app.model import Translation
from node.utils import UNSET
from plumber import plumbing
from yafowil.base import factory
from yafowil.tests import fxml
from yafowil.tests import NodeTestCase


@plumbing(Translation)
class TranslationNode(BaseNode):
    allow_non_node_children = True


class TestBrowserTranslation(NodeTestCase):
    layer = testing.security

    def test_translation_extractor(self):
        widget = factory(
            'translation:text',
            name='field',
            props={
                'label': 'Field'
            })

        request = self.layer.new_request()
        data = widget.extract(request)
        self.assertEqual(data.extracted, UNSET)

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
                'factory': TranslationNode
            })

        request = self.layer.new_request()
        data = widget.extract(request)
        self.assertEqual(data.extracted, UNSET)

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
                'label': 'Field'
            })

        request = self.layer.new_request()
        data = widget.extract(request)
        self.assertEqual(data.extracted, UNSET)

        request.params['field.en'] = u'Value EN new'
        request.params['field.de'] = u'Value DE new'
        data = widget.extract(request)
        self.assertEqual(data.extracted, {
            'en': u'Value EN new',
            'de': u'Value DE new'
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
                'factory': TranslationNode
            })

        request = self.layer.new_request()
        data = widget.extract(request)
        self.assertEqual(data.extracted, UNSET)

        request.params['field.en'] = u'Value EN new'
        request.params['field.de'] = u'Value DE new'
        data = widget.extract(request)
        self.assertIsInstance(data.extracted, TranslationNode)
        self.assertEqual(data.extracted.items(), [
            ('en', u'Value EN new'),
            ('de', u'Value DE new')
        ])

    def test_translation_edit_renderer_no_value(self):
        widget = factory(
            'field:translation:text',
            'field',
            props={
                'label': 'Field'
            })

        self.checkOutput("""
        <div class="field" id="field-field">
          <ul class="nav nav-pills translation-nav">
            <li class="active">
              <a href="#translation-field-en">EN</a>
            </li>
            <li>
              <a href="#translation-field-de">DE</a>
            </li>
          </ul>
          <div class="translation-fields">
            <div id="translation-field-en">
              <input class="text" id="input-field-en" name="field.en"
                     type="text" value=""/>
            </div>
            <div id="translation-field-de">
              <input class="text" id="input-field-de" name="field.de"
                     type="text" value=""/>
            </div>
          </div>
        </div>
        """, fxml(widget()))

    def test_translation_edit_renderer_preset_value(self):
        widget = factory(
            'field:translation:text',
            'field',
            value={
                'en': u'Value EN',
                'de': u'Value DE'
            },
            props={
                'label': 'Field'
            })

        self.checkOutput("""
        ...
        <div id="translation-field-en">
          <input class="text" id="input-field-en" name="field.en"
                 type="text" value="Value EN"/>
        </div>
        <div id="translation-field-de">
          <input class="text" id="input-field-de" name="field.de"
                 type="text" value="Value DE"/>
        </div>
        ...
        """, fxml(widget()))

    def test_translation_edit_renderer_preset_translation_value(self):
        value = TranslationNode()
        value['en'] = u'Value EN'
        value['de'] = u'Value DE'
        widget = factory(
            'field:translation:text',
            'field',
            value=value,
            props={
                'label': 'Field',
                'factory': TranslationNode
            })

        self.checkOutput("""
        ...
        <div id="translation-field-en">
          <input class="text" id="input-field-en" name="field.en"
                 type="text" value="Value EN"/>
        </div>
        <div id="translation-field-de">
          <input class="text" id="input-field-de" name="field.de"
                 type="text" value="Value DE"/>
        </div>
        ...
        """, fxml(widget()))

    def test_render_after_extraction_no_preset_value(self):
        widget = factory(
            'field:translation:text',
            'field',
            props={
                'label': 'Field'
            })

        request = self.layer.new_request()
        request.params['field.en'] = u'Value EN'
        request.params['field.de'] = u'Value DE'
        data = widget.extract(request)
        self.checkOutput("""
        ...
        <div id="translation-field-en">
          <input class="text" id="input-field-en" name="field.en"
                 type="text" value="Value EN"/>
        </div>
        <div id="translation-field-de">
          <input class="text" id="input-field-de" name="field.de"
                 type="text" value="Value DE"/>
        </div>
        ...
        """, fxml(widget(data=data)))

    def test_render_after_extraction_preset_value(self):
        widget = factory(
            'field:translation:text',
            'field',
            value={
                'en': u'Value EN',
                'de': u'Value DE'
            },
            props={
                'label': 'Field'
            })

        request = self.layer.new_request()
        request.params['field.en'] = u'Value EN new'
        request.params['field.de'] = u'Value DE new'
        data = widget.extract(request)
        self.checkOutput("""
        ...
        <div id="translation-field-en">
          <input class="text" id="input-field-en" name="field.en"
                 type="text" value="Value EN new"/>
        </div>
        <div id="translation-field-de">
          <input class="text" id="input-field-de" name="field.de"
                 type="text" value="Value DE new"/>
        </div>
        ...
        """, fxml(widget(data=data)))

    def test_render_after_extraction_preset_translation_value(self):
        value = TranslationNode()
        value['en'] = u'Value EN'
        value['de'] = u'Value DE'
        widget = factory(
            'field:translation:text',
            'field',
            value=value,
            props={
                'label': 'Field',
                'factory': TranslationNode
            })

        request = self.layer.new_request()
        request.params['field.en'] = u'Value EN new'
        request.params['field.de'] = u'Value DE new'
        data = widget.extract(request)
        self.checkOutput("""
        ...
        <div id="translation-field-en">
          <input class="text" id="input-field-en" name="field.en"
               type="text" value="Value EN new"/>
        </div>
        <div id="translation-field-de">
          <input class="text" id="input-field-de" name="field.de"
               type="text" value="Value DE new"/>
        </div>
        ...
        """, fxml(widget(data=data)))

    def test_required(self):
        widget = factory(
            'field:error:translation:text',
            'field',
            value={
                'en': u'Value EN',
                'de': u'Value DE'
            },
            props={
                'label': 'Field',
                'required': 'Field is mandatory'
            })

        request = self.layer.new_request()
        request.params['field.en'] = u''
        request.params['field.de'] = u'Value DE'
        data = widget.extract(request)
        self.checkOutput("""
        <div class="field" id="field-field">
          <div class="error">
            <div class="errormessage">Field is mandatory</div>
            <ul class="nav nav-pills translation-nav">
              <li class="active error">
                <a href="#translation-field-en">* EN</a>
              </li>
              <li>
                <a href="#translation-field-de">DE</a>
              </li>
            </ul>
            <div class="translation-fields">
              <div id="translation-field-en">
                <input class="required text" id="input-field-en" name="field.en"
                       required="required" type="text" value=""/>
              </div>
              <div id="translation-field-de">
                <input class="required text" id="input-field-de" name="field.de"
                       required="required" type="text" value="Value DE"/>
              </div>
            </div>
          </div>
        </div>
        """, fxml(widget(data=data)))

    def test_translation_display_renderer(self):
        widget = factory(
            'field:translation:text',
            'field',
            value={
                'en': u'Value EN',
                'de': u'Value DE'
            },
            props={
                'label': 'Field'
            },
            mode='display')

        self.checkOutput("""
        <div class="field" id="field-field">
          <ul class="nav nav-pills translation-nav">
            <li class="active">
              <a href="#translation-field-en">EN</a>
            </li>
            <li>
              <a href="#translation-field-de">DE</a>
            </li>
          </ul>
          <div class="translation-fields">
            <div id="translation-field-en">
              <div class="display-text" id="display-field-en">Value EN</div>
            </div>
            <div id="translation-field-de">
              <div class="display-text" id="display-field-de">Value DE</div>
            </div>
          </div>
        </div>
        """, fxml(widget()))

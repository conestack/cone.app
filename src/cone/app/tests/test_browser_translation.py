from cone.app import testing
from yafowil.tests import NodeTestCase
from plumber import plumbing
from cone.app.model import BaseNode
from cone.app.model import Translation
from yafowil.base import factory
from yafowil.tests import fxml


class TestBrowserTranslation(NodeTestCase):
    layer = testing.security

    def test_translation_edit_renderer(self):
        @plumbing(Translation)
        class TranslationNode(BaseNode):
            pass

        model = BaseNode()
        model['field'] = TranslationNode()

        widget = factory(
            'field:translation:text',
            'field',
            props={
                'label': 'Field'
            })
        self.checkOutput("""
        <div class="field" id="field-field">
          <ul class="nav nav-tabs">
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

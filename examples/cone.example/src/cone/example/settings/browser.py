from cone.app.browser.form import Form
from cone.app.browser.settings import SettingsForm
from cone.app.browser.settings import settings_form
from cone.example.model import _
from cone.example.settings.model import ExampleSettings
from plumber import plumbing
from yafowil.base import factory


@settings_form(interface=ExampleSettings)
@plumbing(SettingsForm)
class ExampleSettingsForm(Form):
    """Settings form demonstrating the settings_form decorator.

    settings_form registers the form tile as 'editform' for the
    given interface. SettingsForm behavior provides heading and
    contextmenu handling.
    """

    def prepare(self):
        model = self.model
        props = model.config_properties
        self.form = form = factory(
            'form',
            name='example_settings_form',
            props={
                'action': self.form_action,
            })
        form['items_per_page'] = factory(
            'field:label:help:error:number',
            value=props.get('items_per_page', '15'),
            props={
                'label': _('items_per_page', default='Items per Page'),
                'help': _('items_per_page_help',
                          default='Number of items shown per page'),
                'datatype': int,
                'min': 5,
                'max': 100,
            })
        form['enable_notifications'] = factory(
            'field:label:help:error:select',
            value=props.get('enable_notifications', 'true'),
            props={
                'label': _('enable_notifications',
                          default='Enable Notifications'),
                'help': _('notifications_help',
                          default='Toggle notification emails'),
                'vocabulary': [
                    ('true', _('yes', default='Yes')),
                    ('false', _('no', default='No')),
                ],
            })
        form['default_language'] = factory(
            'field:label:help:error:select',
            value=props.get('default_language', 'en'),
            props={
                'label': _('default_language', default='Default Language'),
                'help': _('language_help',
                          default='Default language for new content'),
                'vocabulary': [
                    ('en', _('english', default='English')),
                    ('de', _('german', default='German')),
                ],
            })
        form['save'] = factory(
            'submit',
            props={
                'action': 'save',
                'expression': True,
                'handler': self.save,
                'next': self.next,
                'label': _('save', default='Save')
            })

    def save(self, widget, data):
        props = self.model.config_properties
        props.items_per_page = data.fetch(
            'example_settings_form.items_per_page').extracted
        props.enable_notifications = data.fetch(
            'example_settings_form.enable_notifications').extracted
        props.default_language = data.fetch(
            'example_settings_form.default_language').extracted
        props()

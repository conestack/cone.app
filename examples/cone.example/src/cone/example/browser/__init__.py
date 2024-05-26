from cone.app.browser.authoring import ContentAddForm
from cone.app.browser.authoring import ContentEditForm
from cone.app.browser.form import AddFormTarget
from cone.app.browser.form import EditFormTarget
from cone.app.browser.form import Form
from cone.app.browser.layout import ProtectedContentTile
from cone.app.browser.utils import choose_name
from cone.app.utils import add_creation_metadata
from cone.app.utils import update_creation_metadata
from cone.example.model import EntryFolder
from cone.example.model import Folder
from cone.example.model import Item
from cone.example.model import Translation
from cone.tile import tile
from cone.tile import tile
from node.utils import UNSET
from plumber import plumbing
from pyramid.i18n import TranslationStringFactory
from yafowil.base import factory
from yafowil.persistence import write_mapping_writer
import os
import webresource as wr


_ = TranslationStringFactory('cone.example')


resources_dir = os.path.join(os.path.dirname(__file__), 'static')
cone_example_resources = wr.ResourceGroup(
    name='cone.example',
    directory=resources_dir,
    path='example'
)
cone_example_resources.add(wr.StyleResource(
    name='cone-example-css',
    resource='cone.example.css'
))


def configure_resources(config, settings):
    config.register_resource(cone_example_resources)
    config.set_resource_include('cone-example-css', 'authenticated')


@tile(name='content',
      path='templates/view.pt',
      interface=EntryFolder,
      permission='login')
@tile(name='content',
      path='templates/view.pt',
      interface=Folder,
      permission='login')
@tile(name='content',
      path='templates/view.pt',
      interface=Item,
      permission='login')
class ViewContent(ProtectedContentTile):
    pass


class ExampleForm(Form):

    def prepare(self):
        self.form = form = factory(
            'form',
            name='contentform',
            props={
                'action': self.form_action,
                'persist_writer': write_mapping_writer
            })
        form['title'] = factory(
            'field:label:help:error:translation:text',
            value=self.model.attrs.get('title', UNSET),
            props={
                'factory': Translation,
                'label': _('title', default='Title'),
                'help': _('title_description', default='Enter a title'),
                'required': _('title_required', default='Title is mandatory')
            })
        form['description'] = factory(
            'field:label:help:error:translation:textarea',
            value=self.model.attrs.get('description', UNSET),
            props={
                'factory': Translation,
                'label': _('description', default='Description'),
                'help': _(
                    'description_description',
                    default='Enter a description'
                ),
                'rows': 4
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
        form['cancel'] = factory(
            'submit',
            props={
                'action': 'cancel',
                'expression': True,
                'skip': True,
                'next': self.next,
                'label': _('cancel', default='Cancel')
            })

    def save(self, widget, data):
        data.write(self.model.attrs)


@plumbing(AddFormTarget)
class ExampleAddForm(ExampleForm):

    def save(self, widget, data):
        add_creation_metadata(self.request, self.model.attrs)
        super(ExampleAddForm, self).save(widget, data)
        parent = self.model.parent
        parent[choose_name(parent, self.model.metadata.title)] = self.model


@plumbing(EditFormTarget)
class ExampleEditForm(ExampleForm):

    def save(self, widget, data):
        update_creation_metadata(self.request, self.model.attrs)
        super(ExampleEditForm, self).save(widget, data)


@tile(name='addform', interface=Folder, permission='add')
@tile(name='addform', interface=Item, permission='add')
@plumbing(ContentAddForm)
class ExampleContentAddForm(ExampleAddForm):
    ...


@tile(name='editform', interface=EntryFolder, permission='edit')
@tile(name='editform', interface=Folder, permission='edit')
@tile(name='editform', interface=Item, permission='edit')
@plumbing(ContentEditForm)
class ExampleContentEditForm(ExampleEditForm):
    ...

=====
Forms
=====

``cone.app`` uses `YAFOWIL <http://pypi.python.org/pypi/yafowil>`_  as form
processing library.

Forms are implemented as `tiles <http://pypi.python.org/pypi/cone.tile>`_,
registered for specific model nodes. Different flavours of forms are
implemented as `plumbing <http://pypi.python.org/pypi/plumber>`_ behaviors.


Form Basics
-----------

The base class for all form tiles is located at ``cone.app.browser.form.Form``.
This tile is responsible to build the widget tree and to handle form
processing.

Building the widget tree is done at ``prepare`` time, and form processing is
performed when the tile gets called.

.. code-block:: python

    from cone.app.browser.form import Form
    from cone.app.browser.utils import make_url
    from cone.example.model import ExamplePlugin
    from cone.tile import tile
    from yafowil.base import factory
    from yafowil.persistence import node_attribute_writer

    @tile(name='exampleform', interface=ExamplePlugin, permission='edit')
    class ExampleForm(Form):

        def prepare(self):
            """Prepare YAFOWIL widget tree and set it to ``self.form``
            """
            action = make_url(
                self.request,
                node=self.model,
                resource='exampleform')
            self.form = form = factory(
                'form',
                name='exampleform',
                props={
                    'action': action,
                    'persist_writer': node_attribute_writer
                })
            form['title'] = factory(
                'field:text',
                value=self.model.attrs['title'])
            form['save'] = factory(
                'submit',
                props = {
                    'action': 'save',
                    'expression': True,
                    'handler': self.save,
                    'next': None,
                    'label': 'Save'
                })

        def save(self, widget, data):
            data.write(self.model)

The above form submits to ``exampleform``, thus a view needs to be provided
by this name as well.

.. code-block:: python

    from cone.app.browser.authoring import render_form
    from pyramid.view import view_config

    @view_config(name='exampleform', context=ExamplePlugin, permission='edit')
    def exampleform(model, request):
        return render_form(model, request, tilename='exampleform')

Forms are performed AJAXified by default. This can be changed by setting
``ajax`` flag to ``False`` on form tile. The ``render_form`` function handles
both AJAX an non AJAX form submission. If form is submitted without AJAX
configured, the main template gets rendered with tile ``tilename`` as content
tile, otherwise ``render_ajax_form`` is called, which renders the tile wrapped
by some JavaScript calls into a script tag. The AJAX response will be rendered
to a hidden iframe on client side, from where continuation is processed.


YAML Forms
----------

``cone.app.browser.form.YAMLForm`` is a plumbing behavior for building the
form from YAML definitions. The above form tile implementation using YAML looks
like so.

.. code-block:: python

    from cone.app.browser.form import Form
    from cone.app.browser.form import YAMLForm
    from cone.app.browser.utils import make_url
    from cone.example.model import ExamplePlugin
    from cone.tile import tile
    from plumber import plumbing
    from yafowil.base import factory
    from yafowil.persistence import node_attribute_writer

    @tile(name='exampleform', interface=ExamplePlugin, permission='edit')
    @plumbing(YAMLForm)
    class ExampleForm(Form):
        action_resource = 'exampleform'
        form_template = 'cone.example.browser:forms/example.yaml'
        persist_writer = node_attribute_writer

        def save(self, widget, data):
            data.write(self.model)

The YAML file containing the form declarations looks like so.

.. code-block:: yaml

    factory: form
    name: exampleform
    props:
        action: context.form_action
        persist_writer: context.persist_writer
    widgets:
    - title:
        factory: field:text
        value: expr:context.model.attrs['title']
    - save:
        factory: submit
        props:
            action: save
            expression: True
            handler: context.save
            next: None
            label: Save


Protected Model Attributes
--------------------------

As soon as applications get more complex, it's a common usecase that different
roles of users have different level of data access. A user might be permitted
to edit some data, just be allowed to see it, or not even this so the data
must be hidden from the user. YAFOWIL supports this cases on form widget level
by the widget ``mode``, which is either ``edit``, ``display`` or ``skip``.

For ``cone.app`` forms, the plumbing behavior
``cone.app.browser.form.ProtectedAttributesForm`` is supposed to be used for
calculating widget modes based on security checks.

Security declarations for model attributes are defined on
``attribute_permissions`` containing the attribute names as key, and a 2-tuple
containing required edit and view permission which must be granted on the model
in order to edit or view the corresponding attribute. If no attribute
permissions are found for attribute name, ``attribute_default_permissions`` are
used for security checks. Default permissions are ``('edit', 'view')``.

.. code-block:: python

    from cone.app.browser.form import Form
    from cone.app.browser.form import ProtectedAttributesForm
    from cone.app.browser.utils import make_url
    from cone.example.model import ExamplePlugin
    from cone.tile import tile
    from plumber import plumbing
    from yafowil.base import factory
    from yafowil.persistence import node_attribute_writer

    @tile(name='exampleform', interface=ExamplePlugin, permission='edit')
    @plumbing(ProtectedAttributesForm)
    class ExampleForm(Form):
        attribute_permissions = {
            'field_b': ('manage', 'edit')
        }

        def prepare(self):
            action = make_url(
                self.request,
                node=self.model,
                resource='exampleform')
            self.form = form = factory(
                'form',
                name='exampleform',
                props={
                    'action': action,
                    'persist_writer': node_attribute_writer
                })
            form['field_a'] = factory(
                'field:label:text',
                value=self.model.attrs['field_a'],
                props={
                    'label': 'Field A',
                },
                mode=self.mode_for('field_a'))
            form['field_b'] = factory(
                'field:label:text',
                value=self.model.attrs['field_b'],
                props={
                    'label': 'Field B',
                },
                mode=self.mode_for('field_b'))
            form['save'] = factory(
                'submit',
                props = {
                    'action': 'save',
                    'expression': True,
                    'handler': self.save,
                    'next': None,
                    'label': 'Save'
                })

        def save(self, widget, data):
            data.write(self.model)


Redirecting after Form processing
---------------------------------

Forms are processed as follows:

- If no action submitted, render from.

- If action gets submitted, process form.

- If form extraction succeeds without errors, action referenced ``handler``
  callback is executed.

- If action references a ``next`` callback, it is used to calculate the
  target to redirect to after form processing. If no ``next`` callback is set
  the form ist rendered again.

``cone.app`` ships the plumbing behavior
``cone.app.browser.authoring.CameFromNext`` which can be used to provide
redirect target calculations on form tiles.

It plumbs to the prepare function and adds a ``came_from`` proxy widget to the
form. ``came_from`` gets read from request parameters, thus the user can define
the redirect target when invoking the form. The target can either be ``parent``
of a URL.

It further extends the form tile by a ``next`` function, which is supposed to
be used as form action ``next`` callback. The next function computes the
redirect target by value from ``came_from`` parameter on request.

- If parameter value is ``parent``, application model parent node is used as
  redirect target.

- If URL is found as value, this one is used as redirect target.

- If empty value is found, application model node is used as redirect target.

If the form was submitted by AJAX call, the ``next`` function returns the
appropriate AJAX continuation definitions to render the application layout on
new target, otherwise a ``HTTPFound`` instance used to perform a regular
browser redirect.

.. code-block:: python

    from cone.app.browser.authoring import CameFromNext
    from cone.app.browser.form import Form
    from cone.app.browser.utils import make_url
    from cone.example.model import ExamplePlugin
    from cone.tile import tile
    from plumber import plumbing
    from yafowil.base import factory
    from yafowil.persistence import node_attribute_writer

    @tile(name='exampleform', interface=ExamplePlugin, permission='edit')
    @plumbing(CameFromNext)
    class ExampleForm(Form):

        def prepare(self):
            action = make_url(
                self.request,
                node=self.model,
                resource='exampleform')
            self.form = form = factory(
                'form',
                name='exampleform',
                props={
                    'action': action,
                    'persist_writer': node_attribute_writer
                })
            form['title'] = factory(
                'field:text',
                value=self.model.attrs['title'])
            form['save'] = factory(
                'submit',
                props = {
                    'action': 'save',
                    'expression': True,
                    'handler': self.save,
                    # reference to ``next`` callback provided by CameFromNext
                    'next': self.next,
                    'label': 'Save'
                })

        def save(self, widget, data):
            data.write(self.model)


Content Area Forms
------------------

The most common usecase when integrating forms is to render them in the
*Content Area* of the page.

The plumbing behavior ``cone.app.browser.authoring.ContentForm`` implements the
required integration code and shall be used for form tiles rendering to the
*Content Area*.

Following customization attributes are considered:

- **show_contextmenu**: Flag whether to render the context menu.
  Defaults to ``True``

- **show_heading**: Flag whether to render a form heading.
  Defaults to ``True``.

- **form_heading**: Form heading text.

.. code-block:: python

    from cone.app.browser.authoring import ContentForm
    from cone.app.browser.form import Form
    from cone.example.model import ExamplePlugin
    from cone.tile import tile
    from plumber import plumbing

    @tile(name='exampleform', interface=ExamplePlugin, permission='edit')
    @plumbing(ContentForm)
    class ExampleContentForm(Form):
        show_contextmenu = True
        show_heading = True

        @property
        def form_heading(self):
            return 'Content Form for {}'.format(self.model.metadata.title)

        def prepare(self):
            """Form preperation goes here.
            """


Overlay Forms
-------------

Another usecase is to render forms in an overlay. This is useful when it's
desired to edit some entities without loosing the form triggering UI context.

The plumbing behavior ``cone.app.browser.authoring.OverlayForm`` implements the
required integration code and shall be used for form tiles rendering to an
overlay.

The ``OverlayForm`` plumbs the ``__call__`` function where hooking the form
to the overlay happens, and extends the form tile by a ``next`` handler
callback, which actually return an event for closing the overlay on the client
side.

Needless to say that overlay forms only works for AJAXified form tiles.

When providing an overlay form for a specific model, it is expected under
tile registration name ``overlayform``.

.. code-block:: python

    from cone.app.browser.authoring import OverlayForm
    from cone.app.browser.form import Form
    from cone.example.model import ExamplePlugin
    from cone.tile import tile
    from plumber import plumbing

    @tile(name='overlayform', interface=ExamplePlugin, permission='edit')
    @plumbing(OverlayForm)
    class ExampleOverlayForm(Form):

        def prepare(self):
            """Form preperation goes here.
            """

If it's necessary to deal with several overlay forms for the same model,
buildin tile ``overlayform`` name cannot be used, so corresponding views need
to be provided as well.

.. code-block:: python

    from cone.app.browser.authoring import OverlayForm
    from cone.app.browser.authoring import render_form
    from cone.app.browser.form import Form
    from cone.example.model import ExamplePlugin
    from cone.tile import tile
    from plumber import plumbing
    from pyramid.view import view_config

    @tile(name='otheroverlayform', interface=ExamplePlugin, permission='edit')
    @plumbing(OverlayForm)
    class OtherOverlayForm(Form):

        def prepare(self):
            """Form preperation goes here.
            """

    @view_config(
        name='otheroverlayform',
        context=ExamplePlugin,
        permission='edit')
    def otheroverlayform(model, request):
        return render_form(model, request, tilename='otheroverlayform')

Overlay form invocation happens via ``bdajax`` overlay integration.

In markup this looks like.

.. code-block:: html

    <a href="http://fubar.com/baz?a=a"
       ajax:bind="click"
       ajax:target="http://fubar.com/baz?a=a"
       ajax:overlay="overlayform">
      fubar
    </a>

In JavaScript this looks like.

.. code-block:: js

    var overlay_api = bdajax.overlay({
        action: 'overlayform',
        target: 'http://fubar.com/baz?a=a'
    });

Implemented as action this looks like.

.. code-block:: python

    from cone.app.browser.actions import LinkAction

    class OverlayFormTriggerAction(LinkAction):
        text = 'Show Overlay Form'
        target = 'http://fubar.com/baz?a=a'
        overlay = 'overlayform'


Add Forms
---------

As described in the :ref:`Add Tile <widgets_authoring_add_tile>` documentation,
tiles named ``addform`` are reserved for application node add forms.

For creating add form tiles, ``cone.app.browser.authoring.Add`` provides
the required plumbings. It derives from ``CameFromNext``.

The ``prepare`` function is plumbed in order to extend the form with a
'factory' proxy widget, which passes the node info name.

The ``__call__`` function gets also plumbed, and renders a heading prior to
form if ``show_heading`` on form tile is set to ``True``, which is default.

.. code-block:: python

    from cone.app.browser.authoring import AddPart
    
    @tile('addform', interface=ExampleApp, permission="add")
    @plumbing(AddPart)
    class ExampleAppAddForm(Form):
        pass


Edit forms
----------

As described in the :ref:`Edit Tile <widgets_authoring_edit_tile>`
documentation,

As described in tiles documentation, tiles named ``editform`` are reserved
for application node edit forms. They are invoked by the ``edit`` tile for
node.

For creating edit form tiles, ``cone.app.browser.authoring.EditPart`` provides
the required plumbings. It derives from ``CameFromNext``.

The ``__call__`` function gets plumbed, and renders a heading prior to
form if ``show_heading`` on form tile is set to ``True``, which is default.

.. code-block:: python

    from cone.app.browser.authoring import EditPart
    
    @tile('editform', interface=ExampleApp, permission="edit")
    @plumbing(EditPart)
    class ExampleAppEditForm(Form):
        pass

For add and edit forms it probably makes sense to write one base class
providing the ``prepare`` function.


Settings Forms
--------------

``cone.app`` renders forms for application settings in tabs, all at once.
To provide a edit form for your settings node,
``cone.app.browser.settings.SettingsPart`` should be used.

The ``prepare`` function gets plumbed which calls
``cone.app.browser.ajax.ajax_form_fiddle`` with form selector in order to
define which of the rendered forms on client side should be altered.

The settings form tile gets extended by a ``next`` function, which handles
form continuation similar to ``CameFromNext`` part, without the consideration
of 'came_from'.

.. code-block:: python

    from cone.app.browser.settings import SettingsPart

    @tile('editform', interface=AppSettings, permission="manage")
    @plumbing(SettingsPart)
    class ServerSettingsForm(Form):
        pass


Extending Forms
---------------

The plumbing mechanism could also be used for generic form extension. This is
interesting in cases where a set of different nodes partly contain the same
set of data.

To achieve this, write a plumbing part which hooks to the ``prepare`` function,
which adds form widgets to ``self.form`` after processing ``_next`` downstream
function, which in case is the following ``prepare`` function in the plumbing
pipeline. Also hook to the ``save`` function (the one defined as form action
``handler`` property) and add the related persisting code.

.. code-block:: python

    from plumber import Part
    from plumber import plumb

    class FormExtension(Part):

        @plumb
        def prepare(_next, self):
            # downstream ``prepare`` function, after this self.form must
            # be present
            _next(self)
            # extension widget
            widget = factory(
                'field:text',
                value=self.model.attrs['generic'])
            # add new widget before save widget
            save_widget = self.form['save']
            self.form.insertbefore(roles_widget, save_widget)

        @plumb
        def save(_next, self, widget, data):
            value = data.fetch('%s.generic' % self.form_name).extracted
            self.model.attrs['generic'] = value
            _next(self, widget, data)

This part can now be used like any other plumbing part for extending form
tiles.

.. code-block:: python

    @tile('editform', interface=ExampleApp, permission="edit")
    @plumbing(EditPart, FormExtension)
    class ServerSettingsForm(Form):
        pass

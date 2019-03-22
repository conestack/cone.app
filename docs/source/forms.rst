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
the redirect target when invoking the form.

The target can either be empty string, ``parent`` or a URL.

It extends the form tile by a ``next`` function, which is supposed to be used
as form action ``next`` callback. The next function computes the redirect
target as follows:

- If ``came_from`` not found on request, ``default_came_from`` property is
  used.

- If ``came_from`` is special value ``parent``, URL of model parent is
  computed.

- If ``came_from`` is set, it is considered as URL to use. The given URL must
  match the basic application URL, otherwise an error gets logged and URL of
  current model is computed.

- If ``came_from`` is set to empty value, URL of current model is computed.

If the form was submitted by AJAX call, the ``next`` function returns the
appropriate AJAX continuation definitions to render the application layout on
new target, otherwise a ``HTTPFound`` instance used to perform a regular
browser redirect.

By setting ``write_history_on_next`` to ``True`` on AJAX forms, an ``AjaxPath``
continuation definition gets returned as well writing the browser history on
the client.

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
        default_came_from = 'parent'
        write_history_on_next = True

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
required integration code and is used for form tiles rendering to an overlay.

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


Multiple overlay forms on same model
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

If it's necessary to deal with several overlay forms for the same model,
builtin tile ``overlayform`` name cannot be used, so corresponding pyramid view
and form entry tile needs to be provided as well.

.. code-block:: python

    from cone.app.browser.authoring import OverlayForm
    from cone.app.browser.authoring import OverlayFormTile
    from cone.app.browser.authoring import render_form
    from cone.app.browser.form import Form
    from cone.example.model import ExamplePlugin
    from cone.tile import tile
    from plumber import plumbing
    from pyramid.view import view_config

    @view_config(
        name='otheroverlayform',
        context=ExamplePlugin,
        permission='edit')
    def otheroverlayform(model, request):
        """Pyramid view for posting overlay forms to.
        """
        return render_form(model, request, tilename='otheroverlayformtile')

    @tile(
        name='otheroverlayformtile',
        permission='edit')
    class OtherOverlayFormTile(OverlayFormTile):
        """Entry tile for rendering forms in overlays.
        """
        form_tile_name = 'otheroverlayform'

    @tile(
        name='otheroverlayform',
        interface=ExamplePlugin,
        permission='edit')
    @plumbing(OverlayForm)
    class OtherOverlayForm(Form):
        """Concrete form tile.
        """
        action_resource = 'otheroverlayform'

        def prepare(self):
            """Form preperation goes here.
            """

NOTE: The **entry** to overlay forms is always the intermediate tile, which then
subsequently renders the actual form tile. Thus the name to invoke the custom
overlay above is ``otheroverlayformtile``.

NOTE: Overlay forms are processed by posting the form to a hidden iframe as
form action target. This is needed to prevent POST request restrictions with
XHR requests. Therefor we need the pyramid view ``otheroverlayform``, which
defines the view entry for the form and is supposed to render the form entry
tile. This view must also be defined as ``action_resource`` on
concrete form implementation, in this case ``OtherOverlayForm``.


Overlay form invocation
~~~~~~~~~~~~~~~~~~~~~~~

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


.. _forms_add_and_edit_forms:

Add and Edit Forms
------------------

Add Forms
~~~~~~~~~

Plumbing bahaviors to render add forms to page *Content Area* or as overlay
form named ``ContentAddForm`` and ``OverlayAddForm`` exists in module
``cone.app.browser.authoring``.

As described in the :ref:`Add Tile <widgets_authoring_add_tile>` documentation,
tiles named ``addform`` are reserved for application node content add forms.
Add form tiles refer to the ``add`` view for submission.

Overlay add forms are registered by name ``overlayaddform``. Overlay add form
tiles refer to the ``overlayadd`` view for submission.

Add forms expect the request parameter ``factory`` to be present containing a
``NodeInfo`` registration name for creating the add model and rendering the
corrsponding add form tile on it when being invoked.


Edit Forms
~~~~~~~~~~

Plumbing bahaviors to render edit forms to page *Content Area* or as overlay
form named ``ContentEditForm`` and ``OverlayEditForm`` exists in module
``cone.app.browser.authoring``.

As described in the :ref:`Edit Tile <widgets_authoring_edit_tile>`
documentation, tiles named ``editform`` are reserved for application node
content edit forms. Edit form tiles refer to the ``edit`` view for submission.

Overlay edit forms are registered by name ``overlayeditform``. Overlay edit
form tiles refer to the ``overlayedit`` view for submission.


Authoring Forms Example
~~~~~~~~~~~~~~~~~~~~~~~

A complete implementation of add and edit forms for page *Content Area* and
overlay versions may look like so.

.. code-block:: python

    from cone.app.browser.authoring import ContentAddForm
    from cone.app.browser.authoring import ContentEditForm
    from cone.app.browser.authoring import OverlayAddForm
    from cone.app.browser.authoring import OverlayEditForm
    from cone.app.browser.form import Form
    from cone.app.browser.utils import make_url
    from cone.app.utils import add_creation_metadata
    from cone.app.utils import update_creation_metadata
    from cone.example.model import ExampleNode
    from cone.tile import tile
    from plumber import plumbing
    from yafowil.base import factory
    from yafowil.persistence import node_attribute_writer

    class ExampleForm(Form):
        """Basic form for ExampleNode.
        """

        def prepare(self):
            # ``action_resource`` is provided by add end edit plumbing behaviors
            action = make_url(
                self.request,
                node=self.model,
                resource=self.action_resource)
            # create form and set reference to ``self.form``
            self.form = form = factory(
                'form',
                name='exampleform',
                props={
                    'action': action,
                    'persist_writer': node_attribute_writer
                })
            # add title field
            form['title'] = factory(
                'field:label:text',
                value=self.model.attrs['title'],
                props={
                    'label': 'Title'
                })
            # add save button
            form['save'] = factory(
                'submit',
                props = {
                    'action': 'save',
                    'expression': True,
                    'handler': self.save,
                    'next': self.next,
                    'label': 'Save'
                })
            # add cancel button
            form['cancel'] = factory(
                'submit',
                props = {
                    'action': 'cancel',
                    'expression': True,
                    'skip': True,
                    'next': self.next,
                    'label': 'Cancel'
                })

        def save(self, widget, data):
            # Use YAFOWIL persistence mechanism to write form data to the model
            # can be done manually as well. See YAFOWIL documentation for
            # details.
            data.write(self.model)


    class ExampleAdding(ExampleForm):
        """Basic add form for ExampleNode.
        """

        def save(self, widget, data):
            # add creation metadata if desired
            add_creation_metadata(self.request, self.model.attrs)
            # call superclass handling form data persistence
            super(ExampleAdding, self).save(widget, data)
            # in add forms model is no part of application model yet,
            # so we need to hook it up
            self.model.parent[self.model.attrs['title']] = self.model
            # persist model
            self.model()


    class ExampleEditing(ExampleForm):
        """Basic edit form for ExampleNode.
        """

        def save(self, widget, data):
            # update creation metadata if desired
            update_creation_metadata(self.request, self.model.attrs)
            # call superclass handling form data persistence
            super(ExampleEditing, self).save(widget, data)
            # persist model
            self.model()


    @tile(name='addform', interface=ExampleNode, permission="add")
    @plumbing(ContentAddForm)
    class ExampleAddForm(ExampleAdding):
        """Content add form for ExampleNode.
        """

    @tile(name='editform', interface=ExampleNode, permission="edit")
    @plumbing(ContentEditForm)
    class ExampleEditForm(ExampleEditing):
        """Content edit form for ExampleNode.
        """

    @tile(name='overlayaddform', interface=ExampleNode, permission="add")
    @plumbing(OverlayAddForm)
    class ExampleOverlayAddForm(ExampleAdding):
        """Overlay add form for ExampleNode.
        """

    @tile(name='overlayeditform', interface=ExampleNode, permission="edit")
    @plumbing(OverlayEditForm)
    class ExampleOverlayEditForm(ExampleEditing):
        """Overlay edit form for ExampleNode.
        """


Settings Model Forms
--------------------

``cone.app`` renders forms for application settings in tabs, all at once.
To provide a edit form for your settings node,
``cone.app.browser.settings.SettingsBehavior`` shall be used.

.. code-block:: python

    from cone.app.browser.form import Form
    from cone.app.browser.settings import SettingsBehavior
    from cone.example.model import ExampleSettings
    from cone.tile import tile
    from plumber import plumbing

    @tile(name='editform', interface=ExampleSettings, permission="manage")
    @plumbing(SettingsBehavior)
    class ExampleSettingsForm(Form):
        """Form for ExampleSettings node.
        """


Extending Forms with Plumbing Behaviors
---------------------------------------

The plumbing mechanism can be used for generic form extension. This is
interesting in cases where a set of different nodes partly contain the same
set of data or a form should be extended by a generic behavior.

A plumbing behavior can hook up to existing functions to perform some code
before or after the actual function gets processed or extend an object by
properties and functions. See `plumber <http://pypi.python.org/pypi/plumber>`_
documentations for a detailed documentation about the plumbing system and it's
motivation.

Here we will write a plumbing behavior which hooks some form widget at
``prepare`` time and handles persistence of this widget by hooking up to the
form's ``save`` function.

.. code-block:: python

    from plumber import Behavior
    from plumber import plumb

    class FormExtension(Behavior):
        """Plumbing behavior used as form extension.

        Hooks ``generic`` field to form.
        """

        @plumb
        def prepare(_next, self):
            # call downstream ``prepare`` function, ``self.form`` must be
            # present after calling
            _next(self)
            # extension widget
            widget = factory(
                'field:label:text',
                value=self.model.attrs['generic'],
                props={
                    'label': 'Generic Field'
                })
            # add new widget before save widget
            save_widget = self.form['save']
            self.form.insertbefore(roles_widget, save_widget)

        @plumb
        def save(_next, self, widget, data):
            # fetch extension field value from form data
            value = data.fetch('%s.generic' % self.form_name).extracted
            # set extracted value to model attributes
            self.model.attrs['generic'] = value
            # call downstream ``save`` function
            _next(self, widget, data)

This behavior can now be used like any other plumbing behavior for extending
form tiles.

.. code-block:: python

    from cone.app.browser.authoring import ContentEditForm
    from cone.app.browser.form import Form
    from cone.example.model import ExampleNode
    from cone.tile import tile
    from plumber import plumbing

    @tile(name='editform', interface=ExampleNode, permission="edit")
    @plumbing(ContentEditForm, FormExtension)
    class ExampleEditForm(Form):
        """Content edit form using our generic form extension.
        """

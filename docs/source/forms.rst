=====
Forms
=====

Form basics
===========

``cone.app`` uses YAFOWIL as form library.

Forms are implemented as tiles, registered for specific model nodes. Adding
behavior and form extension of different forms is done with plumbing parts,
see ``plumber`` package for details about the plumbing system.


Form tile
---------

The base class for all form tiles is located at ``cone.app.browser.form.Form``.
This tile is responsible to build the widget tree and to do form processing.

Building the widget tree is done at ``prepare`` time, and form processing is
done when the tile gets called.::

    >>> from yafowil.base import factory
    >>> from cone.tile import tile
    >>> from cone.app.browser.form import Form
    >>> from cone.app.browser.utils import make_url
    >>> from example.app.model import ExampleApp
    
    >>> @tile('someform', interface=ExampleApp, permission="edit")
    ... class SomeForm(Form):
    ... 
    ...     def prepare(self):
    ...         """Prepare YAFOWIL widget tree and set it to ``self.form``
    ...         """
    ...         action = make_url(
    ...             self.request, node=self.model, resource='someform')
    ...         form = factory(
    ...             'form',
    ...             name='someform',
    ...             props={
    ...                 'action': action,
    ...             })
    ...         form['title'] = factory(
    ...             'field:text'
    ...             value=self.model.attrs['title']
    ...             )
    ...         form['save'] = factory(
    ...             'submit',
    ...             props = {
    ...                 'action': 'save',
    ...                 'expression': True,
    ...                 'handler': self.save,
    ...                 'next': None,
    ...                 'label': 'Save',
    ...             })
    ...         self.form = form
    ... 
    ...     def save(self, widget, data):
    ...         value = data.fetch('someform.title').extracted
    ...         self.model.attrs['title'] = value

Forms are AJAX forms by default. If it's desired that a specific form is also
available via traversal, a pyramid view with the name given as ``resource``
parameter when calling ``make_url`` for the form action in the example above
must be provided.::

    >>> from pyramid.view import view_config
    >>> from cone.app.browser.authoring import render_form
    
    >>> @view_config('someform', context=ExampleApp, permission='edit')
    ... def someform(model, request):
    ...     return render_form(model, request, 'someform')


YAMLForm part
-------------

``cone.app.browser.form.YAMLForm`` is a plumbing part which hooks the
``prepare`` function to the form tile building the YAFOWIL form from YAML
definitions. The form implementation from above now looks like::

    >>> from plumber import plumber
    >>> from cone.app.browser.form import YAMLForm
    
    >>> @tile('someyamlform', interface=ExampleApp, permission="edit")
    ... class SomeYAMLForm(Form):
    ...     __metaclass__ = plumber
    ...     __plumbing__ = YAMLForm
    ... 
    ...     action_resource = u'someyamlform'
    ...     form_template = 'example.app.browser:forms/some_form.yaml'
    ... 
    ...     def save(self, widget, data):
    ...         value = data.fetch('someform.title').extracted
    ...         self.model.attrs['title'] = value

The YAML file which must be present at the given location contains::

    factory: form
    name: someyamlform
    props:
        action: context.form_action
        class: ajax
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


CameFromNext part
-----------------

In the examples above we've seen how forms are created, form submission are
processed and forms are rendered. However, a mechanism to handle what happens
after a form actions has been processed successfully is also needed.

This is provided by the plumbing part
``cone.app.browser.authoring.CameFromNext``.

It plumbs to the prepare function and adds a 'came_from' proxy widget to the
already processed form, which can contain either 'parent' or a URL from where
the form was triggered from. If 'came_from' is not found on request, the
application node URL is used.

It extends the form tile by a ``next`` function, which can be defined in form
action definitions as ``next`` property. It also considers 'came_from' on the
request for building the appropriate next URL.

If form was submitted by AJAX call, the ``next`` function returns the desired
AJAX continuation definitions, or an HTTPFound instance used to redirect if
non AJAX request.

Default ajax continuation definitions are an ``AjaxAction`` to render the
``content`` tile to main content area of the page and an ``AjaxEvent``
triggering the contxt change event, both on target URL resulting by 'came_from'.

Define ``self.next``, respective ``context.next`` if YAML form, in save widget
of form as ``next`` property and add ``CameFromNext`` part to plumbing parts on
form tile class.::

    >>> @tile('someyamlform', interface=ExampleApp, permission="edit")
    ... class SomeYAMLForm(Form):
    ...     __metaclass__ = plumber
    ...     __plumbing__ = YAMLForm, CameFromNext


Add forms
=========

Add part
--------

Edit forms
==========

Edit part
---------

Settings part
-------------

Extending forms
===============

FormExtension(Part)

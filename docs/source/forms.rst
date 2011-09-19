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
    ...                 'next': self.next,
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
    
    @tile('someyamlform', interface=ExampleApp, permission="edit")
    >>> class SomeYAMLForm(Form):
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
            next: context.next
            label: Save


CameFromNext part
-----------------

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

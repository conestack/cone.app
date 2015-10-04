Form tiles
==========

``cone.app`` uses ``yafowil`` as form engine. See Documentation of
``yafowil`` for details how to use it.

``cone.app.browser.form`` contains an abstract form tile, which processes 
yafowil forms and provides needed hooks to ``cona.app``.

A subclass of a form tile must implement ``prepare``. This function is 
responsible to create the yafowil form on ``self.form``::

    >>> from cone.app.browser.form import Form

    >>> formtile = Form(None, None, 'plainform')
    >>> formtile.prepare()
    Traceback (most recent call last):
      ...
    NotImplementedError: ``prepare`` function must be provided by 
    deriving object.

    >>> from yafowil import loader
    >>> from yafowil.base import factory
    >>> from cone.tile import tile
    >>> from cone.app.browser.utils import make_url
    >>> from cone.app.browser.ajax import AjaxAction
    >>> from webob.exc import HTTPFound

    >>> @tile('subscriptionform')
    ... class SubscriptionForm(Form):
    ...     _ajax = False # test flag
    ...     _show = False # test flag
    ...     
    ...     @property
    ...     def ajax(self):
    ...         return self._ajax
    ...     
    ...     @property
    ...     def show(self):
    ...         return self._show
    ...     
    ...     def prepare(self):
    ...         form = factory(u'form',
    ...                        name='subscriptionform',
    ...                        props={'action': self.nodeurl})
    ...         form['email'] = factory(
    ...             'field:label:error:text',
    ...             props = {
    ...                 'required': 'No email given',
    ...                 'label': 'E-Mail',
    ...             })
    ...         form['subscribe'] = factory(
    ...             'submit',
    ...             props = {
    ...                 'action': 'subscribe',
    ...                 'expression': True,
    ...                 'handler': self.subscribe,
    ...                 'next': self.next,
    ...                 'label': 'Subscribe',
    ...             })
    ...         self.form = form
    ...     
    ...     def subscribe(self, widget, data):
    ...         """Do subscription here
    ...         """
    ...         print 'subscribe on "%s"' % self.model.name
    ...         
    ...     def next(self, request):
    ...         url = 'http://example.com'
    ...         if self.ajax_request:
    ...             # return as single value, gets list on request.environ
    ...             return AjaxAction(url, 'content', 'inner', '#content')
    ...         return HTTPFound(url)

Create dummy model::

    >>> from cone.app.model import BaseNode
    >>> model = BaseNode()
    >>> model.__name__ = 'dummymodel'

Authenticate::

    >>> layer.login('max')
    >>> request = layer.new_request()

Render form. ``form.show`` returns false, render empty string::

    >>> from cone.tile import render_tile
    >>> render_tile(model, request, 'subscriptionform')
    u''

Set show to True::

    >>> SubscriptionForm._show = True

Render form. no action is triggered and no input is given::

    >>> rendered = render_tile(model, request, 'subscriptionform')
    >>> expected = 'action="http://example.com/dummymodel"'
    >>> rendered.find(expected) != -1
    True

    >>> expected = 'id="form-subscriptionform"'
    >>> rendered.find(expected) != -1
    True

    >>> expected = 'name="subscriptionform.email"'
    >>> rendered.find(expected) != -1
    True

    >>> expected = 'name="action.subscriptionform.subscribe"'
    >>> rendered.find(expected) != -1
    True

Trigger subscribe action and set empty email value. Results in a form with
error message since email is required::

    >>> request.params['action.subscriptionform.subscribe'] = '1'
    >>> request.params['subscriptionform.email'] = ''

    >>> rendered = render_tile(model, request, 'subscriptionform')
    >>> expected = 'No email given'
    >>> rendered.find(expected) != -1
    True

Trigger subscribe action and set valid email value. Now the action handler and
next handler are triggered::

    >>> request.params['subscriptionform.email'] = 'john.doe@example.com'

    >>> rendered = render_tile(model, request, 'subscriptionform')
    subscribe on "dummymodel"

The form was rendered as non ajax form, so we expect an HTTPFound instance on
request::

    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

    >>> del request.environ['redirect']

Even if we commit as ajax form, it is treaten as normal form since ajax flag
is set to False (defaults to True)::

    >>> request.params['ajax'] = '1'
    >>> rendered = render_tile(model, request, 'subscriptionform')
    subscribe on "dummymodel"

    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

    >>> del request.environ['redirect']
    >>> del request.params['ajax']

Try with ajax True. First if submitted without ajax flag, still expect
HTTPFound instance::

    >>> SubscriptionForm._ajax = True
    >>> rendered = render_tile(model, request, 'subscriptionform')
    subscribe on "dummymodel"

    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

Submit with ajax flag::

    >>> request.params['ajax'] = '1'
    >>> rendered = render_tile(model, request, 'subscriptionform')
    subscribe on "dummymodel"

    >>> request.environ['cone.app.continuation']
    [<cone.app.browser.ajax.AjaxAction object at ...>]

Same form as above using ``yafowil.yaml``::

    >>> from plumber import plumbing
    >>> from cone.app.browser.form import YAMLForm

    >>> @tile('yamlsubscriptionform')
    ... @plumbing(YAMLForm)
    ... class YAMLSubscriptionForm(Form):
    ...     action_resource = 'yamlsubscriptionform'
    ...     form_template = 'cone.app.testing:dummy_form.yaml'

    >>> request = layer.new_request()
    >>> from cone.tile import render_tile
    >>> res = render_tile(model, request, 'yamlsubscriptionform')
    >>> expected = \
    ...     'action="http://example.com/dummymodel/yamlsubscriptionform"'
    >>> res.find(expected) > -1
    True

Instead of ``form_template`` attribute, ``form_template_path`` can be used for
backward compatibility::

    >>> @tile('yamlsubscriptionform2')
    ... class YAMLSubscriptionForm2(YAMLSubscriptionForm):
    ...     action_resource = 'yamlsubscriptionform2'
    ...     form_template = None
    ...     form_template_path = 'cone.app.testing:dummy_form.yaml'

    >>> res = render_tile(model, request, 'yamlsubscriptionform2')
    >>> expected = \
    ...     'action="http://example.com/dummymodel/yamlsubscriptionform2"'
    >>> res.find(expected) > -1
    True

ProtectedAttributesForm plumbing behavior::

    >>> from cone.app.browser.form import ProtectedAttributesForm
    >>> @tile('protectedattributesform')
    ... @plumbing(ProtectedAttributesForm)
    ... class ProtectedAttributesForm(Form):
    ...     
    ...     attribute_permissions = {
    ...         'protectedfield': ('manage', 'edit')
    ...     }
    ...     
    ...     def prepare(self):
    ...         form = factory(
    ...             u'form',
    ...             name='protectedattributesform',
    ...             props={
    ...                 'action': self.nodeurl,
    ...             })
    ...         form['protectedfield'] = factory(
    ...             u'field:label:text',
    ...             value=u'Protectedfield',
    ...             mode=self.mode_for('protectedfield')
    ...         )
    ...         self.form = form

    >>> from pyramid.security import has_permission
    >>> layer.login('viewer')
    >>> request = layer.new_request()
    >>> has_permission('edit', model, request)
    <ACLDenied ...

    >>> render_tile(model, request, 'protectedattributesform')
    u'<form 
    action="http://example.com/dummymodel" 
    class="ajax" 
    enctype="multipart/form-data" 
    id="form-protectedattributesform" 
    method="post" 
    novalidate="novalidate"></form>'

    >>> layer.login('editor')
    >>> request = layer.new_request()
    >>> has_permission('edit', model, request)
    <ACLAllowed ...

    >>> render_tile(model, request, 'protectedattributesform')
    u'<form ...<div class="display-text" 
    id="display-protectedattributesform-protectedfield">Protectedfield</div></div></form>'

    >>> layer.login('manager')
    >>> request = layer.new_request()
    >>> has_permission('manage', model, request)
    <ACLAllowed ...

    >>> render_tile(model, request, 'protectedattributesform')
    u'<form ...<input class="text" 
    id="input-protectedattributesform-protectedfield" 
    name="protectedattributesform.protectedfield" 
    type="text" value="Protectedfield" /></div></form>'

    >>> layer.logout()

Provide another form tile for testing remaining aspects of ``Form`` class::

    >>> @tile('otherform')
    ... class OtherForm(Form):
    ...     
    ...     def prepare(self):
    ...         form = factory(
    ...             u'form',
    ...             name='otherform',
    ...             props={
    ...                 'action': self.nodeurl,
    ...                 'class': 'foo', # if class is set and ajax is true
    ...                                 # class 'ajax' gets added to existing
    ...                                 # class
    ...             })
    ...         form['save'] = factory(
    ...             'submit',
    ...             props = {
    ...                 'action': 'save',
    ...                 'expression': True,
    ...                 'handler': None,
    ...                 'next': self.next,
    ...                 'label': 'Save',
    ...             })
    ...         self.form = form
    ...     
    ...     def next(self, request):
    ...         url = 'http://example.com'
    ...         if self.ajax_request:
    ...             # return as list
    ...             return [AjaxAction(url, 'content', 'inner', '#content')]
    ...         # return anything else to be rendered
    ...         return '<div>foo</div>'

    >>> layer.login('max')
    >>> request = layer.new_request()
    >>> request.params['action.otherform.save'] = '1'
    >>> render_tile(model, request, 'otherform')
    '<div>foo</div>'

    >>> request.params['ajax'] = '1'
    >>> render_tile(model, request, 'otherform')
    u''

    >>> request.environ['cone.app.continuation']
    [<cone.app.browser.ajax.AjaxAction object at ...>]

Logout authenticated::

    >>> layer.logout()

from cone.app import testing
from cone.app.browser.ajax import AjaxAction
from cone.app.browser.form import Form
from cone.app.browser.form import ProtectedAttributesForm
from cone.app.browser.form import YAMLForm
from cone.app.browser.form import FormTarget
from cone.app.browser.form import AddFormTarget
from cone.app.browser.form import EditFormTarget
from cone.app.browser.form import YAMLAddFormTarget
from cone.app.browser.form import YAMLEditFormTarget
from cone.app.model import BaseNode
from cone.tile import render_tile
from cone.tile import tile
from cone.tile.tests import TileTestCase
from plumber import plumbing
from pyramid.security import ACLAllowed
from pyramid.security import ACLDenied
from webob.exc import HTTPFound
from yafowil.base import factory


class TestBrowserForm(TileTestCase):
    layer = testing.security

    def test_FormTarget(self):
        @plumbing(FormTarget)
        class TestForm(object):
            pass

        form = TestForm()
        self.assertEqual(form.action_resource, u'')

    def test_AddFormTarget(self):
        parent = BaseNode(name='parent')
        model = parent['model'] = BaseNode()

        @plumbing(AddFormTarget)
        class TestAddForm(object):
            action_resource = 'add'

            def __init__(self, model, request):
                self.model = model
                self.request = request

        form = TestAddForm(model, self.layer.new_request())
        self.assertEqual(form.form_action, u'http://example.com/parent/add')

    def test_EditFormTarget(self):
        model = BaseNode(name='model')

        @plumbing(EditFormTarget)
        class TestEditForm(object):
            action_resource = 'edit'

            def __init__(self, model, request):
                self.model = model
                self.request = request

        form = TestEditForm(model, self.layer.new_request())
        self.assertEqual(form.form_action, u'http://example.com/model/edit')

    def test_YAMLAddFormTarget(self):
        parent = BaseNode(name='parent')
        model = parent['model'] = BaseNode()

        @plumbing(YAMLAddFormTarget)
        class TestYAMLAddForm(object):
            action_resource = 'add'

            def __init__(self, model, request):
                self.model = model
                self.request = request

        widget = object()
        data = object()
        form = TestYAMLAddForm(model, self.layer.new_request())
        self.assertEqual(
            form.form_action(widget, data),
            u'http://example.com/parent/add'
        )

    def test_YAMLEditFormTarget(self):
        model = BaseNode(name='model')

        @plumbing(YAMLEditFormTarget)
        class TestYAMLEditForm(object):
            action_resource = 'edit'

            def __init__(self, model, request):
                self.model = model
                self.request = request

        widget = object()
        data = object()
        form = TestYAMLEditForm(model, self.layer.new_request())
        self.assertEqual(
            form.form_action(widget, data),
            u'http://example.com/model/edit'
        )

    def test_Form(self):
        formtile = Form(None, None, 'plainform')
        with self.assertRaises(NotImplementedError) as arc:
            formtile.prepare()
        self.assertEqual(
            str(arc.exception),
            '``prepare`` function must be provided by deriving object.'
        )

        subscriptions = []

        with self.layer.hook_tile_reg():
            @tile(name='subscriptionform')
            class SubscriptionForm(Form):
                ajax = False
                show = False
                # test flags
                next_as_redirect = True
                continuation_as_list = False

                def prepare(self):
                    form = factory(
                        u'form',
                        name='subscriptionform',
                        props={
                            'action': self.nodeurl,
                            'class': 'foo',
                            'class_add': 'bar'
                        })
                    form['email'] = factory(
                        'field:label:error:text',
                        props={
                            'required': 'No email given',
                            'label': 'E-Mail',
                        })
                    form['subscribe'] = factory(
                        'submit',
                        props={
                            'action': 'subscribe',
                            'expression': True,
                            'handler': self.subscribe,
                            'next': self.next,
                            'label': 'Subscribe',
                        })
                    self.form = form

                def subscribe(self, widget, data):
                    # Do subscription here
                    subscriptions.append('subscribe on "%s"' % self.model.name)

                def next(self, request):
                    url = 'http://example.com'
                    if self.ajax_request:
                        # return as single value, gets list on request.environ
                        cont = AjaxAction(url, 'content', 'inner', '#content')
                        if self.continuation_as_list:
                            return [cont]
                        else:
                            return cont
                    if self.next_as_redirect:
                        return HTTPFound(url)
                    # return anything else to be rendered
                    return '<div>success!</div>'

        model = BaseNode()
        model.__name__ = 'dummymodel'
        request = self.layer.new_request()

        # Render form. ``form.show`` returns false, render empty string
        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'subscriptionform')
            self.assertEqual(rendered, u'')

        # Set show to True
        SubscriptionForm.show = True
        # Render form. no action is triggered and no input is given
        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'subscriptionform')

        expected = 'class="bar foo"'
        self.assertTrue(rendered.find(expected) != -1)

        expected = 'action="http://example.com/dummymodel"'
        self.assertTrue(rendered.find(expected) != -1)

        expected = 'id="form-subscriptionform"'
        self.assertTrue(rendered.find(expected) != -1)

        expected = 'name="subscriptionform.email"'
        self.assertTrue(rendered.find(expected) != -1)

        expected = 'name="action.subscriptionform.subscribe"'
        self.assertTrue(rendered.find(expected) != -1)

        # Trigger subscribe action and set empty email value. Results in a form
        # with error message since email is required
        request = self.layer.new_request()
        request.params['action.subscriptionform.subscribe'] = '1'
        request.params['subscriptionform.email'] = ''

        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'subscriptionform')

        expected = 'No email given'
        self.assertTrue(rendered.find(expected) != -1)

        # Trigger subscribe action and set valid email value. Now the action
        # handler and next handler are triggered
        request = self.layer.new_request()
        request.params['action.subscriptionform.subscribe'] = '1'
        request.params['subscriptionform.email'] = 'john.doe@example.com'

        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'subscriptionform')

        self.assertEqual(rendered, '')
        self.assertEqual(subscriptions, ['subscribe on "dummymodel"'])
        subscriptions = []

        # The form was rendered as non ajax form, so we expect an HTTPFound
        # instance on request
        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))

        # Even if we commit as ajax form, it is treaten as normal form since
        # ajax flag is set to False (defaults to True)
        request = self.layer.new_request()
        request.params['ajax'] = '1'
        request.params['action.subscriptionform.subscribe'] = '1'
        request.params['subscriptionform.email'] = 'john.doe@example.com'
        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'subscriptionform')

        self.assertEqual(rendered, '')
        self.assertEqual(subscriptions, ['subscribe on "dummymodel"'])
        subscriptions = []

        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))

        # We can return markup insted of HTTPFound if we want to render inplace
        # instead of redirection
        SubscriptionForm.next_as_redirect = False

        request = self.layer.new_request()
        request.params['action.subscriptionform.subscribe'] = '1'
        request.params['subscriptionform.email'] = 'john.doe@example.com'
        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'subscriptionform')

        self.assertEqual(rendered, '<div>success!</div>')
        self.assertEqual(subscriptions, ['subscribe on "dummymodel"'])
        subscriptions = []

        self.assertFalse('redirect' in request.environ)

        SubscriptionForm.next_as_redirect = True

        # Try with ajax True.
        SubscriptionForm.ajax = True

        request = self.layer.new_request()
        request.params['ajax'] = '1'
        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'subscriptionform')

        expected = 'class="ajax bar foo"'
        self.assertTrue(rendered.find(expected) != -1)

        # If submitted without ajax flag on request, still get HTTPFound
        request = self.layer.new_request()
        request.params['action.subscriptionform.subscribe'] = '1'
        request.params['subscriptionform.email'] = 'john.doe@example.com'
        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'subscriptionform')

        self.assertEqual(rendered, '')
        self.assertEqual(subscriptions, ['subscribe on "dummymodel"'])
        subscriptions = []

        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))

        # Submit with ajax flag
        request = self.layer.new_request()
        request.params['ajax'] = '1'
        request.params['action.subscriptionform.subscribe'] = '1'
        request.params['subscriptionform.email'] = 'john.doe@example.com'
        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'subscriptionform')

        self.assertEqual(rendered, '')
        self.assertEqual(subscriptions, ['subscribe on "dummymodel"'])
        subscriptions = []

        self.assertTrue(isinstance(
            request.environ['cone.app.continuation'][0],
            AjaxAction
        ))

        # Ajax continuation may be returned as list
        SubscriptionForm.continuation_as_list = True

        request = self.layer.new_request()
        request.params['ajax'] = '1'
        request.params['action.subscriptionform.subscribe'] = '1'
        request.params['subscriptionform.email'] = 'john.doe@example.com'
        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'subscriptionform')

        self.assertEqual(rendered, '')
        self.assertEqual(subscriptions, ['subscribe on "dummymodel"'])
        subscriptions = []

        self.assertTrue(isinstance(
            request.environ['cone.app.continuation'][0],
            AjaxAction
        ))

    def test_YAMLForm(self):
        with self.layer.hook_tile_reg():
            @tile(name='yamlsubscriptionform')
            @plumbing(YAMLForm)
            class YAMLSubscriptionForm(Form):
                action_resource = 'yamlsubscriptionform'
                form_template = 'cone.app.testing:dummy_form.yaml'

        model = BaseNode()
        model.__name__ = 'dummymodel'
        request = self.layer.new_request()

        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'yamlsubscriptionform')

        expected = (
            'action="http://example.com/dummymodel/yamlsubscriptionform"'
        )
        self.assertTrue(rendered.find(expected) > -1)

        # Instead of ``form_template`` attribute, ``form_template_path`` can be
        # used for backward compatibility
        with self.layer.hook_tile_reg():
            @tile(name='yamlsubscriptionform2')
            class YAMLSubscriptionForm2(YAMLSubscriptionForm):
                action_resource = 'yamlsubscriptionform2'
                form_template = None
                form_template_path = 'cone.app.testing:dummy_form.yaml'

        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'yamlsubscriptionform2')

        expected = (
            'action="http://example.com/dummymodel/yamlsubscriptionform2"'
        )
        self.assertTrue(rendered.find(expected) > -1)

        # form flavor add renders form action URL on parent
        root = BaseNode(name='root')
        model = root['child'] = BaseNode()

        YAMLSubscriptionForm.form_flavor = 'add'
        with self.layer.authenticated('max'):
            rendered = render_tile(model, request, 'yamlsubscriptionform')
        expected = (
            'action="http://example.com/root/yamlsubscriptionform"'
        )
        self.assertTrue(rendered.find(expected) > -1)

    def test_ProtectedAttributesForm(self):
        # ProtectedAttributesForm plumbing behavior
        with self.layer.hook_tile_reg():
            @tile(name='protectedattributesform')
            @plumbing(ProtectedAttributesForm)
            class MyProtectedAttributesForm(Form):
                attribute_permissions = {
                    'protectedfield': ('manage', 'edit')
                }

                def prepare(self):
                    form = factory(
                        u'form',
                        name='protectedattributesform',
                        props={
                            'action': self.nodeurl,
                        })
                    form['protectedfield'] = factory(
                        u'field:label:text',
                        value=u'Protectedfield',
                        mode=self.mode_for('protectedfield')
                    )
                    self.form = form

        model = BaseNode()
        model.__name__ = 'dummymodel'
        request = self.layer.new_request()

        with self.layer.authenticated('viewer'):
            rule = request.has_permission('edit', model)
            self.assertTrue(isinstance(rule, ACLDenied))
            rendered = render_tile(model, request, 'protectedattributesform')

        self.checkOutput("""
        <form
        action="http://example.com/dummymodel"
        class="ajax"
        enctype="multipart/form-data"
        id="form-protectedattributesform"
        method="post"
        novalidate="novalidate"></form>
        """, rendered)

        with self.layer.authenticated('editor'):
            rule = request.has_permission('edit', model)
            self.assertTrue(isinstance(rule, ACLAllowed))
            rendered = render_tile(model, request, 'protectedattributesform')

        self.checkOutput("""
        <form ...<div class="form-control disabled text-muted display-form-control"
        id="display-protectedattributesform-protectedfield">Protectedfield</div></div></form>
        """, rendered)

        with self.layer.authenticated('manager'):
            rule = request.has_permission('manage', model)
            self.assertTrue(isinstance(rule, ACLAllowed))
            rendered = render_tile(model, request, 'protectedattributesform')

        self.checkOutput("""
        <form ...<input class="form-control"
        id="input-protectedattributesform-protectedfield"
        name="protectedattributesform.protectedfield"
        type="text" value="Protectedfield" /></div></form>
        """, rendered)

        # Test default attribute permissions
        MyProtectedAttributesForm.attribute_permissions = dict()
        self.assertEqual(
            MyProtectedAttributesForm.attribute_default_permissions,
            ('edit', 'view')
        )

        with self.layer.authenticated('viewer'):
            rule = request.has_permission('view', model)
            self.assertTrue(isinstance(rule, ACLAllowed))
            rendered = render_tile(model, request, 'protectedattributesform')

        self.checkOutput("""
        <form ...<div class="form-control disabled text-muted display-form-control"
        id="display-protectedattributesform-protectedfield">Protectedfield</div></div></form>
        """, rendered)

        with self.layer.authenticated('editor'):
            rule = request.has_permission('edit', model)
            self.assertTrue(isinstance(rule, ACLAllowed))
            rendered = render_tile(model, request, 'protectedattributesform')

        self.checkOutput("""
        <form ...<input class="form-control"
        id="input-protectedattributesform-protectedfield"
        name="protectedattributesform.protectedfield"
        type="text" value="Protectedfield" /></div></form>
        """, rendered)

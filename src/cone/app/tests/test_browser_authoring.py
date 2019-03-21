from cone.app import testing
from cone.app.browser.ajax import AjaxEvent
from cone.app.browser.ajax import AjaxMessage
from cone.app.browser.ajax import AjaxPath
from cone.app.browser.authoring import _FormRenderingTile
from cone.app.browser.authoring import add
from cone.app.browser.authoring import CameFromNext
from cone.app.browser.authoring import ContentAddForm
from cone.app.browser.authoring import ContentEditForm
from cone.app.browser.authoring import edit
from cone.app.browser.authoring import FormHeading
from cone.app.browser.authoring import is_ajax
from cone.app.browser.authoring import render_form
from cone.app.browser.form import Form
from cone.app.model import AdapterNode
from cone.app.model import BaseNode
from cone.app.model import get_node_info
from cone.app.model import NodeInfo
from cone.app.model import register_node_info
from cone.tile import render_tile
from cone.tile import tile
from cone.tile.tests import TileTestCase
from plumber import plumbing
from webob.exc import HTTPFound
from yafowil.base import factory
from zope.interface import implementer
from zope.interface import Interface
import urllib2


class TestBrowserAuthoring(TileTestCase):
    layer = testing.security

    def test_is_ajax(self):
        # Helper for detecting ajax forms
        request = self.layer.new_request()
        self.assertFalse(is_ajax(request))

        request.params['ajax'] = '1'
        self.assertTrue(is_ajax(request))

    def test_render_form(self):
        # Form rendering helper
        with self.layer.hook_tile_reg():
            @tile(name='someform', permission='login')
            class SomeForm(Form):
                def prepare(self):
                    self.form = form = factory('form', name='someform')
                    form['somefield'] = factory(
                        'text',
                        props={
                            'label': 'Field'
                        })

        # Regular page view, render 'someform' tile as content area in main
        # template
        model = BaseNode()
        request = self.layer.new_request()
        res = render_form(model, request, 'someform')

        self.assertTrue(res.body.find('<!DOCTYPE html>') > -1)
        self.assertTrue(res.body.find('<form class="ajax"') > -1)
        self.assertTrue(res.body.find('id="form-someform"') > -1)

        # Ajax flag set, form has been submitted to hidden iframe. Form gets
        # rendered to dedicated container and hooked up to parent frame in
        # browser via some JS
        request.params['ajax'] = '1'
        res = render_form(model, request, 'someform')

        self.assertTrue(res.body.find('<div id="ajaxform">') > -1)
        self.assertTrue(res.body.find('parent.bdajax.render_ajax_form') > -1)

        # Form rendering tile. Has been introduced to handle node information
        # in add forms and is used in overlay and edit forms as mixin as well.
        # Simply renders another tile as form on ``render``.
        # XXX: Feels superfluous. Should be refactored and removed somwhen
        with self.layer.hook_tile_reg():
            @tile(name='someformrenderingtile', permission='login')
            class SomeFormTileRenderingTile(_FormRenderingTile):
                form_tile_name = 'someform'

        request = self.layer.new_request()
        self.checkOutput("""
        <form class="ajax" ... id="form-someform" ...</form>
        """, render_tile(model, request, 'someformrenderingtile'))

    def test_CameFromNext(self):
        # Plumbing behavior to hook up redirection after successful form
        # processing
        with self.layer.hook_tile_reg():
            @tile(name='camefromnextform')
            @plumbing(CameFromNext)
            class CameFromNextForm(Form):
                def prepare(self):
                    form = factory(
                        u'form',
                        name='camefromnextform',
                        props={'action': self.nodeurl})
                    form['next'] = factory(
                        'submit',
                        props={
                            'action': 'next',
                            'expression': True,
                            'next': self.next,
                            'label': 'Next',
                        })
                    self.form = form

        # Check behavior config defaults
        self.assertTrue(CameFromNextForm.default_came_from is None)
        self.assertTrue(CameFromNextForm.write_history_on_next is False)

        # Create a test model and login
        root = BaseNode()
        model = root['child'] = BaseNode()

        # Check whether ``came_from`` is rendered on form as proxy field
        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            came_from = urllib2.quote('http://example.com/some/path?foo=bar')
            request.params['came_from'] = came_from
            res = render_tile(model, request, 'camefromnextform')

        self.checkOutput("""
        ...<input id="input-camefromnextform-came_from"
        name="came_from" type="hidden"
        value="http%3A//example.com/some/path%3Ffoo%3Dbar" />...
        """, res)

        # No ``came_from`` on request, no ``default_came_from``, no ajax request
        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            request.params['action.camefromnextform.next'] = '1'
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))
        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/child'
        )

        # No ``came_from`` on request, ``default_came_from`` set to ``parent``,
        # no ajax request
        with self.layer.authenticated('manager'):
            CameFromNextForm.default_came_from = 'parent'
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))
        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/'
        )

        # No ``came_from`` on request, ``default_came_from`` set to URL, no
        # ajax request
        with self.layer.authenticated('manager'):
            came_from = urllib2.quote('http://example.com/foo/bar?baz=1')
            CameFromNextForm.default_came_from = came_from
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))
        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/foo/bar?baz=1'
        )

        # No ``came_from`` on request, ``default_came_from`` set to wrong
        # domain, no ajax request
        with self.layer.authenticated('manager'):
            CameFromNextForm.default_came_from = 'http://other.com'
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))
        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/child'
        )

        # ``came_from`` set to empty value on request, overrules
        # ``default_came_from``, no ajax request
        with self.layer.authenticated('manager'):
            CameFromNextForm.default_came_from = 'parent'
            request.params['came_from'] = ''
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))
        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/child'
        )

        # ``came_from`` set to ``parent`` on request, overrules
        # ``default_came_from``, no ajax request
        with self.layer.authenticated('manager'):
            CameFromNextForm.default_came_from = None
            request.params['came_from'] = 'parent'
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))
        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/'
        )

        # ``came_from`` set to URL on request, overrules ``default_came_from``,
        # no ajax request
        with self.layer.authenticated('manager'):
            came_from = urllib2.quote('http://example.com/default')
            CameFromNextForm.default_came_from = came_from

            came_from = urllib2.quote('http://example.com/other')
            request.params['came_from'] = came_from
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))
        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/other'
        )

        # Reset ``default_came_from``
        CameFromNextForm.default_came_from = None

        # ``came_from`` set to empty value on request, ajax request, no ajax
        # path continuation
        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            request.params['ajax'] = '1'
            request.params['action.camefromnextform.next'] = '1'
            request.params['came_from'] = ''
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(len(request.environ['cone.app.continuation']) == 1)
        continuation = request.environ['cone.app.continuation'][0]
        self.assertTrue(isinstance(continuation, AjaxEvent))
        self.assertEqual(
            (continuation.target, continuation.name, continuation.selector),
            ('http://example.com/child', 'contextchanged', '#layout')
        )

        # ``came_from`` set to ``parent`` on request, ajax request, no ajax
        # path continuation
        with self.layer.authenticated('manager'):
            request.params['came_from'] = 'parent'
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(len(request.environ['cone.app.continuation']) == 1)
        continuation = request.environ['cone.app.continuation'][0]
        self.assertTrue(isinstance(continuation, AjaxEvent))
        self.assertEqual(
            (continuation.target, continuation.name, continuation.selector),
            ('http://example.com/', 'contextchanged', '#layout')
        )

        # ``came_from`` set to URL on request, ajax request, no ajax path
        # continuation
        with self.layer.authenticated('manager'):
            came_from = urllib2.quote('http://example.com/some/path?foo=bar')
            request.params['came_from'] = came_from
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(len(request.environ['cone.app.continuation']) == 1)
        continuation = request.environ['cone.app.continuation'][0]
        self.assertTrue(isinstance(continuation, AjaxEvent))
        self.assertEqual(
            (continuation.target, continuation.name, continuation.selector),
            ('http://example.com/some/path?foo=bar', 'contextchanged', '#layout')
        )

        # ``came_from`` set to wrong domain on request, ajax request, no ajax
        # path continuation
        with self.layer.authenticated('manager'):
            came_from = urllib2.quote('http://other.com')
            request.params['came_from'] = came_from
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(len(request.environ['cone.app.continuation']) == 1)
        continuation = request.environ['cone.app.continuation'][0]
        self.assertTrue(isinstance(continuation, AjaxEvent))
        self.assertEqual(
            (continuation.target, continuation.name, continuation.selector),
            ('http://example.com/child', 'contextchanged', '#layout')
        )

        # ``came_from`` set to empty value on request, ajax request, setting
        # browser history configured
        with self.layer.authenticated('manager'):
            CameFromNextForm.write_history_on_next = True
            request = self.layer.new_request()
            request.params['ajax'] = '1'
            request.params['action.camefromnextform.next'] = '1'
            request.params['came_from'] = ''
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(len(request.environ['cone.app.continuation']) == 2)

        path = request.environ['cone.app.continuation'][0]
        self.assertTrue(isinstance(path, AjaxPath))
        self.assertEqual(
            (path.path, path.target, path.event),
            (u'child', 'http://example.com/child', 'contextchanged:#layout')
        )

        event = request.environ['cone.app.continuation'][1]
        self.assertTrue(isinstance(event, AjaxEvent))
        self.assertEqual(
            (event.target, continuation.name, continuation.selector),
            ('http://example.com/child', 'contextchanged', '#layout')
        )

        # ``came_from`` set to ``parent`` on request, ajax request, setting
        # browser history configured
        with self.layer.authenticated('manager'):
            request.params['came_from'] = 'parent'
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(len(request.environ['cone.app.continuation']) == 2)

        path = request.environ['cone.app.continuation'][0]
        self.assertTrue(isinstance(path, AjaxPath))
        self.assertEqual(
            (path.path, path.target, path.event),
            ('', 'http://example.com/', 'contextchanged:#layout')
        )

        event = request.environ['cone.app.continuation'][1]
        self.assertTrue(isinstance(event, AjaxEvent))
        self.assertEqual(
            (event.target, continuation.name, continuation.selector),
            ('http://example.com/', 'contextchanged', '#layout')
        )

        # ``came_from`` set to URL on request, ajax request, setting browser
        # history configured
        with self.layer.authenticated('manager'):
            came_from = urllib2.quote('http://example.com/some/path')
            request.params['came_from'] = came_from
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(len(request.environ['cone.app.continuation']) == 2)

        path = request.environ['cone.app.continuation'][0]
        self.assertTrue(isinstance(path, AjaxPath))
        self.assertEqual(
            (path.path, path.target, path.event),
            ('/some/path', 'http://example.com/some/path', 'contextchanged:#layout')
        )

        event = request.environ['cone.app.continuation'][1]
        self.assertTrue(isinstance(event, AjaxEvent))
        self.assertEqual(
            (event.target, continuation.name, continuation.selector),
            ('http://example.com/some/path', 'contextchanged', '#layout')
        )

        # ``came_from`` set to to wrong on request, ajax request, setting
        # browser history configured
        with self.layer.authenticated('manager'):
            came_from = urllib2.quote('http://other.com')
            request.params['came_from'] = came_from
            res = render_tile(model, request, 'camefromnextform')

        self.assertTrue(len(request.environ['cone.app.continuation']) == 2)

        path = request.environ['cone.app.continuation'][0]
        self.assertTrue(isinstance(path, AjaxPath))
        self.assertEqual(
            (path.path, path.target, path.event),
            (u'child', 'http://example.com/child', 'contextchanged:#layout')
        )

        event = request.environ['cone.app.continuation'][1]
        self.assertTrue(isinstance(event, AjaxEvent))
        self.assertEqual(
            (event.target, continuation.name, continuation.selector),
            ('http://example.com/child', 'contextchanged', '#layout')
        )

        # Reset ``write_history_on_next``
        CameFromNextForm.write_history_on_next = False

    def test_FormHeading(self):
        # Abstract form heading
        @plumbing(FormHeading)
        class FormWithHeading(object):
            pass

        form_with_heading = FormWithHeading()
        err = self.expectError(
            NotImplementedError,
            lambda: form_with_heading.form_heading
        )
        expected = 'Abstract ``FormHeading`` does not implement ``form_heading``'
        self.assertEqual(str(err), expected)

    def test_adding(self):
        # Provide a node interface needed for different node style binding to
        # test form
        class ITestAddingNode(Interface):
            pass

        # Create dummy node
        @implementer(ITestAddingNode)
        class MyNode(BaseNode):
            node_info_name = 'mynode'

        # Provide NodeInfo for our Application node
        mynodeinfo = NodeInfo()
        mynodeinfo.title = 'My Node'
        mynodeinfo.description = 'This is My node.'
        mynodeinfo.node = MyNode
        mynodeinfo.addables = ['mynode']  # self containment
        register_node_info('mynode', mynodeinfo)

        # Create another dummy node inheriting from AdapterNode
        @implementer(ITestAddingNode)
        class MyAdapterNode(AdapterNode):
            node_info_name = 'myadapternode'

        myadapternodeinfo = NodeInfo()
        myadapternodeinfo.title = 'My Adapter Node'
        myadapternodeinfo.description = 'This is My adapter node.'
        myadapternodeinfo.node = MyAdapterNode
        myadapternodeinfo.addables = ['myadapternode']  # self containment
        register_node_info('myadapternode', myadapternodeinfo)

        # Create and register an ``addform`` named form tile
        with self.layer.hook_tile_reg():
            @tile(name='addform', interface=ITestAddingNode)
            @plumbing(ContentAddForm)
            class MyAddForm(Form):
                def prepare(self):
                    form = factory(u'form',
                                   name='addform',
                                   props={'action': self.nodeurl})
                    form['id'] = factory(
                        'field:label:text',
                        props={
                            'label': 'Id',
                        })
                    form['title'] = factory(
                        'field:label:text',
                        props={
                            'label': 'Title',
                        })
                    form['add'] = factory(
                        'submit',
                        props={
                            'action': 'add',
                            'expression': True,
                            'handler': self.add,
                            'next': self.next,
                            'label': 'Add',
                        })
                    self.form = form

                def add(self, widget, data):
                    fetch = self.request.params.get
                    child = MyNode()
                    child.attrs.title = fetch('addform.title')
                    self.model.__parent__[fetch('addform.id')] = child
                    self.model = child

        # Create dummy container
        root = MyNode()

        # Render without factory
        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            self.assertEqual(
                render_tile(root, request, 'add'),
                u'unknown_factory'
            )

        # Render with valid factory
        with self.layer.authenticated('manager'):
            request.params['factory'] = 'mynode'
            result = render_tile(root, request, 'add')

        self.assertTrue(result.find(u'<form action="http://example.com"') != -1)

        # Render with valid factory on adapter node
        with self.layer.authenticated('manager'):
            adapterroot = MyAdapterNode(None, None, None)
            request.params['factory'] = 'myadapternode'
            result = render_tile(adapterroot, request, 'add')

        self.assertTrue(result.find(u'<form action="http://example.com"') != -1)

        # Render with submitted data
        with self.layer.authenticated('manager'):
            request = self.layer.current_request
            request.params['factory'] = 'mynode'
            request.params['action.addform.add'] = '1'
            request.params['addform.id'] = 'somechild'
            request.params['addform.title'] = 'Some Child'
            render_tile(root, request, 'add')

        self.assertTrue(isinstance(request.environ['redirect'], HTTPFound))
        self.checkOutput("""
        <class '...MyNode'>: None
          <class '...MyNode'>: somechild
        """, root.treerepr())

        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/somechild'
        )
        del request.environ['redirect']

        # Render with 'came_from' set
        with self.layer.authenticated('manager'):
            request.params['came_from'] = 'parent'
            render_tile(root, request, 'add')

        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/'
        )
        del request.environ['redirect']

        with self.layer.authenticated('manager'):
            came_from = urllib2.quote('http://example.com/foo/bar?baz=1')
            request.params['came_from'] = came_from
            render_tile(root, request, 'add')

        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/foo/bar?baz=1'
        )

        # Render with ajax flag
        with self.layer.authenticated('manager'):
            request.params['ajax'] = '1'
            render_tile(root, request, 'add')

        self.assertTrue(isinstance(
            request.environ['cone.app.continuation'][0],
            AjaxEvent
        ))

        # Check the modified model
        self.assertEqual(root.keys(), ['somechild'])
        self.assertEqual(root['somechild'].attrs.title, 'Some Child')

        # Add view
        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            request.params['factory'] = 'mynode'
            request.params['action.addform.add'] = '1'
            request.params['addform.id'] = 'somechild'
            request.params['addform.title'] = 'Some Child'
            res = add(root, request)

        self.assertTrue(isinstance(res, HTTPFound))

        with self.layer.authenticated('manager'):
            request.params['ajax'] = '1'
            res = str(add(root, request))

        self.assertTrue(res.find('parent.bdajax.render_ajax_form') != -1)

    def test_editing(self):
        class MyNode(BaseNode):
            node_info_name = 'mynode'

        # Create and register an ``editform`` named form tile
        with self.layer.hook_tile_reg():
            @tile(name='editform', interface=MyNode)
            @plumbing(ContentEditForm)
            class MyEditForm(Form):
                def prepare(self):
                    form = factory(u'form',
                                   name='editform',
                                   props={'action': self.nodeurl})
                    form['title'] = factory(
                        'field:label:text',
                        value=self.model.attrs.title,
                        props={
                            'label': 'Title',
                        })
                    form['update'] = factory(
                        'submit',
                        props={
                            'action': 'update',
                            'expression': True,
                            'handler': self.update,
                            'next': self.next,
                            'label': 'Update',
                        })
                    self.form = form

                def update(self, widget, data):
                    fetch = self.request.params.get
                    self.model.attrs.title = fetch('editform.title')

        # Dummy model
        root = MyNode()
        child = root['somechild'] = MyNode()
        child.attrs.title = 'My Node'

        # Render form with value from model
        with self.layer.authenticated('editor'):
            request = self.layer.new_request()
            res = render_tile(root['somechild'], request, 'edit')

        self.checkOutput("""
        ...<span class="label label-primary">Edit: My Node</span>...
        <form action="http://example.com/somechild"...
        """, res)

        # Render with submitted data. Default next URL of EditForm is the
        # edited node
        with self.layer.authenticated('editor'):
            request = self.layer.new_request()
            request.params['action.editform.update'] = '1'
            request.params['editform.title'] = 'Changed title'
            res = render_tile(root['somechild'], request, 'edit')

        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/somechild'
        )

        # Check next URL with ``parent`` as ``came_from`` value
        with self.layer.authenticated('editor'):
            request = self.layer.new_request()
            request.params['action.editform.update'] = '1'
            request.params['editform.title'] = 'Changed title'
            request.params['came_from'] = 'parent'
            res = render_tile(root['somechild'], request, 'edit')

        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/'
        )

        # Check next URL with URL as ``came_from`` value
        with self.layer.authenticated('editor'):
            request = self.layer.new_request()
            request.params['action.editform.update'] = '1'
            request.params['editform.title'] = 'Changed title'
            came_from = urllib2.quote('http://example.com/other/node/in/tree')
            request.params['came_from'] = came_from
            res = render_tile(root['somechild'], request, 'edit')

        self.assertEqual(
            request.environ['redirect'].location,
            'http://example.com/other/node/in/tree'
        )

        # Render with ajax flag
        with self.layer.authenticated('editor'):
            request = self.layer.new_request()
            request.params['action.editform.update'] = '1'
            request.params['editform.title'] = 'Changed title'
            request.params['ajax'] = '1'
            res = render_tile(root['somechild'], request, 'edit')

        self.assertTrue(isinstance(
            request.environ['cone.app.continuation'][0],
            AjaxEvent
        ))

        # URL computing is the same as if ``HTTPFound`` instance is returned.
        # In Ajax case, the URL is used as ajax target
        self.assertEqual(
            request.environ['cone.app.continuation'][0].target,
            'http://example.com/somechild'
        )

        with self.layer.authenticated('editor'):
            request = self.layer.new_request()
            request.params['action.editform.update'] = '1'
            request.params['editform.title'] = 'Changed title'
            came_from = urllib2.quote('http://example.com/other/node/in/tree')
            request.params['came_from'] = came_from
            request.params['ajax'] = '1'
            res = render_tile(root['somechild'], request, 'edit')

        self.assertEqual(
            request.environ['cone.app.continuation'][0].target,
            'http://example.com/other/node/in/tree'
        )
        # Check the updated node
        self.assertEqual(root['somechild'].attrs.title, 'Changed title')

        # Edit view
        with self.layer.authenticated('editor'):
            request = self.layer.new_request()
            request.params['action.editform.update'] = '1'
            request.params['editform.title'] = 'Changed title'
            root.attrs.title = 'Foo'
            res = edit(root, request)

        self.assertTrue(isinstance(res, HTTPFound))

        with self.layer.authenticated('editor'):
            request = self.layer.new_request()
            request.params['action.editform.update'] = '1'
            request.params['editform.title'] = 'Changed title'
            request.params['ajax'] = '1'
            res = str(edit(root, request))

        self.assertTrue(res.find('parent.bdajax.render_ajax_form') != -1)

    def test_deleting(self):
        class CallableNode(BaseNode):
            def __call__(self):
                pass

        node = CallableNode()
        node['child'] = CallableNode()
        self.checkOutput("""
        <class '...CallableNode'>: None
          <class '...CallableNode'>: child
        """, node.treerepr())

        del node['child']
        self.checkOutput("""
        <class '...CallableNode'>: None
        """, node.treerepr())

        node['child'] = CallableNode()

        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            self.assertEqual(render_tile(node['child'], request, 'delete'), u'')

        self.assertEqual(
            request.environ['cone.app.continuation'][0].payload,
            u'Object "child" not deletable'
        )

        node['child'].properties.action_delete = True

        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            self.assertEqual(render_tile(node['child'], request, 'delete'), u'')

        self.assertTrue(isinstance(
            request.environ['cone.app.continuation'][0],
            AjaxEvent
        ))
        self.assertTrue(isinstance(
            request.environ['cone.app.continuation'][1],
            AjaxMessage
        ))
        self.checkOutput("""
        <class '...CallableNode'>: None
        """, node.treerepr())

    def test_add_items_dropdown(self):
        class MyNode(BaseNode):
            node_info_name = 'mynode'

        # Provide NodeInfo for our Application node
        mynodeinfo = NodeInfo()
        mynodeinfo.title = 'My Node'
        mynodeinfo.description = 'This is My node.'
        mynodeinfo.node = MyNode
        mynodeinfo.addables = ['mynode']  # self containment
        register_node_info('mynode', mynodeinfo)

        # Dummy model
        root = MyNode()
        root['somechild'] = MyNode()
        # child.attrs.title = 'My Node'

        # Dropdown menu containing links to the addforms of allowed child nodes
        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            rendered = render_tile(root['somechild'], request, 'add_dropdown')

        # Non JS link to add form
        expected = 'href="http://example.com/somechild/add?factory=mynode"'
        self.assertTrue(rendered.find(expected) != -1)

        # Ajax target for add form
        expected = 'ajax:target="http://example.com/somechild?factory=mynode"'
        self.assertTrue(rendered.find(expected) != -1)

        # Ajax action rule for add form
        expected = 'ajax:action="add:#content:inner"'
        self.assertTrue(rendered.find(expected) != -1)

        # Allow another node type as child
        nodeinfo = NodeInfo()
        nodeinfo.title = 'Another Node'
        nodeinfo.description = 'This is another node.'
        nodeinfo.node = BaseNode
        nodeinfo.addables = []
        register_node_info('anothernode', nodeinfo)
        get_node_info('mynode').addables = ['mynode', 'anothernode']

        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            rendered = render_tile(root['somechild'], request, 'add_dropdown')

        # Non JS links to add form
        expected = 'href="http://example.com/somechild/add?factory=mynode"'
        self.assertTrue(rendered.find(expected) != -1)

        expected = 'href="http://example.com/somechild/add?factory=anothernode"'
        self.assertTrue(rendered.find(expected) != -1)

        # Ajax targets for add form
        expected = 'ajax:target="http://example.com/somechild?factory=mynode"'
        self.assertTrue(rendered.find(expected) != -1)

        expected = 'ajax:target="http://example.com/somechild?factory=anothernode"'
        self.assertTrue(rendered.find(expected) != -1)

        # Test node without addables, results in empty listing.
        # XXX: discuss whether to hide entire widget if no items
        class NoChildAddingNode(BaseNode):
            node_info_name = 'nochildaddingnode'

        nodeinfo = NodeInfo()
        nodeinfo.title = 'No child adding Node'
        nodeinfo.description = 'This is a no child containing node.'
        nodeinfo.node = NoChildAddingNode
        nodeinfo.addables = []
        register_node_info('nochildaddingnode', nodeinfo)

        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            rendered = render_tile(NoChildAddingNode(), request, 'add_dropdown')

        self.checkOutput("""
        ...<li class="dropdown">
        <a href="#"
        class="dropdown-toggle"
        data-toggle="dropdown">
        <span>Add</span>
        <span class="caret"></span>
        </a>
        <ul class="dropdown-menu" role="addmenu">
        </ul>
        </li>...
        """, rendered)

        # Test node with invalid addable, results in empty listing
        # XXX: discuss whether to hide entire widget if no items::
        class InvalidChildNodeInfoNode(BaseNode):
            node_info_name = 'invalidchildnodeinfo'

        nodeinfo = NodeInfo()
        nodeinfo.title = 'Invalid Child NodeInfo Node'
        nodeinfo.description = 'This is a node with an invalid child node info.'
        nodeinfo.node = InvalidChildNodeInfoNode
        nodeinfo.addables = ['invalid']
        register_node_info('invalidchildnodeinfo', nodeinfo)

        with self.layer.authenticated('manager'):
            request = self.layer.new_request()
            rendered = render_tile(
                InvalidChildNodeInfoNode(),
                request,
                'add_dropdown'
            )
        self.checkOutput("""
        ...<li class="dropdown">
        <a href="#"
        class="dropdown-toggle"
        data-toggle="dropdown">
        <span>Add</span>
        <span class="caret"></span>
        </a>
        <ul class="dropdown-menu" role="addmenu">
        </ul>
        </li>...
        """, rendered)

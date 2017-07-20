Authoring
=========

Provide adding and editing of nodes. 

There are two views registered named ``add`` and ``edit``. These views either
call ``render_main_template`` or ``render_ajax_form`` depending on the
submitted form data (see ajax.txt for more information). As tile name for
stated functions, ``add`` respective ``edit`` are used.

The ``add`` and ``edit`` tiles itself are wrappers for the particular form tile
and are supposed to decorate the form with some information if needed (i.e. a 
title, description, etc).

The default implementations of ``add`` and ``edit`` just proxy the form 
rendering tiles as is, which are expected to be registered as ``addform``
respective ``editform``.


CameFromNext
------------

Imports::

    >>> from cone.tile import tile
    >>> from cone.app.browser.ajax import AjaxEvent
    >>> from cone.app.browser.ajax import AjaxPath
    >>> from cone.app.browser.authoring import CameFromNext
    >>> from cone.app.browser.form import Form
    >>> from cone.app.model import BaseNode
    >>> from plumber import plumbing
    >>> from yafowil import loader
    >>> from yafowil.base import factory
    >>> from cone.tile import render_tile
    >>> from cone.tile import tile
    >>> import urllib2

Create form tile with ``CameFromNext`` behavior::

    >>> @tile('camefromnextform')
    ... @plumbing(CameFromNext)
    ... class CameFromNextForm(Form):
    ... 
    ...     def prepare(self):
    ...         form = factory(u'form',
    ...                        name='camefromnextform',
    ...                        props={'action': self.nodeurl})
    ...         form['next'] = factory(
    ...             'submit',
    ...             props = {
    ...                 'action': 'next',
    ...                 'expression': True,
    ...                 'handler': None,
    ...                 'next': self.next,
    ...                 'label': 'Next',
    ...             })
    ...         self.form = form

Check behavior config defaults::

    >>> assert(CameFromNextForm.default_came_from is None)
    >>> assert(CameFromNextForm.write_history_on_next is False)

Create a test model and login::

    >>> root = BaseNode()
    >>> model = root['child'] = BaseNode()

    >>> layer.login('manager')

Check whether ``came_from`` is rendered on form as proxy field::

    >>> request = layer.new_request()
    >>> came_from = urllib2.quote('http://example.com/some/path?foo=bar')
    >>> request.params['came_from'] = came_from
    >>> render_tile(model, request, 'camefromnextform')
    u'...<input id="input-camefromnextform-came_from" 
    name="came_from" type="hidden" 
    value="http%3A//example.com/some/path%3Ffoo%3Dbar" />...'

No ``came_from`` on request, no ``default_came_from``, no ajax request::

    >>> request = layer.new_request()
    >>> request.params['action.camefromnextform.next'] = '1'
    >>> res = render_tile(model, request, 'camefromnextform')

    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

    >>> request.environ['redirect'].location
    'http://example.com/child'

No ``came_from`` on request, ``default_came_from`` set to ``parent``, no ajax
request::

    >>> CameFromNextForm.default_came_from = 'parent'
    >>> res = render_tile(model, request, 'camefromnextform')

    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

    >>> request.environ['redirect'].location
    'http://example.com/'

No ``came_from`` on request, ``default_came_from`` set to URL, no ajax
request::

    >>> came_from = urllib2.quote('http://example.com/foo/bar?baz=1')
    >>> CameFromNextForm.default_came_from = came_from
    >>> res = render_tile(model, request, 'camefromnextform')

    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

    >>> request.environ['redirect'].location
    'http://example.com/foo/bar?baz=1'

No ``came_from`` on request, ``default_came_from`` set to wrong domain, no
ajax request::

    >>> CameFromNextForm.default_came_from = 'http://other.com'
    >>> res = render_tile(model, request, 'camefromnextform')

    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

    >>> request.environ['redirect'].location
    'http://example.com/child'

``came_from`` set to empty value on request, overrules ``default_came_from``,
no ajax request::

    >>> CameFromNextForm.default_came_from = 'parent'

    >>> request.params['came_from'] = ''
    >>> res = render_tile(model, request, 'camefromnextform')
    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

    >>> request.environ['redirect'].location
    'http://example.com/child'

``came_from`` set to ``parent`` on request, overrules ``default_came_from``,
no ajax request::

    >>> CameFromNextForm.default_came_from = None

    >>> request.params['came_from'] = 'parent'
    >>> res = render_tile(model, request, 'camefromnextform')
    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

    >>> request.environ['redirect'].location
    'http://example.com/'

``came_from`` set to URL on request, overrules ``default_came_from``,
no ajax request::

    >>> came_from = urllib2.quote('http://example.com/default')
    >>> CameFromNextForm.default_came_from = came_from

    >>> came_from = urllib2.quote('http://example.com/other')
    >>> request.params['came_from'] = came_from
    >>> res = render_tile(model, request, 'camefromnextform')
    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

    >>> request.environ['redirect'].location
    'http://example.com/other'

Reset ``default_came_from``::

    >>> CameFromNextForm.default_came_from = None

``came_from`` set to empty value on request, ajax request, no ajax path
continuation::

    >>> request = layer.new_request()
    >>> request.params['ajax'] = '1'
    >>> request.params['action.camefromnextform.next'] = '1'
    >>> request.params['came_from'] = ''

    >>> res = render_tile(model, request, 'camefromnextform')
    >>> assert(len(request.environ['cone.app.continuation']) == 1)
    >>> continuation = request.environ['cone.app.continuation'][0]
    >>> assert(isinstance(continuation, AjaxEvent))
    >>> continuation.target, continuation.name, continuation.selector
    ('http://example.com/child', 'contextchanged', '#layout')

``came_from`` set to ``parent`` on request, ajax request, no ajax path
continuation::

    >>> request.params['came_from'] = 'parent'

    >>> res = render_tile(model, request, 'camefromnextform')
    >>> assert(len(request.environ['cone.app.continuation']) == 1)
    >>> continuation = request.environ['cone.app.continuation'][0]
    >>> assert(isinstance(continuation, AjaxEvent))
    >>> continuation.target, continuation.name, continuation.selector
    ('http://example.com/', 'contextchanged', '#layout')

``came_from`` set to URL on request, ajax request, no ajax path
continuation::

    >>> came_from = urllib2.quote('http://example.com/some/path?foo=bar')
    >>> request.params['came_from'] = came_from

    >>> res = render_tile(model, request, 'camefromnextform')
    >>> assert(len(request.environ['cone.app.continuation']) == 1)
    >>> continuation = request.environ['cone.app.continuation'][0]
    >>> assert(isinstance(continuation, AjaxEvent))
    >>> continuation.target, continuation.name, continuation.selector
    ('http://example.com/some/path?foo=bar', 'contextchanged', '#layout')

``came_from`` set to wrong domain on request, ajax request, no ajax path
continuation::

    >>> came_from = urllib2.quote('http://other.com')
    >>> request.params['came_from'] = came_from

    >>> res = render_tile(model, request, 'camefromnextform')
    >>> assert(len(request.environ['cone.app.continuation']) == 1)
    >>> continuation = request.environ['cone.app.continuation'][0]
    >>> assert(isinstance(continuation, AjaxEvent))
    >>> continuation.target, continuation.name, continuation.selector
    ('http://example.com/child', 'contextchanged', '#layout')

``came_from`` set to empty value on request, ajax request, setting browser
history configured::

    >>> CameFromNextForm.write_history_on_next = True

    >>> request = layer.new_request()
    >>> request.params['ajax'] = '1'
    >>> request.params['action.camefromnextform.next'] = '1'
    >>> request.params['came_from'] = ''

    >>> res = render_tile(model, request, 'camefromnextform')
    >>> assert(len(request.environ['cone.app.continuation']) == 2)

    >>> path = request.environ['cone.app.continuation'][0]
    >>> assert(isinstance(path, AjaxPath))
    >>> path.path, path.target, path.event
    (u'child', 'http://example.com/child', 'contextchanged:#layout')

    >>> event = request.environ['cone.app.continuation'][1]
    >>> assert(isinstance(event, AjaxEvent))
    >>> event.target, continuation.name, continuation.selector
    ('http://example.com/child', 'contextchanged', '#layout')

``came_from`` set to ``parent`` on request, ajax request, setting browser
history configured::

    >>> request.params['came_from'] = 'parent'

    >>> res = render_tile(model, request, 'camefromnextform')
    >>> assert(len(request.environ['cone.app.continuation']) == 2)

    >>> path = request.environ['cone.app.continuation'][0]
    >>> assert(isinstance(path, AjaxPath))
    >>> path.path, path.target, path.event
    ('', 'http://example.com/', 'contextchanged:#layout')

    >>> event = request.environ['cone.app.continuation'][1]
    >>> assert(isinstance(event, AjaxEvent))
    >>> event.target, continuation.name, continuation.selector
    ('http://example.com/', 'contextchanged', '#layout')

``came_from`` set to URL on request, ajax request, setting browser
history configured::

    >>> came_from = urllib2.quote('http://example.com/some/path')
    >>> request.params['came_from'] = came_from

    >>> res = render_tile(model, request, 'camefromnextform')
    >>> assert(len(request.environ['cone.app.continuation']) == 2)

    >>> path = request.environ['cone.app.continuation'][0]
    >>> assert(isinstance(path, AjaxPath))
    >>> path.path, path.target, path.event
    ('/some/path', 
    'http://example.com/some/path', 
    'contextchanged:#layout')

    >>> event = request.environ['cone.app.continuation'][1]
    >>> assert(isinstance(event, AjaxEvent))
    >>> event.target, continuation.name, continuation.selector
    ('http://example.com/some/path', 'contextchanged', '#layout')

``came_from`` set to to wrong on request, ajax request, setting browser
history configured::

    >>> came_from = urllib2.quote('http://other.com')
    >>> request.params['came_from'] = came_from

    >>> res = render_tile(model, request, 'camefromnextform')
    >>> assert(len(request.environ['cone.app.continuation']) == 2)

    >>> path = request.environ['cone.app.continuation'][0]
    >>> assert(isinstance(path, AjaxPath))
    >>> path.path, path.target, path.event
    (u'child', 'http://example.com/child', 'contextchanged:#layout')

    >>> event = request.environ['cone.app.continuation'][1]
    >>> assert(isinstance(event, AjaxEvent))
    >>> event.target, continuation.name, continuation.selector
    ('http://example.com/child', 'contextchanged', '#layout')

Reset ``write_history_on_next``::

    >>> CameFromNextForm.write_history_on_next = False

Logout::

    >>> layer.logout()


Adding
------

Provide a node interface needed for different node style binding to test form::

    >>> from zope.interface import Interface
    >>> from zope.interface import implementer

    >>> class ITestAddingNode(Interface): pass

Create dummy node::

    >>> from cone.app.model import get_node_info

    >>> @implementer(ITestAddingNode)
    ... class MyNode(BaseNode):
    ...     node_info_name = 'mynode'

Provide NodeInfo for our Application node::

    >>> from cone.app.model import NodeInfo
    >>> from cone.app.model import register_node_info

    >>> mynodeinfo = NodeInfo()
    >>> mynodeinfo.title = 'My Node'
    >>> mynodeinfo.description = 'This is My node.'
    >>> mynodeinfo.node = MyNode
    >>> mynodeinfo.addables = ['mynode'] # self containment
    >>> register_node_info('mynode', mynodeinfo)

Create another dummy node inheriting from AdapterNode::

    >>> from cone.app.model import AdapterNode

    >>> @implementer(ITestAddingNode)
    ... class MyAdapterNode(AdapterNode):
    ...     node_info_name = 'myadapternode'

    >>> myadapternodeinfo = NodeInfo()
    >>> myadapternodeinfo.title = 'My Adapter Node'
    >>> myadapternodeinfo.description = 'This is My adapter node.'
    >>> myadapternodeinfo.node = MyAdapterNode
    >>> myadapternodeinfo.addables = ['myadapternode'] # self containment
    >>> register_node_info('myadapternode', myadapternodeinfo)

Create and register an ``addform`` named form tile::

    >>> from cone.app.browser.utils import make_url
    >>> from cone.app.browser.authoring import ContentAddForm
    >>> from cone.app.browser.ajax import AjaxAction
    >>> from cone.app.browser.ajax import AjaxEvent

    >>> @tile('addform', interface=ITestAddingNode)
    ... @plumbing(ContentAddForm)
    ... class MyAddForm(Form):
    ... 
    ...     def prepare(self):
    ...         form = factory(u'form',
    ...                        name='addform',
    ...                        props={'action': self.nodeurl})
    ...         form['id'] = factory(
    ...             'field:label:text',
    ...             props = {
    ...                 'label': 'Id',
    ...             })
    ...         form['title'] = factory(
    ...             'field:label:text',
    ...             props = {
    ...                 'label': 'Title',
    ...             })
    ...         form['add'] = factory(
    ...             'submit',
    ...             props = {
    ...                 'action': 'add',
    ...                 'expression': True,
    ...                 'handler': self.add,
    ...                 'next': self.next,
    ...                 'label': 'Add',
    ...             })
    ...         self.form = form
    ... 
    ...     def add(self, widget, data):
    ...         fetch = self.request.params.get
    ...         child = MyNode()
    ...         child.attrs.title = fetch('addform.title')
    ...         self.model.__parent__[fetch('addform.id')] = child
    ...         self.model = child

Create dummy container::

    >>> root = MyNode()

Authenticate::

    >>> layer.login('manager')

Render without factory::

    >>> request = layer.new_request()
    >>> render_tile(root, request, 'add')
    u'unknown_factory'

Render with valid factory::

    >>> from cone.app.browser.actions import ActionContext

    >>> ac = ActionContext(root, request, 'content')

    >>> request.params['factory'] = 'mynode'
    >>> result = render_tile(root, request, 'add')
    >>> result.find(u'<form action="http://example.com"') != -1
    True

Render with valid factory on adapter node::

    >>> adapterroot = MyAdapterNode(None, None, None)
    >>> request.params['factory'] = 'myadapternode'
    >>> result = render_tile(adapterroot, request, 'add')
    >>> result.find(u'<form action="http://example.com"') != -1
    True

Render with submitted data::

    >>> layer.login('manager')
    >>> request = layer.current_request
    >>> request.params['factory'] = 'mynode'
    >>> request.params['action.addform.add'] = '1'
    >>> request.params['addform.id'] = 'somechild'
    >>> request.params['addform.title'] = 'Some Child'

    >>> res = render_tile(root, request, 'add')
    >>> request.environ['redirect']
    <HTTPFound at ... 302 Found>

    >>> root.printtree()
    <class 'MyNode'>: None
      <class 'MyNode'>: somechild

    >>> request.environ['redirect'].location
    'http://example.com/somechild'

Render with 'came_from' set::

    >>> del request.environ['redirect']
    >>> request.params['came_from'] = 'parent'
    >>> res = render_tile(root, request, 'add')
    >>> request.environ['redirect'].location
    'http://example.com/'

    >>> del request.environ['redirect']
    >>> came_from = urllib2.quote('http://example.com/foo/bar?baz=1')
    >>> request.params['came_from'] = came_from
    >>> res = render_tile(root, request, 'add')
    >>> request.environ['redirect'].location
    'http://example.com/foo/bar?baz=1'

Render with ajax flag::

    >>> layer.login('manager')
    >>> request.params['ajax'] = '1'
    >>> res = render_tile(root, request, 'add')
    >>> request.environ['cone.app.continuation']
    [<cone.app.browser.ajax.AjaxEvent object at ...>]

Check the modified model::

    >>> root.keys()
    ['somechild']

    >>> root['somechild'].attrs.title
    'Some Child'

Add view::

    >>> from cone.app.browser.authoring import add

    >>> layer.login('manager')
    >>> request = layer.new_request()
    >>> request.params['factory'] = 'mynode'
    >>> request.params['action.addform.add'] = '1'
    >>> request.params['addform.id'] = 'somechild'
    >>> request.params['addform.title'] = 'Some Child'
    >>> add(root, request)
    <HTTPFound at ... 302 Found>

    >>> request.params['ajax'] = '1'
    >>> result = str(add(root, request))
    >>> result.find('parent.bdajax.render_ajax_form') != -1
    True


Editing
-------

Create and register an ``editform`` named form tile::

    >>> from cone.app.browser.authoring import ContentEditForm

    >>> @tile('editform', interface=MyNode)
    ... @plumbing(ContentEditForm)
    ... class MyEditForm(Form):
    ... 
    ...     def prepare(self):
    ...         form = factory(u'form',
    ...                        name='editform',
    ...                        props={'action': self.nodeurl})
    ...         form['title'] = factory(
    ...             'field:label:text',
    ...             value = self.model.attrs.title,
    ...             props = {
    ...                 'label': 'Title',
    ...             })
    ...         form['update'] = factory(
    ...             'submit',
    ...             props = {
    ...                 'action': 'update',
    ...                 'expression': True,
    ...                 'handler': self.update,
    ...                 'next': self.next,
    ...                 'label': 'Update',
    ...             })
    ...         self.form = form
    ... 
    ...     def update(self, widget, data):
    ...         fetch = self.request.params.get
    ...         self.model.attrs.title = fetch('editform.title')

Render form with value from model::

    >>> layer.login('editor')
    >>> request = layer.new_request()

    >>> ac = ActionContext(root['somechild'], request, 'content')

    >>> render_tile(root['somechild'], request, 'edit')
    u'...<span class="label label-primary">Edit: My Node</span>...
    <form action="http://example.com/somechild"...'

Render with submitted data. Default next URL of EditForm is the edited
node::

    >>> request = layer.new_request()
    >>> request.params['action.editform.update'] = '1'
    >>> request.params['editform.title'] = 'Changed title'
    >>> res = render_tile(root['somechild'], request, 'edit')
    >>> request.environ['redirect'].location
    'http://example.com/somechild'

Check next URL with ``parent`` as ``came_from`` value::

    >>> request = layer.new_request()

    >>> ac = ActionContext(root['somechild'], request, 'content')

    >>> request.params['action.editform.update'] = '1'
    >>> request.params['editform.title'] = 'Changed title'
    >>> request.params['came_from'] = 'parent'
    >>> res = render_tile(root['somechild'], request, 'edit')
    >>> request.environ['redirect'].location
    'http://example.com/'

Check next URL with URL as ``came_from`` value::

    >>> request = layer.new_request()
    >>> request.params['action.editform.update'] = '1'
    >>> request.params['editform.title'] = 'Changed title'
    >>> came_from = urllib2.quote('http://example.com/other/node/in/tree')
    >>> request.params['came_from'] = came_from
    >>> res = render_tile(root['somechild'], request, 'edit')
    >>> request.environ['redirect'].location
    'http://example.com/other/node/in/tree'

Render with ajax flag::

    >>> request = layer.new_request()

    >>> ac = ActionContext(root['somechild'], request, 'content')

    >>> request.params['action.editform.update'] = '1'
    >>> request.params['editform.title'] = 'Changed title'
    >>> request.params['ajax'] = '1'
    >>> res = render_tile(root['somechild'], request, 'edit')
    >>> request.environ['cone.app.continuation']
    [<cone.app.browser.ajax.AjaxEvent object at ...>]

URL computing is the same as if ``HTTPFound`` instance is returned. In Ajax
case, the URL is used as ajax target::

    >>> request.environ['cone.app.continuation'][0].target
    'http://example.com/somechild'

    >>> request = layer.new_request()

    >>> ac = ActionContext(root['somechild'], request, 'content')

    >>> request.params['action.editform.update'] = '1'
    >>> request.params['editform.title'] = 'Changed title'
    >>> came_from = urllib2.quote('http://example.com/other/node/in/tree')
    >>> request.params['came_from'] = came_from
    >>> request.params['ajax'] = '1'
    >>> res = render_tile(root['somechild'], request, 'edit')
    >>> request.environ['cone.app.continuation'][0].target
    'http://example.com/other/node/in/tree'

Check the updated node::

    >>> root['somechild'].attrs.title
    'Changed title'

Edit view::

    >>> from cone.app.browser.authoring import edit
    >>> request = layer.new_request()
    >>> request.params['action.editform.update'] = '1'
    >>> request.params['editform.title'] = 'Changed title'
    >>> root.attrs.title = 'Foo'
    >>> edit(root, request)
    <HTTPFound at ... 302 Found>

    >>> request = layer.new_request()
    >>> request.params['action.editform.update'] = '1'
    >>> request.params['editform.title'] = 'Changed title'
    >>> request.params['ajax'] = '1'
    >>> result = str(edit(root, request))
    >>> result.find('parent.bdajax.render_ajax_form') != -1
    True


Deleting
--------

::

    >>> class CallableNode(BaseNode):
    ...     def __call__(self):
    ...         pass

    >>> node = CallableNode()
    >>> node['child'] = CallableNode()
    >>> node.printtree()
    <class 'CallableNode'>: None
      <class 'CallableNode'>: child

    >>> del node['child']
    >>> node.printtree()
    <class 'CallableNode'>: None

    >>> node['child'] = CallableNode()

    >>> layer.login('manager')
    >>> request = layer.new_request()
    >>> render_tile(node['child'], request, 'delete')
    u''

    >>> request.environ['cone.app.continuation'][0].payload
    u'Object "child" not deletable'

    >>> node['child'].properties.action_delete = True

    >>> request = layer.new_request()
    >>> render_tile(node['child'], request, 'delete')
    u''

    >>> request.environ['cone.app.continuation']
    [<cone.app.browser.ajax.AjaxEvent object at ...>, 
    <cone.app.browser.ajax.AjaxMessage object at ...>]

    >>> node.printtree()
    <class 'CallableNode'>: None


Add Items Dropdown Widget
-------------------------

Dropdown menu containing links to the addforms of allowed child nodes::

    >>> layer.login('manager')
    >>> request = layer.new_request()
    >>> rendered = render_tile(root['somechild'], request, 'add_dropdown')

Non JS link to add form::

    >>> expected = 'href="http://example.com/somechild/add?factory=mynode"'
    >>> rendered.find(expected) != -1
    True

Ajax target for add form::

    >>> expected = 'ajax:target="http://example.com/somechild?factory=mynode"'
    >>> rendered.find(expected) != -1
    True

Ajax action rule for add form::

    >>> expected = 'ajax:action="add:#content:inner"'
    >>> rendered.find(expected) != -1
    True

Allow another node type as child::

    >>> nodeinfo = NodeInfo()
    >>> nodeinfo.title = 'Another Node'
    >>> nodeinfo.description = 'This is another node.'
    >>> nodeinfo.node = BaseNode
    >>> nodeinfo.addables = []
    >>> register_node_info('anothernode', nodeinfo)
    >>> get_node_info('mynode').addables = ['mynode', 'anothernode']
    >>> rendered = render_tile(root['somechild'], request, 'add_dropdown')

Non JS links to add form::

    >>> expected = 'href="http://example.com/somechild/add?factory=mynode"'
    >>> rendered.find(expected) != -1
    True

    >>> expected = 'href="http://example.com/somechild/add?factory=anothernode"'
    >>> rendered.find(expected) != -1
    True

Ajax targets for add form::

    >>> expected = 'ajax:target="http://example.com/somechild?factory=mynode"'
    >>> rendered.find(expected) != -1
    True

    >>> expected = 'ajax:target="http://example.com/somechild?factory=anothernode"'
    >>> rendered.find(expected) != -1
    True

Test node without addables, results in empty listing.
XXX: discuss whether to hide entire widget if no items::

    >>> class NoChildAddingNode(BaseNode):
    ...     node_info_name = 'nochildaddingnode'

    >>> nodeinfo = NodeInfo()
    >>> nodeinfo.title = 'No child adding Node'
    >>> nodeinfo.description = 'This is a no child containing node.'
    >>> nodeinfo.node = NoChildAddingNode
    >>> nodeinfo.addables = []
    >>> register_node_info('nochildaddingnode', nodeinfo)
    >>> rendered = render_tile(NoChildAddingNode(), request, 'add_dropdown')
    
    >>> rendered
    u'...<li class="dropdown">\n\n    
    <a href="#"\n       
    class="dropdown-toggle"\n       
    data-toggle="dropdown">\n      
    <span>Add</span>\n      
    <span class="caret"></span>\n    
    </a>\n\n    
    <ul class="dropdown-menu" role="addmenu">\n      \n    
    </ul>\n\n  </li>...'

Test node with invalid addable, results in empty listing
XXX: discuss whether to hide entire widget if no items::

    >>> class InvalidChildNodeInfoNode(BaseNode):
    ...     node_info_name = 'invalidchildnodeinfo'

    >>> nodeinfo = NodeInfo()
    >>> nodeinfo.title = 'Invalid Child NodeInfo Node'
    >>> nodeinfo.description = 'This is a node with an invalid child node info.'
    >>> nodeinfo.node = InvalidChildNodeInfoNode
    >>> nodeinfo.addables = ['invalid']
    >>> register_node_info('invalidchildnodeinfo', nodeinfo)
    >>> rendered = render_tile(InvalidChildNodeInfoNode(),
    ...                        request,
    ...                        'add_dropdown')
    >>> rendered
    u'...<li class="dropdown">\n\n    
    <a href="#"\n       
    class="dropdown-toggle"\n       
    data-toggle="dropdown">\n      
    <span>Add</span>\n      
    <span class="caret"></span>\n    
    </a>\n\n    
    <ul class="dropdown-menu" role="addmenu">\n      \n    
    </ul>\n\n  </li>...'

Logout::

    >>> layer.logout()

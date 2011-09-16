BaseNode
--------
::
    >>> from cone.app.model import BaseNode
    >>> root = BaseNode()

Default permissions.::

    >>> root.__acl__
    [('Allow', 'system.Authenticated', ['view']), 
    ('Allow', 'role:viewer', ['view']), 
    ('Allow', 'role:editor', ['view', 'add', 'edit']), 
    ('Allow', 'role:admin', ['view', 'add', 'edit', 'delete']), 
    ('Allow', 'role:owner', ['view', 'add', 'edit', 'delete']), 
    ('Allow', 'role:manager', ['view', 'add', 'edit', 'delete', 'manage']), 
    ('Allow', 'system.Everyone', ['login']), 
    ('Deny', 'system.Everyone', 
    <pyramid.security.AllPermissionsList object at ...>)]

Properties.::

    >>> root.properties
    <cone.app.model.ProtectedProperties object at ...>

``IProperties`` implementations do not raise AttributeErrors if requested
attribute not exists.::

    >>> root.properties.inexistent

Metadata.::

    >>> root.metadata
    <cone.app.model.Metadata object at ...>
    
    >>> root.metadata.title
    'No Title'

    >>> root.metadata.inexistent

Nodeinfo.::

    >>> root.nodeinfo
    <cone.app.model.NodeInfo object at ...>
    
    >>> root.nodeinfo.node
    <class 'cone.app.model.BaseNode'>
    
    >>> root.nodeinfo.title
    "<class 'cone.app.model.BaseNode'>"
    
    >>> root.nodeinfo.inexistent


FactoryNode
-----------

::

    >>> from cone.app.model import FactoryNode
    >>> class Root(FactoryNode):
    ...     factories = {
    ...         'foo': BaseNode,
    ...         'bar': BaseNode,
    ...     }
    
    >>> root = Root()
    >>> root['foo']
    <BaseNode object 'foo' at ...>
    
    >>> root['bar']
    <BaseNode object 'bar' at ...>
    
    >>> root['baz']
    Traceback (most recent call last):
      ...
    KeyError: 'baz'
    
    >>> [_ for _ in root]
    ['foo', 'bar']


AdapterNode
-----------

::

    >>> from cone.app.model import BaseNode
    >>> from cone.app.model import AdapterNode
    
    >>> toadapt = BaseNode()
    >>> toadapt['foo'] = BaseNode()
    >>> toadapt['bar'] = BaseNode()
    >>> toadapt.attrs.title = 'Some title'
    >>> toadapt.attrs.description = 'Some description'

Adapt created node structure.::

    >>> adapter = AdapterNode(toadapt, 'name', None)

Check ``AdapterNode``.::

    >>> adapter.model['foo']
    <BaseNode object 'foo' at ...>

``attrs``::

    >>> adapter.attrs.title
    'Some title'
    
The adapter node is responsible to return other adapter node or application
nodes on ``__getitem__`` if application hierarchy continues.

You can do key aliasing as well at this place.::

    >>> class MyAdapterNode(AdapterNode):
    ...     def __getitem__(self, key):
    ...         return AdapterNode(self.model['bar'], key, self)

This dummy class does a static mapping on __getitem__.::

    >>> node = MyAdapterNode(toadapt, 'adapter', None)
    >>> child = node['aliased']
    >>> child
    <AdapterNode object 'aliased' at ...>
    
    >>> child.model
    <BaseNode object 'bar' at ...>
    
    >>> [key for key in node]
    ['foo', 'bar']

The application node path differs from the adapted node path. This is essential
to keep the application path sane while not violating the adapted node's
structure.::

    >>> child.path
    ['adapter', 'aliased']
    
    >>> child.model.path
    [None, 'bar']


Metadata
--------

The ``IMetadata`` implementation returned by ``IApplicationNode.metadata`` is
used by the application for displaying metadata information.

The default implementation accepts a dict like object on ``__init__``.::

    >>> from cone.app.model import BaseMetadata
    >>> data = {
    ...     'title': 'some title',
    ...     'description': 'some description',
    ...     'creator': 'john doe',
    ... }

Check ``INodeAdapter`` interface.::

    >>> metadata = BaseMetadata(data)

``__getattr__``. No AttributeError is raised if attribute is inexistent.::

    >>> metadata.title
    'some title'
    
    >>> metadata.description
    'some description'
    
    >>> metadata.creator
    'john doe'
    
    >>> metadata.inexistent

``__getitem__``::

    >>> metadata['title']
    'some title'

``__contains__``::

    >>> 'description' in metadata
    True

``get``::

    >>> metadata.get('creator')
    'john doe'


NodeInfo
--------

The ``INodeInfo`` providing object holds information about the application
node.::

    >>> from cone.app.model import BaseNodeInfo
    >>> nodeinfo = BaseNodeInfo()
    >>> nodeinfo.node = BaseNode
    >>> nodeinfo.addables = ['basenode']
    >>> nodeinfo.title = 'Base Node'

Register node info.::

    >>> from cone.app.model import registerNodeInfo, getNodeInfo
    >>> registerNodeInfo('basenode', nodeinfo)

Lookup Node info.::

    >>> nodeinfo = getNodeInfo('basenode')
    >>> nodeinfo.title
    'Base Node'

``__getattr__``. No AttributeError is raised if attribute is inexistent.::

    >>> nodeinfo.addables
    ['basenode']
    
    >>> nodeinfo.inexistent

``__getitem__``::

    >>> nodeinfo['addables']
    ['basenode']

``__contains__``::

    >>> 'node' in nodeinfo
    True

``get``::

    >>> nodeinfo.get('node')
    <class 'cone.app.model.BaseNode'>


Properties
----------

You can use the ``Properties`` object for any kind of mapping.::

    >>> from cone.app.model import Properties
    >>> p1 = Properties()
    >>> p1.prop = 'Foo'
    
    >>> p2 = Properties()
    >>> p2.prop = 'Bar'
    
    >>> p1.prop, p2.prop
    ('Foo', 'Bar')


ProtectedProperties
-------------------

Protected properties checks against permission for properties::

    >>> from cone.app.model import ProtectedProperties
    >>> context = BaseNode()

'viewprotected' property gets protected by 'view' permission::

    >>> permissions = {
    ...     'viewprotected': ['view'],
    ... }
    >>> props = ProtectedProperties(context, permissions)

Setting properties works always::

    >>> props.viewprotected = True
    >>> props.unprotected = True

Unauthorized just permits access to unprotected property::

    >>> props.viewprotected
    >>> props.unprotected
    True
    
    >>> 'viewprotected' in props
    False
    
    >>> 'unprotected' in props
    True
    
    >>> props.keys()
    ['unprotected']
    
    >>> props.get('viewprotected')
    >>> props.get('unprotected')
    True
    
    >>> props['viewprotected']
    Traceback (most recent call last):
      ...
    KeyError: u"No permission to access 'viewprotected'"
    
    >>> props['unprotected']
    True

Authenticate, both properties are now available::

    >>> layer.login('viewer')
    
    >>> props['viewprotected']
    True
    
    >>> props.viewprotected
    True
    
    >>> props.unprotected
    True
    
    >>> props.keys()
    ['unprotected', 'viewprotected']
    
    >>> props.get('viewprotected')
    True
    
    >>> props.get('unprotected')
    True
    
    >>> props.viewprotected = False
    >>> props.viewprotected
    False
    
    >>> layer.logout()


XML Properties
--------------

There's a convenience object for XML input and output.

Dummy environment.::

    >>> import os
    >>> import tempfile
    >>> tempdir = tempfile.mkdtemp()
    
Create XML properties with path and optional data.::

    >>> from cone.app.model import XMLProperties
    >>> props = XMLProperties(os.path.join(tempdir, 'props.xml'),
    ...                       data={'foo': u'äöüß'})

Testing helper functions.::
    
    >>> props._keys()
    ['foo']
    
    >>> props._values()
    [u'\xc3\xa4\xc3\xb6\xc3\xbc\xc3\x9f']

XML properties could be datetime objects.::

    >>> from datetime import datetime
    >>> props.effective = datetime(2010, 1, 1, 10, 15)
    >>> props.empty = ''

XML properties could be multi valued...::

    >>> props.keywords = ['a', datetime(2010, 1, 1, 10, 15), '']

...or dict/odict instance::

    >>> from odict import odict
    >>> props.dictlike = odict([('a', 'foo'), ('b', 'bar'), ('c', '')])

Nothing added yet.::

    >>> os.listdir(tempdir)
    []

Call props, file is now written to disk.::

    >>> props()
    >>> os.listdir(tempdir)
    ['props.xml']

Check file contents.::

    >>> with open(os.path.join(tempdir, 'props.xml')) as file:
    ...     file.read().split('\n')
    ['<properties>', 
    '  <foo>&#195;&#164;&#195;&#182;&#195;&#188;&#195;&#159;</foo>', 
    '  <effective>2010-01-01T10:15:00</effective>', 
    '  <empty></empty>', 
    '  <keywords>', 
    '    <item>a</item>', 
    '    <item>2010-01-01T10:15:00</item>', 
    '    <item></item>', 
    '  </keywords>', 
    '  <dictlike>', 
    '    <elem>', 
    '      <key>a</key>', 
    '      <value>foo</value>', 
    '    </elem>', 
    '    <elem>', 
    '      <key>b</key>', 
    '      <value>bar</value>', 
    '    </elem>', 
    '    <elem>', 
    '      <key>c</key>', 
    '      <value></value>', 
    '    </elem>', 
    '  </dictlike>', 
    '</properties>', 
    '']

Overwrite ``foo`` and add ``bar`` properties; Note that even markup can be 
used safely.::

    >>> props.foo = 'foo'
    >>> props.bar = '<bar>äöü</bar>'
    
Call props and check result.::
    
    >>> props()
    >>> with open(os.path.join(tempdir, 'props.xml')) as file:
    ...     file.read().split('\n')
    ['<properties>', 
    '  <foo>foo</foo>', 
    '  <effective>2010-01-01T10:15:00</effective>', 
    '  <empty></empty>', 
    '  <keywords>', 
    '    <item>a</item>', 
    '    <item>2010-01-01T10:15:00</item>', 
    '    <item></item>', 
    '  </keywords>', 
    '  <dictlike>', 
    '    <elem>', 
    '      <key>a</key>', 
    '      <value>foo</value>', 
    '    </elem>', 
    '    <elem>', 
    '      <key>b</key>', 
    '      <value>bar</value>', 
    '    </elem>', 
    '    <elem>', 
    '      <key>c</key>', 
    '      <value></value>', 
    '    </elem>', 
    '  </dictlike>', 
    '  <bar>&lt;bar&gt;&#228;&#246;&#252;&lt;/bar&gt;</bar>', 
    '</properties>', 
    '']

Create XML properties from existing file.::

    >>> props = XMLProperties(os.path.join(tempdir, 'props.xml'))
    >>> props._keys()
    ['foo', 'effective', 'empty', 'keywords', 'dictlike', 'bar']
    
    >>> props._values()
    [u'foo', 
    datetime.datetime(2010, 1, 1, 10, 15), 
    u'', 
    [u'a', datetime.datetime(2010, 1, 1, 10, 15), u''], 
    odict([('a', 'foo'), ('b', 'bar'), ('c', None)]), 
    u'<bar>\xe4\xf6\xfc</bar>']

Delete property.::

    >>> del props['foo']
    >>> props._keys()
    ['effective', 'empty', 'keywords', 'dictlike', 'bar']
    
    >>> del props['inexistent']
    Traceback (most recent call last):
      ...
    KeyError: u'property inexistent does not exist'

Call and check results.::

    >>> props()
    >>> with open(os.path.join(tempdir, 'props.xml')) as file:
    ...     file.read().split('\n')
    ['<properties>', 
    '  <effective>2010-01-01T10:15:00</effective>', 
    '  <empty></empty>', 
    '  <keywords>', 
    '    <item>a</item>', 
    '    <item>2010-01-01T10:15:00</item>', 
    '    <item></item>', 
    '  </keywords>', 
    '  <dictlike>', 
    '    <elem>', 
    '      <key>a</key>', 
    '      <value>foo</value>', 
    '    </elem>', 
    '    <elem>', 
    '      <key>b</key>', 
    '      <value>bar</value>', 
    '    </elem>', 
    '    <elem>', 
    '      <key>c</key>', 
    '      <value>None</value>', 
    '    </elem>', 
    '  </dictlike>', 
    '  <bar>&lt;bar&gt;&#228;&#246;&#252;&lt;/bar&gt;</bar>', 
    '</properties>', 
    '']

Change order of odict and check results::

    >>> props.dictlike = odict([('b', 'bar'), ('a', 'foo')])
    >>> props()
    >>> with open(os.path.join(tempdir, 'props.xml')) as file:
    ...     file.read().split('\n')
    ['<properties>', 
    '  <effective>2010-01-01T10:15:00</effective>', 
    '  <empty></empty>', 
    '  <keywords>', 
    '    <item>a</item>', 
    '    <item>2010-01-01T10:15:00</item>', 
    '    <item></item>', 
    '  </keywords>', 
    '  <dictlike>', 
    '    <elem>', 
    '      <key>b</key>', 
    '      <value>bar</value>', 
    '    </elem>', 
    '    <elem>', 
    '      <key>a</key>', 
    '      <value>foo</value>', 
    '    </elem>', 
    '  </dictlike>', 
    '  <bar>&lt;bar&gt;&#228;&#246;&#252;&lt;/bar&gt;</bar>', 
    '</properties>', 
    '']
    
    >>> os.remove(os.path.join(tempdir, 'props.xml'))

ConfigProperties
----------------

A Properties implementation exists for Config files used by python
configparser.:: 

    >>> from cone.app.model import ConfigProperties
    >>> props = ConfigProperties(os.path.join(tempdir, 'props.cfg'),
    ...                          data={'foo': 1})

Nothing added yet.::

    >>> os.listdir(tempdir)
    []

Call props, file is now written to disk.::

    >>> props()
    >>> os.listdir(tempdir)
    ['props.cfg']

Check file contents.::

    >>> with open(os.path.join(tempdir, 'props.cfg')) as file:
    ...     file.read()
    '[properties]\nfoo = 1\n\n'

Overwrite ``foo`` and add ``bar`` properties.::

    >>> props.foo = 'foo'
    >>> props.bar = 'bar'
    
Call props and check result.::
    
    >>> props()
    >>> with open(os.path.join(tempdir, 'props.cfg')) as file:
    ...     file.read()
    '[properties]\nfoo = foo\nbar = bar\n\n'

Create config properties from existing file.::

    >>> props = ConfigProperties(os.path.join(tempdir, 'props.cfg'))
    >>> props.foo
    'foo'
    
    >>> props.bar
    'bar'

Test ``__getitem__``::

    >>> props['foo']
    'foo'
    
    >>> props['inexistent']
    Traceback (most recent call last):
      ...
    KeyError: 'inexistent'

Test ``get``::

    >>> props.get('foo')
    'foo'
    
    >>> props.get('inexistent', 'default')
    'default'

Test ``__conteins__``::

    >>> 'foo' in props
    True
    
    >>> 'inexistent' in props
    False

Delete property.::

    >>> del props['inexistent']
    Traceback (most recent call last):
      ...
    KeyError: u'property inexistent does not exist'
    
    >>> del props['foo']
    >>> props.foo

Call and check results.::

    >>> props()
    >>> with open(os.path.join(tempdir, 'props.cfg')) as file:
    ...     file.read()
    '[properties]\nbar = bar\n\n'

    >>> import shutil
    >>> shutil.rmtree(tempdir)

# -*- coding: utf-8 -*-
from cone.app.interfaces import ILayout
from cone.app.interfaces import IMetadata
from cone.app.interfaces import IProperties
from cone.app.interfaces import INodeInfo
from cone.app import testing
from cone.app.model import Layout
from cone.app.model import AdapterNode
from cone.app.model import BaseNode
from cone.app.model import ConfigProperties
from cone.app.model import FactoryNode
from cone.app.model import get_node_info
from cone.app.model import Metadata
from cone.app.model import NodeInfo
from cone.app.model import Properties
from cone.app.model import ProtectedProperties
from cone.app.model import register_node_info
from cone.app.model import UUIDAsName
from cone.app.model import UUIDAttributeAware
from cone.app.model import XMLProperties
from datetime import datetime
from node.interfaces import IInvalidate
from node.tests import NodeTestCase
from odict import odict
from plumber import plumbing
from pyramid.security import ALL_PERMISSIONS
import os
import shutil
import tempfile
import uuid


class TestModel(NodeTestCase):
    layer = testing.security

    def test_BaseNode(self):
        # Default permissions.
        root = BaseNode()
        self.assertEqual(root.__acl__, [
            ('Allow', 'system.Authenticated', ['view']),
            ('Allow', 'role:viewer', ['view', 'list']),
            ('Allow', 'role:editor', ['view', 'list', 'add', 'edit']),
            ('Allow', 'role:admin', [
                'view', 'list', 'add', 'edit', 'delete', 'cut', 'copy',
                'paste', 'manage_permissions', 'change_state'
            ]),
            ('Allow', 'role:manager', [
                'view', 'list', 'add', 'edit', 'delete', 'cut', 'copy',
                'paste', 'manage_permissions', 'change_state', 'manage'
            ]),
            ('Allow', 'role:owner', [
                'view', 'list', 'add', 'edit', 'delete', 'cut', 'copy',
                'paste', 'manage_permissions', 'change_state'
            ]),
            ('Allow', 'system.Everyone', ['login']),
            ('Deny', 'system.Everyone', ALL_PERMISSIONS)
        ])

        # Properties
        props = root.properties
        self.assertTrue(isinstance(props, Properties))
        self.assertTrue(IProperties.providedBy(props))

        # ``IProperties`` implementations do not raise AttributeErrors if
        # requested attribute not exists
        self.assertTrue(props.inexistent is None)

        # Metadata
        md = root.metadata
        self.assertTrue(isinstance(md, Metadata))
        self.assertTrue(IMetadata.providedBy(md))
        self.assertTrue(IProperties.providedBy(md))

        self.assertEqual(md.title, 'no_title')
        self.assertTrue(md.inexistent is None)

        # Layout
        layout = root.layout
        self.assertTrue(isinstance(layout, Layout))
        self.assertTrue(ILayout.providedBy(layout))

        self.assertTrue(layout.mainmenu)
        self.assertFalse(layout.mainmenu_fluid)
        self.assertTrue(layout.livesearch)
        self.assertTrue(layout.personaltools)
        self.assertFalse(layout.columns_fluid)
        self.assertTrue(layout.pathbar)
        self.assertEqual(layout.sidebar_left, ['navtree'])
        self.assertEqual(layout.sidebar_left_grid_width, 3)
        self.assertEqual(layout.content_grid_width, 9)

        # Nodeinfo
        info = root.nodeinfo
        self.assertTrue(isinstance(info, NodeInfo))
        self.assertTrue(INodeInfo.providedBy(info))
        self.assertTrue(info.node is BaseNode)
        self.assertEqual(info.title, "<class 'cone.app.model.BaseNode'>")
        self.assertTrue(info.inexistent is None)

    def test_FactoryNode(self):
        class TestFactoryNode(FactoryNode):
            factories = {
                'foo': BaseNode,
                'bar': BaseNode,
            }
        node = TestFactoryNode()

        # static factories
        self.assertTrue(str(node['foo']).startswith("<BaseNode object 'foo' at"))
        self.assertTrue(str(node['bar']).startswith("<BaseNode object 'bar' at"))
        self.expect_error(KeyError, lambda: node['baz'])
        self.assertEqual([it for it in node], ['foo', 'bar'])
        self.assertTrue(IInvalidate.providedBy(node))
        self.assertEqual(node.values(), [node['foo'], node['bar']])

        # invalidate
        node.invalidate()
        self.assertEqual(node.storage.values(), [])
        self.assertEqual(node.values(), [node['foo'], node['bar']])
        self.assertEqual(node.storage.values(), [node['foo'], node['bar']])

        node.invalidate('foo')
        self.assertEqual(node.storage.values(), [node['bar']])

    def test_AdapterNode(self):
        toadapt = BaseNode()
        toadapt['foo'] = BaseNode()
        toadapt['bar'] = BaseNode()
        toadapt.attrs.title = 'Some title'
        toadapt.attrs.description = 'Some description'

        # Adapt created node structure
        adapter = AdapterNode(toadapt, 'name', None)

        # Check ``AdapterNode``
        expected = "<BaseNode object 'foo' at"
        self.assertTrue(str(adapter.model['foo']).startswith(expected))

        # ``attrs``
        self.assertEqual(adapter.attrs.title, 'Some title')

        # The adapter node is responsible to return other adapter node or
        # application nodes on ``__getitem__`` if application hierarchy
        # continues. It's possible to do key aliasing as well at this place.
        # This dummy class does a static mapping on ``__getitem__``.
        class TestAdapterNode(AdapterNode):
            def __getitem__(self, key):
                return AdapterNode(self.model['bar'], key, self)

        node = TestAdapterNode(toadapt, 'adapter', None)
        child = node['aliased']
        expected = "<AdapterNode object 'aliased' at"
        self.assertTrue(str(child).startswith(expected))

        self.assertTrue(child.model is toadapt['bar'])
        self.assertEqual([key for key in node], ['foo', 'bar'])

        # The application node path differs from the adapted node path. This is
        # essential to keep the application path sane while not violating the
        # adapted node's structure
        self.assertEqual(child.path, ['adapter', 'aliased'])
        self.assertEqual(child.model.path, [None, 'bar'])

    def test_Metadata(self):
        # The ``IMetadata`` implementation returned by
        # ``IApplicationNode.metadata`` is used by the application for
        # displaying metadata information. The default implementation accepts a
        # dict like object on ``__init__``
        data = {
            'title': 'some title',
            'description': 'some description',
            'creator': 'john doe',
        }

        # Check ``INodeAdapter`` interface
        metadata = Metadata(data)

        # ``__getattr__``. No AttributeError is raised if attribute is
        # inexistent
        self.assertEqual(metadata.title, 'some title')
        self.assertEqual(metadata.description, 'some description')
        self.assertEqual(metadata.creator, 'john doe')
        self.assertTrue(metadata.inexistent is None)

        # ``__getitem__``
        self.assertEqual(metadata['title'], 'some title')

        # ``__contains__``
        self.assertTrue('description' in metadata)

        # ``get``
        self.assertEqual(metadata.get('creator'), 'john doe')

    def test_NodeInfo(self):
        # The ``INodeInfo`` providing object holds information about the
        # application node
        nodeinfo = NodeInfo()
        nodeinfo.node = BaseNode
        nodeinfo.addables = ['basenode']
        nodeinfo.title = 'Base Node'

        # Register node info
        register_node_info('basenode', nodeinfo)

        # Lookup Node info
        nodeinfo = get_node_info('basenode')
        self.assertEqual(nodeinfo.title, 'Base Node')

        # ``__getattr__``. No AttributeError is raised if attribute is
        # inexistent
        self.assertEqual(nodeinfo.addables, ['basenode'])
        self.assertTrue(nodeinfo.inexistent is None)

        # ``__getitem__``
        self.assertEqual(nodeinfo['addables'], ['basenode'])

        # ``__contains__``
        self.assertTrue('node' in nodeinfo)

        # ``get``
        self.assertTrue(nodeinfo.get('node') is BaseNode)

    def test_UUIDAttributeAware(self):
        @plumbing(UUIDAttributeAware)
        class UUIDNode(BaseNode):
            pass

        node = UUIDNode()
        self.assertTrue(isinstance(node.uuid, uuid.UUID))
        self.assertTrue(node.attrs['uuid'] is node.uuid)

    def test_UUIDAsName(self):
        @plumbing(UUIDAsName)
        class UUIDAsNameNode(BaseNode):
            pass

        node = UUIDAsNameNode()
        self.assertTrue(isinstance(node.uuid, uuid.UUID))
        self.assertTrue(str(node.uuid) == node.name)

        child = UUIDAsNameNode()
        node[child.name] = child
        sub = UUIDAsNameNode()
        node[child.name][sub.name] = sub
        sub = UUIDAsNameNode()
        node[child.name][sub.name] = sub
        self.check_output("""\
        <class '...UUIDAsNameNode'>: ...
          <class '...UUIDAsNameNode'>: ...
            <class '...UUIDAsNameNode'>: ...
            <class '...UUIDAsNameNode'>: ...
        """, node.treerepr())

        err = self.expect_error(RuntimeError, node[child.name].copy)
        expected = 'Shallow copy useless on UUID aware node trees, use deepcopy.'
        self.assertEqual(str(err), expected)

        copy = child.deepcopy()
        self.check_output("""\
        <class '...UUIDAsNameNode'>: ...
          <class '...UUIDAsNameNode'>: ...
          <class '...UUIDAsNameNode'>: ...
        """, copy.treerepr())

        self.assertFalse(copy.uuid == child.uuid)
        self.assertFalse(sorted(copy.keys()) == sorted(child.keys()))
        self.assertEqual(len(copy.keys()), 2)
        self.assertEqual(len(copy.values()), 2)
        self.assertTrue(copy[copy.keys()[0]].name == copy.keys()[0])

"""
Properties
----------

You can use the ``Properties`` object for any kind of mapping.::

    >>> p1 = Properties()
    >>> p1.prop = 'Foo'

    >>> p2 = Properties()
    >>> p2.prop = 'Bar'

    >>> p1.prop, p2.prop
    ('Foo', 'Bar')


ProtectedProperties
-------------------

Protected properties checks against permission for properties::

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

    >>> tempdir = tempfile.mkdtemp()

Create XML properties with path and optional data.::

    >>> props = XMLProperties(os.path.join(tempdir, 'props.xml'),
    ...                       data={'foo': u'äöüß'})

Testing helper functions.::

    >>> props._keys()
    ['foo']

    >>> props._values()
    [u'\xc3\xa4\xc3\xb6\xc3\xbc\xc3\x9f']

XML properties could be datetime objects.::

    >>> props.effective = datetime(2010, 1, 1, 10, 15)
    >>> props.empty = ''

XML properties could be multi valued...::

    >>> props.keywords = ['a', datetime(2010, 1, 1, 10, 15), '']

...or dict/odict instance::

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

    >>> props.foo = u'foo'
    >>> props.bar = u'bar'
    >>> props.baz = u'\xc3\xa4\xc3\xb6\xc3\xbc'

Call props and check result.::

    >>> props()
    >>> with open(os.path.join(tempdir, 'props.cfg')) as file:
    ...     file.read().split('\n')
    ['[properties]', 
    'foo = foo', 
    'bar = bar', 
    'baz = \xc3\x83\xc2\xa4\xc3\x83\xc2\xb6\xc3\x83\xc2\xbc', 
    '', 
    '']

Create config properties from existing file.::

    >>> props = ConfigProperties(os.path.join(tempdir, 'props.cfg'))
    >>> props.foo
    u'foo'

    >>> props.bar
    u'bar'

    >>> props.baz
    u'\xc3\xa4\xc3\xb6\xc3\xbc'

Test ``__getitem__``::

    >>> props['foo']
    u'foo'

    >>> props['inexistent']
    Traceback (most recent call last):
      ...
    KeyError: 'inexistent'

Test ``get``::

    >>> props.get('foo')
    u'foo'

    >>> props.get('inexistent', u'default')
    u'default'

Test ``__contains__``::

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
    ...     file.read().split('\n')
    ['[properties]', 
    'bar = bar', 
    'baz = \xc3\x83\xc2\xa4\xc3\x83\xc2\xb6\xc3\x83\xc2\xbc', 
    '', 
    '']

    >>> shutil.rmtree(tempdir)

"""

=====
Model
=====

``cone.app`` uses the traversal mechanism of pyramid. Model nodes utilize the
`node <http://pypi.python.org/pypi/node>`_ package. The nodes shipped with
``cone.app`` extend ``node.interfaces.INode`` by security declarations,
UI properties, metadata information and meta information of the node. See
``cone.app.interfaces`` for detailed information of the contract.


BaseNode
--------

``cone.app.model.BaseNode`` plumbs together all required aspects for
representing an application node. It's probably a good idea to inherit from it
if none of the ongoing objects fit desired behavior.::

    >>> from cone.app.model import BaseNode
    
    >>> class MyNode(BaseNode):
    ...     """Model related code goes here
    ...     """

Note: A more advanced technique is to use the mechanisms provided by
`plumber <http://pypi.python.org/pypi/plumber>`_ package directly for combining
different node behaviors. The ``IApplicationNode`` related interface extensions
are also implemented as plumbing part (see documentation of plumber package to
get a clue), and the ``BaseNode`` class is just a combination of plumbing parts
without extending anything on the class directly.::

    >>> from plumber import plumber
    >>> from node.parts import (
    ...     AsAttrAccess,
    ...     NodeChildValidate,
    ...     Adopt,
    ...     Nodespaces,
    ...     Attributes,
    ...     DefaultInit,
    ...     Nodify,
    ...     Lifecycle,
    ...     OdictStorage,
    ... )
    >>> from cone.app.model import AppNode
    
    >>> class MyAdvancedNode(object)
    ...     __metaclass__ = plumber
    ...     __plumbing__ = (
    ...         AppNode,
    ...         AsAttrAccess,
    ...         NodeChildValidate,
    ...         Adopt,
    ...         Nodespaces,
    ...         Attributes,
    ...         DefaultInit,
    ...         Nodify,
    ...         Lifecycle,
    ...         OdictStorage,
    ...     )


FactoryNode
-----------

A ``cone.app.model.FactoryNode`` can be used to serve static children. The
factory node provides a ``factory`` attribute containing a dict, where the keys
represent the available child keys, and the values are simply callables which
act as factory for given key on first access. I.e., a factory callable could be
used to initialize database related entry nodes.::

    >>> from cone.app.model import FactoryNode
    >>> class MyFactoryNode(FactoryNode):
    ...     factories = {
    ...         'child_by_factory_function': self.child_factory,
    ...         'child_by_node_init_as_factory': BaseNode,
    ...     }
    ...     def child_factory(self):
    ...         return BaseNode()


AdapterNode
-----------

``cone.app.AdapterNode`` is intended to be used for publishing nodes of models
where the hierarchy differs from the one of the application model.

The adapter node by default acts as proxy for ``__iter__`` and ``attrs``, all
other functions map to the used ``OdictStorage``. If an adapter node provides
children itself, it may be needed to adapted them as well, thus ``__getitem__``
must be overwritten.::

    >>> from cone.app.model import AdapterNode
    
    >>> class MyAdapterNode(AdapterNode):
    ...     def __getitem__(self, key):
    ...         try:
    ...             return self.storage[key]
    ...         except KeyError:
    ...             # raises KeyError directly if inexistent
    ...             child_context = self.model[key]
    ...             child = AdapterNode(child_context, key, self)
    ...             self.storage[key] = child
    ...             return child


AppRoot
-------

``cone.app.model.AppRoot`` is a factory node instanciated at application
startup time. Every plugin root factory registered by
``cone.app.register_plugin`` is written to app root's ``factories``
attribute. Also application related settings from the INI file are written to 
``properties`` respective ``metadata`` of app root node. The root node can be
accessed either by calling ``node.root`` if ``node`` is child of application
model or by using ``cone.app.get_root``.::

    >>> from cone.app import get_root
    >>> root = get_root()


AppSettings
-----------

``cone.app.model.AppSettings`` is - like app root - also a factory node
initialized at application startup. Every settings node factory registered by
``cone.app.register_plugin_config`` is written to settings node ``factories``
attribute. The settings node also provides relevant properties and metadata.
The settings node can be accessed either by calling ``node.root['settings']``
if ``node`` is child of application model or again by using
``cone.app.get_root`` and access 'settings' child.::

    >>> settings = get_root()['settings']


CopySupport
-----------

``cone.app.model.CopySupport`` is a plumbing part for application model nodes
indicating that children of nodes can be cut and copied, and that nodes can be
pasted. cut, copy and paste can be disabled explicitly by setting
``supports_cut``, ``supports_copy`` respective ``supports_paste``.


Properties
----------

``cone.app.model.Properties`` can be used for any kind of property mapping.
The contract is described in ``cone.app.interfaces.IProperties``. The
application node attributes ``properties`` and ``metadata`` promise to
provide an ``IProperties`` implementation. A properties object never raises an
AttributeError on attribute access, instead ``None`` is returned if property is
inexistent. Available properties are provided by ``keys``.::

    >>> from cone.app.model import Properties
    >>> props = Properties
    >>> props.a = '1'
    >>> props.b = '2'
    >>> props.keys()
    ['a', 'b']
    
    >>> props.a
    '1'
    
    >>> props.c


ProtectedProperties
-------------------

``cone.app.model.ProtectedProperties`` object can be used to secure property
access by permissions. Properties with no permissions are always returned::

    >>> from cone.app.model import ProtectedProperties

Define the permission map. In this example, permission 'view' is required to
access property 'a', and permission 'edit' is required to access property
'b'.:: 

    >>> permissions = {
    ...     'a': ['view'],
    ...     'b': ['edit'],
    ... }

The model to check the permissions against.::

    >>> model = BaseNode()

Property data.::

    >>> data = {
    ...     'a': '1', # 'view' permission protected
    ...     'b': '2', # 'edit' permission protected
    ...     'c': '3', # unprotected
    ... }

Initialize properties.::

    >>> props = ProtectedProperties(model, permissions, data)

If a user does not have the respective permission granted to access a specific
property, ``ProtectedProperties`` behaves as if this property is inexistent.

Write access to properties is not protected at all.


Metadata
--------

``cone.app.model.Metadada`` class inherits from ``cone.app.model.Properties``
and adds the marker interface ``cone.app.interfaces.IMetadata``. This object
is supposed to be used for ``cone.app.interfaces.IApplicationNode.metadata``.


XMLProperties
-------------

``cone.app.model.XMLProperties`` is an ``IProperties`` implementation which
can be used to serialize/deserialze properties to XML files. Supported value
types are ``string``, ``list``, ``tuple``, ``dict`` and ``datetime.datetime``::

    >>> from cone.app.model import XMLProperties
    >>> file = '/path/to/file.xml'
    >>> props = XMLProperties(file)
    >>> props.a = '1'
    >>> props() # persist to file
  

ConfigProperties
----------------

``cone.app.model.ConfigProperties`` is an ``IProperties`` implementation which
can be used to serialize/deserialze properties to INI file. Supports value
type ``string`` only.::

    >>> from cone.app.model import ConfigProperties
    >>> file = '/path/to/file.ini'
    >>> props = ConfigProperties(file)
    >>> props.a = '1'
    >>> props() # persist to file


NodeInfo
--------

``cone.app.model.NodeInfo`` class inherits from ``cone.app.model.Properties``
and adds the marker interface ``cone.app.interfaces.INodeInfo``. A NodeInfo
object contains meta information of application nodes and are basically used
for authoring purposes.::

    >>> from cone.app.model import (
    ...     NodeInfo,
    ...     registerNodeInfo,
    ... )
    >>> info = NodeInfo()
    >>> info.title = 'Node meta title'
    >>> info.description = 'Node meta description'
    >>> info.node = SomeNode
    >>> info.addables = ['node_info_name_b', 'node_info_name_c']
    >>> registerNodeInfo('node_info_name_a', info)

The refering application model node must provide ``node_info_name`` attribute,
which is used to lookup the related NodeInfo instance.::

    >>> from cone.app.model import getNodeInfo
    >>> info = getNodeInfo('node_info_name_a')

See forms documentation for more details.


Security
--------

In ``cone.app``, security declarations on models and authorization is done with
``pyramid.security``. As authorization policy
``pyramid.authorization.ACLAuthorizationPolicy`` is used.

For authentication, users, groups and roles, the contract of ``node.ext.ugm``
is used. As authentication policy
``pyramid.authentication.AuthTktAuthenticationPolicy`` with
``cone.app.security.groups_callback`` is used, which bridges roles and group
membership.

The desired ``node.ext.ugm`` instance is created in application main hook
and set to ``cone.app.cfg.auth``.

If no authentication implementation is registered, the only user which can
authenticate is the admin user defined in application configuration INI file.

By default, anonymous access to all application model nodes is prohibited.

Default ACL for application nodes is located at
``cone.app.security.DEFAULT_ACL``.

Default ACL for settings nodes is located at
``cone.app.security.DEFAULT_SETTINGS_ACL``.

Default vocab for available roles is located at
``cone.app.security.DEFAULT_ROLES``.


PrincipalACL
------------

In many applications it's required to grant access for specific parts of the
application model to specific users and groups. ``cone.app`` ships with a
plumbing part providing principal related roles. It's an abstract
implementation leaving the persistence apart. A concrete shareable node looks
like::

    >>> from plumber import plumber
    >>> from node.utils import instance_property
    >>> from cone.app.model import BaseNode
    >>> from cone.app.security import (
    ...     PrincipalACL,
    ...     DEFAULT_ACL,
    ... )
    >>> class SharingNode(BaseNode):
    ...     __metaclass__ = plumber
    ...     __plumbing__ = PrincipalACL
    ... 
    ...     role_inheritance = True
    ... 
    ...     @property
    ...     def __acl__(self):
    ...         return DEFAULT_ACL
    ... 
    ...     @instance_property
    ...     def principal_roles(self):
    ...         return dict()

The ``role_inheritance`` attribute defines whether to aggregate roles from
parent nodes. It's important for shareable nodes that the ``__acl__`` attribute
is implemented as property function to make sure plumber can hook in correctly.
``principal_roles`` returns a persistent dict like object containing the stored
or computed local roles for this node.

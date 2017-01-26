=================
Application Model
=================

The application model consists of nodes providing the application hierarchy,
security declarations, UI configuration and node type information for authoring.

The base application node utilizes `node <http://pypi.python.org/pypi/node>`_
and implements the following contracts:

- **node.interfaces.INode** defines the basic tree information and containment
  API used for application model traversal.

- **node.interfaces.IAttributes** extends the node by an ``attrs`` property
  which holds the node data. We use a dedicated object holding the attributes
  in order to separate node hierarchy information from actual node data in a
  clean way.

- **cone.app.interfaces.ISecured** extends the node by the ``__acl__``
  property. It is used by Pyramid at publishing time to manage access.
  See :doc:`Security <security>` documentation for more details.

- **cone.app.interfaces.IApplicationNode** extends the node by application
  specific contracts.

    - **layout**: Property containing ``cone.app.interfaces.ILayout`` implementing
      object. The layout object contains settings for the main layout. See
      :doc:`Application Layout <layout>` for details.

    - **properties**: Property containing ``cone.app.IProperties`` implementing
      object. The properties are supposed to provide UI configuration settings.
      :doc:`UI widgets <widgets>` for details.

    - **metadata**: Property containing ``cone.app.IMetadata`` implementing object.
      Metadata is used by different UI widgets to display node metadata.

    - **nodeinfo**: Property containing ``cone.app.INodeInfo`` implementing object.
      NodeInfo provides cardinality information and general node information which
      is primary needed for authoring operations.


BaseNode
--------

The ``cone.app.model.BaseNode`` implements all required aspects for
representing an application node. It can be used as starting point when writing
application models.

.. code-block:: python

    from cone.app.model import BaseNode

    class CustomNode(BaseNode):
        """Model related code goes here.
        """

A more advanced technique is to use the mechanisms provided by
`plumber <http://pypi.python.org/pypi/plumber>`_ package directly for defining
different behaviors of a node. The ``IApplicationNode`` related interface
extensions are implemented as plumbing behaviors as well, and the ``BaseNode``
class is just a combination of plumbing behaviors without extending anything on
the class directly.

.. code-block:: python

    from cone.app.model import AppNode
    from node import behaviors
    from plumber import plumbing

    @plumbing(
        behaviors.AppNode,
        behaviors.AsAttrAccess,
        behaviors.NodeChildValidate,
        behaviors.Adopt,
        behaviors.Nodespaces,
        behaviors.Attributes,
        behaviors.DefaultInit,
        behaviors.Nodify,
        behaviors.Lifecycle,
        behaviors.OdictStorage)
    class AdvancedNode(object)
        """The used plumbing behaviors on this class are the same as for
        ``cone.app.model.BaseNode``
        """

.. _model_factory_node:

FactoryNode
-----------

The ``cone.app.model.FactoryNode`` can be used to serve fixed children. The
factory node provides a ``factory`` attribute containing a dict, where the keys
represent the available children keys, and the values are callables which act
as factory for given key on first access.

E.g., the :ref:`AppRoot <model_app_root>` node inherits from ``FactoryNode`` and is
used to serve the entry nodes of the application.

.. code-block:: python

    from cone.app.model import FactoryNode

    class CustomFactoryNode(FactoryNode):
        factories = {
            'child_by_factory_function': self.child_factory_function,
            'child_by_node_init_as_factory': BaseNode,
        }

        def child_factory_function(self):
            return BaseNode()


AdapterNode
-----------

The ``cone.app.AdapterNode`` can be used for publishing nodes of models where
the hierarchy differs from the one of the application model.

The adapter node by default acts as proxy for ``__iter__`` and ``attrs``, all
other functions refer to the underlying ``node.behaviors.OdictStorage`` of the
adapter node.

If an adapter node wants to publish the children of the adapted node, it must
not do this by just returning the children of the adapted node because the
application node hierarchy would get invalid. Thus it is required to adapt
them as well. Do this by overrwriting ``__getitem__``.

.. code-block:: python

    from cone.app.model import AdapterNode

    class AdaptedChildNode(AdapterNode):
        pass

    class CustomAdapterNode(AdapterNode):

        def __getitem__(self, key):
            try:
                return self.storage[key]
            except KeyError:
                child_context = self.model[key]
                child = AdaptedChildNode(child_context, key, self)
                self.storage[key] = child
                return child


.. _model_app_root:

AppRoot
-------

``cone.app.model.AppRoot`` derives from :ref:`FactoryNode <model_factory_node>`
and represents the application model root node.

This node gets instanciated only once on application startup. Every plugin
entry point registered with :ref:`register_entry <plugins_application_model>`
gets written to the ``factories`` attribute of the root node.

Root node related settings from the ``.ini`` file are written to ``properties``
respective ``metadata`` objects of the application root node.

The root node can be accessed either by calling ``self.root`` on application
model nodes or by using ``cone.app.get_root()`` utility.

.. code-block:: python

    from cone.app import get_root

    root = get_root()


AppSettings
-----------

``cone.app.model.AppSettings`` is like application root a factory node
initialized at application startup. Every settings node factory registered with
:ref:`register_config <plugins_application_settings>` gets written to the
``factories`` attribute of the settings node.

The settings node provides relevant ``properties`` and ``metadata`` objects and
an ``__acl__`` restricting access to the ``manager <link to security>`` role.

The settings node is available at ``settings`` on application model root.

.. code-block:: python

    settings = get_root()['settings']


CopySupport
-----------

``cone.app.model.CopySupport`` is a plumbing behavior for application model
nodes indicating that it's children can be cut and copied, and that nodes from
another subtree can be pasted. Cut, copy and paste features are controlled by
``supports_cut``, ``supports_copy`` respective ``supports_paste`` flags. They
all default to ``True``.


UUIDAttributeAware
------------------

``cone.app.model.UUIDAttributeAware`` is a plumbing behavior and supposed to be
used to expose ``self.attrs['uuid']`` at ``self.uuid``.


UUIDAsName
----------

.. warning::

    EXPERIMENTAL - Subject to change.

``cone.app.model.UUIDAsName`` is a plumbing behavior which provides
``self.uuid`` at ``self.name``. In conjunction with ``UUIDAttributeAware`` it
is possible to create application models where nodes are traversable by
persistent UUID.

``self.set_uuid_for(node, override=False, recursiv=False)`` can be used to
recursively update UUID's on copies of a node.


Properties
----------

``cone.app.model.Properties`` can be used for any kind of property mapping.
The contract is described in ``cone.app.interfaces.IProperties``. The
application node attributes ``properties`` and ``metadata`` promise to
provide an ``IProperties`` implementation.

Properties are accessed via python attribute access, but never raise an
``AttributeError`` if property not exists, instead ``None`` is returned.

Available properties are provided by ``keys`` function.

.. note::

    Although one Python ZEN rule says "Explicit is better than implicit", the
    behavior is desired.

    The reason is that ``IProperties`` objects are used to expect UI element
    settings or metadata on application nodes.

    When writing new UI elements supporting custom settings it's not necessary
    to extend the properties objects all the time but just add the desired new
    setting to it.

    The other way around a UI element accessing a missing setting property can
    consider the UI element unconfigured/unavailable if expected setting is
    ``None``.

    The downside of this strategy is that it's necessary to be careful when
    defining setting names. They need to be explicit enough to avoid namespace
    clashes between UI widgets. A good practice is to prefix widget related
    settings by the related ``tile <link to tiles>`` name.

.. code-block:: pycon

    >>> from cone.app.model import Properties

    >>> props = Properties
    >>> props.a = '1'
    >>> props.b = '2'
    >>> props.keys()
    ['a', 'b']

    >>> assert(props.a == '1')
    >>> assert(props.not_exists is None)


ProtectedProperties
-------------------

``cone.app.model.ProtectedProperties`` object can be used to secure property
access by permissions. Properties with no permissions are always returned.
See :doc:`Security <security>` documentation for more details about
permissions.

.. code-block:: python

    from cone.app.model import ProtectedProperties

Define the permission map. In this example, permission 'view' is required to
access property 'a', and permission 'edit' is required to access property
'b'.

.. code-block:: python

    permissions = {
        'a': ['view'],
        'b': ['edit'],
    }

The model to check the permissions against.

.. code-block:: python

    model = BaseNode()

Property data.

.. code-block:: python

    data = {
        'a': '1',  # 'view' permission protected
        'b': '2',  # 'edit' permission protected
        'c': '3',  # unprotected
    }

Initialize properties.

.. code-block:: python

    props = ProtectedProperties(model, permissions, data)

If a user does not have the resquired permission granted to access a specific
property, ``ProtectedProperties`` behaves as if this property is inexistent.

.. note::

    Write access to properties is not protected at all.


Metadata
--------

``cone.app.model.Metadada`` class inherits from ``cone.app.model.Properties``
and adds the marker interface ``cone.app.interfaces.IMetadata``. This object
is for ``cone.app.interfaces.IApplicationNode.metadata``.


XMLProperties
-------------

``cone.app.model.XMLProperties`` is an ``IProperties`` implementation which
can be used to serialize/deserialze properties to XML files. Supported value
types are ``string``, ``list``, ``tuple``, ``dict`` and ``datetime.datetime``.

.. code-block:: python

    from cone.app.model import XMLProperties

    file = '/path/to/file.xml'
    props = XMLProperties(file)
    props.a = '1'
    props()  # persist to file


ConfigProperties
----------------

``cone.app.model.ConfigProperties`` is an ``IProperties`` implementation which
can be used to serialize/deserialze properties to ``.ini`` files. Supports
value type ``string`` only.

.. code-block:: python

    from cone.app.model import ConfigProperties

    file = '/path/to/file.ini'
    props = ConfigProperties(file)
    props.a = '1'
    props()  # persist to file


NodeInfo
--------

``cone.app.model.NodeInfo`` class inherits from ``cone.app.model.Properties``
and adds the marker interface ``cone.app.interfaces.INodeInfo``.

``NodeInfo`` provides cardinality information and general node information
which is primary needed for authoring operations. The following properties are
used:

- **name**: Unique name as string of node type.

- **title**: Title of this node type.

- **description**: Description of this node type.

- **factory**: Add model factory. Function used to instanciate a non persistent
  instance of node type used to render add forms. Defaults to
  ``cone.app.browser.authoring.default_addmodel_factory``.

- **addables**: List of node info names. Defines which node types are allowed
  as children in this node.

- **icon**: Icon for node type. Icon support is implemented using icon fonts.
  Ionicons <link to ionicons> are shipped and delivered with ``cone.app`` by
  default.

``NodeInfo`` objects are not instanciated directly, instead the
``cone.app.model.node_info`` decorator is used to register node types.

.. code-block:: python

    from cone.app.model import BaseNode
    from cone.app.model import node_info

    @node_info(
        name='custom_node',
        title='Custom Node',
        description='A Custom Node',
        factory=None,
        icon='ion-ios7-gear',
        addables=['other_node'])
    class CustomNode(BaseNode):
        pass

The ``NodeInfo`` instance can be accessed either on the application model
nodes or with ``cone.app.model.get_node_info``.

``get_node_info`` returns ``None`` if node info by name not exists while
``model.nodeinfo`` always returns a ``NodeInfo`` instance, regardless whether
there has been registered a dedicated one or not.

.. code-block:: python

    from cone.app.model import get_node_info

    # lookup node info by utility function
    info = get_node_info('custom_node')

    # lookup node info from model
    model = CustomNode()
    info = model.nodeinfo

See :doc:`Forms <forms>` documentation for more details.

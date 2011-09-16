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
representing an application node. It's propably a good idea to inherit from it
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

``cone.app.AdapterNode`` is intended to be used to publish nodes of trees with
an orthogonal hierarchy to the application model.

The adapter node by default act as proxy for ``__iter__`` and ``attrs``, all
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

AppSettings
-----------

Properties
----------

ProtectedProperties
-------------------

Metadata
--------

NodeInfo
--------

XMLProperties
-------------

ConfigProperties
----------------

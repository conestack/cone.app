.. cone.app documentation master file

===================================================
cone.app - Build Web Applications on top of pyramid
===================================================

Overview
--------

``cone.app`` offers a web application stub built on top of the
`pyramid <https://pylonsproject.org/docs/pyramid.html>`_ framework.

The authors of this package are coming from ``Zope`` and ``Plone`` development,
thus a developer originating those domains will be familiar with lots of the
concepts used.

The package does NOT aim to provide another CMS. Plone is already well done.
``cone.app`` aims to provide an environment for building web applications used
to serve and modify node-like data structures. They all follow the same
contract of how data nodes must look like. Doing so ensures that user interface
components can be build generic. It also ensures on the other hand that data
models following the contract are publishable.

For publishing data the traversal mechanism of ``pyramid`` takes place.
As base for application models `node <http://pypi.python.org/pypi/node>`_
package is used.

Views are primary implemented as ``tiles``, which are provided by
`cone.tile <http://pypi.python.org/pypi/cone.tile>`_. The main reason using
``tiles`` is a unique contract to render "parts" of the application.

For AJAXification `bdajax <http://pypi.python.org/pypi/bdajax>`_ is utilized.

`Yafowil <http://pypi.python.org/pypi/yafowil>`_ is used as default form
processing library.

For authentication and authorization
`node.ext.ugm <http://pypi.python.org/pypi/node.ext.ugm>`_ contract is expected.

Note: ``cone.app`` currently requires pyramid 1.1!


Features
--------

* Base application layout
* Authentication integration
* Application model basics
* Authoring
* Workflows
* Common UI widgets
* AJAX helpers
* Application extensions are organized as plugins.


Contents
--------

.. toctree::
   :maxdepth: 3
   
   Quickstart <quickstart>
   Plugins <plugins>
   Application Model <model>
   Tiles <tiles>
   Forms <forms>
   Workflows <workflows>
   AJAX <ajax>

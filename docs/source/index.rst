.. cone.app documentation master file

.. image:: _static/cone.app.png

===========================================
cone - a comprehensive Web Application Stub
===========================================

Overview
--------

``cone.app`` offers a Web Application Stub built on top of the
`Pyramid <https://pylonsproject.org/docs/pyramid.html>`_ framework.

The authors of this package are coming from `Zope <https://zope.org>`_ and
`Plone <https://plone.org>`_ development, thus a developer originating those
domains will be familiar with lots of the concepts used.

The package does NOT aim to provide another CMS. Plone is already well done.
``cone.app`` aims to provide an environment for building web applications used
to serve and modify node-like data structures. They all follow the same
contract of how data nodes must look like. Doing so ensures that user interface
components can be build generic. It also ensures on the other hand that data
models following the contract are publishable.

For publishing data the traversal mechanism of Pyramid takes place. As base for
application models `node <http://pypi.python.org/pypi/node>`_ package is used.

Views are primary implemented as *Tiles*, which are provided by
`cone.tile <http://pypi.python.org/pypi/cone.tile>`_. The main reason using
Tiles is a unique contract to independently render parts of the Application UI.

For AJAX operations `bdajax <http://pypi.python.org/pypi/bdajax>`_ is utilized.

`YAFOWIL <http://pypi.python.org/pypi/yafowil>`_ is used as default Form
Processing Library.

For authentication and authorization
`node.ext.ugm <http://pypi.python.org/pypi/node.ext.ugm>`_ contract is expected.

.. note::

    ``cone.app`` currently requires Pyramid 1.1


Features
--------

* Base Application UI

* Authentication Integration

* Application Model Basics

* CRUD

* Workflows

* Common UI Widgets

* AJAX Helpers

* Application Extensions are organized by Plugins


Contents
--------

.. toctree::
   :maxdepth: 3

   Quickstart <quickstart>
   Plugins <plugins>
   Layout <layout>
   Application Model <model>
   Tiles <tiles>
   Forms <forms>
   Workflows <workflows>
   AJAX <ajax>

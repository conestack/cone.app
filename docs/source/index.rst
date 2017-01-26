.. cone.app documentation master file

.. image:: _static/cone.app.png

===========================================
cone - A Comprehensive Web Application Stub
===========================================

Introduction
------------

``cone.app`` offers a Web Application Stub built on top of the
`Pyramid <https://pylonsproject.org/docs/pyramid.html>`_ framework.

The authors of this package are coming from `Zope <https://zope.org>`_ and
`Plone <https://plone.org>`_ development, thus a developer originating those
domains will be familiar with lots of the concepts used.

The package does not aim to provide another CMS. ``cone.app`` provides
an environment for building Web Applications used to publish and modify
`node <http://pypi.python.org/pypi/node>`_ based data models.

Nodes describes a unified contract the data model must follow, regardless of
the physical data storage backend.

By depending on the node contracts, we ensure that data models are traversable
by Pyramid and can be published.

The same contracts make it possibe to build generic reusable User Interface
components. This components are primarily implemented as Tiles utilizing
`cone.tile <http://pypi.python.org/pypi/cone.tile>`_.

For AJAX operations `bdajax <http://pypi.python.org/pypi/bdajax>`_ is utilized.

`YAFOWIL <http://pypi.python.org/pypi/yafowil>`_ is used as Form processing
library.

For authentication and authorization
`node.ext.ugm <http://pypi.python.org/pypi/node.ext.ugm>`_ contract is expected.

`plumber <http://pypi.python.org/pypi/plumber>`_ is utilized
for providing several application model and UI related behaviors.

`Bootstrap <http://getbootstrap.com>`_ is used for a pretty, modern and
responsive look and feel.


Features
--------

* Base Application UI

* Authentication Integration

* Application Model Basics

* CRUD

* Workflows

* Common UI Elements

* AJAX Helpers

* Application Extensions as Plugins


Contents
--------

.. toctree::
   :maxdepth: 3

   Getting Started <quickstart>
   Application Configuration <configuration>
   Plugins <plugins>
   Layout <layout>
   Application Model <model>
   UI Widgets <widgets>
   Forms <forms>
   Workflows <workflows>
   AJAX <ajax>

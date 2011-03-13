Overview
========

``cone.app`` provides a common web application stub for pyramid.

This includes a base web application layout, authentication integration,
application model handling, view helpers and commonly needed UI widgets and
AJAX helpers.


Getting started
===============


Setup
-----

Create plugin python egg ``your.app`` and add ``cone.app`` to 
``install_requires`` in ``setup.py``.

Create ``buildout.cfg`` configuring the instance::

    [buildout]
    parts = instance
    eggs-directory = ${buildout:directory}/eggs
    develop = .

    [instance]
    recipe = zc.recipe.egg:scripts
    dependent-scripts = true
    initialization =
        import os
        os.environ['APP_PATH'] = '${buildout:directory}'
    eggs =
        your.app

Create ``yourapp.ini`` and add::

    [DEFAULT]
    debug = true
    
    [server:main]
    use = egg:Paste#http
    host = 0.0.0.0
    port = 8081
    
    [app:yourapp]
    # use cone.app main entry point
    use = egg:cone.app#main
    reload_templates = true
    debug_authorization = false
    debug_notfound = false
    debug_routematch = false
    debug_templates = true
    default_locale_name = en
    # cone.app specific settings
    cone.admin_user = admin
    cone.admin_password = admin
    cone.secret_password = 12345
    cone.plugins = your.app
    cone.root.title = your app
    
    [pipeline:main]
    pipeline =
        yourapp

``cone.app`` specific Settings:

``cone.admin_user``
    Login name of Superuser

``cone.admin_password``
    Password of Superuser

``cone.secret_password``
    Cookie encryption password

``cone.plugins``
    List of eggs plugging to ``cone.app``. Plugins are included by invoking the
    plugin package ``configure.zcml``.

``cone.root.title``
    Title of the Application


Application Model
-----------------

An application model provides the application hierarchy, security
declarations, UI configuration and type information for authoring.

The base application node utilizes `node <http://pypi.python.org/pypi/node>`_.

``cone.app.interfaces.IApplicationNode`` extend this interface by:

    - An ``__acl__`` property defining security. See documentation of
      ``pyramid.security`` for details.
    
    - A ``properties`` property, containing IProperties implementing object.
      This properties usually hold UI configuration information.
    
    - A ``metadata`` property, containing IMetadata implementing object.
      Metadata are used by different UI widgets to display metadata
      information.
    
    - A ``nodeinfo`` property containing INodeInfo implementing object.
      NodeInfo provides cardinality information and general node information
      which is primary needed for authoring operations.

Provide plugin root node in ``your.app.model``::

    >>> from cone.app.model import BaseNode
    >>> class YourApp(BaseNode): pass

Hook this application node to ``cone.app`` in ``your.app.__init__``::

    >>> import cone.app
    >>> cone.app.register_plugin('yourapp', YourApp)


Views
-----

``cone.app`` strictly follows the concept of tiles. Each part of the
application is represented by a tile, i.e. main menu, navigation tree, site
content area, etc..

This gives us following characteristics:

    - Abstraction of the site to several 'subapplications' which could be
      views, widgets and/or controllers.
    
    - The possibility to create generic tiles by the contract of
      ``cone.app.interfaces.IApplicationNode``.
    
    - AJAX is easily integrateable.

Create a package named ``browser``. Define the root content tile in
``__init__.py`` of browser package. Name it ``content`` and 
register it for your root node::

    >>> from cone.tile import registerTile
    >>> from cone.app.browser.layout import ProtectedContentTile
    >>> from your.app.model import YourApp
    
    >>> registerTile('content',
    ...              'your.app:browser/templates/yourapp.pt',
    ...              interface=YourApp,
    ...              class_=ProtectedContentTile,
    ...              permission='login')

Also create a page template named ``myapp.pt`` at the indicated location::

    <div>
       Your app content.
    </div>

Tell your plugin to scan the available views in ``configure.zcml``::

    <scan package=".browser" />


Testing
-------

* run buildout
  
* start server with ``./bin/paster serve yourapp.ini``

If everything is ok the application is available at ``localhost:8081``.


Documentation
=============

XXX: point to full documentation


Copyright
=========

    - Copyright (c) 2009-2011 BlueDynamics Alliance http://www.bluedynamics.com


Contributors
============

    - Robert Niederreiter <rnix@squarewave.at>
    
    - Jens Klein <jens@bluedynamics.com>
    
    - Georg Gogo. BERNHARD <gogo@bluedynamics.com>


Changes
=======

0.9
---

    - Initial work

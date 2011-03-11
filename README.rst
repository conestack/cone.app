Overview
========

``cone.app`` provides a common web application stub for pyramid.

This includes a base web application layout, authentication integration,
application model handling, view helpers and commonly needed UI widgets and
AJAX helpers.


Setup
=====

Application egg
---------------

Create your application egg and make it depend on ``cone.app``.

Include the package ``cone.app`` in the ``configure.zcml`` of your 
application egg to make sure everything needed to run the application.::

    <configure xmlns="http://pylonshq.com/pyramid">
        <include package="cone.app" />
        ...
    </configure>


Buildout
--------

Assuming ``Paster`` for WSGI deployment and buildout for the application setup,
your (self contained) buildout configuration might look like this.::

    [buildout]
    parts = instance
    eggs-directory = ${buildout:directory}/eggs
    develop = .
        
    [instance]
    recipe = repoze.recipe.egg:scripts
    eggs =
        your.application.egg


Authentication and Authorization Configuration
----------------------------------------------

XXX


Configure the WSGI pipeline
---------------------------

Here we use ``Paster`` to server our application.

We have to provide a configuration which ties all things together.

Create a file like ``yourapplication.ini`` which looks similar to this.::

    [DEFAULT]
    debug = true
    
    [server:main]
    use = egg:Paste#http
    host = 0.0.0.0
    port = 8081
    
    [app:cone]
    use = egg:cone.app#main
    reload_templates = true
    debug_authorization = false
    debug_notfound = false
    debug_routematch = false
    debug_templates = true
    default_locale_name = en
    cone.admin_user = admin
    cone.admin_password = admin
    cone.secret_password = 12345
    #cone.auth_impl = 
    #cone.plugins = 
    cone.root.title = cone
    #cone.root.default_child = 
    cone.root.mainmenu_empty_title = false
    
    [pipeline:main]
    pipeline =
        cone


Extend Application with a plugin
--------------------------------

XXX


Provide views for your model nodes
----------------------------------

Now we have to provide tile for our model. Name it ``content`` and register
it for the root node in order to render it.

See documentation of package ``cone.tile`` for more info about tiles and
section "Reserved Tiles" which describe the application layout view hooks for
your model.

Create a package named ``browser`` in you application egg. Define the root 
content tile in ``__init__.py`` of browser package.
::

    >>> from cone.tile import registerTile
    >>> from cone.app.browser.layout import ProtectedContentTile
    >>> from yourapplication.model import Root
    
    >>> registerTile('content',
    ...              'yourapplication:browser/templates/foo.pt',
    ...              interface=Foo,
    ...              class_=ProtectedContentTile,
    ...              permission='login')

Also create a page template named ``foo.pt`` at the indicated location.
::

    <div>
      Foo content
    </div>

Now add the following line to your applications ``configure.zcml`` to scan the
available views.
::

     <scan package=".browser" />


Test the setup
--------------

Now the base application setup is done. Test your setup by
::

  - running buildout
  
  - and starting the WSGI pipline like
    ``./bin/paster serve yourapplication.ini``

You should be able now to browse the application at ``localhost:8080``.


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

1.0dev
------

    - Initial work [rnix]

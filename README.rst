Overview
========

``cone.app`` provides a common web application stub.

This includes a base web application layout, authentication integration,
application model handling, view helpers and commonly needed UI widgets and
AJAX helpers.


Setup
=====

Application egg
---------------

Create your application egg and make it depend on ``cone.app``. You must
depend your application as well to your prefered ``repoze.what`` plugin, i.e. 
``repoze.what.plugins.ini`` which is used in example below.

Include the package ``cone.app`` in the ``configure.zcml`` of your 
application egg to make sure everything needed to run the framework is
available.
::

    <configure xmlns="http://pylonshq.com/pyramid">
        <include package="cone.app" />
        ...
    </configure>


Buildout
--------

Assuming ``Paster`` for WSGI deployment and buildout for the application setup,
your (self contained) buildout configuration might look like this.
::

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




Configure the WSGI pipeline
---------------------------

Here we use ``Paster`` to server our application.

We have to provide a configuration which ties all things together.

Create a file like ``yourapplication.ini`` which looks similar to this.
::

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
    #cone.authn_policy_factory = 
    #cone.authz_policy_factory = 
    cone.secret_password = 12345
    
    [pipeline:main]
    pipeline =
        cone


Provide the application
-----------------------

Provide the entry point ``yourapplication#app`` defined in the configuration
above in your ``setup.py``. This entry point returns a WSGI app.
::

    >>> setup(  
    ...     #...  
    ...     entry_points="""\
    ...         [paste.app_factory]
    ...         app = yourapplication.run:app
    ...     """
    ...     #...
    ... )

``yourapplication/run.py`` looks like this.
::

    >>> from pyramid.config import Configurator
    >>> from yourapplication.model import get_root
    
    >>> def app(global_config, **settings):
    ...     """ This function returns a WSGI application.
    ...     """
    ...     zcml_file = settings.get('configure_zcml', 'configure.zcml')
    ...     config = Configurator(
    ...         root_factory=get_root,
    ...         settings=settings,
    ...         autocommit=True)
    ...     config.begin()
    ...     config.load_zcml(zcml_file)
    ...     config.end()
    ...     return config.make_wsgi_app()


Provide the application model
-----------------------------

The imported get_root function above is responsible to return the application
model root node. Create a file ``model.py`` which looks like.
::

    >>> from cone.app.model import BaseNode
    
    >>> class Root(BaseNode):
    ...     """Your application root Node.
    ...     """
    ...     title = "YourApplication"
    
    >>> root = Root()
    
    >>> def get_root(environ):
    ...     return root

See documentation of package ``node`` for more info about Nodes and section
"Application model" for how it is used in ``cone.app``. 


Provide a view for your root node
---------------------------------

Now we have to provide a tile. Name it ``content`` and register it for the root 
node in order to render it.

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
    ...              'yourapplication:browser/templates/root.pt',
    ...              interface=Root,
    ...              class_=ProtectedContentTile,
    ...              permission='login',
    ...              strict=False)

Also create a page template named ``root.pt`` at the indicated location.
::

    <div>
      Root content
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

    - Copyright (c) 2009-2010 BlueDynamics Alliance http://www.bluedynamics.com


Contributors
============

    - Robert Niederreiter <rnix@squarewave.at>
    
    - Jens Klein <jens@bluedynamics.com>
    
    - Georg Gogo. BERNHARD <gogo@bluedynamics.com>


Changes
=======

1.0b1
-----

    - Initial work [rnix]
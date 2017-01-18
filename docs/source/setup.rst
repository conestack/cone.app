=====
Setup
=====

In order to use ``cone.app``, an integration package is created. This package
contains the buildout and application configuration.

``cone.app`` based applications are organized by plugins. Thus, the integration
package might directly contain the plugin code, or the plugin is created in
a seperate package.


Hello world
===========

In this example a package named ``example.app`` is created, which contains the
plugin code and the application configuration.


Create the package
------------------

Create a python egg named ``example.app`` with a folder structure like this and
featuring the following files. Instructions follow :-) ::

    example.app/
        bootstrap.py
        buildout.cfg
        example.ini
        setup.py
        src/
            example/
                __init__.py
                app/
                    __init__.py
                    browser/
                    templates/
                        example.pt
                    configure.zcml
                    model.py


The package must depend on ``cone.app`` as installation dependency.
``bootstrap.py`` and ``setup.py`` must be copied from somewhere or reinvented,
see http://docs.python.org/distutils/setupscript.html#writing-the-setup-script
and wget http://python-distribute.org/bootstrap.py .
But let's first create the config files before we start and try to run it.


Buildout
--------

Edit ``buildout.cfg`` and add.

.. code-block:: ini

    [buildout]
    parts = instance
    eggs-directory = ${buildout:directory}/eggs
    develop = .

    [instance]
    recipe = zc.recipe.egg:scripts
    dependent-scripts = true
    eggs =
        example.app


INI configuration
-----------------

Create ``example.ini`` and add.

.. code-block:: ini

    [DEFAULT]
    debug = true

    [server:main]
    use = egg:Paste#http
    host = 0.0.0.0
    port = 8081

    [app:example]
    use = egg:cone.app#main
    reload_templates = true

    # paster debugging flags
    debug_authorization = false
    debug_notfound = false
    debug_routematch = false
    debug_templates = true
    default_locale_name = en

    # cone.app admin user and password
    cone.admin_user = admin
    cone.admin_password = admin

    # cone.app auth tkt settings
    cone.auth_secret = 12345
    #cone.auth_cookie_name =
    #cone.auth_secure =
    #cone.auth_include_ip =
    #cone.auth_timeout =
    #cone.auth_reissue_time =
    #cone.auth_max_age =
    #cone.auth_http_only =
    #cone.auth_path =
    #cone.auth_wild_domain =
    #cone.auth_impl =

    # plugins to be loaded
    cone.plugins = example.app

    # application title
    cone.root.title = example

    # default child of cone.app root model node
    cone.root.default_child = example

    # flag whether to suppress rendering main menu titles
    cone.root.mainmenu_empty_title = false

    [pipeline:main]
    pipeline =
        example


Available INI configuration parameters
......................................

*cone.admin_user*
    Login name of Superuser

*cone.admin_password*
    Password of Superuser

*cone.auth_secret*
    Cookie encryption password

*cone.auth_cookie_name*
    Default: ``auth_tkt``. The cookie name used

*cone.auth_secure*
    Default: ``False``. Only send the cookie back over a secure conn.

*cone.auth_include_ip*
    Default: ``False``.  Make the requesting IP address part of the
    authentication data in the cookie.

*cone.auth_timeout*
    Default: ``None``.  Maximum number of seconds which a newly issued ticket
    will be considered valid.

*cone.auth_reissue_time*
    Default: ``None``.  If this parameter is set, it represents the number of
    seconds that must pass before an authentication token cookie is reissued.

*cone.auth_max_age*
    Default: ``None``.  The max age of the auth_tkt cookie, in seconds. This
    differs from ``timeout`` inasmuch as ``timeout`` represents the lifetime
    of the ticket contained in the cookie, while this value represents the
    lifetime of the cookie itself.

*cone.auth_http_only*
    Default: ``False``. Hide cookie from JavaScript by setting the HttpOnly
    flag.

*cone.auth_path*
    Default: ``/``. The path for which the auth_tkt cookie is valid.

*cone.auth_wild_domain*
    Default: ``True``. An auth_tkt cookie will be generated for the wildcard
    domain.

*cone.auth_impl*
    UGM implementation to use for authentication and principal authorization.
    If not set, only ``cone.admin_user`` is available. It's recommended
    to avoid setting a global superuser via ini file for live deployments.
    ``cone.auth_impl`` is not considered at any place in cone.app. This is left
    to the UGM implementation creating application hook callback.

*cone.plugins*
    List of eggs plugging to ``cone.app``. Plugins are included by invoking the
    plugin package ``configure.zcml``.

*cone.root.title*
    Title of the Application

*cone.root.default_child*
    Default child of cone.app root model node

*cone.root.mainmenu_empty_title*
    Flag whether to suppress rendering main menu titles


Application model
-----------------

The application model consists of nodes providing the application hierarchy,
security declarations, UI configuration and node type information for authoring.

The base application node utilizes `node <http://pypi.python.org/pypi/node>`_
and is described in ``cone.app.interfaces.IApplicationNode``. This interface
inherits from ``node.interfaces.INode`` and extends it by:

*__acl__*
    Property defining security. See documentation of ``pyramid.security`` for
    details.

*properties*
    Property containing ``cone.app.IProperties`` implementing object. This
    properties usually hold UI configuration information.

*metadata*
    Property containing ``cone.app.IMetadata`` implementing object. Metadata
    are used by different UI widgets to display node metadata.

*nodeinfo*
    Property containing ``cone.app.INodeInfo`` implementing object. NodeInfo
    provides cardinality information and general node information which is
    primary needed for authoring operations.

Create plugin root node in ``example/app/model.py``.

.. code-block:: python

    from cone.app.model import BaseNode

    class ExampleApp(BaseNode):
        pass

Hook this application node to ``cone.app`` in ``example.app.__init__``.

.. code-block:: python

    import cone.app
    import my.app.model import MyApp

    cone.app.register_plugin('example', ExampleApp)


Views
-----

``cone.app`` follows the concept of tiles. Each part of the application is
represented by a tile, i.e. main menu, navigation tree, site content area, etc.

The implementation and more documentation of tiles can be found here
`cone.tile <http://pypi.python.org/pypi/cone.tile>`_.

The use of tiles has the following advantages:

- Abstraction of the site to several "subapplications" which act as
  views, widgets and/or controllers.

- The possibility to create generic tiles by the contract of
  ``cone.app.interfaces.IApplicationNode``.

- AJAX is easily integrateable.


In ``cone.app`` some reserved tile names exist. One of this is ``content``,
which is reserved for rendering the "content area" of the page.

Each application node must at least register a tile named ``content`` for each
application node it provides in order to display it in the layout.

Create a package named ``browser`` in ``example.app``. Define the root content
tile in ``__init__.py`` of the browser package and register it for the plugin
root node.

.. code-block:: python

    from cone.tile import registerTile
    from cone.app.browser.layout import ProtectedContentTile
    from example.app.model import ExampleApp

    registerTile('content',
                 'your.app:browser/templates/exampleapp.pt',
                 interface=ExampleApp,
                 class_=ProtectedContentTile,
                 permission='login')

Also create the page template named ``exampleapp.pt`` at the indicated location.

.. code-block:: html

    <div>
       Example app content.
    </div>

Tell your plugin to scan the available views in ``configure.zcml``.

.. code-block:: xml

    <?xml version="1.0" encoding="utf-8" ?>
    <configure xmlns="http://pylonshq.com/pyramid">
      <include package="pyramid_zcml"/>
      <scan package=".browser" />
    </configure>


Install and run application
---------------------------

To install and run the application, run buildout and then start paster server.

.. code-block:: sh

    python bootstrap.py
    ./bin/buildout
    ./bin/paster serve example.ini

The application is now available at ``localhost:8081``.

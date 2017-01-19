.. _quickstart:

=================
Quick Start Guide
=================

Overview
========

In order to use ``cone.app``, an integration package is created. This package
contains the buildout and application configuration.

``cone.app`` based applications are organized by plugins. Thus, the integration
package might directly contain the plugin code, or the plugin is created in
a seperate package.


Getting Started
===============

In this example a package named ``cone.example`` is created, which contains the
plugin code and the application configuration.

.. note::

    The final example plugin created during this documentation can be found
    `here <https://github.com/bluedynamics/cone.app/tree/master/examples>`_.


Create file system structure
----------------------------

Create a python egg named ``cone.example`` with the following file system
structure::

    cone.example/
        bootstrap.sh
        buildout.cfg
        example.ini
        setup.py
        src/
            cone/
                __init__.py
                example/
                    __init__.py
                    browser/
                        templates/
                            example.pt
                    configure.zcml
                    model.py


Setup
-----

The package must depend on ``cone.app`` as installation dependency.

Create a ``setup.py`` containing:

.. code-block:: python

    from setuptools import find_packages
    from setuptools import setup

    version = '0.1'
    shortdesc = 'Example cone plugin'

    setup(
        name='cone.example',
        version=version,
        description=shortdesc,
        packages=find_packages('src'),
        package_dir={'': 'src'},
        namespace_packages=['cone'],
        include_package_data=True,
        zip_safe=False,
        install_requires=[
            'cone.app'
        ]
    )


Bootstrap
---------

Add ``bootstrap.sh`` containing:

.. code-block:: sh

    #!/bin/sh
    rm -r ./lib ./include ./local ./bin
    virtualenv --clear --no-site-packages .
    ./bin/pip install --upgrade pip setuptools zc.buildout
    ./bin/buildout -N

Make this file executable.

.. code-block:: sh

    chmod +x bootstrap.sh


Buildout
--------

Add ``buildout.cfg`` configuration containing:

.. code-block:: ini

    [buildout]
    parts = instance
    eggs-directory = ${buildout:directory}/eggs
    develop = .
    versions = versions

    [versions]
    zc.buildout = 
    setuptools = 
    pyramid = 1.1.3
    pyramid-zcml = 0.9.2
    cone.app = 1.0a1

    [instance]
    recipe = zc.recipe.egg:scripts
    dependent-scripts = true
    eggs =
        cone.example


Application INI configuration
-----------------------------

Create ``example.ini`` and add:

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
    cone.plugins = cone.example

    # application root node settings
    cone.root.title = cone.example
    cone.root.default_child = example
    #cone.root.default_content_tile = 
    #cone.root.mainmenu_empty_title = false

    [pipeline:main]
    pipeline =
        example


Available INI configuration parameters
......................................

*cone.admin_user*
    Login name of superuser.

*cone.admin_password*
    Password of superuser.

*cone.auth_secret*
    Cookie encryption password.

*cone.auth_cookie_name*
    Default: ``auth_tkt``. The name used for auth cookie.

*cone.auth_secure*
    Default: ``False``. Only send the cookie back over a secure connection.

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
    Default: ``/``. The path for which the authentication cookie is valid.

*cone.auth_wild_domain*
    Default: ``True``. An authentication cookie will be generated for the
    wildcard domain.

*cone.auth_impl*
    UGM implementation to use for authentication and principal authorization.
    If not set, only ``cone.admin_user`` is available. It's recommended
    to avoid setting a global superuser via ini file for live deployments.
    ``cone.auth_impl`` is not considered at any place in ``cone.app``. This is
    left to the UGM implementation creating application hook callback.

*cone.plugins*
    List of ``cone.app`` plugin packages. Plugins are included by invoking the
    plugin package ``configure.zcml``.

*cone.root.title*
    Title of the application.

*cone.root.default_child*
    Default child of root model node.

*cone.root.default_content_tile*
    Default content tile for root model node.

*cone.root.mainmenu_empty_title*
    Flag whether to suppress rendering main menu titles.


ZCML Configuration
------------------

Add ``src/cone/example/configure.zcml`` containing:

.. code-block:: xml

    <?xml version="1.0" encoding="utf-8" ?>
    <configure xmlns="http://pylonshq.com/pyramid">
    </configure>

.. note::

    Right now this file is mandatory, but it will be optional in future.


Application Model
-----------------

The application model consists of nodes providing the application hierarchy,
security declarations, UI configuration and node type information for authoring.

The base application node utilizes `node <http://pypi.python.org/pypi/node>`_
and implements ``cone.app.interfaces.IApplicationNode``. Concrete model
implementations must implement the following additional properties apart from
being a node:

*__acl__*
    Property defining security. See documentation of ``pyramid.security`` for
    details.

*layout*
    Property containing ``cone.app.interfaces.ILayout`` implementing object.
    The layout object contains main layout configuration information.

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

Create plugin root node in ``src/cone/example/model.py``.

.. code-block:: python

    from cone.app.model import BaseNode

    class ExamplePlugin(BaseNode):
        pass

Plugin initialization code goes into the main hook function. Hook the
application node to the application model in ``src/cone/example/__init__.py``.

.. code-block:: python

    from cone.app import register_entry
    from cone.app import register_main_hook
    from cone.example.model import ExamplePlugin

    def example_main_hook(config, global_config, local_config):
        # register plugin entry node
        register_entry('example', ExamplePlugin)

    register_main_hook(example_main_hook)


Views
-----

``cone.app`` follows the concept of tiles in it's UI. Each part of the
application is represented by a tile, i.e. main menu, navigation tree, site
content area, etc.

The implementation and more documentation about tiles can be found
`here <http://pypi.python.org/pypi/cone.tile>`_.

The use of tiles has the following advantages:

- Abstraction of the site to several "subapplications" which act as
  views, widgets and/or controllers.

- The possibility to create generic tiles expecting model nodes providing the
  contract of ``cone.app.interfaces.IApplicationNode``.

- AJAX is easily integrateable.

In ``cone.app`` some reserved tile names exist. One of this is ``content``,
which is reserved for rendering the *Content Area* of the page.

Each application node must at least register a tile named ``content`` for each
application node it provides in order to display it in the layout.

To provide the ``content`` tile for the ``ExamplePlugin`` node, create
``src/cone/example/browser/__init__.py`` and register it like so:

.. code-block:: python

    from cone.app.browser.layout import ProtectedContentTile
    from cone.tile import registerTile
    from cone.example.model import ExamplePlugin

    registerTile(
        name='content',
        path='cone.example:browser/templates/example.pt',
        interface=ExamplePlugin,
        class_=ProtectedContentTile,
        permission='login')

Also create the corresponding page template in
``src/cone/example/browser/templates/example.pt`` and add:

.. code-block:: html

    <div>
       Example app content.
    </div>

Tell your plugin to scan the browser package in the main hook function to
ensure tile registration gets executed.

.. code-block:: python

    def example_main_hook(config, global_config, local_config):
        # register plugin entry node
        register_entry('example', ExamplePlugin)

        # scan browser package
        config.scan('cone.example.browser')


Install
-------

To install the application, run bootstrap.sh.

.. code-block:: sh

    ./bootstrap.sh

If you have changes in setup dependencies of buildout config, run buildout to
update.

.. code-block:: sh

    ./bin/buildout


Run Application
---------------

.. code-block:: sh

    ./bin/paster serve example.ini

The application is now available at ``localhost:8081``.

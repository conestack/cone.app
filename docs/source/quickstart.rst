===============
Getting Started
===============

Overview
--------

In order to use ``cone.app``, an integration package must be created. This
package contains the buildout and application configuration.

``cone.app`` extensions are organized as Plugins. Thus, the integration
package may contain the Plugin code directly, or the Plugin is created as
seperate package.

In this documentation a package named ``cone.example`` is created, which
contains both the integration and plugin code.

.. note::

    The example package created in this documentation can be found in the
    `Github repository
    <https://github.com/bluedynamics/cone.app/tree/master/examples>`_.


Create Python Package
---------------------

First thing to do is to create a python package.

Create a directory named ``cone.example`` with the following structure::

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

Add ``setup.py``. The package must depend on ``cone.app`` as installation
dependency:

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

The package hooks up to the `namespace package <http://setuptools.readthedocs.io/en/latest/setuptools.html#namespace-packages>`_
 ``cone``, so ``src/cone/__init__.py`` must contain:

.. code-block:: python

    __import__('pkg_resources').declare_namespace(__name__)


Bootstrap Script
----------------

`Virtualenv <https://virtualenv.pypa.io/en/stable>`_ and
`Buildout <https://pypi.python.org/pypi/zc.buildout>`_ are used to setup the
application. Add a ``bootstrap.sh`` script, which creates the isolated python
environment, installs ``zc.buildout`` and invokes the installation.

.. code-block:: sh

    #!/bin/sh
    rm -r ./lib ./include ./local ./bin
    virtualenv --clear --no-site-packages .
    ./bin/pip install --upgrade pip setuptools zc.buildout
    ./bin/buildout -N

Make this script executable.

.. code-block:: sh

    chmod +x bootstrap.sh


Buildout Configuration
----------------------

Buildout configuration is contained in ``buildout.cfg``. The minimal
configuration for properly setting up the application looks like:

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
    eggs = cone.example


Application Configuration
-------------------------

``cone.app`` uses `PasteDeploy <pythonpaste.org/deploy>`_ for application
configuration. PasteDeploy defines a way to declare WSGI application
configuration in an ``.ini`` file.

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

    # pyramid related configuration useful for development
    reload_templates = true

    debug_authorization = false
    debug_notfound = false
    debug_routematch = false
    debug_templates = true

    # default language
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

Details about the available ``cone.app`` dedicated configuration options can be
found in the :doc:`Application Configuration <configuration>` documentation.


ZCML Configuration
------------------

Plugins are expected to contain a :ref:`ZCML<plugin_zcml>` configuration which
may contain configuration directives. Add ``src/cone/example/configure.zcml``
containing:

.. code-block:: xml

    <?xml version="1.0" encoding="utf-8" ?>
    <configure xmlns="http://pylonshq.com/pyramid">

    </configure>


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


Installation
------------

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

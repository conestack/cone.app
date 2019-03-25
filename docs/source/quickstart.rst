===============
Getting Started
===============

In order to use ``cone.app``, an integration package must be created. This
package contains the application code and configuration.

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

First thing to do is to create a
`Python Package <https://python-packaging.readthedocs.io/en/latest/>`_.

Create a directory named ``cone.example`` with the following structure::

    cone.example
    ├── bootstrap.sh
    ├── example.ini
    ├── setup.py
    └── src
        └── cone
            ├── example
            │   ├── browser
            │   │   ├── __init__.py
            │   │   ├── static
            │   │   │   ├── example.css
            │   │   │   └── example.js
            │   │   └── templates
            │   │       └── example.pt
            │   ├── configure.zcml
            │   ├── __init__.py
            │   └── model.py
            └── __init__.py

The package must depend on ``cone.app`` and ``waitress`` as installation
dependency. Add the following to ``setup.py``.

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
            'waitress',
            'cone.app'
        ]
    )

The package hooks up to the `namespace package <http://setuptools.readthedocs.io/en/latest/setuptools.html#namespace-packages>`_
``cone``, so ``src/cone/__init__.py`` must contain:

.. code-block:: python

    __import__('pkg_resources').declare_namespace(__name__)


Bootstrap Script
----------------

`Virtualenv <https://virtualenv.pypa.io/en/stable>`_ is used to setup the
application. Add a ``bootstrap.sh`` script, which creates the isolated python
environment, and installs the dependencies.

.. code-block:: sh

    #!/bin/sh
    rm -r ./lib ./include ./local ./bin ./share
    python3 -m venv.
    ./bin/pip install pyramid==1.9.4
    ./bin/pip install repoze.zcml==1.0b1
    ./bin/pip install repoze.workflow==1.0b1
    ./bin/pip install -e .

Make this script executable.

.. code-block:: sh

    chmod +x bootstrap.sh


Application Configuration
-------------------------

``cone.app`` uses `PasteDeploy <http://pastedeploy.readthedocs.io/en/latest/>`_
for application configuration. PasteDeploy defines a way to declare WSGI
application configuration in an ``.ini`` file.

Create ``example.ini`` and add:

.. code-block:: ini

    [DEFAULT]
    debug = true

    [server:main]
    use = egg:waitress#http
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

Plugins may contain a :ref:`ZCML <plugin_zcml>` configuration which
contains ZCML configuration directives. If desired, add
``src/cone/example/configure.zcml`` containing:

.. code-block:: xml

    <?xml version="1.0" encoding="utf-8" ?>
    <configure xmlns="http://pylonshq.com/pyramid">
      <!-- configuration directives goes here -->
    </configure>


Static Resources
----------------

Delivering :ref:`static resources <plugin_static_resources>` is done by
registering a directory for serving the assets and telling the application
which files to deliver to the browser.

Create ``src/cone/example/browser/static`` directory containing ``example.css``
and ``example.js``.

Create a static view for the ``static`` directory in
``src/cone/example/browser/__init__.py``:

.. code-block:: python

    from pyramid.static import static_view

    static_resources = static_view('static', use_subpath=True)

Register the static view and tell the application to deliver the
CSS and JS file to the browser. This is done inside the
:ref:`Plugin main hook function <plugin_main_hook>`.

Add the plugin main hook function in ``src/cone/example/__init__.py``
containing.

.. code-block:: python

    from cone.app import main_hook
    import cone.app

    @main_hook
    def example_main_hook(config, global_config, local_config):
        """Function which gets called at application startup to initialize
        this plugin.
        """
        # register static resources view
        config.add_view(
            'cone.example.browser.static_resources',
            name='example-static')

        # register static resources to be delivered
        cone.app.cfg.css.public.append('example-static/example.css')
        cone.app.cfg.js.public.append('example-static/example.js')


Application Model
-----------------

``cone.app`` uses the traversal mechanism of Pyramid and utilize
`node <http://pypi.python.org/pypi/node>`_ package for publishing.

Publishable nodes are expected to implement
``cone.app.interfaces.IApplicationNode``. A basic application node is shipped
with ``cone.app`` which can be used to start implementing the application model
from.

Detailed information about the application model can be found in the
:doc:`Application Model <model>` documentation.

Create plugin entry node in ``src/cone/example/model.py``.

.. code-block:: python

    from cone.app.model import BaseNode

    class ExamplePlugin(BaseNode):
        pass

The application needs to know about the application model entry node. This is
done by registering it with ``register_entry`` inside the
:ref:`Plugin main hook function <plugin_main_hook>`.

Extend the main hook function in ``src/cone/example/__init__.py`` and register
the model.

.. code-block:: python

    from cone.app import main_hook
    from cone.app import register_entry
    from cone.example.model import ExamplePlugin

    @main_hook
    def example_main_hook(config, global_config, local_config):
        # register plugin entry node
        register_entry('example', ExamplePlugin)


UI Widgets
----------

``cone.app`` follows the concept of tiles in it's UI. Each part of the
application is represented by a tile, i.e. main menu, navigation tree, site
content area, etc.

The implementation and more documentation about tiles can be found
`here <http://pypi.python.org/pypi/cone.tile>`_.

Detailed information about the available UI elements can be found in the
:doc:`UI Widgets <widgets>` documentation.

To render the *Content Area* of the UI for the ``ExamplePlugin`` node, a tile
named ``content`` must be created. Add ``src/cone/example/browser/__init__.py``
and register it like so:

.. code-block:: python

    from cone.app.browser.layout import ProtectedContentTile
    from cone.example.model import ExamplePlugin
    from cone.tile import tile

    @tile(name='content',
          path='templates/example.pt',
          interface=ExamplePlugin,
          permission='login')
    class ExamplePluginContent(ProtectedContentTile):
        pass

Also create the corresponding page template in
``src/cone/example/browser/templates/example.pt`` containing:

.. code-block:: html

    <div>
       Example app content.
    </div>

Tell your plugin to scan the browser package inside the
:ref:`Plugin main hook function <plugin_main_hook>` to ensure tile registration
gets executed.

.. code-block:: python

    from cone.app import main_hook

    @main_hook
    def example_main_hook(config, global_config, local_config):
        # scan browser package
        config.scan('cone.example.browser')


Working with JavaScript
-----------------------

``cone.app`` utilizes `bdajax <http://pypi.python.org/pypi/bdajax>`_ for it's
user interface. The documentation how to properly integrate custom JavaScript
can be found :ref:`here <ajax_custom_javascript>`.


Installation
------------

To install the application, run bootstrap.sh.

.. code-block:: sh

    ./bootstrap.sh


Run Application
---------------

.. code-block:: sh

    ./bin/pserve serve example.ini

The application is now available at ``localhost:8081``.

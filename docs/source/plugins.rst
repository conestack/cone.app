=======
Plugins
=======

As explained in the :doc:`Getting Started <quickstart>` documentation,
applications are organized by plugins, shipping with related application models,
tiles and resources.

``cone.app`` provides a set of hooks for plugins to extend and customize the
application which are explained in the following sections.


.. _plugin_zcml:

ZCML
----

For each plugin registered in the application configuration ini file, a
``configure.zcml`` file must be provided which may contain package includes,
package scans and other ZCML directives, e.g.

.. code-block:: xml

    <?xml version="1.0" encoding="utf-8" ?>
    <configure xmlns="http://pylonshq.com/pyramid">

      <!-- directives go here -->

    </configure>

ZCML Configuration of plugins are loaded after ``cone.app`` basics are
initialized properly at application creation time.


.. _plugin_main_hook:

Plugin Main Hook
----------------

Plugin initialization code goes into the main hook function.

The main hook function of all plugins is executed after all plugin ZCML files
are loaded.

The hook gets passed the ``pyramid.config.Configurator`` object and the
``global_config`` and ``local_config`` dictionaries.

Configuration ini file contents are contained in ``local_config``. Thus you can
add plugin related custom settings to the application ini file and read them
inside the main hook.

.. code-block:: python

    from cone.app import register_main_hook

    def example_main_hook(config, global_config, local_config):
        """Initialization code goes here.
        """

    register_main_hook(example_main_hook)


Static Resources
----------------

A plugin may provide resources like JavaScipt and CSS files, images, and so
forth. Such resources are located in a seperate folder, which gets provided as
pyramid static resource.

.. code-block:: python

    from pyramid.static import static_view

    static_resources = static_view('static', use_subpath=True)

The static view gets registered in the plugin main hook.

.. code-block:: python

    def example_main_hook(config, global_config, local_config):

        # static resources
        config.add_view(
            'cone.example.browser.static_resources',
            name='example-static')

This configuration makes the resources available to the browser by URL, but no
CSS or JS files are delivered yet on page load. CSS and JS files can be
published for authenticated users only or for all users.

For delivering CSS and JS resources, register them ``cone.app.cfg.css``
respective ``cone.app.cfg.js``.

.. note::

    If you need to depend on resources delivered by another plugin make sure to
    register the resources inside the main hook function and that the plugin
    containing the dependencies is placed before your plugin is loaded at
    ``cone.plugins`` in the ini configuration.

    If you provide a plugin which is desired to be used as dependency for other
    plugins this also applies.

.. code-block:: python

    import cone.app

    # public CSS
    cone.app.cfg.css.public.append('example-static/public.css')

    # protected CSS
    cone.app.cfg.css.protected.append('example-static/protected.css')

    # public Javascript
    cone.app.cfg.js.public.append('example-static/public.js')

    # protected javascript
    cone.app.cfg.js.protected.append('example-static/protected.js')


Application Model
-----------------

Plugin root node factoies are registered to the application via
``cone.app.register_entry`` inside the main hook function.

.. code-block:: python

    from cone.app import register_entry
    import cone.example.model import ExamplePlugin

    def example_main_hook(config, global_config, local_config):
        # register plugin entry node
        register_entry('example', ExamplePlugin)

This makes the plugin model available to the browser via traversal.


Application Settings
--------------------

Plugin Settings are realized as well as application nodes. They are located
at ``app_root['settings']`` and can be registered to the application via
``cone.app.register_config``.

.. code-block:: python

    from cone.app import register_config
    from cone.app.model import BaseNode

    class ExampleSettings(BaseNode):
        """Plugin settings are provided by this node.
        """

    def example_main_hook(config, global_config, local_config):
        register_config('example', ExampleSettings)


Authentication
--------------

``cone.app`` provides pluggable authentication as long as the authentication
implementation follows the contract described in ``node.ext.ugm.interfaces``.

If a UGM implementation is provided, it makes sense to initialize it inside
an application startup main hook.

UGM implementations acting for authentication are added to
``cone.app.cfg.auth``.

.. code-block:: python

    import cone.app

    cone.app.cfg.auth.append(ugm_impl)

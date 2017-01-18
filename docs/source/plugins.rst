=======
Plugins
=======

As explained in the "setup" documentation, application extensions are
organized as plugins, shipping with related application models, tiles and 
resources.

``cone.app`` provides a set of hooks for plugins to extend and customize the
application which are explained in the following sections.


ZCML
----

For each plugin registered in the application configuration ini file, a
configure.zcml file must be provided which may contain package includes,
package scans and other ZCML directives, e.g.

.. code-block:: xml

    <?xml version="1.0" encoding="utf-8" ?>
    <configure xmlns="http://pylonshq.com/pyramid">
      
      <!-- directives go here -->
    
    </configure>

ZCML Configuration is loaded at application creation time.


Resources
---------

A plugin might provide resources like Javascipt and CSS files, images, and so
forth. Such resources are located in a seperate folder, which gets provided as
pyramid static resource.

.. code-block:: python

    from pyramid.static import static_view

    static_resources = static_view('static', use_subpath=True)

The static view gets registered in ``configure.zcml``.

.. code-block:: xml
  
    <view
      for="*"
      view=".browser.static_resources"
      name="example.static"
    />

This configuration makes the resources available to the browser by URL, but no
CSS or JS files are delivered yet on page load. CSS and JS files can be 
published for authenticated users only or for all users. 

For delivering CSS and JS resources, register them in plugin ``__init__.py``.

.. code-block:: python

    import cone.app

    # public CSS
    cone.app.cfg.css.public.append('example.static/public.css')

    # protected CSS
    cone.app.cfg.css.protected.append('example.static/protected.css')

    # public Javascript
    cone.app.cfg.js.public.append('example.static/public.js')

    # protected javascript
    cone.app.cfg.js.protected.append('example.static/protected.js')


Model
-----

A plugin root factory is registered to the application via 
``cone.app.register_plugin``.

.. code-block:: python

    from cone.app import register_plugin
    from example.app.model import ExampleApp

    register_plugin('example', ExampleApp)

This makes the plugin available to the browser via traversal.

Plugin Settings are realized as well as application nodes. They are located
at ``approot['settings']`` and can be registered to the application via
``cone.app.register_plugin_config``.

.. code-block:: python

    from cone.app import register_plugin_config
    from cone.app.model import BaseNode

    class ExampleSettings(BaseNode)
        """Plugin settings are provided by this node."""

    register_plugin_config('example', ExampleSettings)


Application startup
-------------------

If there is the need of performing some code on application startup, a main
hook function can be registered by any plugin (or other package). The main
hooks are performed after configuration loading. The hook gets passed the
``pyramid.config.Configurator`` object, global_config and local_config 
dictionaries.

.. code-block:: python

    from cone.app import register_main_hook

    def example_main_hook(config, global_config, local_config):
        """Initialization at application startup"""

    register_main_hook(example_main_hook)


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


UI
--

The main template of ``cone.app`` can be altered by overriding
``cone.app.cfg.main_template``.

.. code-block:: python

    import cone.app

    cone.app.cfg.main_template = 'example.app.browser:templates/main.pt'

When using the default main template, some tiles can be disabled globally
by settings some properties on ``cone.app.cfg.layout``.

Hide livesearch.

.. code-block:: python

    import cone.app
    cone.app.cfg.layout.livesearch = False

Hide personaltools.

.. code-block:: python

    cone.app.cfg.layout.personaltools = False

Hide main menu.

.. code-block:: python

    cone.app.cfg.layout.mainmenu = False

Hide pathbar.

.. code-block:: python

    cone.app.cfg.layout.pathbar = False

The contents of the left sidebar can be modified. Each string in the list is
a tile name.

.. code-block:: python

    cone.app.cfg.layout.sidebar_left = ['navtree']

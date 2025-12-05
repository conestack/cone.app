=======
Plugins
=======

As explained in the :doc:`Getting Started <quickstart>` documentation,
applications are organized by Plugins, shipping with related application Models,
Tiles and Resources.

``cone.app`` provides a set of hooks for plugins to extend and customize the
application which are explained in the following sections.


.. _plugin_zcml:

ZCML
----

For each plugin registered in the
:doc:`Application Configuration <configuration>` ``.ini`` file, a
``configure.zcml`` file can be provided containing ZCML directives,
e.g.

.. code-block:: xml

    <?xml version="1.0" encoding="utf-8" ?>
    <configure xmlns="http://pylonshq.com/pyramid">

      <!-- directives go here -->

    </configure>

ZCML Configuration of plugins are loaded after ``cone.app`` basics are
initialized properly at application creation time.

For more Information about ZCML take a look at the
`ZCML Documentation <http://zopetoolkit.readthedocs.io/en/latest/codingstyle/zcml-style.html>`_
and the
`Pyramid ZCML Integration <http://docs.pylonsproject.org/projects/pyramid_zcml/en/latest/>`_


.. _plugin_main_hook:

Plugin Main Hook
----------------

Plugin initialization code goes into the main hook function.

The main hook function of all plugins is executed after all ZCML files
are loaded. This happens in defined plugin registration order in application
``.ini`` file.

The hook gets passed the
`pyramid.config.Configurator <http://docs.pylonsproject.org/projects/pyramid/en/latest/api/config.html>`_
object and the ``global_config`` and ``settings`` dictionaries.

Configuration ``.ini`` file settings are contained in ``settings``. Thus
plugin related custom settings can be added to the application ``.ini`` file
and read inside the main hook.

Following tasks shall be implemented in the main hook function:

- Register application model entry nodes.

- Register application settings nodes.

- Register static resources.

- Register translations.

- Working with the Pyramid configurator object.

The main hook function is normally implemented and registered in the plugin
package ``__init__.py`` module.

.. code-block:: python

    from cone.app import main_hook

    @main_hook
    def example_main_hook(config, global_config, settings):
        """Initialization code goes here.
        """


.. _plugin_static_resources:

Static Resources
----------------

A plugin may provide resources like JavaScipt and CSS files, images, and so
forth. `webresource <http://pypi.python.org/pypi/webresource>`_ is utilized
for handling static resources.

Static resources need to be registered, this usually happens in the
``browser`` package's ``__init__`` file of the plugin.

.. code-block:: python

    import os
    import webresource as wr

    # expect resource files in ``static`` subfolder of ``browser`` package.
    resources_dir = os.path.join(os.path.dirname(__file__), 'static')

    cone_example_resources = wr.ResourceGroup(
        name='cone.example',
        directory=resources_dir,
        path='example'
    )
    cone_example_resources.add(wr.ScriptResource(
        name='cone-example-js',
        depends='cone-app-protected-js',
        resource='cone.example.js',
        compressed='cone.example.min.js'
    ))
    cone_example_resources.add(wr.StyleResource(
        name='cone-example-css',
        resource='cone.example.css',
        compressed='cone.example.min.css'
    ))

    def configure_resources(config, settings):
        # see ``cone.app.browser.resources.ResourceRegistry``
        config.register_resource(cone_example_resources)
        config.set_resource_include('cone-example-js', 'authenticated')
        config.set_resource_include('cone-example-css', 'authenticated')

``configure_resources`` must be called in the plugin main hook.

.. code-block:: python

    from cone.app import main_hook
    from cone.example.browser import configure_resources

    @main_hook
    def example_main_hook(config, global_config, settings):
        # static resources
        configure_resources(config, settings)


.. _plugins_application_model:

Application Model
-----------------

Plugin root node factories are registered to the application via
``cone.app.register_entry`` inside the main hook function.

.. code-block:: python

    from cone.app import main_hook
    from cone.app import register_entry
    import cone.example.model import ExamplePlugin

    @main_hook
    def example_main_hook(config, global_config, settings):
        # register plugin entry node
        register_entry('example', ExamplePlugin)

This makes the plugin model available to the browser via traversal.


.. _plugins_application_settings:

Application Settings
--------------------

Plugin settings are implemented as application nodes extending
``cone.app.model.SettingsNode``. They are located at ``app_root['settings']``
and registered via ``cone.app.register_config``.

.. code-block:: python

    from cone.app import main_hook
    from cone.app import register_config
    from cone.app.model import SettingsNode
    from cone.app.model import node_info

    @node_info(
        name='example_settings',
        title='Example Settings',
        description='Settings for the example plugin',
        icon='glyphicon glyphicon-cog')
    class ExampleSettings(SettingsNode):
        """Plugin settings node."""
        # Category for grouping in settings UI
        category = 'Example'

        @property
        def display(self):
            # Control visibility in settings UI
            return True

    @main_hook
    def example_main_hook(config, global_config, settings):
        register_config('example', ExampleSettings)

Settings forms use the ``SettingsForm`` behavior and ``settings_form`` decorator:

.. code-block:: python

    from cone.app.browser.form import Form
    from cone.app.browser.settings import SettingsForm
    from cone.app.browser.settings import settings_form
    from plumber import plumbing
    from yafowil.base import factory

    @settings_form(interface=ExampleSettings)
    @plumbing(SettingsForm)
    class ExampleSettingsForm(Form):

        def prepare(self):
            # Form preparation
            self.form = factory(
                'form',
                name='examplesettings',
                props={'action': self.form_action}
            )
            # Add form fields...

The ``settings_form`` decorator accepts a ``permission`` keyword argument if the
settings should be editable by users without ``manage`` permission.

.. note::

    As of version 1.1, settings are accessible to authenticated users, not just
    managers. The ``display`` property on ``SettingsNode`` controls visibility
    per settings node.


Custom Threads
--------------

If a plugin starts non-daemon threads, a mechanism is provided to monitor
them and invoke a graceful shutdown when the main thread ends.

.. code-block:: python

    from cone.app import thread_shutdown_hook

    @thread_shutdown_hook
    def stop_non_daemon_thread():
        # graceful thread shutdown happens here

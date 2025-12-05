.. _migration_deprecated_patterns:

===========================
Migration from 1.0.x to 1.1
===========================

This section covers deprecated patterns and their replacements when upgrading
from ``cone.app`` 1.0.x to 1.1.


Package Layout
--------------

**Old (setup.py with explicit namespaces):**

.. code-block:: python

    # setup.py
    from setuptools import find_packages
    from setuptools import setup

    setup(
        name='cone.example',
        packages=find_packages('src'),
        package_dir={'': 'src'},
        namespace_packages=['cone'],
        ...
    )

    # src/cone/__init__.py
    __import__('pkg_resources').declare_namespace(__name__)

**New (pyproject.toml with implicit namespaces):**

.. code-block:: toml

    # pyproject.toml
    [build-system]
    requires = ["setuptools>=61.0"]
    build-backend = "setuptools.build_meta"

    [project]
    name = "cone.example"
    dependencies = ["cone.app"]

    [tool.setuptools.packages.find]
    where = ["src"]

    # src/cone/__init__.py - empty or non-existent


Resource Registration
---------------------

**Old (entries on global cfg object):**

An example of the old resource registration pattern can be found at
https://github.com/conestack/cone.ugm/blob/1.0.x/src/cone/ugm/__init__.py#L92

**New (webresource):**

.. code-block:: python

    import os
    import webresource as wr

    resources_dir = os.path.join(os.path.dirname(__file__), 'static')

    mypackage_resources = wr.ResourceGroup(
        name='mypackage',
        directory=resources_dir,
        path='mypackage'
    )
    mypackage_resources.add(wr.ScriptResource(
        name='mypackage-js',
        depends='cone-app-protected-js',
        resource='mypackage.js'
    ))
    mypackage_resources.add(wr.StyleResource(
        name='mypackage-css',
        resource='mypackage.css'
    ))

    def configure_resources(config, settings):
        config.register_resource(mypackage_resources)
        config.set_resource_include('mypackage-js', 'authenticated')
        config.set_resource_include('mypackage-css', 'authenticated')


JavaScript/Ajax
---------------

**Old (bdajax):** No longer supported.

**New (treibstoff):**

The JavaScript patterns are largely compatible. Main changes:

- Import from ``treibstoff`` instead of ``bdajax``
- Use ``ts.ajax.*`` namespace instead of ``bdajax.*``
- Updated overlay API

.. code-block:: javascript

    // Old bdajax pattern
    bdajax.register(function(context) {
        // ...
    });

    // New treibstoff pattern
    ts.ajax.register(function(context, options) {
        // ...
    });


Layout Configuration
--------------------

**Old (layout property or ILayout adapter):**

.. code-block:: python

    # Deprecated: layout property
    class MyNode(BaseNode):
        @property
        def layout(self):
            return Layout()

    # Deprecated: ILayout adapter
    from zope.component import adapter
    from zope.interface import implementer
    from cone.app.interfaces import ILayout

    @adapter(IMyNode)
    @implementer(ILayout)
    class MyNodeLayout(Layout):
        pass

**New (layout_config decorator):**

.. code-block:: python

    from cone.app import layout_config
    from cone.app.model import LayoutConfig

    @layout_config(IMyNode)
    class MyNodeLayoutConfig(LayoutConfig):

        def __init__(self, model, request):
            super().__init__(model, request)
            self.sidebar_left = ['navtree']


Form Rendering
--------------

**Old (EditTile, OverlayEditTile):**

.. code-block:: python

    # Deprecated
    from cone.app.browser.authoring import EditTile
    from cone.tile import tile

    @tile(name='editform', ...)
    class MyEditForm(EditTile):
        pass

**New (direct view rendering with FormTarget):**

.. code-block:: python

    from cone.app.browser.form import Form
    from cone.app.browser.form import EditFormTarget
    from cone.app.browser.authoring import ContentEditForm
    from cone.tile import tile
    from plumber import plumbing

    @tile(name='editform', ...)
    @plumbing(EditFormTarget, ContentEditForm)
    class MyEditForm(Form):
        action_resource = 'edit'

        def prepare(self):
            # Form preparation
            pass


YAML Forms
----------

**Old (form_flavor and form_action):**

.. code-block:: python

    # Deprecated
    @tile(name='exampleform', ...)
    @plumbing(YAMLForm)
    class ExampleYAMLForm(Form):
        form_flavor = 'edit'
        form_action = 'exampleform'

**New (YAMLEditFormTarget or YAMLAddFormTarget):**

.. code-block:: python

    from cone.app.browser.form import Form
    from cone.app.browser.form import YAMLForm
    from cone.app.browser.form import YAMLEditFormTarget
    from cone.tile import tile
    from plumber import plumbing

    @tile(name='exampleform', ...)
    @plumbing(YAMLForm, YAMLEditFormTarget)
    class ExampleYAMLForm(Form):
        action_resource = 'exampleform'
        form_template = 'cone.example.browser:forms/example.yaml'


Settings UI
-----------

**Old (custom settings implementation):**

Settings were only accessible to users with ``manager`` permission.

**New (SettingsNode and SettingsForm):**

.. code-block:: python

    from cone.app.model import SettingsNode
    from cone.app.model import node_info
    from cone.app.browser.form import Form
    from cone.app.browser.settings import SettingsForm
    from cone.app.browser.settings import settings_form
    from plumber import plumbing

    @node_info(name='example_settings', title='Example Settings')
    class ExampleSettings(SettingsNode):
        category = 'Example'

        @property
        def display(self):
            return True

    @settings_form(interface=ExampleSettings)
    @plumbing(SettingsForm)
    class ExampleSettingsForm(Form):
        pass

Settings are now accessible to authenticated users. The ``display`` property
controls visibility per settings node.


Bootstrap/jQuery Updates
------------------------

As of version 1.1:

- Bootstrap and jQuery have been updated to newer versions
- ``jquery-ui`` has been dropped
- ``mainmenu_fluid`` defaults to ``True``

Ensure your custom CSS and JavaScript is compatible with the updated versions.

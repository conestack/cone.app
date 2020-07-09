============
Translations
============

``cone.app`` uses the ``.po`` (portable object) and ``.pot``
(portable object template) extensions as translation files, which use
the `GNU gettext <http://www.gnu.org/software/gettext>`_ format.

For managing translations, `lingua <http://www.gnu.org/software/gettext>`_ is
used to create translations for different languages, extracting
translation strings from source code, and to compile message catalogs.

When working with YAFOWIL forms in ``YAML`` format, you also need to install
``yafowil.lingua`` additionally to ``lingua`` in order to get translations
extracted properly from the ``.yaml`` files.


Installation
------------

Install ``lingua`` either globally in your system python or to the virtual
environment the application is installed.

.. code-block:: sh

    sudo pip install lingua
    sudo pip install babel
    sudo pip install chameleon
    sudo pip install yafowil.lingua


Helper Script
-------------

Lingua provides a
`helper script <https://github.com/wichert/lingua/blob/master/docs/examples/i18n.sh>`_
which can be used for managing translations.

Copy the script to the plugin package directory and adopt the settings
parameters in the script.

.. code-block:: sh

    #!/bin/bash
    # Usage:
    #     Initial catalog creation (lang is the language identifier):
    #         ./i18n.sh lang
    #     Updating translation and compile catalog:
    #         ./i18n.sh

    # configuration
    DOMAIN="cone.example"
    SEARCH_PATH="src/cone/example"
    LOCALES_PATH="src/cone/example/locale"
    # end configuration

    # ...


Adding Translation Languages
----------------------------

For adding a new translation language, call ``i18n.sh`` with the desired
language code.

.. code-block:: sh

    ./i18n.sh de


Extracting and Compilation
--------------------------

For extracting translations and compiling the message catalog call the
``i18n.sh`` script without arguments. It will extract translation strings from
code followed from compiling message catalogs for all languages.

.. code-block:: sh

    ./i18n.sh


Including Translations
----------------------

To tell ``cone.app`` about the translations contained in the plugin, they must
be registered inside the :ref:`Plugin main hook function <plugin_main_hook>`.

.. code-block:: python

    def example_main_hook(config, global_config, local_config):
        # add translation
        config.add_translation_dirs('cone.example:locale/')


Providing Translation Strings
-----------------------------

Python
~~~~~~

Defining translation strings in python. A translation string factory must be
instanciated with the correct i18n domain which is used for creating
translation strings.

.. code-block:: python

    from pyramid.i18n import TranslationStringFactory

    _ = TranslationStringFactory('cone.example')

    translation_string = _(
        'example_translation_string',
        default='Example Translation String'
    )


Page Templates
~~~~~~~~~~~~~~

Defining translation strings in page templates. The ``i18n`` namespace and
the correct ``i18n:domain`` must be defined.

.. code-block:: xml

    <tal:block xmlns:tal="http://xml.zope.org/namespaces/tal"
               xmlns:i18n="http://xml.zope.org/namespaces/i18n"
               i18n:domain="cone.example"
               omit-tag="True">

      <span i18n:translate="example_translation_string">
        Example Translation String
      </span>

    </tal:block>


YAML Forms
~~~~~~~~~~

Defining translation strings in YAML forms.

.. code-block:: yaml

    factory: form
    name: exampleform
    widgets:
    - title:
        factory: field:label:text
        value: expr:context.model.attrs['title']
        props:
            label: i18n:title_label:Title

In order to make translations work in YAML forms, the correct translation
string factory must be provided on the form tile.

.. code-block:: python

    from cone.app.browser.form import Form
    from cone.app.browser.form import YAMLForm
    from plumber import plumbing
    from pyramid.i18n import TranslationStringFactory

    _ = TranslationStringFactory('cone.example')

    @plumbing(YAMLForm)
    class ExampleForm(Form):
        form_name = 'exampleform'
        form_template = 'cone.example.browser:forms/example.yaml'

        @property
        def message_factory(self):
            return _


ZCML
~~~~

Defining translation strings in ZCML files actually works the same way as for
XML files and page templates. However, lingua ships with a ZCML extractor which
works slightly different to what one would expect, and this extractor is set as
default extractor for .zcml file endings.

So when working with ZCML files containing translation strings it's recommended
to use the XML extractor instead of the default extractor. Therefor we create
a ``lingua.cfg`` file next to the ``i18n.sh`` script.

.. code-block:: ini

    [extensions]
    .zcml = xml

In the ``i18n.sh`` script we need to change the ``pot-create`` command to use this
config file.

.. code-block:: sh

    pot-create "$SEARCH_PATH" -c lingua.cfg -o "$LOCALES_PATH"/$DOMAIN.pot

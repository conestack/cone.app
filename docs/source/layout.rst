======
Layout
======

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

====
TODO
====

Docs
====

[X] - Complete layout docs
[X] - Overhaul UI Widgets docs
[X] - Overhaul forms docs
[X] - Overhaul workflows docs
[X] - Overhaul AJAX docs
[ ] - Document expected permissions for tiles and actions
[ ] - Create security docs
[ ] - Create translations documentation
[ ] - Create writing tests documenatation
[ ] - Create twisted integration documentation
[ ] - Create websocket integration documentation
[ ] - Create tutorial extending cone.example
[ ] - Proper cross linking all over the place


Roadmap
-------

1.0a2
-----

[ ] - Test ``cone.app.browser.actions.DropdownAction`` with BS3
[ ] - ``cone.app.browser.authoring.OverlayFormTile`` is superfluous.
[ ] - Overhaul settings rendering. available settings should be rendered in
      the navtree. ``SettingsBehavior`` for settings forms probably superfluous
      then.
[ ] - Set ``ISecured`` on ``cone.app.workflow.WorkflowACL``
[ ] - ``cone.app.browser.copysupport:124``: trigger ``contextchanged`` on
      ``#layout`` instead of ``.contextsensitiv``.
[ ] - Get rid of remaining ``contextsensitiv`` CSS class related bdajax
      bindings and remove ``contextsensitiv`` CSS class entirly from markup and
      tests.

1.0b1
-----

[ ] - Merge ``pyramid_upgrade`` branches back to master.
[ ] - Restore B/C compatibility for pyramid < 1.5
[ ] - Adopt docs for using ``waitress`` instead of ``paster``.
[ ] - Add template for creating ``cone.app`` plugins.
[ ] - Update to jQuery 2.0.
[ ] - Adopt livesearch JS intergration to provide hooks for passing typeahead
      options and datasets instead of just datasets.

1.0
---

[ ] - Add proper API docs to code and include in docs.

1.1
---

[ ] - Overhaul resource registration and delivery keeping B/C.
    [ ] - Think about using fanstatic
    [ ] - Add resource export as JSON if 3rd party build tool is preferred.
[ ] - Overhaul plugin entry hooks staying closer to pyramid if possible.

1.2
---

[ ] - Migrate Doctests to Unittests where appropriate.
[ ] - Python 3 support.

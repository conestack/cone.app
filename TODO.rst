====
TODO
====

Docs
====

[ ] Document expected permissions for tiles and actions

[ ] Create writing tests documenatation

[ ] Create twisted integration documentation

[ ] Create websocket integration documentation

[ ] Create tutorial extending cone.example

[ ] Proper cross linking all over the place


Roadmap
=======

1.0 beta
--------

[ ] Test ``cone.app.browser.actions.DropdownAction`` with BS3.

[ ] ``cone.app.browser.authoring.OverlayFormTile`` is superfluous.

[ ] Overhaul settings rendering. available settings should be rendered in
the navtree. ``SettingsBehavior`` for settings forms probably superfluous then.

[ ] Set ``ISecured`` on ``cone.app.workflow.WorkflowACL``

[ ] ``cone.app.browser.copysupport:124``: trigger ``contextchanged`` on
``#layout`` instead of ``.contextsensitiv``.

[ ] Get rid of remaining ``contextsensitiv`` CSS class related bdajax
bindings and remove ``contextsensitiv`` CSS class entirly from markup and
tests.

[ ] Bind sharing view to ``cone.app.interfaces.IPrincipalACL``.

[ ] Consolidate ``cone.app.model.AppSettings.__acl__```and
``cone.app.security.DEFAULT_SETTINGS_ACL`` which is not used yet in
``cone.app``.

[ ] Fix lookup in ACL registry. First node by class or base class and node
info name if given, Then by class or base class only if not found, then
by node info name only if no class given at lookup. Or so...

[ ] Create and use constants for all default roles and permissions.

[ ] Merge ``pyramid_upgrade`` branches back to master.

[ ] Restore B/C compatibility for pyramid < 1.5

[ ] Adopt docs for using ``waitress`` instead of ``paster``.

[ ] Adopt livesearch JS intergration to provide hooks for passing typeahead
options and datasets instead of just datasets.

[ ] Use ``BatchedItems`` as base for ``Table``.

[ ] ``cone.tile.Tile`` should point to template at ``template`` instead of
``path``.

[ ] Return unicode in ``cone.app.browser.utils.make_url`` and
``cone.app.browser.utils.make_query``.

1.0
---

[ ] Add proper API docs to code and include in docs.

1.1
---

[ ] Update to jQuery 2.0.

[ ] Add template for creating ``cone.app`` plugins.

[ ] Overhaul resource registration and delivery keeping B/C.

- Think about using fanstatic
- Add resource export as JSON if 3rd party build tool is preferred.

[ ] Overhaul plugin entry hooks staying closer to pyramid if possible.

[ ] Pyramid request wrapper for autobahn websocket requests to enable proper
security integration.

[ ] Rename ``cone.app.browser.batch.Batch`` to
``cone.app.browser.batch.Pagination`` provoding B/C.

1.2
---

[ ] Migrate Doctests to Unittests where appropriate.

[ ] Python 3 support.

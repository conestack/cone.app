====
TODO
====

Docs
====

[ ] Document expected permissions for tiles and actions

[ ] Create writing tests documenatation

[ ] Create twisted integration documentation

[ ] Create websocket integration documentation

[ ] Create tutorial extending ``cone.example``

[ ] Proper cross linking all over the place

[ ] Add proper API docs to code and include in docs.


Roadmap
=======

1.1
---

[ ] Consolidate "Unauthorized" and "Insufficient Privileges" tiles.

[ ] Check ``title`` of transition names before using ``name`` in workflow
    dropdown.

[ ] Change overlay forms selector to use dedicated overlay.

[ ] Bind sharing view to ``cone.app.interfaces.IPrincipalACL``.

[ ] Fix ACL registry lookup. First check by cls and node info name, then by
    class only and finally return default.

[ ] CopySupport is used both for marking containers supporting cut/copy/paste
    and objects being copyable. Make dedicated interface/mechanism for marking
    objects copyable.

[ ] Add template for creating ``cone.app`` plugins.

[ ] Overhaul resource registration and delivery keeping B/C.
    - Think about using fanstatic
    - Add resource export as JSON if 3rd party build tool is preferred.

[ ] Overhaul plugin entry hooks staying closer to pyramid if possible.

[ ] Pyramid request wrapper for autobahn websocket requests to enable proper
security integration.

[ ] ``cone.tile.Tile`` should point to template at ``template`` instead of
``path``.

[ ] Use ``BatchedItems`` as base for ``Table``.

[ ] Rename ``cone.app.browser.batch.Batch`` to
``cone.app.browser.batch.Pagination`` provoding B/C.

[ ] Provide a ``form_action`` property on ``cone.app.browser.form.Form``
considering ``action_resource`` attribute. Consolidate with
``cone.app.browser.Form.YAMLForm.form_action``.

[ ] Test ``cone.app.browser.actions.DropdownAction`` with BS3.

[ ] Overhaul settings rendering. available settings should be rendered in
the navtree. ``SettingsBehavior`` for settings forms probably superfluous then.

[ ] ``cone.app.browser.copysupport#124``: trigger ``contextchanged`` on
``#layout`` instead of ``.contextsensitiv``.

[ ] Get rid of remaining ``contextsensitiv`` CSS class related bdajax
bindings and remove ``contextsensitiv`` CSS class entirly from markup and
tests.

[ ] Consolidate ``cone.app.model.AppSettings.__acl__```and
``cone.app.security.DEFAULT_SETTINGS_ACL`` which is not used yet in
``cone.app``.

[ ] Fix lookup in ACL registry. First node by class or base class and node
info name if given, Then by class or base class only if not found, then
by node info name only if no class given at lookup. Or so...

[ ] Create and use constants for all default roles and permissions.

[ ] Adopt livesearch JS intergration to provide hooks for passing typeahead
options and datasets instead of just datasets.

[ ] Sharing tile table sorting by principal title instead of principal id

[ ] Bind navtree to ``list`` permission?

1.2
---

[ ] Update jQuery.

[ ] Update bootstrap.

[ ] Drop python 2.

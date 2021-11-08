Changes
=======

1.0.3 (2021-11-08)
------------------

- Add ``translation`` YAFOWIL blueprint.
  [rnix]

- Provide dedicated forbidden and not found views for request types `text/html`
  and `application/json`.
  [rnix]

- Implement move actions for changing order of children within it's container.
  [rnix]

- Move ``cone.app.browser.utils.node_path`` to ``cone.app.browser.node_path``.
  Import from old location is deprecated.
  [rnix]

- Introduce ``cone.app.NodeTraverser``. It ensures only ``IApplicationNode``
  implementing children get traversed.
  [rnix]

- Ignore children which not implements ``IApplicationNode`` in ``navtree``,
  ``mainmenu`` and ``listing`` tiles.
  [rnix]

- Consider ``INavigationLeaf`` interface in ``navtree`` tile.
  [rnix]

- Introduce ``cone.app.model.AppEnvironment`` behavior.
  [rnix]

- Introduce ``cone.app.model.Translation`` behavior.
  [rnix]

- Add language selection dropdown.
  [rnix]

**Breaking changes:**

- Change signature of internal ``MainMenu.ignore_node`` and
  ``MainMenu.create_item``. They do not expect the ``props`` argument any more.


1.0.2 (2021-10-21)
------------------

- Workflow transition title is taken from zcml transition title if no
  translation factory is defined.
  [rnix, 2021-08-06]

- Workflow state title is taken from zcml state title if no translation factory
  is defined.
  [rnix, 2021-08-06]

- Main template can be defined in the application ini config file.
  [rnix, 2021-08-06]

- Get label ``lookup`` function in reference browser widget directly from widget
  instance instead of using ``attr_value``. Lookup function is expected to be a
  callable accepting a uuid as argument while ``attr_value`` tries to invoke
  callables with widget and data as arguments. The code worked due to a B/C
  fallback behavior in ``attr_value`` which was dropped in yafowil 3.0.
  [rnix, 2021-07-08]

- Deliver CSS before Javascript in HTML head.
  [rnix, 2021-06-30]


1.0.1 (2021-05-17)
------------------

- Use ``safe_encode`` and ``safe_decode`` from ``node.utils``.
  [rnix, 2021-05-17]


1.0 (2021-02-07)
----------------

- Introduce ``cone.app.browser.content.content_view_tile`` decorator.
  [rnix, 2021-02-05]

- Introduce ``cone.app.browser.content.content_view_action`` decorator.
  [rnix, 2021-02-05]

- Introduce ``cone.app.browser.layout.personal_tools_action`` decorator.
  [rnix, 2021-02-04]

- Introduce ``cone.app.browser.contextmenu.context_menu_group`` and
  ``cone.app.browser.contextmenu.context_menu_item`` decorators.
  [rnix, 2021-02-04]

- Introduce ``cone.app.interfaces.IAuthenticator`` utility.
  [rnix, zworkb, 2021-02-02]


1.0rc3 (2020-10-12)
-------------------

- ``cone.app.browser.ajax.AjaxEvent`` supports optional ``data`` argument
  supported as of ``bdajax`` 1.13.
  [rnix, 2020-09-29]


1.0rc2 (2020-08-12)
-------------------

- Fix print CSS.
  [rnix, 2020-08-12]

- Fix case when pasting to empty folder in copysupport JS.
  [rnix, 2020-08-12]

- Remove ``col-xs-4`` CSS class from ``h4`` headings in panel headers.
  [rnix, 2020-08-12]


1.0rc1 (2020-07-09)
-------------------

- Implement ``__copy__`` and ``__deepcopy__`` on ``Properties``,
  ``ProtectedProperties``, ``XMLProperties`` and ``ConfigProperties`` in
  ``cone.app.model``.
  [rnix, 2020-06-30]

- Overhaul copy support. ``paste`` action triggers ``contextchanged`` event to
  ``#layout`` instead of ``.contextsensitiv`` selector. Paste action considers
  ``action_paste_tile`` model property for customizing rerendering after paste.
  Move JS copysupport logic from ``cone.copysupportbinder`` to
  ``cone.CopySupport``. Do not unselect items if mouse click outside selectable
  listing. Preselect items on page and tile load.
  [rnix, 2020-06-28]

- Rename JS ``cone.selectable`` to ``cone.Selectable``. It is now a class and
  each selectable listing gets it's own instance. No longer automatically binds
  to table with selectable rows.
  [rnix, 2020-06-28]

- Do not check 'delete' permission on parent node in
  ``cona.app.browser.actions.ActionDelete.display``.
  [rnix, 2020-06-27]

- Add ``ProtectedContentTile.content_permission``. If this permission is not
  granted on model node, ``insufficient_privileges`` tile gets rendered.
  [rnix, 2020-06-25]

- Remove ``cone.app.security.DEFAULT_NODE_PROPERTY_PERMISSIONS``.
  [rnix, 2020-06-25]

- Fix CSS for selected items in dropdown menues.
  [rnix, 2020-06-25]

- Improve layout configuration handling. Rename ``cone.app.interfaces.ILayout``
  to ``cone.app.interfaces.ILayoutConfig`` and ``cone.app.model.Layout`` to
  ``cone.app.model.LayoutConfig``. Remove ``layout`` property from application
  model. Introduce ``cone.app.layout_config`` decorator which is used to register
  concrete ``LayoutConfig`` implementations for model nodes.
  [rnix, 2020-06-22]

- Fix asking for interface implementations via ``Interface.providedBy`` on
  subclasses of ``cone.app.model.Properties``.
  [rnix, 2020-06-22]

- Fix workflow state styles if no transitions are available.
  [rnix, 2020-06-15]

- Introduce ``cone.app.workflow.lookup_workflow`` and use it internally to get
  workflow. Fixes issue with interface bound workflows.
  [rnix, 2020-06-15]

- Fix principal name displaying. Fall back to principal id if configured display
  name attribute returns empty value.
  [rnix, 2020-06-14]

- Introduce ``cone.app.ugm.ugm_backend.user_display_attr`` and
  ``cone.app.ugm.ugm_backend.group_display_attr`` for configuring user and
  group display names in the UI. The config values can be customized in the
  application config file via ``ugm.user_display_attr`` and
  ``ugm.group_display_attr`` settings. This settings supersede
  ``cone.app.browser.sharing.GROUP_TITLE_ATTR`` and
  ``cone.app.browser.sharing.USER_TITLE_ATTR``.
  [rnix, 2020-06-14]


1.0b3 (2020-05-30)
------------------

- Improve multivalued handling of reference browser. Instead of passing
  ``vocabulary`` property, a ``lookup`` function gets passed which is used
  for looking up labels for currently selected references.
  [rnix, 2020-05-13]

- Proper required handling in reference browser.
  [rnix, 2020-05-13]

- Add ``form-control`` CSS class to referencebrowser input and select tags.
  [rnix, 2020-05-06]

- Fix reference browser no referencable restrictions.
  [rnix, 2020-05-06]

- Implement ``cone.app.model.NamespaceUUID``.
  [rnix, 2020-05-06]

- Expect ``node.interfaces.IUUID`` instead of ``node.interfaces.IUUIDAware`` in
  reference browser for referencable nodes.
  [rnix, 2020-05-06]

- Fix reference browser widget rendering ``target`` handling.
  [rnix, 2020-05-06]


1.0b2 (2020-03-30)
------------------

- Adopt ``cone.app.model.UUIDAware`` to use ``uuid.factory`` introduced in
  ``node`` 0.9.25.
  [rnix, 2020-03-01]

- Add ``cone.app.browser.table.Table.table_css`` for rendering additinal
  CSS classes to table wrapper.
  [rnix, 2020-02-27]


1.0b1 (2019-11-06)
------------------

- Fix ``DatetimeHelper.r_value`` and ``DatetimeHelper.w_value`` handling
  non string data types.
  [rnix, 2019-04-30]

- Only execute main hooks contained in defined plugins names from application
  config file.
  [rnix, 2019-03-31]

- Ignore commented out plugin names from application config file on startup
  [rnix, 2019-03-31]

- Remove ``cone.auth_impl`` setting from application config ini file. Use
  ``ugm.backend`` instead.
  [rnix, 2019-03-29]

- Move ``cone.app.utils.principal_data`` to ``cone.app.ugm.principal_data``.
  [rnix, 2019-03-28]

- Remove ``cone.app.cfg.auth``. The corresponding UGM implementation is now
  at ``cone.app.ugm.ugm_backend.ugm``.
  [rnix, 2019-03-28]

- Introduce ``cone.app.ugm.UGMFactory`` contract and implement
  ``cone.app.FileUGMFactory`` and ``BCFileUGMFactory``.
  [rnix, 2019-03-27]

- Introduce ``cone.app.ugm.ugm_backend`` decorator for registering and
  accessing ``UGMFactory`` objects.
  [rnix, 2019-03-27]

- Add ``cone.app.utils.format_traceback``.
  [rnix, 2019-03-27]

- Python 3 support.
  [rnix, 2019-03-25]

- Drop support for pyramid < 1.5.
  [rnix, 2019-03-25]

- Remove ``request`` from ``cone.app.browser.utils.node_icon`` signature.
  It was never used.
  [rnix, 2019-03-25]

- Make ``configure.zcml`` file in plugins optional.
  [rnix, 2019-03-24]

- Introduce ``cone.app.browser.sharing.GROUP_TITLE_ATTR`` and
  ``cone.app.browser.sharing.USER_TITLE_ATTR``.
  [rnix, 2019-03-24]

- Add content type header to merged js file.
  [rnix, 2019-03-24]

- Change signature of referencebrowser yafowil widget callable attributes. Gets
  passed ``widget`` and ``data`` as common in yafowil.
  [rnix, 2019-03-24]

- Prevent ``ComponentLookupError`` in
  ``cone.app.browser.form.Form._process_form`` if ``controller.next`` returns
  ``HTTPFound`` instance. This never had any effect due to a redirect, we want
  to avoid the error anyway.
  [rnix, 2019-03-22]

- Add ``cone.app.main_hook`` decorator. ``cone.app.register_main_hook`` is
  deprecated and will be removed as of ``cone.app`` version 1.1.
  [rnix, 2019-03-21]

- Add ``cone.app.workflow.permission_checker`` for use with ``repoze.workflow``
  to make it wirk with pyramid >= 1.8.
  [rnix, 2019-03-21]

- Use ``request.has_permission`` instead of deprecated
  ``pyramid.security.has_permission``.
  [rnix, 2019-03-21]

- Use ``request.authenticated_userid`` instead of deprecated
  ``pyramid.security.authenticated_userid``.
  [rnix, 2019-03-21]

- Add ``cone.app.main_hook`` decorator. ``cone.app.register_main_hook`` is
  deprecated and will be removed as of ``cone.app`` version 1.1.
  [rnix, 2019-03-21]

- Convert doctests to unittests.
  [rnix, 2019-03-21]

- Do not use ``cone.tile.register_tile`` any more. Create dedicated tile
  classes and use ``cone.tile.tile`` all over the place.
  [rnix, 2017-02-21]


1.0a12 (2018-11-20)
-------------------

- Introduce ``show_confirm_deleted`` on
  ``cone.app.browser.authoring.DeleteAction`` which can be used to prevent
  "Item has been deleted" ajax continuation message.
  [rnix, 2018-11-20]

- Add default favicon.ico.
  [rnix, 2018-11-19]


1.0a11 (2018-11-07)
-------------------

- Add ``cone.light.browser.exception.not_found_view`` and ``not_found`` tile.
  [rnix, 2018-09-11]

- Move ``cone.light.browser.login.forbidden_view`` to
  ``cone.app.browser.exception``.
  [rnix, 2018-09-11]

- Move registration of ``unauthorized`` tile from ``cone.app.browser.layout``
  to ``cone.app.browser.exception``.
  [rnix, 2018-09-11]

- Move ``cone.app.browser.exception.format_traceback`` to
  ``cone.app.browser.utils``.
  [rnix, 2018-09-11]


1.0a10 (2018-07-17)
-------------------

- Modify response body of ``request.response`` and return this one instead of
  creating a new response in ``cone.app.browser.render_ajax_form`` to ensure
  response header modifications gets delivered properly.
  [rnix, 2018-07-12]

- Batched items filter input fields may provide a prefilled text which gets
  emptied on first focus. Use ``empty_filter`` CSS class on input field for
  this.
  [rnix, 2017-12-20]

- Introduce ``cone.batcheditems_size_binder`` and
  ``cone.batcheditems_filter_binder`` helper functions in ``protected.js``.
  [rnix, 2017-12-20]


1.0a9 (2017-11-13)
------------------

- Add ``quote_params`` keyword argument to ``cone.app.browser.utils.make_query``
  to control explicitely if some request paramater values should be URL quoted.
  Needed to make ``cone.app.browser.authoring.CameFromNext`` work properly if
  ``came_from`` URL contains a query on it's own.
  [rnix, 2017-11-07]


1.0a8 (2017-10-10)
------------------

- Include related view in ``cone.app.browser.contents.ContentsViewLink.target``
  if present and node is container, otherwise ``target`` of superclass.
  [rnix, 2017-10-09]

- Revert use ``urllib2.quote`` in ``cone.app.browser.utils.make_query`` to
  quote query parameter values.
  [rnix, 2017-10-09]

- ``safe_decode`` keys to check for current node in ``NavTree.fillchildren``.
  [rnix, 2017-09-27]


1.0a7 (2017-09-17)
------------------

- Update to ``bdajax`` 1.10 and adopt server side ajax form processing code.
  [rnix, 2017-09-12]


1.0a6 (2017-08-28)
------------------

- Use ``RelatedViewConsumer`` on ``cone.app.browser.batch.BatchedItems``
  and ``cone.app.browser.table.Table``.
  [rnix, 2017-07-23]

- Use ``RelatedViewProvider`` on ``listing`` and ``sharing`` tile.
  [rnix, 2017-07-23]

- Add related view support. This includes ``set_related_view``,
  ``get_related_view``, ``RelatedViewProvider`` and ``RelatedViewConsumer``
  in ``cone.app.browser``.
  [rnix, 2017-07-23]

- Introduce dedicated ``href`` and ``target`` keys for batch vocab
  pages. Makes it possible to consider view names. ``url`` key still works
  as B/C, but will be removed as of ``cone.app`` 1.1.
  [rnix, 2017-07-23]

- Copy passed ``path`` in ``cone.app.browser.utils.make_url`` to avoid
  modification of given argument.
  [rnix, 2017-07-23]

- Use ``urllib2.quote`` in ``cone.app.browser.utils.make_query`` to quote
  query parameter values.
  [rnix, 2017-07-19]

- Include query when setting browser path in ``cone.batcheditemsbinder`` JS.
  [rnix, 2017-07-19]

- Update to ``bdajax`` 1.9 and adopt bdajax binder function registration.
  [rnix, 2017-07-19]


1.0a5 (2017-05-15)
------------------

- Add ajax overlay additional CSS class support which has been introduced in
  ``bdajax`` 1.8
  [rnix, 2017-05-12]


1.0a4 (2017-03-28)
------------------

- Fix children filtering in ``cone.app.browser.contents.ContentsTile`` if
  title or creator from metadata is ``None``.
  [rnix, 2017-03-28]

- Fix ``href`` link creation of ``ActionList``, ``ActionSharing`` and
  ``ActionEdit`` in ``cone.app.browser.actions`` to ensure correct links if
  ``target`` gets overwritten on subclass.
  [rnix, 2017-03-28]

- Consolidate ``batcheditemsbinder`` and ``tabletoolbarbinder`` in
  ``protected.js``.
  [rnix, 2017-03-28]

- ``cone.app.browser.actions.ActionUp`` sets ``href`` properly.
  [rnix, 2017-03-28]

- Introduce ``logout`` tile.
  [rnix, 2017-03-23]

- Move ``login_view``, ``logout_view`` and ``forbidden_view`` from
  ``cone.app.browser`` to ``cone.app.browser.login``.
  [rnix, 2017-03-23]

- Catch ``Forbidden`` exception explicitely in ``ajaxaction`` JSON view and
  set 403 response status in order to ensure bdajax redirects to login view
  properly.
  [rnix, 2017-03-23]

- Ajax path is not longer set on server side in layout tile via ajax
  continuation but explicitely via ``ajax:path`` in markup where appropriate.
  [rnix, 2017-03-23]

- ``cone.app.browser.actions.LinkAction`` now supports ``path``,
  ``path_target``, ``path_action``, ``path_event`` and ``path_overlay``.
  [rnix, 2017-03-23]

- ``cone.app.browser.ajax.AjaxPath`` now supports ``target``, ``action``,
  ``event`` and ``overlay``.
  [rnix, 2017-03-23]

- Update to ``bdajax`` 1.7 which supports browser history handling for ajax
  actions.
  [rnix, 2017-03-23]

- Rename ``nodepath`` to ``node_path`` in ``cone.app.browser.utils``. B/C
  ``nodepath`` is suppoerted as of ``cone.app`` 1.1.
  [rnix, 2017-03-23]


1.0a3
-----

- Add ``BatchedItems`` tile to ``cone.app.browser.batch``.
  [rnix, 2017-02-21]

- Add ``trigger_event`` and ``trigger_selector`` to ``cone.app.browser.Batch``
  to make ajax JS event and selector customizble.
  [rnix, 2017-02-21]


1.0a2
-----

- Provide ``icon`` on ``ReferencableChildrenLink`` to render node icons in
  ``referencelisting`` tile.
  [rnix, 2017-02-07]

- Fix referencebrowser navigation root lookup and render
  ``referencebrowser_pathbar`` and ``referencelisting`` tiles on proper
  context in ``referencebrowser`` tile.
  [rnix, 2017-02-07]

- Add ``cone.app.browser.referencebrowser.ReferenceBrowserModelMixin``.
  [rnix, 2017-02-07]

- Handle unicode properly in ``cone.app.model.ConfigProperties``.
  [rnix, 2017-02-07]

- Move ``safe_encode`` and ``safe_decode`` utility functions from
  ``cone.app.browser.utils`` to ``cone.app.utils``.
  [rnix, 2017-02-07]

- Section name for ``cone.app.model.ConfigProperties`` can be customized.
  [rnix, 2017-02-06]

- Check whether owner already has been set in
  ``cone.app.security.OwnerSupport.__init__`` and skip setting it if so.
  [rnix, 2017-01-29]


1.0a1
-----

- Display ``userid`` in peronal tools if ``fullname`` found but empty.
  [rnix, 2015-04-11]

- ``sort_key`` not mandatory on column definitions any longer in tables.
  [rnix, 2015-02-23]

- URL's may contain umlaute.
  [rnix, 2015-02-18]

- Application nodes can be marked as root for navigation tree by setting
  ``is_navroot`` property to True.
  [rnix, 2015-02-17]

- No default values for admin user and password from ini file if not set.
  [rnix, 2014-12-01]

- Main menu can display first level children in dropdown menu if
  ``model.properties.mainmenu_display_children`` is set to ``True``.
  [rnix, 2014-09-08]

- Add login form actions to form compound. Thus login form actions can be
  extended keeping UI rednering sane.
  [rnix, 2014-09-04]

- Default model layout lookup considers ``default_child`` property.
  [rnix, 2014-08-28]

- Remove ``yafowil.yaml`` dependency.
  [rnix, 2014-08-26]

- Refactor ``cone.app.browser.AddDropdown``. It provides now a ``make_item``
  for better customizability.
  [rnix, 2014-08-21]

- Rename ``cone.app.model.registerNodeInfo`` to
  ``cone.app.model.register_node_info``. B/C import avaiable as of ``cone.app``
  1.1.
  [rnix, 2014-08-19]

- Rename ``cone.app.model.getNodeInfo`` to ``cone.app.model.get_node_info``.
  B/C import avaiable as of ``cone.app`` 1.1.
  [rnix, 2014-08-19]

- Modify ``class_add`` instead of ``class`` property in
  ``cone.app.browser.form.Form.prepare_ajax``.
  [rnix, 2014-08-16]

- Default layout lookup mechanism is done via ZCA adapter. Provide default
  ``__init__`` function on ``cone.app.model.Layout``.
  [rnix, 2014-08-13]

- Deprecate ``cone.app.register_plugin``. Use ``cone.app.register_entry``
  instead.
  [rnix, 2014-08-13]

- Deprecate ``cone.app.register_plugin_config``. Use
  ``cone.app.register_config`` instead.
  [rnix, 2014-08-13]

- Settings link in personaltools gets skipped if there are no settings nodes
  registered.
  [rnix, 2014-08-13]

- Add example ``twisted.cfg`` buildout configuration and ``cone.tac`` twisted
  configuration file for running cone with twisted WSGI.
  [rnix, 2014-08-02]

- Adopt ``IWorkflowState`` interface. Workflow name is now set directly
  on node. Optional a trnaslation string factory can be set for workflow
  state and transision translations.
  [rnix, 2014-08-01]

- Use ``plumbing`` decorator instead of ``plumber`` metaclass.
  [rnix, 2014-08-01]

- Introduce ``list`` permission, bind ``listing`` and ``contents`` tile to it
  and adopt default ACL's.
  [rnix, 2014-07-26]

- Improve forbidden view, renders unauthorized tile in case user is
  authenticated, otherwise redirect to login form.
  [rnix, 2014-07-26]

- All Authoring forms are no longer derived from ``ProtectedContentTile``.
  [rnix, 2014-07-26]

- ``OverlayForm`` now renders by default to ``#ajax-overlay`` instead of
  ``#ajax-form``. Latter is supposed to be used if overlay form should be
  rendered above an already opened overlay.
  [rnix, 2014-07-25]

- Introduce ``OverlayAddForm`` and ``OverlayEditForm``.
  [rnix, 2014-07-24]

- ``OverlayForm`` renders ``overlayform`` form tile instead of
  ``overlayeditform``.
  [rnix, 2014-07-24]

- Authoring forms cleanup. Rename ``AddBehavior`` to ``ContentAddForm``,
  ``EditBehavior`` to ``ContentEditForm`` and ``OverlayBehavior`` to
  ``OverlayForm``.
  [rnix, 2014-07-24]

- Introduce ``ILiveSearch`` adapter interface and remove
  ``cone.app.browser.ajax.LIVESEARCH_CALLBACK``.
  [rnix, 2014-07-15]

- Move over to ``typeahead.js`` for livesearch.
  [rnix, 2014-07-14]

- ``cone.app.cfg.layout`` not exists any longer. Register ``ILayout`` providing
  adapter for application nodes in order to customize layout configuration.
  [rnix, 2014-07-14]

- Add ``node_info`` decorator.
  [rnix, 2014-07-11]

- Trigger ``contextchanged`` to ``#layout`` rather than ``.contextsensitiv``
  in ``mainmenu``, ``logo``, ``pathbar``, ``navtree``.
  [rnix, 2014-07-11]

- Introduce ``layout`` tile.
  [rnix, 2014-07-11]

- Provide Layout configuration via ``AppNode``.
  [rnix, 2014-07-11]

- Remove ``cone.app.util.AppUtil``.
  [rnix, 2014-07-11]

- Workflow state only gets initialized at node creation time if not set at
  corresponding data yet. Needed for non persisting application nodes.
  [rnix, 2014-07-09]

- Content forms are now wrapped by a bs3 panel element.
  [rnix, 2014-07-09]

- Introduce ``skip_mainmenu`` in ``model.properties``. Gets considered in
  mainmenu.
  [rnix, 2014-07-09]

- Settings are displayed in personaltools menu rather than navtree and
  mainmenu.
  [rnix, 2014-07-09]

- ``personaltools`` tile now renders ``cone.app.browser.actions.LinkAction``
  based items.
  [rnix, 2014-07-09]

- Use bootstrap 3 related resources for bdajax integration.
  [rnix, 2014-07-04]

- Remove custom dropdown from ``cone.app.js``. Boostrap dropdown is used all
  over the place.
  [rnix, 2014-07-03]

- Introduce ``cone.app.browser.batch.BATCH_RANGE`` which can be used for
  default batch range configuration.
  [rnix, 2014-07-03]

- Remove ``cone.app.utils.node_icon_url``.
  [rnix, 2014-07-03]

- Include ionicons.
  [rnix, 2014-07-02]

- Introduce ``cone.app.is_remote_resource``.
  [rnix, 2014-06-27]

- CSS background image path from site root.
  [rnix, 2014-06-27]

- Fix yafowil JS resources delivery order.
  [rnix, 2014-06-19]

- Do not fail in ``cone.app.browser.actions.Action.action_scope`` if no
  ``ActionContext`` defined. Useful for testing.
  [rnix, 2014-06-18]

- Update jQuery, jQuery-UI and remove jQuery Tools.
  [rnix, 2013-08-13]

- ``cone.app.model.Properties`` now supports ``__setitem__`` and setting file
  ``path`` manually.
  [rnix, 2013-08-06]

- No more generic tabs binder, refactor settings tabs.
  [rnix, 2013-08-06]

- Change base styles to twitter bootstrap 3.
  [rnix, 2013-08-05]


0.9.5
-----

- ``lxml`` is no longer a hard dependency.
  [rnix, 2014-01-18]

- Factory node can be invalidated now.
  [rnix, 2014-01-15]

- Update jQuery, jQuery-UI and remove jQuery Tools.
  [rnix, 2013-08-13]

- ``cone.app.model.Properties`` now supports ``__setitem__`` and setting file
  ``path`` manually.
  [rnix, 2013-08-06]

- No more generic tabs binder, refactor settings tabs.
  [rnix, 2013-08-06]

- Change base styles to twitter bootstrap.
  [rnix, 2013-08-05]

- Test request can be flagged as XHR request.
  [rnix, 2013-03-23]

- Improve exception view to handle default error page and bdajax action
  requests. Move Exception code to ``cone.app.browser.exception``.
  [rnix, 2013-02-10]

- Introduce ``cone.app.browser.utils.request_property``.
  [rnix, 2013-02-05]

- Do not load ``cone.app.js`` merged, ensures to be loaded after bdajax.
  [rnix, 2013-01-20]

- Check if autocomplete plugin is available in ``cone.app.js`` when trying to
  bind livesearch.
  [rnix, 2013-01-08]

- Make yafowil resources beeing delivered public as well.
  [rnix, 2013-01-08]

- Possibility to skip yafowil resource groups, deliver yafowil resources
  before addon resources.
  [rnix, 2013-01-08]

- Remove yafowil addon widgets from default setup dependencies.
  [rnix, 2013-01-04]


0.9.4
-----

- Introduce ``Table.display_table_header`` and ``Table.display_table_footer``
  properties.
  [rnix, 2012-10-30]

- Introduce ``cone.app.browser.actions.DropdownAction``.
  [rnix, 2012-10-28]

- Introduce ``row_data`` on ``ContentsTile`` for customizing column data on
  ``ContentsTile`` deriving objects.
  [rnix, 2012-10-28]

- ``model.properties.action_delete_tile`` can be set if
  ``model.properties.action_delete`` is True. Used to define the content tile
  which gets rendered on parent of model after deleting.
  [rnix, 2012-10-26]

- Available child nodes of ``ContentsTile`` can be controlled by
  ``listable_children``.
  [rnix, 2012-10-26]

- Introduce ``show_slicesize`` on tables.
  [rnix, 2012-10-19]

- PEP-8.
  [rnix, 2012-10-16]

- Python2.7 Support.
  [rnix, 2012-10-16]

- Rename parts to behaviors.
  [rnix, 2012-07-29]

- adopt to ``node`` 0.9.8
  [rnix, 2012-07-29]

- adopt to ``plumber`` 1.2
  [rnix, 2012-07-29]

- use fresh Chameleon and fix tests to recognize correct output of new Chameleon
  [jensens, 2012-07-04]


0.9.3
-----

- Add basic print CSS.
  [rnix, 2012-05-29]

- ``contextmenu`` tile got a ``bdajax`` contract.
  [rnix, 2012-05-23]

- CSS and JS can be delivered merged if desired.
  [rnix, 2012-05-22]

- Move resources rendering to seperate module.
  [rnix, 2012-05-21]

- Add ``form_flavor`` attribute to ``cone.app.browser.form.YAMLForm``.
  [rnix, 2012-05-18]

- Add ``cone.app.model.UUIDAsName`` part.
  [rnix, 2012-05-18]

- Use ``zope.interface.implementer`` instead of ``zope.interface.implements``.
  [rnix, 2012-05-18]

- Remove BBB classes ``come.app.model.BaseNodeInfo`` and
  ``cone.app.model.BaseMetadata``.
  [rnix, 2012-05-18]

- Consider ``default_content_tile`` in application ini in order to support
  configuring root content tile.
  [rnix, 2012-05-14]

- Support bdajax overlay continuation as introduced in bdajax 1.4.
  [rnix, 2012-05-04]

- Move AJAX forms related markup and javascript to bdajax.
  [rnix, 2012-05-04]

- Add property ``head_additional`` to table tile. Supposed to be used for
  hooking additional markup to table header.
  [rnix, 2012-05-03]

- Fix bug in navtree when displaying children of node with ``hide_if_default``
  property set.
  [rnix, 2012-04-26]

- Consider ``default_child`` property in UP action and action scope.
  [rnix, 2012-04-24]

- Include ``yafowil.widget.image``.
  [rnix, 2012-04-21]

- Improve ajax form rendering.
  [rnix, 2012-04-19]

- Ajaxify settings tabs.
  [rnix, 2012-04-19]

- Add resizeable plugin to jQuery UI custom built.
  [rnix, 2012-03-27]


0.9.2
-----

- Resources also can originate at a remote server.
  [rnix, 2012-03-21]


0.9.1
-----

- Better table and batch templates and styles. Table now supports slice size
  selection and filtering.
  [rnix, 2012-03-19]

- Fix default ``sort`` and ``order`` request parameters for table batch.
  [rnix, 2012-03-16]

- Cleanup self contained buidlout.
  [rnix, 2012-02-29]

- Remove ``cone.app.APP_PATH``.
  [rnix, 2012-02-29]

- Adopt YAFOWIL addon registration to YAFOWIL 1.3
  [rnix, 2012-02-29]

- Use ``node.ext.ugm.interfaces.Users.id_for_login`` contract for remembering
  User id instead of login name in authentication cookie.
  [rnix, 2012-01-18]

- Dynamic width CSS
  [rnix, 2011-12-18]

- Extend UI actions by ``selected`` property.
  [rnix, 2011-12-16]

- Add ``cone.app.model.UUIDAttributeAware``.
  [rnix, 2011-12-07]

- Add ``cone.app.security.OwnerSupport``.
  [rnix, 2011-12-07]

- Add ``cone.app.security.ACLRegistry``.
  [rnix, 2011-12-07]

- Use ``node.parts.IUUIDAware`` as dependency for node beeing referencable.
  [rnix, 2011-12-02]

- Add ``browser.actions``.
  [rnix, 2011-12-01]

- Update jQuery (1.6.4) and jQuery Tools (1.2.6).
  [rnix, 2011-11-30]

- Add copy support.
  [rnix, 2011-11-30]

- Single UGM implementation.
  [rnix, 2011-11-21]

- Add ``PrincipalACL`` part and ``sharing`` tile.
  [rnix, 2011-11-21]

- Refactor contextmenu, can now be extended.
  [rnix, 2011-11-19]

- Add margin top for sidebar and content.
  [rnix, 2011-11-18]

- ``contextmenu`` tile considers ``action_up_tile`` property now.
  [rnix, 2011-11-17]

- Add ``bda.calendar.base`` as install dependency for timezone aware 
  datetime handling.
  [rnix, 2011-11-16]

- Show error message at attempt to add reference with missing UID.
  [rnix, 2011-11-16]

- Add yafowil.widget.array to dependencies.
  [rnix]


0.9
---

- Initial work

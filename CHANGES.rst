Changes
=======

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

``cone.app`` - Build Web Applications on top of the pyramid framework.


Detailed Documentation
======================

The detailed ``cone.app`` documentation is available 
`here <http://packages.python.org/cone.app>`_.


Source Code
===========

The sources are in a GIT DVCS with its main branches at 
`github <http://github.com/bluedynamics/cone.app>`_.


Copyright
=========

- Copyright (c) 2009-2012 BlueDynamics Alliance http://www.bluedynamics.com


Contributors
============

- Robert Niederreiter <rnix [at] squarewave [dot] at>
    
- Jens Klein <jens [at] bluedynamics [dot] com>
    
- Georg Gogo. BERNHARD <gogo [at] bluedynamics [dot] com>


Coverage Report
===============

::

    lines   cov%   module
      194    98%   cone.app.__init__
       32   100%   cone.app.browser.__init__
      283    99%   cone.app.browser.actions
      170   100%   cone.app.browser.ajax
      219    95%   cone.app.browser.authoring
      101   100%   cone.app.browser.batch
      144    94%   cone.app.browser.contents
       72    91%   cone.app.browser.contextmenu
      111   100%   cone.app.browser.copysupport
       24   100%   cone.app.browser.exception
       81    96%   cone.app.browser.form
      229    96%   cone.app.browser.layout
       58   100%   cone.app.browser.login
      205    95%   cone.app.browser.referencebrowser
       69    78%   cone.app.browser.resources
       43   100%   cone.app.browser.settings
      150    98%   cone.app.browser.sharing
      136   100%   cone.app.browser.table
       80    98%   cone.app.browser.utils
       48   100%   cone.app.browser.workflow
       53   100%   cone.app.interfaces
      339    97%   cone.app.model
      172   100%   cone.app.security
       88   100%   cone.app.testing.__init__
       50   100%   cone.app.testing.mock
       44   100%   cone.app.tests
       47   100%   cone.app.utils
       60   100%   cone.app.workflow


Changes
=======

1.0.dev0 (unreleased)
---------------------

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

- Authoring forms cleanup. Rename ``AddBehavior`` to ``AddForm``,
  ``EditBehavior`` to ``EditForm`` and ``OverlayBehavior`` to ``OverlayForm``.
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

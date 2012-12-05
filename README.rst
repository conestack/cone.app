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


Changes
=======


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

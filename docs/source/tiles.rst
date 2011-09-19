=====
Tiles
=====

As explained in the "setup" documentation, the UI elements of ``cone.app`` are
organized as tiles. Following sections explain the tiles shipped with this
package. Some of them are abstract and can be used as base classes for custom
tiles, while others are already registered and ready to be used. Also some tile
names are used by plugins as UI hooks.


Integration related
===================

Resources
---------

For delivering CSS and JS resources.

**Registration name**
    *resources*

When providing your own main template, add to HTML header::

    <head>
      ...
      <tal:resources replace="structure tile('resources')" />
      ...
    </head>


Bdajax
------

Renders ``bdajax`` related markup.

**Registration name**
    *bdajax*


Authentication related
======================

Login form
----------

Renders login form and performs authentication.

**Registration name**
    *loginform*


Main layout related
===================

Livesearch
----------

Renders the live search widget. The client side is implemented while on the
server side a callback function has to be provided in order to get a senceful
result.

**Registration name**
    *livesearch*

**Customization**

The callback gets the model and request as arguments.The search term is at
``request.params['term']``.

A list of dicts must be returned with these keys:

*label*
    Label of found item

*value*
    The value re-inserted in input. This is normally ``term``

*target*
    The target URL for rendering the content tile.

To set the callback, ``cone.app.browser.ajax.LIVESEARCH_CALLBACK`` must be
set::

    >>> from cone.app.browser import ajax
    
    >>> def example_livesearch_callback(model, request):
    ...     term = request.params['term']
    ...     return [
    ...         {
    ...             'label': 'Root',
    ...             'value': term,
    ...             'target': request.application_url,
    ...         },
    ...     ]
    
    >>> ajax.LIVESEARCH_CALLBACK = example_livesearch_callback


Personal Tools
--------------

Renders a dropdown if user is authenticated. It is titled with the
authenticated user name and contains a set of links to personal stuff. By
default, only the logout link is provided.

**Registration name**
    *personaltools*

**Customization**

To add more items in the dropdown, set a callback function on  
``cone.app.browser.layout.personal_tools``. The callback gets the model and
request as arguments and must return a 2-tuple containing URL and title.::

    >>> from cone.app.browser.utils import make_url
    >>> from cone.app.browser.layout import personal_tools
    
    >>> def settings_link(model, request):
    ...     return (make_url(request, resource='settings'), 'Settings')
    
    >>> personal_tools['settings'] = settings_link


Main menu
---------

Renders the first level of children below root as main menu.

**Registration name**
    *mainmenu*

**Expected metadata**

*title*
    Node title.

*description*
    Node description.

**Considered properties**

*mainmenu_empty_title*
    if set on ``model.root.properties`` with value ``True`` links are rendered
    empty instead containing the title. Use this if main menu actions use
    icons styled with CSS. As CSS selector 'node-nodeid' gets rendered as
    class attribute on ``li`` DOM element.

*default_child*
    If set on ``model.root.properties``, default child is marked selected if
    no other child was selected explicitly.


Pathbar
-------

Renders a breadcrumb navigation.

**Registration name**
    *pathbar*

**Expected metadata**

*title*
    Node title.

**Considered properties**

*default_child*
    Render default child instead of current node in pathbar if selected.


Navigation tree
---------------

Renders a navigation tree. Nodes which do not grant  permission 'view' are
skipped.

**Registration name**
    *navtree*

**Expected metadata**

*title*
    Node title.

**Considered properties**

*in_navtree*
    Flag whether to display the node in navtree at all.

*default_child*
    Default child nodes are displayed in navtree.

*hide_if_default*
    If default child should not be displayed it navtree, ``hide_if_default``
    must be set to 'True'. In this case, also children scope gets switched.
    Instead of remaining non default children, children of default node are 
    rendered.

*icon*
    Relative resource path to node icon. if not found on ``node.properties``,
    lookup registered ``cone.app.NodeInfo`` instance. If this also does not
    provide the ``icon`` property, ``cone.app.cfg.default_node_icon`` is used.


Content
-------

Content area for node. ``cone.app`` expects a tile registered by name content
to render the default content view of a node. The plugin code is responsible
to provide a content tile for model nodes.

**Registration name**
    *content*

**ProtectedContentTile**

When providing tiles for displaying node content, normally it's desired to
render the login form if access is forbidden. Therefor class
``cone.app.browser.layout.ProtectedContentTile`` is available. Use it as
tile class if registering the tile with ``cone.tile.registerTile`` or inherit
from it when working with the ``cone.tile.tile`` decorator.::

    >>> from cone.tile import tile, registerTile
    >>> from cone.app.browser.layout import ProtectedContentTile
    >>> registerTile('protected_tile',
    ...      'example.app:browser/templates/protected_tile.pt',
    ...      class_=ProtectedContentTile,
    ...      permission='login')
    
    >>> @tile('other_protected_tile', permission='login')
    ... class ProtectedTile(ProtectedContentTile):
    ...     def render(self):
    ...         return '<div>protected stuff</div>'


Model structure related
=======================

Contents
--------

Model child nodes in batched, sortable table.

**Registration name**
    *contents*

**Expected metadata**

*title*
    Node title.

*creator*
    Node creator name as string.

*created*
    Node creation date as ``datetime.datetime`` instance.

*modified*
    Node last modification date as ``datetime.datetime`` instance.

**Considered properties**

*editable*
    Flag whether node is editable.

*deletable*
    Flag whether node is deletable.


Listing
-------

Renders node title, ``contextmenu`` tile, node description and ``contents``
tile.

**Registration name**
    *listing*

**Expected metadata**

*title*
    Node title.

*description*
    Node description.


Authoring related
=================

Byline
------

Renders node creation, modification and author information.

**Registration name**
    *byline*

**Expected metadata**

*creator*
    Node creator name as string.

*created*
    Node creation date as ``datetime.datetime`` instance.

*modified*
    Node last modification date as ``datetime.datetime`` instance.


Context menu
------------

Contextmenu containing available user actions for node.

**Registration name**
    *contextmenu*

**Considered properties**

*action_up*
    Flag whether to render "One level up" action. Renders ``listing`` tile on
    parent node to main content area.

*action_view*
    Flag whether to render view action. Renders ``content`` tile on node to
    main content area.

*action_list*
    Flag whether to render list action. Renders ``listing`` tile on node to
    main content area.

*editable*
    Flag whether node is editable. Renders ``edit`` tile to main content area.

*deletable*
    Flag whether node is deletable. Invokes ``delete`` tile on node after
    confirming action.

*wf_state*
    Flag whether model provides workflow. If so, render ``wf_dropdown`` tile.

**Considered node information**

*addables*
    If node can have children, render ``add_dropdown`` tile.


Add dropdown
------------

Adding dropdown menu contains addable node types. Renders the ``add`` tile to
main content area passing desired ``cone.app.model.NodeInfo`` registration name
as param.

**Registration name**
    *add_dropdown*

**Considered node information**

*addables*
    Build addable dropdown by ``cone.app.model.NodeInfo`` instances registered
    by names defined in ``node.nodeinfo.addables``.


Workflow transitions dropdown
-----------------------------

Renders dropdown menu containing available workflow transitions for node.
Performs workflow transition if ``do_transition`` is passed to request
containing the transition id.

**Registration name**
    *wf_dropdown*

**Considered properties**

*wf_state*
    Flag whether model provides workflow.

*wf_name*
    Registration name of workflow.

*wf_transition_names*
    transition id to transition title mapping.


Delete
------

Delete node from model. Does not render directly but uses bdajax continuation
mechanism. Triggers rendering main content area with ``contents`` tile.
Triggers ``contextchanged`` event. Displays info dialog.

**Registration name**
    *delete*

**Considered metadata**

*title*
    Used for message creation.

**Considered properties**

*deletable*
    Flag whether node can be deleted. If not, a bdajax error message gets
    displayed.


Add
---

Generic tile deriving from ``cone.app.browser.layout.ProtectedContentTile``
rendering ``addform`` tile. It is used by ajax calls and by generic ``add``
view. If ajax request, render ``cone.app.browser.ajax.render_ajax_form``. If
not, render main template with ``add`` tile in main content area.

**Registration name**
    *add*


Edit
----

Generic tile deriving from ``cone.app.browser.layout.ProtectedContentTile``
rendering ``editform`` tile. Is is used by ajax calls and by generic ``edit``
view. If ajax request, render ``cone.app.browser.ajax.render_ajax_form``. If
not, render main template with ``edit`` tile in main content area.

**Registration name**
    *edit*


Add form
--------

Add form for node. The plugin code is responsible to provide the addform tile
for nodes. See documentation of forms for more details.

**Registration name**
    *addform*


Edit form
---------

Edit form for node. The plugin code is responsible to provide the editform tile
for nodes. See documentation of forms for more details.

**Registration name**
    *editform*


Form widget related
===================

Reference browser
-----------------

Render ``referencebrowser_pathbar`` tile and ``referencelisting`` tile.

This tile gets rendered in an overlay and is used by the ``referencebrowser``
YAFOWIL widget provided by ``cone.app``.

**Registration name**
    *referencebrowser*


Reference browser pathbar
-------------------------

Referencebrowser specific pathbar.

**Registration name**
    *referencebrowser_pathbar*


Reference listing
-----------------

Like ``contents`` tile, but with less table columns and reference browser
specific actions.

**Registration name**
    *referencelisting*

**Expected metadata**

*title*
    Node title.

*created*
    Node creation date as ``datetime.datetime`` instance.

*modified*
    Node last modification date as ``datetime.datetime`` instance.

**Considered properties**

*leaf*
    Whether node contains children. Used to check rendering of navigational
    links.

*referencable*
    Flag whether node can be referenced.


Abstract tiles
==============

Batch
-----

A tile for rendering batches is contained at ``cone.app.browser.batch.Batch``.

**Customization**

A subclass has to implement ``vocab`` and may override ``batchrange``,
``display`` and ``batchname``.   


Table
-----

A tile for rendering sortable, batched tables is contained at
``cone.app.browser.table.Table``.

**Customization**

A subclass of this tile must be registered under the same name as defined
at ``table_tile_name``, normally bound to template
``cone.app:browser/templates/table.pt``. A subclass has to provide ``col_defs``,
``item_count`` and ``sorted_rows``.

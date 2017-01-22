==========
UI Widgets
==========

As mentioned in the :doc:`Getting Started <quickstart>` documentation, most UI
Elements of ``cone.app`` are organized as
`tiles <http://pypi.python.org/pypi/cone.tile>`_.

The use of tiles has the following advantages:

- Abstraction of the site to several "subapplications" which act as
  views, widgets and/or controllers.

- The possibility to create generic tiles expecting model nodes providing the
  contract of ``cone.app.interfaces.IApplicationNode``.

- AJAX is easily integrateable.

``cone.app`` ships with several commonly needed tiles. One of this is
registered by name ``content``, which is reserved for rendering the
*Content Area* of the page. A plugin must at least register a ``content`` tile
for each application node it provides in order to display it in the layout.

The following sections explain the tiles shipped with this package. Some of
them are abstract and can be used as base classes for custom tiles, while
others are already registered and ready to be used.


Integration related
===================

Static Resources
----------------

For delivering CSS and JS resources.

**Tile registration name**: resources

When providing your own main template, add to HTML header.

.. code-block:: html

    <head>
      ...
      <tal:resources replace="structure tile('resources')" />
      ...
    </head>


Bdajax
------

Renders ``bdajax`` related markup.

**Tile registration name**: bdajax

When providing your own main template, add to HTML body.

.. code-block:: html

    <body>
      ...
      <tal:resources replace="structure tile('bdajax')" />
      ...
    </body>


Authentication related
======================

Login form
----------

Renders login form and performs authentication.

**Tile registration name**: loginform


Main layout related
===================

Livesearch
----------

**Tile registration name**: livesearch

Renders the live search widget. Cone provides a serverside ``livesearch`` JSON
view, which is expecting an ``ILiveSearch`` implementing adapter for model
node in order to get a reasonable result.

.. code-block:: python

    from cone.app.interfaces import IApplicationNode
    from cone.app.interfaces import ILiveSearch
    from zope.component import adapter
    from zope.interface import implementer

    @implementer(ILiveSearch)
    @adapter(IApplicationNode)
    class LiveSearch(object):

        def __init__(self, model):
            self.model = model

        def search(self, request, query):
            return [{
                'value': 'Example',
                'target': 'https://example.com/example',
                'icon': 'ion-ios7-gear'
            }]

Another option to implement serverside search logic is to overwrite the
``livesearch`` JSON view.

.. code-block:: python

    from pyramid.view import view_config

    @view_config(
        name='livesearch',
        context=IApplicationNode,
        accept='application/json',
        renderer='json')
    def livesearch(model, request):
        query = request.params['term']
        return [{
            'value': 'Example',
            'target': 'https://example.com/example',
            'icon': 'ion-ios7-gear'
        }]

``cone.app`` uses `typeahead.js <https://github.com/twitter/typeahead.js>`_
on the client side for the livesearch implementation. Since cone makes no
assumptions about what should happen with the livesearch results, a plugin
must provide some JS handling it. Cone not even makes assumptions about the
format of the received suggestions from the server. This is all up to the
integration. The following example renders suggestions with icon and value
text. When suggestion gets clicked, layout rendering is triggered on target
URL.

.. note::

    The example binds to ``typeahead:selected`` event. For a complete list of
    available custom typeahead events, look at the
    `typeahead documentation <https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md#custom-events>`_.

.. code-block:: js

    (function($) {

        $(document).ready(function() {
            $.extend(bdajax.binders, {
                example_binder: example.binder
            });
            example.binder();
        });

        example = {

            binder: function(context) {
                // listen to typeahead ``typeahead:selected`` event.
                var event = 'typeahead:selected';
                input.off(event).on(event, function(e, suggestion, dataset) {
                    // trigger layout rendering on target URL
                    bdajax.trigger(
                        'contextchanged',
                        '#layout',
                        suggestion.target
                    );
                });
            },

            // render livesearch suggestion
            render_livesearch_suggestion: function (suggestion) {
                return '<span class="' +
                       suggestion.icon +
                       '"></span> ' +
                       suggestion.value;
            }
        };

        // extend livesearch options by suggestion renderer. this options gets
        // passed to typeahead as datasets
        livesearch_options.templates = {
            suggestion: example.render_livesearch_suggestion
        };

    })(jQuery);


Personal Tools
--------------

Renders a dropdown if user is authenticated. It is titled with the
authenticated user name and contains a set of links to personal stuff. By
default, only the logout link is provided.

**Tile registration name**: personaltools

**Customization**

To add more items in the dropdown, set a callback function on  
``cone.app.browser.layout.personal_tools``. The callback gets the model and
request as arguments and must return a 2-tuple containing URL and title.

.. code-block:: python

    from cone.app.browser.utils import make_url
    from cone.app.browser.layout import personal_tools

    def settings_link(model, request):
        return (make_url(request, resource='settings'), 'Settings')

    personal_tools['settings'] = settings_link


Main menu
---------

Renders the first level of children below root as main menu.

**Tile registration name**: mainmenu

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

**Tile registration name**: pathbar

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

**Tile registration name**: navtree

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


Page Content Area
-----------------

Content area for node. ``cone.app`` expects a tile registered by name content
to render the default content view of a node. The plugin code is responsible
to provide a content tile for model nodes.

**Tile registration name**: content

**ProtectedContentTile**

When providing tiles for displaying node content, normally it's desired to
render the login form if access is forbidden. Therefor class
``cone.app.browser.layout.ProtectedContentTile`` is available. Use it as
tile class if registering the tile with ``cone.tile.registerTile`` or inherit
from it when working with the ``cone.tile.tile`` decorator.

.. code-block:: python

    from cone.tile import registerTile
    from cone.tile import tile
    from cone.app.browser.layout import ProtectedContentTile

    registerTile('protected_tile',
         'example.app:browser/templates/protected_tile.pt',
         class_=ProtectedContentTile,
         permission='login')

    @tile('other_protected_tile', permission='login')
    class ProtectedTile(ProtectedContentTile):
        def render(self):
            return '<div>protected stuff</div>'


Model structure related
=======================

Contents
--------

Model child nodes in batched, sortable table.

**Tile registration name**: contents

**Expected metadata**

*title*
    Node title.

*creator*
    Node creator name as string.

*created*
    Node creation date as ``datetime.datetime`` instance.

*modified*
    Node last modification date as ``datetime.datetime`` instance.


Listing
-------

Renders node title, ``contextmenu`` tile, node description and ``contents``
tile.

**Tile registration name**: listing

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

**Tile registration name**: byline

**Expected metadata**

*creator*
    Node creator name as string.

*created*
    Node creation date as ``datetime.datetime`` instance.

*modified*
    Node last modification date as ``datetime.datetime`` instance.


Context menu
------------

User actions for a node. The context menu consists of toolbars containing
actions. toolbars and actions can be added to
``cone.app.browser.contextmenu.context_menu``.

**Tile registration name**: contextmenu


Add dropdown
------------

Adding dropdown menu contains addable node types. Renders the ``add`` tile to
main content area passing desired ``cone.app.model.NodeInfo`` registration name
as param.

**Tile registration name**: add_dropdown

**Considered node information**

*addables*
    Build addable dropdown by ``cone.app.model.NodeInfo`` instances registered
    by names defined in ``node.nodeinfo.addables``.


Workflow transitions dropdown
-----------------------------

Renders dropdown menu containing available workflow transitions for node.
Performs workflow transition if ``do_transition`` is passed to request
containing the transition id.

**Tile registration name**: wf_dropdown

**Considered properties**

*wf_name*
    Registration name of workflow.

*wf_transition_names*
    transition id to transition title mapping.


Delete
------

Delete node from model. Does not render directly but uses bdajax continuation
mechanism. Triggers rendering main content area with ``contents`` tile.
Triggers ``contextchanged`` event. Displays info dialog.

**Tile registration name**: delete

**Considered metadata**

*title*
    Used for message creation.

**Considered properties**

*action_delete*
    Flag whether node can be deleted. If not, a bdajax error message gets
    displayed.


Add
---

Generic tile deriving from ``cone.app.browser.layout.ProtectedContentTile``
rendering ``addform`` tile. It is used by ajax calls and by generic ``add``
view. If ajax request, render ``cone.app.browser.ajax.render_ajax_form``. If
not, render main template with ``add`` tile in main content area.

**Tile registration name**: add


Edit
----

Generic tile deriving from ``cone.app.browser.layout.ProtectedContentTile``
rendering ``editform`` tile. Is is used by ajax calls and by generic ``edit``
view. If ajax request, render ``cone.app.browser.ajax.render_ajax_form``. If
not, render main template with ``edit`` tile in main content area.

**Tile registration name**: edit


Add form
--------

Add form for node. The plugin code is responsible to provide the addform tile
for nodes. See documentation of forms for more details.

**Tile registration name**: addform


Edit form
---------

Edit form for node. The plugin code is responsible to provide the editform tile
for nodes. See documentation of forms for more details.

**Tile registration name**: editform


Form widget related
===================

Reference browser
-----------------

Render ``referencebrowser_pathbar`` tile and ``referencelisting`` tile.

This tile gets rendered in an overlay and is used by the ``referencebrowser``
YAFOWIL widget provided by ``cone.app``.

**Tile registration name**: referencebrowser


Reference browser pathbar
-------------------------

Referencebrowser specific pathbar.

**Tile registration name**: referencebrowser_pathbar


Reference listing
-----------------

Like ``contents`` tile, but with less table columns and reference browser
specific actions.

**Tile registration name**: referencelisting

**Expected metadata**

*title*
    Node title.

*created*
    Node creation date as ``datetime.datetime`` instance.

*modified*
    Node last modification date as ``datetime.datetime`` instance.

XXX: outdated

**Considered properties**

*leaf*
    Whether node contains children. Used to check rendering of navigational
    links.

*action_add_reference*
    Flag whether to render add reference link for node.


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


Actions
=======

Actions are used to render action user action triggers. They are used in
contexmenu and contents table by default, but you can use them elsewhere to
render user actions for nodes.

Action are no "real" tiles, but behave similar that they get normally called
with context and request as arguments, are responsible to read related
information from given node and request and render some appropriate 
action (or not).

There exist base objects ``Action``, ``TileAction``, ``TemplateAction`` and
``LinkAction`` in ``cone.app.browser.actions`` which can be used as base class
for custom actions.

Class ``Toolbar`` can be used to render a set of actions.


ActionUp
--------

Renders content area tile on parent node to main content area.

**Considered properties**

*action_up*
    Flag whether to render "One level up" action.

*action_up_tile*
    Considered if ``action_up`` is true. Defines the tilename used for
    rendering parent content area. Defaults to ``listing`` if undefined.


ActionView
----------

Renders ``content`` tile on node to main content area.

**Considered properties**

*action_view*
    Flag whether to render view action.


ViewLink
--------

Renders ``content`` tile on node to main content area.


ActionList
----------

Renders ``listing`` tile on node to main content area.

**Considered properties**

*action_list*
    Flag whether to render list action.


ActionAdd
---------

Renders add dropdown menu.

**Considered node information**

*addables*
    Addable children defined for node.


ActionEdit
----------

Renders ``edit`` tile to main content area.

**Considered properties**

*action_edit*
    Flag whether to render edit action.


ActionDelete
------------

Invokes ``delete`` tile on node after confirming action.

**Considered properties**

*action_delete*
    Flag whether to render delete action.


ActionCut
---------

Writes selected elements contained in ``cone.selectable.selected`` to cookie
on client.


ActionCopy
----------

Writes selected elements contained in ``cone.selectable.selected`` to cookie
on client.


ActionPaste
-----------

Invokes ``paste`` tile on node.


ActionShare
-----------

Renders ``sharing`` tile on node to main content area. Only renders for
nodes with ``cone.app.security.PrincipalACL`` behavior.


ActionState
-----------

Renders workflow state dropdown menu. Only renders for nodes with
``cone.app.workflow.WorkflowState`` behavior.

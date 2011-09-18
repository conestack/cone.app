==
UI
==

As explained in the "setup" documentation, the UI elements of ``cone.app`` are
organized as tiles. Following sections explain the tiles shipped with this
package. Some of them are abstract and can be used as base classes for custom
tiles, while others are already registered and ready to be used. Also some tile
names are used by plugins as UI hooks.


Integration related tiles
=========================

Resources
---------

Registration name: ``resources``

For delivering CSS and JS resources. When providing your own main template,
add to HTML header::

    <head>
      ...
      <tal:resources replace="structure tile('resources')" />
      ...
    </head>


Bdajax
------

Registration name: ``bdajax``

Render ``bdajax`` related markup.


Authentication related tiles
============================

Login form
----------

Registration name: ``loginform``

Renders login form and performs authentication.


Main layout related tiles
=========================

Livesearch
----------

Registration name: ``livesearch``

Renders the live search widget. The client side is implemented while on the
server side a callback function has to be provided in order to get a senceful
result.

The callback gets the model and request as arguments.The search term is at
``request.params['term']``.

A list of dicts must be returned with these keys:

- label
    Label of found item

- value
    The value re-inserted in input. This is normally ``term``

- target
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

Registration name: ``personaltools``

Renders a dropdown if user is authenticated. It is titled with the
authenticated user name and contains a set of links to personal stuff. By
default, only the logout link is provided.

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

Registration name: ``mainmenu``

Renders the first level of children below root as main menu.

Expected metadata:

- title
    Node title

- description
    Node description

Considered properties:

- mainmenu_empty_title
    if set on ``model.root.properties`` with value ``True`` links are rendered
    empty instead containing the title. Use this if main menu actions use
    icons styled with CSS. As CSS selector 'node-nodeid' gets rendered as
    class attribute on ``li`` DOM element.

- default_child
    If set on ``model.root.properties``, default child is marked selected if
    no other child was selected explicitly.


Pathbar
-------

Registration name: ``pathbar``

Renders a breadcrumb navigation.

Expected metadata:

- title
    Node title

Considered properties:

- default_child
    Render default child instead of current node in pathbar if selected.


Navigation tree
---------------

Registration name: ``navtree``

Renders a navigation tree. Nodes which do not grant  permission 'view' are
skipped.

Expected metadata:

- title
    Node title

Considered properties:

- in_navtree
    Flag whether to display the node in navtree at all

- default_child
    Default child nodes are displayed in navtree.

- hide_if_default
    If default child should not be displayed it navtree, ``hide_if_default``
    must be set to 'True'. In this case, also children scope gets switched.
    Instead of remaining non default children, children of default node are 
    rendered.

- icon
    Relative resource path to node icon. if not found on ``node.properties``,
    lookup registered ``cone.app.NodeInfo`` instance. If this also does not
    provide the ``icon`` property, ``cone.app.cfg.default_node_icon`` is used.


Content
-------

Registration name: ``content``

Content area for node.


ProtectedContentTile
....................

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


Model structure related tiles
=============================

Contents
--------
   
Registration name: ``contents``

Model child nodes in batched, sortable table.


Listing
-------

Registration name: ``listing``

Node title, ``contextmenu`` tile, node description and ``contents`` tile. 


Authoring related tiles
=======================

Byline
------

Registration name: ``byline``

Renders node creation, modification and author information.

Expected metadata:

- creator
    Node creator name as string

- created
    Node creation date as ``datetime.datetime`` instance

- modified
    Node last modification date as ``datetime.datetime`` instance


Context menu
------------

Registration name: ``contextmenu``

Contextmenu containing available user actions for node.


Add dropdown
------------

Registration name: ``add_dropdown``

Adding dropdown menu contaiing links to add forms of allowed node children.


Workflow transitions dropdown
-----------------------------

Registration name: ``wf_dropdown``

Dropdown menu containing available workflow transitions for node.


Delete
------

Registration name: ``delete``

Deleting action for node.


Add
---

Registration name: ``add``

Generic tile rendering ``addform`` tile or ``loginform`` tile if adding is not
permitted.


Edit
----

Registration name: ``edit``

Generic tile rendering ``editform`` tile or ``loginform`` tile if editing is
not permitted.


Add form
--------

Registration name: ``addform``

Add form for node.


Edit form
---------

Registration name: ``editform``

Edit form for node.


Form widget related tiles
=========================

Reference browser
-----------------

Registration name: ``referencebrowser``

Render ``referencebrowser_pathbar`` tile and ``referencelisting`` tile.


Reference browser pathbar
-------------------------

Registration name: ``referencebrowser_pathbar``

Referencebrowser specific pathbar.


Reference listing
-----------------

Registration name: ``referencelisting``

Like ``contents`` tile, but with less table columns and reference browser
specific actions.

======
Layout
======

``cone.app`` ships with common needed UI widgets.


Resources
---------

For delivering CSS and JS resources, a tile named ``resources`` is registered.
When providing your own main template, add to HTML header::

    <head>
      ...
      <tal:resources replace="structure tile('resources')" />
      ...
    </head>


Livesearch
----------

A tile named ``livesearch`` renders the live search widget. The client side is
implemented while on the server side a callback function has to be provided in
order to get a senceful result.

The callback gets the model and request as arguments.The search term is at
``request.params['term']``.

A list of dicts must be returned with these keys:

label
    Label of found item

value
    The value re-inserted in input. This is normally ``term``

target
    The target URL for rendering the content tile.

To set the callback, ``cone.app.browser.ajax.LIVESEARCH_CALLBACK`` must be
overwritten::

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

A tile named ``personaltools`` renders a dropdown if user is authenticated. It
is titled with the authenticated user name and contains a set of links to 
personal stuff. By default, only the logout link is provided.

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

A tile named ``mainmenu`` renders the first level of child nodes.

- set ``mainmenu_empty_title`` on ``model.root.properties`` to ``True``
  if you want to render empty links in mainmenu for setting icons via CSS.
  Therefor 'node-nodeid' gets rendered as CSS class on ``li`` DOM element.
    
- If ``default_child`` is set on ``model.root.properties``, it is marked
  selected if no other current path is found.


Pathbar
-------

A tile named ``pathbar`` renders a path navigation.

XXX: used node metadata
XXX: used node properties


Navigation tree
---------------

A tile named ``navtree`` renders a navigation tree.

XXX: used node metadata
XXX: used node properties


Byline
------

A tile named ``byline`` renders node authoring information.

XXX: used node metadata
XXX: used node properties


Listing
-------

A tile named ``listing`` provides rendering the current node children as
listing.

XXX: used node metadata
XXX: used node properties


ProtectedContentTile
--------------------

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
    
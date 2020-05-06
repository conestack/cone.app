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

**Tile registration name**: ``resources``

For delivering CSS and JS resources.

When providing your own main template, add to HTML header.

.. code-block:: html

    <head>
      ...
      <tal:resources replace="structure tile('resources')" />
      ...
    </head>


Bdajax Integration
------------------

**Tile registration name**: ``bdajax``

Renders `bdajax <http://pypi.python.org/pypi/bdajax>`_ related markup.

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

**Tile registration name**: ``loginform``

Renders login form and performs authentication.


Main layout related
===================

Livesearch
----------

**Tile registration name**: ``livesearch``

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
            bdajax.register(example.binder.bind(example), true);
        });

        example = {

            binder: function(context) {
                var input = $('input#search-text', context);
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
                return '<span class="' + suggestion.icon + '"></span> ' +
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

**Tile registration name**: ``personaltools``

Renders a dropdown if user is authenticated. It is titled with the
authenticated user name and contains a set of links to personal stuff. By
default, a link to application settings and the logout link are rendered in the
dropdown.

To add more items to the dropdown, set a callable on
``cone.app.browser.layout.personal_tools``. The callable gets passed the model
and request as arguments and returns the rendered markup.

.. code-block:: python

    from cone.app.browser.actions import LinkAction
    from cone.app.browser.layout import personal_tools
    from cone.app.browser.utils import make_url

    class ExampleAction(LinkAction):
        text = 'Example'
        icon = 'ion-ios7-gear'
        event = 'contextchanged:#layout'

        @property
        def target(self):
            return make_url(self.request, node=self.model.root['example'])

        href = target

    personal_tools['example'] = ExampleAction()


Main menu
---------

**Tile registration name**: ``mainmenu``

Renders root children as main menu. Optionally render first level children of
main menu node as dropdown.

Expected ``metadata``:

- **title**: Node title.

- **description**: Node description.

Considered ``properties``:

- **skip_mainmenu**: Set to ``True`` if node should not be displayed in
  mainmenu.

- **mainmenu_empty_title**: If set to ``True``, links are rendered
  as icon only without the title.

- **mainmenu_display_children**: Set to ``True`` if children nodes of main menu
  node should be rendered as dropdown menu.

- **default_child**: If set, referring child is marked selected if no other
  current path is found.

- **default_content_tile**: If set, it is considered in target link creation.

- **icon**: If set, used to render the node icon. As fallback, the icon defined
  in ``@node_info`` decorator is used.

.. code-block:: python

    from cone.app import model
    from node.utils import instance_property

    class ExamplePlugin(model.BaseNode):

        @instance_property
        def properties(self):
            props = model.Properties()
            props.skip_mainmenu = False
            props.mainmenu_empty_title = False
            props.mainmenu_display_children = False
            props.default_content_tile = 'examplecontent'
            props.icon = 'ion-ios7-gear'
            return props

        @instance_property
        def metadata(self):
            metadata = model.Metadata()
            metadata.title = 'Example'
            metadata.description = 'Example Plugin'
            return metadata


Path Bar
--------

**Tile registration name**: ``pathbar``

Renders the path bar navigation.

Expected ``metadata``:

- **title**: Node title.

Considered ``properties``:

- **default_child**: Render default child instead of current node in pathbar
  if selected.

- **default_content_tile**: If set, it is considered in target link creation.

.. code-block:: python

    from cone.app import model
    from node.utils import instance_property

    class ExampleNode(model.BaseNode):

        @instance_property
        def properties(self):
            props = model.Properties()
            props.default_child = 'child'
            props.default_content_tile = 'examplecontent'
            return props

        @instance_property
        def metadata(self):
            metadata = model.Metadata()
            metadata.title = 'Example'
            return metadata


Navigation tree
---------------

**Tile registration name**: ``navtree``

Renders a navigation tree. Nodes which do not grant  permission 'view' are
skipped.

Expected ``metadata``:

- **title**: Node title.

Considered ``properties``:

- **in_navtree**: Flag whether to display the node in navigation tree.

- **is_navroot**: Flag whether this node should be used as navigation root in
  navigation tree.

- **default_child**: Default child nodes are displayed in navigation tree.

- **hide_if_default**: If default child should not be displayed it navtree,
  ``hide_if_default`` must be ``True``. In this case, also children scope
  switches. Instead of siblings, children of default child node are rendered.

- **default_content_tile**: If set, it is considered in target link creation.

- **icon**: If set, used to render the node icon. As fallback, the icon defined
  in ``@node_info`` decorator is used.

.. code-block:: python

    from cone.app import model
    from node.utils import instance_property

    class ExampleNode(model.BaseNode):

        @instance_property
        def properties(self):
            props = model.Properties()
            props.in_navtree = True
            props.is_navroot = False
            props.default_child = 'child'
            props.hide_if_default = False
            props.default_content_tile = 'examplecontent'
            props.icon = 'ion-ios7-gear'
            return props

        @instance_property
        def metadata(self):
            metadata = model.Metadata()
            metadata.title = 'Example'
            return metadata


Page Content Area
-----------------

**Tile registration name**: ``content``

Content area for node. ``cone.app`` expects a tile registered by name
``content`` to render the default *Content Area* of a node. The plugin code is
responsible to provide a content tile for model nodes.

When providing tiles for displaying node content, it's normally desired to
render the login form if access is forbidden. Therefor class
``cone.app.browser.layout.ProtectedContentTile`` is available.

If a ``content`` tile requires a template only, use ``ProtectedContentTile`` as
``class_``.

.. code-block:: python

    from cone.app.browser.layout import ProtectedContentTile
    from cone.example.model import ExamplePlugin
    from cone.tile import registerTile

    registerTile(
        name='content',
        path='cone.example:browser/templates/example.pt',
        interface=ExamplePlugin,
        class_=ProtectedContentTile,
        permission='login')

If a ``content`` tile requires a related python class to perform some view or
controller logic, use ``ProtectedContentTile`` as base.

.. code-block:: python

    from cone.app.browser.layout import ProtectedContentTile
    from cone.example.model import ExamplePlugin
    from cone.tile import tile

    @tile(name='content', interface=ExamplePlugin, permission='login')
    class ExamplePluginContentTile(ProtectedContentTile):

        def render(self):
            return '<div>Example Plugin Content</div>'


Model structure related
=======================

Contents
--------

**Tile registration name**: ``contents``

Model children nodes in batched, sortable table.

Expected ``metadata`` on children:

- **title**: Node title.

- **creator**: Node creator name as string.

- **created**: Node creation date as ``datetime.datetime`` instance.

- **modified**: Node last modification date as ``datetime.datetime`` instance.

Considered ``properties`` on children:

- **default_content_tile**: Content tile name for view action.

- **action_view**: Flag whether to render view action.

- **action_edit**: Flag whether to render edit action.

- **action_delete**: Flag whether to render delete action.

.. code-block:: python

    from cone.app import model
    from datetime import datetime
    from node.utils import instance_property

    class ListingChildNode(model.BaseNode):

        @instance_property
        def properties(self):
            props = model.Properties()
            props.default_content_tile = 'examplecontent'
            props.action_view = True
            props.action_edit = True
            props.action_delete = True
            return props

        @instance_property
        def metadata(self):
            metadata = model.Metadata()
            metadata.title = 'Example Child Node'
            metadata.creator = 'admin'
            metadata.created = datetime(2017, 1, 1, 0, 0)
            metadata.modified = datetime(2017, 1, 1, 0, 0)
            return metadata


Listing
-------

**Tile registration name**: ``listing``

*Content Area* tile rendering ``contextmenu`` and ``contents`` tiles.

A pyramid view named ``listing`` is registered rendering the main template
with ``listing`` tile as content tile.


Authoring related
=================

Byline
------

**Tile registration name**: ``byline``

Renders node creator, and creation and modification dates.

Expected ``metadata``:

- **creator**: Node creator name as string.

- **created**: Node creation date as ``datetime.datetime`` instance.

- **modified**: Node last modification date as ``datetime.datetime`` instance.

.. code-block:: python

    from cone.app import model
    from datetime import datetime
    from node.utils import instance_property

    class ExampleNode(model.BaseNode):

        @instance_property
        def metadata(self):
            metadata = model.Metadata()
            metadata.title = 'Example Node'
            metadata.creator = 'admin'
            metadata.created = datetime(2017, 1, 1, 0, 0)
            metadata.modified = datetime(2017, 1, 1, 0, 0)
            return metadata


Context menu
------------

**Tile registration name**: ``contextmenu``

User actions for a node. The context menu consists of toolbars containing
context related actions. Toolbars and actions are configured at
``cone.app.browser.contextmenu.context_menu``.

Navigation related actions are placed in the ``navigation`` toolbar.

.. code-block:: python

    from cone.app.browser.actions import LinkAction
    from cone.app.browser.contextmenu import context_menu
    from cone.app.browser.utils import make_query
    from cone.app.browser.utils import make_url

    class LinkToSomewhereAction(LinkAction):
        id = 'toolbaraction-link-to-somewhere'
        icon = 'glyphicon glyphicon-arrow-down'
        event = 'contextchanged:#layout'
        text = 'Link to somewhere'

        @property
        def target(self):
            model = self.model.root['somewhere']
            query = make_query(contenttile='content')
            return make_url(self.request, node=model, query=query)

    context_menu['navigation']['link_to_somewhere'] = LinkToSomewhereAction()

Context related content views are placed in ``contentviews`` toolbar.

.. code-block:: python

    from cone.app.browser import render_main_template
    from cone.app.browser.actions import LinkAction
    from cone.app.browser.contextmenu import context_menu
    from cone.example.interfaces import IMyFeature
    from cone.tile import registerTile
    from pyramid.view import view_config

    # content tile rendering my feature
    registerTile('myfeature', 'templates/myfeature.pt', permission='view')

    # view rendering main template with my feature content tile
    @view_config('myfeature', permission='view')
    def myfeature(model, request):
        return render_main_template(model, request, 'myfeature')

    class ActionMyFeature(LinkAction):
        id = 'toolbaraction-myfeature'
        action = 'myfeature:#content:inner'
        text = 'My Feature'

        @property
        def href(self):
            # link to myfeature view
            return '{}/myfeature'.format(self.target)

        @property
        def display(self):
            # check whether my feature is provided by current model
            return IMyFeature.providedBy(self.model)

        @property
        def selected(self):
            # check whether myfeature tile is current scope to highlight action
            return self.action_scope == 'myfeature'

    context_menu['contentviews']['myfeature'] = ActionSharing()

Context related children actions are placed in ``childactions`` toolbar. This
toolbar by default contains ``ICopySupport`` support related cut, copy and
paste actions. Children actions are supposed to be rendered if ``listing``
tile is shown. The children actions may rely on the selected items in the
table.

Context related actions are placed in ``contextactions`` toolbar. Context
related actions are e.g. the add dropdown, workflow transition dropdown or
other custom actions performing a task on current model node.

A plugin can extend the contextmenu by entire toolbars like so.

.. code-block:: python

    from cone.app.browser.contextmenu import ContextMenuToolbar
    from cone.app.browser.contextmenu import context_menu

    context_menu['mytoolbar'] = ContextMenuToolbar()
    context_menu['mytoolbar']['myaction'] = MyAction()


Add dropdown
------------

**Tile registration name**: ``add_dropdown``

Add dropdown menu containing addable node types. Renders the ``add`` tile to
content area passing desired ``cone.app.model.NodeInfo`` registration name
which is used to create a proper add model and add form.

Considered ``nodeinfo``:

- **addables**: Build addable dropdown by ``cone.app.model.NodeInfo`` instances
  registered by names defined in ``node.nodeinfo.addables``.

In the following example the add dropdown shows an add link for ``ChildNode``
if rendered on ``ContainerNode``.

.. code-block:: python

    from cone.app import model

    @model.node_info(
        name='container',
        title='Container Node',
        addables=['child'])
    class ContainerNode(model.BaseNode):
        pass

    @model.node_info(
        name='child',
        title='Child Node')
    class ChildNode(model.BaseNode):
        pass


Workflow transitions dropdown
-----------------------------

**Tile registration name**: ``wf_dropdown``

Renders dropdown menu containing available workflow transitions for node.
Performs workflow transition if ``do_transition`` is passed to request
containing the transition id.

.. code-block:: python

    from cone.app import model
    from cone.app import workflow
    from node.utils import instance_property
    from plumber import plumbing

    @plumbing(workflow.WorkflowState)
    class WorkflowNode(model.BaseNode):
        workflow_name = 'example_workflow'


Delete
------

**Tile registration name**: ``delete``

Triggered via ``ActionDelete``.

Deletes node from model. Uses bdajax continuation mechanism. Triggers rendering
layout on containing node and displays info message after performing delete
action.

Expected ``metadata``:

- **title**: Used for info message creation.

Considered ``properties``:

- **action_delete**: Flag whether node can be deleted. If not, a error
  message gets displayed when delete action gets performed.

- **action_delete_tile**: Content tile which should be rendered on parent after
  node has been deleted. Defaults to ``content``.


.. _widgets_authoring_add_tile:

Add
---

**Tile registration name**: ``add``

Tile for rendering add forms to content area. Looks up node info, creates add
model and renders add form on it which is expected as tile under name
``addform``.

See :ref:`Add and Edit Forms <forms_add_and_edit_forms>` documentation for more
details.


.. _widgets_authoring_edit_tile:

Edit
----

**Tile registration name**: ``edit``

Tile for rendering edit forms to content area. Edit form is expected as tile
under name ``editform``.

See :ref:`Add and Edit Forms <forms_add_and_edit_forms>` documentation for more
details.


Form widget related
===================

Reference browser
-----------------

**Tile registration name**: ``referencebrowser``

Render ``referencebrowser_pathbar`` tile and ``referencelisting`` tile.

This tile gets rendered in an overlay and is used by the ``referencebrowser``
YAFOWIL widget provided by ``cone.app``.


Reference browser pathbar
-------------------------

**Tile registration name**: ``referencebrowser_pathbar``

Referencebrowser specific pathbar.


Reference listing
-----------------

**Tile registration name**: ``referencelisting``

Like ``contents`` tile, but with less table columns and reference browser
specific actions for adding and removing references.

Nodes must implement ``node.interfaces.IUUID`` and provide a node info in order
to be referenceable.

Reference browser can be used as YAFOWIL widget.

.. code-block:: python

    from cone.app.browser.utils import make_url
    from yafowil.base import factory

    reference_field = factory(
        'field:error:reference',
        props={
            target: make_url(request, node=node)
            referencable: 'referencable_node'
        })

Expected widget ``props``:

- **multivalued**: Flag whether reference field is multivalued. Defaults to
  ``False``.

- **vocabulary**: If multivalued, provide a vocabulary mapping uids to node
  names.

- **target**: Ajax target used for rendering reference browser. If not defined,
  application root is used.

- **root**: Path of reference browser root. Defaults to '/'

- **referencable**: List of node info names which are referencable. Defaults
  to '' which means all objects are referenceable, given they implement
  ``node.interfaces.IUUID`` and a node info.

See :doc:`forms documentation <forms>` for more details.


Abstract tiles
==============

.. _widgets_batch:

Batch
-----

A tile for rendering batches is contained at ``cone.app.browser.batch.Batch``.

A subclass must at least implement ``vocab``. The example below renders a batch
for all children of model node.

.. code-block:: python

    from cone.app.browser.batch import Batch
    from cone.app.browser.utils import make_query
    from cone.app.browser.utils import make_url
    from cone.tile import tile

    @tile('examplebatch')
    class ExampleBatch(Batch):
        slicesize = 10

        @property
        def vocab(self):
            count = len(self.model)
            pages = count / self.slicesize
            if count % self.slicesize != 0:
                pages += 1
            current = self.request.params.get('b_page', '0')
            for i in range(pages):
                query = make_query(b_page=str(i))
                href = make_url(
                    self.request,
                    path=path,
                    resource='viewname',
                    query=query
                )
                target = make_url(self.request, path=path, query=query)
                ret.append({
                    'page': '{}'.format(i + 1),
                    'current': current == str(i),
                    'visible': True,
                    'href': href,
                    'target': target,
                })
            return ret

More customization options on ``Batch`` class:

- **display**: Flag whether to display the batch.

- **batchrange**: Number of batch pages displayed.

- **ellipsis**: Ellipsis is number of pages exceeds ``batchrange``.

- **firstpage**: Overwrite with property returning ``None`` to suppress
  rendering first page link.

- **lastpage**: Overwrite with property returning ``None`` to suppress
  rendering last page link.

- **prevpage**: Overwrite with property returning ``None`` to suppress
  rendering previous page link.

- **nextpage**: Overwrite with property returning ``None`` to suppress
  rendering next page link.


Batched Items
-------------

A tile for creating batched, searchable listings is contained at
``cone.app.browser.batch``.

It consists of a listing header which displays a search field and a slice size
selection, the actual listing slice and a listing footer which displays
information about the currently displayed slice and the pagination
:ref:`Batch <widgets_batch>`.

The listing slice is abstract and must be implemented while the listing header,
footer and pagination batch are generic implementations.

Create a template for rendering the slice, e.g. at
``cone.example.browser:templates/example_slice.pt``:

.. code-block:: xml

    <tal:example_slice
        xmlns:tal="http://xml.zope.org/namespaces/tal"
        omit-tag="True">

      <div class="${context.slice_id}">
        <div tal:repeat="item context.slice_items">
          <span tal:content="item.metadata.title">Title</span>
        </div>
      </div>

    </tal:example_slice>

The concrete tile implementation subclasses ``BatchedItems`` and must at least
implement ``item_count`` and ``slice_items``. To render the slice a template
is provided at ``slice_template``. Another option to render the slice is to
overwrite ``rendered_slice`` or using a custom template for the entire
``BatchedItems`` implementation based on
``cone.app.browser:templates/batched_items.pt`` and render the slice there.

``item_count`` returns the overall item count, ``slice_items`` returns the
current items to display in the slice.

The subclass of ``BatchedItems`` gets registered under desired tile name.
``items_id`` is set as CSS id of the tile element and is used to bind JS events
on the client side for rerendering the tile.

In the following example, ``filtered_items`` is used to compute the overall
items based on given search term. This function is no part of the contract,
but illustrates that filter criteria and current slice needs to be considered
by the concrete ``BatchedItems`` implementation.

.. code-block:: python

    from cone.app.browser.batch import BatchedItems

    @tile(name='example_items')
    class ExampleBatchedItems(BatchedItems):
        items_id = 'example_items'
        slice_template = 'cone.example.browser:templates/example_slice.pt'

        @property
        def item_count(self):
            return len(self.filtered_items)

        @property
        def slice_items(self):
            start, end = self.current_slice
            return self.filtered_items[start:end]

        @property
        def filtered_items(self):
            items = list()
            term = self.filter_term
            term = term.lower() if term else term
            for node in self.model.values():
                if term and node.name.find(term) == -1:
                    continue
                items.append(node)
            return items

More customization options on ``BatchedItems`` class:

- **path**: Path to template used for rendering the tile. Defaults to
  ``cone.app.browser:templates/batched_items.pt``. Can also be set by passing
  it as ``path`` keyword argument to ``tile`` decorator.

- **header_template**: Template rendering the slice header. Defaults to
  ``cone.app.browser:templates/batched_items_header.pt``.

- **footer_template**: Template rendering the slice footer. Defaults to
  ``cone.app.browser:templates/batched_items_footer.pt``.

- **slice_template**: Template rendering the slice items. Defaults to ``None``.
  Shall be set by subclass.

- **items_id**: CSS ID of the batched items container DOM element.

- **items_css**: CSS classes of the batched items container DOM element.

- **query_whitelist**: Additional incoming request parameters to consider when
  creating URL's. Defaults to ``[]``.

- **display_header**: Flag whether to display the listing header. Defaults to
  ``True``.

- **display_footer**: Flag whether to display the listing footer. Defaults to
  ``True``.

- **show_title**: Flag whether to show title in the listing header. Defaults
  to ``True``.

- **title_css**: CSS classes to set on title container DOM element. Defaults
  to ``col-xs-4``. Can be used to change the size of the title area.

- **default_slice_size**: Default number of items displayed in slice. Defaults
  to ``15``.

- **num_slice_sizes**: Number of available slice sizes in slice size selection.

- **show_slice_size**: Flag whether to display the slice size selection in
  listing header. Defaults to ``True``.

- **slice_size_css**: CSS classes to set on slice size selection container DOM
  element. Defaults to ``col-xs-4 col-sm3``. Can be used to change the size
  of the slice size selection.

- **show_filter**: Flag whether to display the search filter input in listing
  header. Defaults to ``True``.

- **filter_css**: CSS classes to set on search filter input container DOM
  element. Defaults to ``col-xs-3``. Can be used to change the size
  of the search filter input.

- **head_additional**: Additional arbitrary markup rendered in listing header.
  Can be used to add additional listing filter aspects or similar.

- **title**: Title in the listing header. Defaults to ``model.metadata.title``.

- **bind_selectors**: CSS selector to bind the batched items container DOM
  element to.

- **bind_events**: JS events to bind the batched items container DOM
  element to.

- **trigger_selector**: CSS selector to trigger JS event to when changing slice
  size or entering search filter term.

- **trigger_event**: JS event triggered when changing slice size or entering
  search filter term.

- **pagination**: ``BatchedItemsBatch`` instance.

- **page_target**: Pagination batch page target.

- **slice_id**: CSS ID of the slice container DOM element.

- **slice_target**: Slice size selection target URL.

- **filter_target**: Search filter input target URL.


Table
-----

A tile for rendering sortable, batched tables is contained at
``cone.app.browser.table.Table``.

A subclass of this tile must be registered under the same name as defined
at ``table_tile_name`` and is normally bound to template
``cone.app:browser/templates/table.pt``.

Futher the implementation must provide ``col_defs``, ``item_count`` and
``sorted_rows``.

.. code-block:: python

    from cone.app.browser.table import RowData
    from cone.app.browser.table import Table

    @tile(name='example_table', path='cone.app:browser/templates/table.pt')
    class ExampleTable(Table):
        table_id = 'example_table'
        table_css = 'example_table'
        table_tile_name = 'example_table'
        col_defs = [{
            'id': 'column_a',
            'title': 'Column A',
            'sort_key': None,
            'sort_title': None,
            'content': 'string'
        }, {
            'id': 'column_b',
            'title': 'Column B',
            'sort_key': None,
            'sort_title': None,
            'content': 'string'
        }]

        @property
        def item_count(self):
            return len(self.model)

        def sorted_rows(self, start, end, sort, order):
            # ``sort`` and ``order`` must be considered when creating the
            # sorted results.
            rows = list()
            for child in self.model.values()[start:end]:
                row_data = RowData()
                row_data['column_a'] = child.attrs['attr_a']
                row_data['column_b'] = child.attrs['attr_b']
                rows.append(row_data)
            return rows

Column definitions:

- **id**: Column ID.

- **title**: Column Title.

- **sort_key**: Key used for sorting this column.

- **sort_title**: Sort Title.

- **content**: Column content format:
    - ``string``: Renders column content as is.
    - ``datetime``: Expects datetime as column value and formats datetime.
    - ``structure``: Renders column content as Markup.

More customization options on ``Table`` class:

- **default_sort**: Default sort column by ID. Defaults to ``None``.

- **default_order**: Default sort order. Can be ``'asc'`` or ``'desc'``.
  Defaults to ``None``.

- **default_slicesize**: Default table content slize size. Defaults to ``15``.

- **query_whitelist**: List of URL query parameters considered when creating
  Links. Defaults to ``[]``.

- **show_title**: Flag whether to display table title. Defaults to ``True``.

- **table_title**: Title of the table. Defaults to
  ``self.model.metadata.title``.

- **show_filter**: Flag whether to display table filter search field. Defaults
  to ``False``. If used, server side implementation must consider
  ``self.filter_term`` when creating results.

- **show_slicesize**: Flag whether to display the slize size selection.
  Defaults to ``True``.

- **head_additional**: Additional table header markup. Defaults to ``None``.

- **display_table_header**: Flag whether to display table header. Defaults
  to ``True``.

- **display_table_footer**: Flag whether to display table footer. Defaults
  to ``True``.


Related View Support
====================

When writing generic tiles it's desired to avoid "binding" the tiles to static
pyramid view names. E.g., a generic batch might be used inside a view named
``listing`` and a view named ``sharing``. We want to include the view name
in generated URLs and when writing the browser history to ensure the expected
result gets displayed when reloading the browser URL or navigating via
browser back and next buttons.

Therefor, ``cone.app`` provides the concept of related views, implemented via
``cone.app.browser.RelatedViewProvider`` and
``cone.app.browser.RelatedViewConsumer`` plumbing behaviors.

The related view provider is supposed to be used on content view tiles.

.. code-block:: python

    from cone.app.browser import RelatedViewProvider
    from cone.app.browser import render_main_template
    from cone.tile import Tile
    from cone.tile import tile
    from plumber import plumbing
    from pyramid.view import view_config

    @tile(name='viewtile', path='templates/view.pt')
    @plumbing(RelatedViewProvider)
    class ViewTile(Tile):
        """Content rendering tile.
        """
        # related view name corresponds to pyramid view name below
        related_view = 'viewname'

    @view_config('viewname')
    def view(model, request):
        """Pyramid view.
        """
        return render_main_template(model, request, 'viewtile')

When using related view consumer it's possible to access the related view set
in the "entry tile" above for URL generation.

.. code-block:: python

    from cone.app.browser import RelatedViewConsumer
    from cone.app.browser.utils import make_url
    from cone.tile import Tile
    from plumber import plumbing

    @plumbing(RelatedViewConsumer)
    class GenericTile(Tile):
        """A generic tile supposed to be used as nested tile inside a content
        view tile.
        """

        @property
        def someurl(self):
            # Use ``self.related_view`` for URL generation. If this tile is
            # used as nested tile inside ``viewtile``, this will return
            # ``viewname``
            return make_url(
                self.request,
                node=self.model,
                resource=self.related_view
            )


Actions
=======

Action are no tiles but behave similar. They get called with context and
request as arguments, are responsible to read action related information from
node and request and render an appropriate action (or not).

Actions are used in ``contexmenu`` and ``contents`` tiles by default, but they
can be used elsewhere to render user actions for nodes.

There exist base objects ``Action``, ``TileAction``, ``TemplateAction``,
``DropdownAction`` and ``LinkAction`` in ``cone.app.browser.actions`` which can
be used as base classes for custom actions.

Class ``Toolbar`` can be used to render a set of actions.

Class ``ActionContext`` provides information about the current execution
scope. The scope is a tile name and used by actions to check it's own state,
e.g. if action is selected, disabled or should be displayed at all. The scope
gets calculated by a set of rules.

- If ``bdajax.action`` found on request, use it as current scope.
  ``bdajax.action`` is always a tile name in ``cone.app`` context.

- If tile name is ``layout``, content tile name is used. The layout tile
  renders the entire page, thus the user is normally interested in the content
  tile name rather than the rendered tile name.

- If tile name is ``content`` and model defines
  ``properties.default_content_tile``, this one is used instead of ``content``
  to ensure a user can detect the correct content tile currently rendered.

When inheriting from ``Action`` directly, class must provide a ``render``
function returning HTML markup.

.. code-block:: python

    from cone.app.browser.actions import Action

    class ExampleAction(Action):

        @property
        def display(self):
            return self.permitted('view') and self.action_scope == 'content'

        def render(self):
            return '<a href="http://example.com">Example</a>'

When inheriting from ``TileAction``, a tile by name is rendered.

.. code-block:: python

    from cone.app.browser.actions import TileAction
    from cone.tile import registerTile

    registerTile(
        name='example_action',
        path='cone.example:browser/templates/example_action.pt',
        permission='view')

    class ExampleAction(TileAction):
        tile = 'example_action'

When inheriting from ``TemplateAction``, a template is rendered.

.. code-block:: python

    from cone.app.browser.actions import TemplateAction

    class ExampleAction(TemplateAction):
        template = 'cone.example:browser/templates/example_action.pt'

When inheriting from ``DropdownAction``, class must implement ``items`` which
are used as dropdown menu items.

.. code-block:: python

    from cone.app import model
    from cone.app.browser.actions import DropdownAction
    from cone.app.browser.utils import make_url

    class ExampleAction(DropdownAction):
        css = 'example_css_class'
        title = 'Example Dropdown'

        @property
        def items(self):
            item = model.Properties()
            item.icon = 'ion-ios7-gear'
            item.url = item.target = make_url(self.request, node=self.model)
            item.action = 'example_action:NONE:NONE'
            item.title = 'Example Action'
            return [item]

``LinkAction`` represents a HTML link offering integration to ``bdajax``,
enabled and selected state and optionally rendering an icon.

.. code-block:: python

    from cone.app.browser.actions import LinkAction

    class ExampleAction(LinkAction):
        bind = 'click'       # ``ajax:bind`` attribute
        id = None            # ``id`` attribute
        href = '#'           # ``href`` attribute
        css = None           # in addition for computed ``class`` attribute
        title = None         # ``title`` attribute
        action = None        # ``ajax:action`` attribute
        event = None         # ``ajax:event`` attribute
        confirm = None       # ``ajax:confirm`` attribute
        overlay = None       # ``ajax:overlay`` attribute
        path = None          # ``ajax:path`` attribute
        path_target = None   # ``ajax:path-target`` attribute
        path_action = None   # ``ajax:path-action`` attribute
        path_event = None    # ``ajax:path-event`` attribute
        path_overlay = None  # ``ajax:path-overlay`` attribute
        text = None          # link text
        enabled = True       # if ``False``, link gets 'disabled' CSS class
        selected = False     # if ``True``, link get 'selected' CSS class
        icon = None          # if set, render span tag with value as CSS class in link

``Toolbar`` can be used to create a set of actions.

.. code-block:: python

    from cone.app.browser.actions import Toolbar
    from cone.app.browser.actions import ActionView
    from cone.app.browser.actions import ActionEdit

    toolbar = Toolbar()
    toolbar['view'] = ActionView()
    toolbar['edit'] = ActionEdit()

    # render toolbar with model and request
    markup = toolbar(model, request)

``cone.app`` ships with concrete ``Action`` implementations which are described
in the following sections.


ActionUp
--------

Renders content area tile on parent node to main content area.

Considered ``properties``:

- **action_up**: Flag whether to render "One level up" action.

- **action_up_tile**: Considered if ``action_up`` is true. Defines the tilename
  used for rendering parent content area. Defaults to ``listing`` if undefined.

- **default_child**: If set, use ``model.parent`` for ``target`` link creation.


ActionView
----------

Renders ``content`` tile on node to main content area.

Considered ``properties``:

- **action_view**: Flag whether to render view action.

- **default_content_tile**: If set, it is considered in target link creation.


ViewLink
--------

Like ``ActionView`` but renders text only link.


ActionList
----------

Renders ``listing`` tile on node to main content area.

Considered ``properties``:

- **action_list**: Flag whether to render list action.


ActionAdd
---------

Renders add dropdown menu.

Considered ``nodeinfo``:

- **addables**: Addable children defined for node.


ActionEdit
----------

Renders ``edit`` tile to main content area.

Considered ``nodeinfo``:

- **action_edit**: Flag whether to render edit action.


ActionDelete
------------

Invokes ``delete`` tile on node after confirming action.

Considered ``nodeinfo``:

- **action_delete**: Flag whether to render delete action.

- **default_content_tile**: If set, used to check if scope is ``view`` when
  calculating whether to display action.


ActionCut
---------

Writes selected elements contained in ``cone.selectable.selected`` to cookie
on client.

Action related node must implement ``cone.app.interfaces.ICopySupport``.


ActionCopy
----------

Writes selected elements contained in ``cone.selectable.selected`` to cookie
on client.

Action related node must implement ``cone.app.interfaces.ICopySupport``.


ActionPaste
-----------

Invokes ``paste`` tile on node.

Action related node must implement ``cone.app.interfaces.ICopySupport``.


ActionShare
-----------

Renders ``sharing`` tile on node to main content area.

Action related node must implement ``cone.app.interfaces.IPrincipalACL``.


ActionState
-----------

Renders workflow state dropdown menu.

Action related node must implement ``cone.app.interfaces.IWorkflowState``.

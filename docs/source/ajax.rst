====
AJAX
====

``cone.app`` uses ``bdajax`` for AJAXification of it's User Interface.

Detailed documentation about the features provided by ``bdajax`` can be found
in it's `Documentation <http://pypi.python.org/pypi/bdajax>`_.

Related client and server side implementation details are described in the
following sections.


Client Side
-----------

.. _ajax_custom_javascript:

JavaScript Integration
~~~~~~~~~~~~~~~~~~~~~~

To make custom JavaScript work properly in combination with ``bdajax``, the
plugin needs to provide a binder function which gets registered to
``bdajax.binders``. The binder function is responsible for proper event
bindings and gets called each time ``bdajax`` modifies the DOM tree with
the modified part of the DOM tree as ``context``.

A best practice JS stub for a plugin looks like so.

.. code-block:: js

    (function($) {

        $(document).ready(function() {
            // register binder function to bdajax.
            $.extend(bdajax.binders, {
                example_binder: example.binder
            });

            // call binder function on initial page load.
            example.binder();
        });

        // plugin namespace
        example = {

            // plugin binder function. gets called on initial page load and
            // every time bdajax modifies the DOM tree.
            binder: function(context) {
                // event binding code goes here. context is the modified
                // part of the DOM tree if called by bdajax.
            }
        };

    })(jQuery);


Using bdajax in Page Templates
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When working with ``bdajax`` in page templates, the related XML namespace
must be defined.

.. code-block:: xml

    <tal:block xmlns:tal="http://xml.zope.org/namespaces/tal"
               xmlns:ajax="http://namesspaces.bluedynamics.eu/ajax"
               omit-tag="True">

      <!-- bdajax using markup goes here -->

    </tal:block>


Context Changed Event
~~~~~~~~~~~~~~~~~~~~~

``cone.app`` uses a custom JavaScript event named ``contextchanged`` to
notify the UI about a changed traversal context.

If some action changes the application context it's usually desired to render
the entire ``layout`` on the new context. To achieve this, trigger
``contextchanged`` event to ``#layout`` DOM element. The target must contain
the new traversal path without a trailing view name but including request
parameters if desired.

.. code-block:: html

    <a href=""
       ajax:bind="click"
       ajax:target="http://example.com/path/to/node/without/trailing/view?a=1"
       ajax:event="contextchanged:#layout">
      Trigger context change.
    </a>


Server Side
-----------

Markup
~~~~~~

``bdajax`` related markup gets delivered by a tile with name ``bdajax`` and is
included in :ref:`main template <layout_main_template>`.


AJAX Actions
~~~~~~~~~~~~

``bdajax`` expects a server side implemented JSON view for performing
actions by name ``ajaxaction``.

The implementation is located at ``cone.app.browser.ajax.ajax_tile``. It
renders a tile registered by action name and returns a JSON reponse in the
format expected by ``bdajax``.

If an uncaught exception is thrown during action processing, the traceback is
delivered to the client and gets displayed as error message.


Continuation
~~~~~~~~~~~~

``bdajax`` supports AJAX continuation. This can be useful if data manipulating
actions need to finish it's job before anything can be re-rendered,
or if user should get a message displayed after action processing just to name
a few usecases.

AJAX continuation definitions are collected during request execution and
translated via ``cone.app.browser.ajax.AjaxContinue`` to the format
expected by ``bdajax`` on the client side in the ``ajaxaction`` JSON view.

The Available continuation definitions are located in module
``cone.app.browser.ajax`` and represented by the following classes:

- **AjaxPath**: Set browser path. Accepted arguments

    - ``path``: Browser path to be set.
    - ``target``: Traversable target URL without trailing server view.
    - ``action``: Name of action which should be performed.
    - ``event``: Event to trigger.
    - ``overlay``: Overlay to display.
    - ``overlay_css``: Additional overlay CSS class.

- **AjaxAction**: Execute action. Accepted arguments

    - ``target``: Traversable target URL without trailing server view
    - ``name``: Action name.
    - ``mode``: DOM modification mode. Either ``inner`` and ``replace``.
    - ``selector``: DOM modification selector.

- **AjaxEvent**: Trigger event. Accepted arguments

    - ``target``: Traversable target URL without trailing server view
    - ``name``: Event name.
    - ``selector``: Selector of DOM elements on which to trigger the event

- **AjaxMessage**: Display message. Accepted arguments

    - ``payload``: Message payload as text or markup.
    - ``flavor``: XOR with ``selector``. One out of ``message``, ``info``,
      ``warning`` or ``error``.
    - ``selector``: XOR with ``flavor``. If given, render message to DOM
      element found by selector.

- **AjaxOverlay**: Display or close overlay. Accepted arguments

    - ``selector``: selector of overlay DOM element. Defaults to
      ``#ajax-overlay``.
    - ``action``: Name of action which should be displayed in overlay.
    - ``target``: Traversable target URL without trailing server view
    - ``close``: Flag whether to close an open overlay.
    - ``content_selector``: Optional overlay content selector. Defaults to
      ``.overlay_content``.
    - ``css``: Additional overlay CSS class.

AJAX continuation can be queued by passing continuation definition objects
to ``cone.app.browser.ajax.ajax_continue``, which expects the request and
a single or a list of continuation definitions.

.. code-block:: python

    from cone.app.browser.ajax import AjaxEvent
    from cone.app.browser.ajax import AjaxOverlay
    from cone.app.browser.ajax import ajax_continue
    from cone.tile import Tile
    from cone.tile import tile

    @tile(name='exampleaction', permission='view')
    class ExampleAction(Tile):

        def render(self):
            # close overlay
            overlay = AjaxOverlay(close=True)
            # trigger changed context to layout
            event = AjaxEvent(
                target=make_url(self.request, node=self.model),
                name='contextchanged',
                selector='#layout'
            )
            # queue continuation definitions
            ajax_continue(request, [overlay, event])
            return u''

A shortcut for continuation messages is located at
``cone.app.browser.ajax.ajax_message``.

.. code-block:: python

    from cone.app.browser.ajax import ajax_message

    payload = '<div>Message</div>'
    ajax_message(request, payload, flavor='message')


Forms
~~~~~

AJAX forms are automatically detected and computed properly as long as they are
rendered via ``cone.app.browser.authoring.render_form``. The default rendering
location is the main content area of the page. If form target DOM element
differs, re-rendering definitions must also change in order to hook the form at
the right location.

The rendering target of a form can be changed with
``cone.app.browser.ajax.ajax_form_fiddle``. It expects ``request``,
``selector`` and ``mode`` as arguments.

``ajax_form_fiddle`` must be called somewhen during request processing. For
unique form tiles the function can be called at ``prepare`` time, while for
generic forms it might be worth providing a plumbing behavior hooking to the
``__call__`` function.

.. code-block:: python

    from plumber import plumbing
    from plumber import plumb
    from plumber import Behavior
    from cone.app.browser.ajax import ajax_form_fiddle

    class ExampleNonStandardFormLocation(Behavior):

        @plumb
        def __call__(_next, self, model, request):
            ajax_form_fiddle(request, '.some_selector', 'inner')
            return _next(self, model, request)

And then use this behavior for form tiles.

.. code-block:: python

    @tile('exampleform', interface=ExampleNode, permission='edit')
    @plumbing(ExampleNonStandardFormLocation)
    class ExampleForm(Form):
        pass

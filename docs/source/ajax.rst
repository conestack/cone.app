====
Ajax
====

``cone.app`` uses ``treibstoff`` for SSR Ajax operations in it's user interface
components.

Detailed documentation about the features provided by treibstoff can be found
at it's `documentation <http://treibstoff.readthedocs.io>`_.

Related client and server side implementation details are described in the
following sections.


Client Side
-----------

.. _ajax_custom_javascript:

JavaScript Integration
~~~~~~~~~~~~~~~~~~~~~~

To make custom JavaScript work properly in combination with treibstoff Ajax SSR,
the plugin needs to provide a callback function which gets registered with
``ts.ajax.register``. This function is responsible for proper event bindings
and gets called each time treibstoff modifies the DOM tree with
the receiced markup snipped as ``context``.

A best practice JS stub for a plugin looks like so.

.. code-block:: js

    (function($, ts) {

        class Example {

            static initialize(context) {
                // Event binding, el al. code goes here.
                // ``context`` is the received snipped of the DOM tree from
                // the Ajax action operation.
                $('.example', context).each(function() {
                    new Example($(this));
                });
            }

            constructor(elem) {
                // example instance creation.
            }
        }

        $(function() {
            // Register binder function to ts.ajax. The register function takes
            // a function and a boolean flag whether to immediately execute
            // this function as arguments.
            ts.ajax.register(Example.initialize, true);
        });

    })(jQuery, treibstoff);


Using ajax operations in Page Templates
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

When working with Ajax operations in page templates, the related XML namespace
must be defined.

.. code-block:: xml

    <tal:block xmlns:tal="http://xml.zope.org/namespaces/tal"
               xmlns:ajax="http://namespaces.conestack.org/ajax"
               omit-tag="True">

      ...

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

Ajax Actions
~~~~~~~~~~~~

Treibstoff expects a server side implemented JSON view for performing
SSR Ajax actions by name ``ajaxaction``.

The implementation is located at ``cone.app.browser.ajax.ajax_tile``. It
renders a tile registered by action name and returns a JSON reponse in the
format expected by treibstoff.

If an uncaught exception is thrown during action processing, the traceback is
delivered to the client and gets displayed as error message in an overlay.


Continuation
~~~~~~~~~~~~

Treibstoff supports Ajax continuation operations. This can be useful if data
manipulating actions need to finish it's job before anything can be re-rendered,
or if user should get a message displayed after action processing just to name
a few usecases.

Ajax continuation operations are collected during request execution and
translated via ``cone.app.browser.ajax.AjaxContinue`` to the format
expected by treibstoff on the client side in the ``ajaxaction`` JSON view.

The Available continuation operations are located in module
``cone.app.browser.ajax`` and represented by the following classes:

- **AjaxPath**: Set browser path. Accepted arguments

    - ``path``: Browser path to be set.
    - ``target``: Traversable target URL without trailing server view.
    - ``action``: Name of action which should be performed.
    - ``event``: Event to trigger.
    - ``overlay``: Overlay to display.
    - ``overlay_css``: Additional overlay CSS class.
    - ``overlay_uid``: UID of the overlay
    - ``overlay_title``: Title of the overlay.

- **AjaxAction**: Execute action. Accepted arguments

    - ``target``: Traversable target URL without trailing server view.
    - ``name``: Action name.
    - ``mode``: DOM modification mode. Either ``inner`` and ``replace``.
    - ``selector``: DOM modification selector.

- **AjaxEvent**: Trigger event. Accepted arguments

    - ``target``: Traversable target URL without trailing server view.
    - ``name``: Event name.
    - ``selector``: Selector of DOM elements on which to trigger the event
    - ``data``: Optional data set on event.

- **AjaxMessage**: Display message. Accepted arguments

    - ``payload``: Message payload as text or markup.
    - ``flavor``: XOR with ``selector``. One out of ``message``, ``info``,
      ``warning`` or ``error``.
    - ``selector``: XOR with ``flavor``. If given, render message to DOM
      element found by selector.

- **AjaxOverlay**: Display or close overlay. Accepted arguments

    - ``action``: Name of action which should be displayed in overlay.
    - ``target``: Traversable target URL without trailing server view.
    - ``close``: Flag whether to close an open overlay.
    - ``css``: Additional overlay CSS class.
    - ``uid``: Overlay UID. Must be given if ``close`` is ``True``. The
        overlay UID gets passed on request as ``ajax.overlay-uid`` parameter
        if the overlay was displayed with ``ajax:overlay`` in the browser.
    - ``title``: Overlay title.

Ajax continuation operations can be queued by passing operation instances
to ``cone.app.browser.ajax.ajax_continue``, which expect the request and
a single or a list of continuation operation instances.

.. code-block:: python

    from cone.app.browser.ajax import AjaxEvent
    from cone.app.browser.ajax import AjaxOverlay
    from cone.app.browser.ajax import ajax_continue
    from cone.tile import Tile
    from cone.tile import tile

    @tile(name='exampleaction', permission='view')
    class ExampleAction(Tile):

        def render(self):
            # close an open overlay
            overlay_uid = self.request.params['ajax.overlay-uid']
            overlay = AjaxOverlay(close=True, uid=overlay_uid)

            # trigger changed traversal context to layout
            event = AjaxEvent(
                target=make_url(self.request, node=self.model),
                name='contextchanged',
                selector='#layout'
            )

            # queue continuation operations
            ajax_continue(request, [overlay, event])
            return u''

A shortcut for continuation message operations is located at
``cone.app.browser.ajax.ajax_message``.

.. code-block:: python

    from cone.app.browser.ajax import ajax_message

    payload = '<div>Message</div>'
    ajax_message(request, payload, flavor='message')


Forms
~~~~~

Ajax forms are automatically detected and computed properly as long as they are
rendered via ``cone.app.browser.authoring.render_form``. The default rendering
location is the main content area of the page. If form target DOM element
differs, re-rendering settings must also change in order to hook the
form at the right location.

The rendering target of a form can be changed with
``cone.app.browser.ajax.ajax_form_fiddle``. It expects ``request``,
``selector`` and ``mode`` as arguments.

``ajax_form_fiddle`` must be called at any time during request processing. For
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

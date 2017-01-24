====
AJAX
====

``cone.app`` uses ``bdajax`` for AJAXification of it's User Interface.

Detailed documentation about the features provided by ``bdajax`` can be found
in it's `Documentation <http://pypi.python.org/pypi/bdajax>`_.

Related client contracts and the ``bdajax`` related server side implementation
are described in the following sections.


Client Contracts
----------------

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


Server Side Implementation
--------------------------

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

- **AjaxPath**: Set browser path. Accepted arguments:
    - ``path``: Browser path to be set.

- **AjaxAction**: Execute action. Accepted arguments:
    - ``target``: Traversable target URL without trailing server view
    - ``name``: Action name.
    - ``mode``: DOM modification mode. Either ``inner`` and ``replace``.
    - ``selector``: DOM modification selector.

- **AjaxEvent**: Trigger event. Accepted arguments:
    - ``target``: Traversable target URL without trailing server view
    - ``name``: Event name.
    - ``selector``: Selector of DOM elements on which to trigger the event

- **AjaxMessage**: Display message. Accepted arguments:
    - ``payload``: Message payload as text or markup.
    - ``flavor``: XOR with ``selector``. One out of ``message``, ``info``,
      ``warning`` or ``error``.
    - ``selector``: XOR with ``flavor``. If given, render message to DOM
      element found by selector.

- **AjaxOverlay**: Display or close overlay. Accepted arguments:
    - ``selector``: selector of overlay DOM element. Defaults to
      ``#ajax-overlay``.
    - ``action``: Name of action which should be displayed in overlay.
    - ``target``: Traversable target URL without trailing server view
    - ``close``: Flag whether to close an open overlay.
    - ``content_selector``: Optional overlay content selector. Defaults to
      ``.overlay_content``.

AJAX continuation can be queued by passing continuation definition objects
to ``cone.app.browser.ajax.ajax_continue``, which expects the request and
a single or a list of continuation definitions.

.. code-block:: python

    from cone.app.browser.ajax import AjaxEvent
    from cone.app.browser.ajax import AjaxOverlay
    from cone.app.browser.ajax import ajax_continue

    # close overlay if open
    overlay = AjaxOverlay(close=True)
    # trigger changed context to layout
    event = AjaxEvent(
        target=make_url(request, node=model),
        name='contextchanged',
        selector='#layout'
    )
    # queue continuation definitions
    ajax_continue(request, [overlay, event])

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
location is the main content area of the page. If a DOM element on the client
side containing the form is not default, re-rendering definitions of the form
must also change in order to make validation error form re-rendering do the
right thing.

The rendering target of a form can be changed with
``cone.app.browser.ajax.ajax_form_fiddle``. Provide a plumbing behavior
hooking to ``__call__`` function.

.. code-block:: python

    from plumber import plumbing
    from plumber import plumb
    from plumber import Behavior
    from cone.app.browser.ajax import ajax_form_fiddle

    class FormFiddle(Behavior):

        @plumb
        def __call__(_next, self, model, request):
            ajax_form_fiddle(request, '.some_selector', 'inner')
            return _next(self, model, request)

Use this behavior in form tile.

.. code-block:: python

    @tile('someform', interface=ExampleApp, permission='edit')
    @plumbing(ContentEditForm, FormFiddle)
    class SomeForm(Form):
        pass


JavaScript
----------

Using ``bdajax`` dispatching is supposed to be used for very general contracts.
Often, it's faster or even required to provide a snippet of JavaScript code
doing something specific.

To make custom JS work properly in combination with the dispatching system,
define a "binder" function and register it in ``bdajax.binders``.

.. code-block:: js

    (function($) {
    
        binder_function = function() {
            $('.foo').bind('click', function(event) {
                // do something fancy
            });
        }
        
        $(document).ready(function() {
            
            // initial binding
            binder_function();
            
            // add binder to bdajax binding callbacks
            $.extend(bdajax.binders, {
                binder_function: binder_function,
            });
        });
    
    })(jQuery);

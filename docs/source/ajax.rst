====
AJAX
====

``cone.app`` uses ``jQuery``, ``jquery tools`` and ``bdajax`` for AJAX support.
Please see related documentation for detailed documentation.


General contracts
-----------------

Some tiles of the application (like ``mainmenu`` and ``navtree``)
are using ``bdajax`` to notify each other about changes of the application
context. The custom JS event ``contextchanged`` gets triggered on DOM elements
with CSS class ``contextsensitiv`` set. The main content area is separately
bound to this event by ID ``content``.

If some action changes the application context it's usually desired to render 
navigation tree, main menu and main content area. Thus, trigger the 
``contextchanged`` event from your markup on user interaction. Defined 
target is the new application context.

.. code-block:: html

    <a href=""
       ajax:bind="click"
       ajax:target="http://example.com/path/to/node/without/trailing/view"
       ajax:event="contextchanged:.contextsensitiv
                   contextchanged:#content">
      Trigger context change.
    </a>

For a custom tile, i.e. rendering some node metadata which should be
re-rendered every time the context changes, bind the DOM element to
event ``contextchanged``, add ``contextsensitiv`` CSS class and define the
desired AJAX action.

The tile registered by name ``myfancytile`` is re-rendering itself each time 
application context changes.

.. code-block:: html

    <div id="myfancytile"
         class="contextsensitiv"
         ajax:bind="contextchanged"
         ajax:action="myfancytile:#myfancytile:replace">
      ...
    </div>


Actions
-------

``bdajax``  does not ship with server implementation performing AJAX actions. 
For details follow up to the bdajax-documentation  

Server side implementation is located at
``cone.app.browser.ajax.ajax_tile``. It renders the tile registered by action
name. AJAX continuation definitions are read from
``request.environ['cone.app.continuation']``. If an uncaught exception is
thrown during AJAX action processing, the traceback gets displayed in a
``bdajax.error`` message.


Continuation
------------

``bdajax`` supports AJAX continuation. This is useful i.e. if a data
manipulating tile needs to finish it's job before anything can be re-rendered,
or if user should get a message displayed after action processing. Several
other use cases are applying.

Available continuation objects on the server side are
``cone.app.browser.ajax.AjaxAction``, ``cone.app.browser.ajax.AjaxEvent`` and
``cone.app.browser.ajax.AjaxMessage``.

To trigger AJAX continuation, instantiate the desired definition(s) and call
``cone.app.browser.ajax.ajax_continue``. It expects the request and a
continuation definition or a list of continuation definitions as arguments.

.. code-block:: python

    from cone.app.browser.ajax import ajax_continue
    from cone.app.browser.ajax import AjaxAction
    from cone.app.browser.ajax import AjaxEvent
    from cone.app.browser.ajax import AjaxMessage

    action = AjaxAction(target, name, mode, selector)
    ajax_continue(request, action)

    event = AjaxEvent(target, name, selector)
    message = AjaxMessage(payload, flavor, selector)
    ajax_continue(request, [event, message])

A shortcut for continuation messages is located at
``cone.app.browser.ajax.ajax_message``. Possible flavors are ``message``,
``info`` ``warning`` and ``error``.

.. code-block:: python

    payload = '<div>Message</div>'
    ajax_message(request, payload, flavor='message')


Forms
-----

AJAX forms are automatically detected and computed properly as long as they are
rendered via ``cone.app.browser.authoring.render_form``. The default rendering
location is the main content area of the page. If a DOM element on the client
side containing the form is not default, re-rendering definitions of the form
must also change in order to make validation error form re-rendering do the
right thing.

The rendering target of a form can be changed with
``cone.app.browser.ajax.ajax_form_fiddle``. Provide a plumbing part hooking to
``__call__`` function.

.. code-block:: python

    from plumber import plumbing
    from plumber import plumb
    from plumber import Part
    from cone.app.browser.ajax import ajax_form_fiddle

    class FormFiddle(Part):

        @plumb
        def __call__(_next, self, model, request):
            ajax_form_fiddle(request, '.some_selector', 'inner')
            return _next(self, model, request)

Use this part in form tile.

.. code-block:: python

    @tile('someform', interface=ExampleApp, permission='edit')
    @plumbing(EditPart, FormFiddle)
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

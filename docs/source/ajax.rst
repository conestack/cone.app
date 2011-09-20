====
AJAX
====

``cone.app`` uses ``jQuery``, ``jquery tools`` and ``bdajax`` for AJAX support.
Please see related documentation for detailed documentation.


General UI Contracts
--------------------

Tiles representing parts of the application, like ``mainmenu`` and ``navtree``
use ``bdajax`` to notify each other about a changed application context by the
custom ``contextchanged`` JS event, which gets triggered on DOM elements
with CSS class ``contextsensitiv`` set by this tiles. The main content area is
seperate bound to this event by ID ``content``.

When providing an action which changes the application context, it's propably
desired to render the navigation tree, the main menu and the main content area
of the page. Thus, trigger the ``contextchanged`` event from your markup on
user interaction. The defined target is the application context to get switched
to.::

    <a href=""
       ajax:bind="click"
       ajax:target="http://example.com/path/to/node/without/trailing/view"
       ajax:event="contextchanged:.contextsensitiv
                   contextchanged:#content">
      Trigger context change.
    </a>

Given a custom tile, i.e. rendering some node metadata, which should be
re-rendered every time the context changes, bind DOM element to the
``contextchanged`` event, add ``contextsensitiv`` CSS class and define the
desired ajax action.

Tile registered by name ``myfancytile`` re-rendering itself each time the
application context changes.::

    <div id="myfancytile"
         class="contextsensitiv"
         ajax:bind="contextchanged"
         ajax:action="myfancytile:#myfancytile:replace">
      ...
    </div>


AJAX action
-----------

As described in the documentation of ``bdajax``, it does not ship the server
implementation performing ajax actions.

The server side implementation is located at
``cone.app.browser.ajax.ajax_tile``. It renders the tile registered by action
name. AJAX continuation definitions are read from
``request.environ['cone.app.continuation']``. If an uncaught exception is
thrown during ajax action processing, the traceback gets displayed in a
``bdajax.error`` message.


AJAX continuation
-----------------

``bdajax`` supports AJAX continuation. This is useful i.e. if a data
manipulating tile needs to finish it's job before anything can be re-rendered,
or if user should get a message displayed after action processing or similar.

Available continuation objects on the server side are
``cone.app.browser.ajax.AjaxAction``, ``cone.app.browser.ajax.AjaxEvent`` and
``cone.app.browser.ajax.AjaxMessage``.

To trigger AJAX continuation, instanciate the desired definition(s) and call
``cone.app.browser.ajax.ajax_continue``, which expects the request and a
continuation definition or al list of continuation definitions as arguments.::

    >>> from cone.app.browser.ajax import (
    ...     ajax_continue,
    ...     AjaxAction,
    ...     AjaxEvent,
    ...     AjaxMessage,
    ... )
    
    >>> action = AjaxAction(target, name, mode, selector)
    >>> ajax_continue(request, action)
    
    >>> event = AjaxEvent(target, name, selector)
    >>> message = AjaxMessage(payload, flavor, selector)
    >>> ajax_continue(request, [event, message])

A shortcut for continuation messages is located at
``cone.app.browser.ajax.ajax_message``. Possible flavors are ``message``,
``info`` ``warning`` and ``error``::

    >>> payload = '<div>Message</div>'
    >>> ajax_message(request, payload, flavor='message')


AJAX Forms
----------

AJAX forms are automatically detected and computed porperly as long as they
are rendered via ``cone.app.browser.authoring.render_form``. However, the
default rendering location is the main content area of the page. If the
DOM element on client side containing the form differs, re-rendering
definitions of the form must also change in order to make validation error form
re-rendering do the right thing.

The rendering target of a form can be changed with
``cone.app.browser.ajax.ajax_form_fiddle``. Provide a plumbing part hooking to
``__call__`` function.::

    >>> from plumber import (
    ...     plumb,
    ...     Part,
    ... )
    >>> from cone.app.browser.ajax import ajax_form_fiddle
    
    >>> class FormFiddle(Part):
    ...     
    ...     @plumb
    ...     def __call__(_next, self, model, request):
    ...         ajax_form_fiddle(request, '.some_selector', 'inner')
    ...         return _next(self, model, request)

Use this part in form tile.::

    >>> @tile('someform', interface=ExampleApp, permission='edit')
    >>> class SomeForm(Form):
    ...     __metaclass__ = plumber
    ...     __plumbing__ = EditPart, FormFiddle


Client side JavaScript
----------------------

Using ``bdajax`` dispatching is desired to be used for very general contracts.
Often, it's faster or even required to provide a snippet of Javascript code
doing something specific.

To make custom JS work propably in combination with the dispatching system,
define a "binder" function and register it in ``bdajax.binders``.::

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

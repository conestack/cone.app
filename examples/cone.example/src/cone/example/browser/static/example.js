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
        // every time bdajax hooks up some markup to the dom tree.
        binder: function(context) {
            // event binding code goes here. context is the modified
            // part of the DOM tree if called by bdajax.
        }
    };

})(jQuery);

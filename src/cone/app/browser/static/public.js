/*
 * cone.app public JS
 *
 * Requires:
 *     jquery
 *     bdajax
 *     jqueryui autocomplete
 */

(function($) {

    $(document).ready(function() {
        // initial binding
        livesearch.binder();

        // add binders to bdajax binding callbacks
        $.extend(bdajax.binders, {
            livesearchbinder: livesearch.binder
        });
    });

    livesearch = {
        binder: function(context) {
            console.log($.fn.autocomplete);
            if (!$.fn.autocomplete) {
                return;
            }
            $('input#search-text', context).autocomplete({
                source: 'livesearch',
                minLength: 3,
                select: function(event, ui) {
                    $('input#search-text').val('');
                    bdajax.action({
                        name: 'content',
                        selector: '#content',
                        mode: 'inner',
                        url: ui.item.target,
                        params: {}
                    });
                    bdajax.trigger('contextchanged',
                                   '.contextsensitiv',
                                   ui.item.target);
                    return false;
                }
            });
        }
    };

})(jQuery);

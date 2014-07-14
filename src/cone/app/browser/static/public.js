/*
 * cone.app public JS
 *
 * Requires:
 *     jquery
 *     bdajax
 *     typeahead.js
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
            var livesearch_source = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                remote: 'livesearch?term=%QUERY'
            });
            livesearch_source.initialize();
            $('input#search-text').typeahead(null, {
                name: 'livesearch',
                displayKey: 'value',
                source: livesearch_source.ttAdapter()
            });
        }
    };

})(jQuery);

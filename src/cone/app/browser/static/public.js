/*
 * cone.app public JS
 *
 * Requires:
 *     jquery
 *     treibstoff
 *     typeahead.js
 */

// additional livesearch options
var livesearch_options = new Object();

(function($, ts) {

    $(document).ready(function() {
        ts.ajax.register(livesearch.binder.bind(livesearch), true);
    });

    livesearch = {
        binder: function(context) {
            var livesearch_source = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                remote: 'livesearch?term=%QUERY'
            });
            livesearch_source.initialize();
            var input = $('input#search-text');
            var options = {
                name: 'livesearch',
                displayKey: 'value',
                source: livesearch_source.ttAdapter()
            };
            $.extend(options, livesearch_options);
            input.typeahead(null, options);
        }
    };

})(jQuery, treibstoff);

var cone_app_public = (function (exports, $, ts) {
    'use strict';

    class LiveSearch {
        static initialize(context, factory=null) {
            let elem = $('input#search-text', context);
            if (!elem.length) {
                return;
            }
            if (factory === null) {
                factory = cone.LiveSearch;
            }
            new factory(elem);
        }
        constructor(elem) {
            this.elem = elem;
            let source = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                remote: 'livesearch?term=%QUERY'
            });
            source.initialize();
            this.render_suggestion = this.render_suggestion.bind(this);
            elem.typeahead(null, {
                name: 'livesearch',
                displayKey: 'value',
                source: source.ttAdapter(),
                templates: {
                    suggestion: this.render_suggestion,
                    empty: '<div class="empty-message">No search results</div>'
                }
            });
            this.on_select = this.on_select.bind(this);
            let event = 'typeahead:selected';
            elem.off(event).on(event, this.on_select);
        }
        on_select(evt, suggestion, dataset) {
            if (!suggestion.target) {
                console.log('No suggestion target defined.');
                return;
            }
            ts.ajax.trigger(
                'contextchanged',
                '#layout',
                suggestion.target
            );
        }
        render_suggestion(suggestion) {
            return `<span class="${suggestion.icon}"></span>${suggestion.value}`;
        }
    }

    $(function() {
        ts.ajax.register(LiveSearch.initialize, true);
    });

    exports.LiveSearch = LiveSearch;

    Object.defineProperty(exports, '__esModule', { value: true });


    window.cone = window.cone || {};
    Object.assign(window.cone, exports);


    return exports;

})({}, jQuery, treibstoff);

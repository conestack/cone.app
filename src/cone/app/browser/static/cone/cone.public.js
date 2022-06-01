var cone_public = (function (exports, $, ts) {
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
            this._render_suggestion_hande = this.render_suggestion.bind(this);
            elem.typeahead(null, {
                name: 'livesearch',
                displayKey: 'value',
                source: source.ttAdapter(),
                templates: {
                    suggestion: this._render_suggestion_handle
                }
            });
            this._on_select_handle = this.on_select.bind(this);
            elem.off(event).on(event, this._on_select_handle);
        }
        on_select(evt, suggestion, dataset) {
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


    if (window.cone === undefined) {
        window.cone = {};
    }
    Object.assign(window.cone, exports);


    return exports;

})({}, jQuery, treibstoff);

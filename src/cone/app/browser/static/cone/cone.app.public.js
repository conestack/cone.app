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

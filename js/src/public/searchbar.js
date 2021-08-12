import $ from 'jquery';
import ts from 'treibstoff';
import {
    ViewPortAware,
    VP_SMALL,
    VP_MEDIUM
} from './viewport.js';
import {layout} from './layout.js';

export class Searchbar extends ViewPortAware {

    static initialize(context, factory=null) {
        let elem = $('#cone-searchbar', context);
        /* istanbul ignore if */
        if (!elem.length) {
            return;
        }
        if (factory === null) {
            factory = Searchbar;
        }
        layout.searchbar = new factory(elem);
        return layout.searchbar;
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.search_text = $('#livesearch-input', this.elem);
        this.search_text.on('click', this.livesearch_handle.bind(this));
        this.search_group = $('#livesearch-group', this.elem);
        this.dd = $('#cone-livesearch-dropdown', this.elem);

        this.result_header = $('#livesearch-result-header');
        this.results = $('#cone-livesearch-results');

        if(this.vp_state === VP_SMALL || this.vp_state === VP_MEDIUM) {
            this.dd.addClass('dropdown-menu-end');
            this.search_text.detach().prependTo(this.dd);
        }
    }

    livesearch_handle(e) {
        
        this.dd.on('click', (e) => {
            e.preventDefault();
        });
        // TODO: work on livesearch
        let dots = $(
            `<div class="loading-dots">
                <i class="bi bi-circle-fill"></i>
                <i class="bi bi-circle-fill"></i>
                <i class="bi bi-circle-fill"></i>
            </div>`
        );

        this.result_header.append(dots);

        let timeout = 0;
        let characters = 0;

        this.search_text.off().on('keydown', (e) => {
            e.preventDefault();
        });

        this.search_text.off().on('keyup', (e) => {
            if (e.code === 'Backspace' && characters > 0) {
                characters -= 1;
            } else {
                characters += 1;
            }
            if (characters >= 3) {
                $('.search-result').remove();
                $('.loading-dots').show();
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    $('.loading-dots').hide();
                    ts.ajax.request({
                        url: 'livesearch',
                        params: {
                            term: this.search_text.val(),
                        },
                        type: 'json',
                        success: (data, status, request) => {
                            console.log('request response received here');
                            console.log(data);
                            for (let result of data) {
                                let res = this.render_suggestion(result);
                                let li_elem = $(`<li class="search-result">${res}</li>`);
                                this.results.append(li_elem);
                            }
                        }
                    });
                }, 800);
            } else {
                $('.search-result').remove();
                $('.loading-dots').show();
                clearTimeout(timeout);
            }
        });
    }

    viewport_changed(e) {
        super.viewport_changed(e);
        if(this.vp_state === VP_SMALL || this.vp_state === VP_MEDIUM) {
            this.dd.addClass('dropdown-menu-end');
            this.search_text.detach().prependTo(this.dd);
        } else {
            this.search_text.detach().prependTo(this.search_group);
            this.dd.removeClass('dropdown-menu-end');
        }
    }

    /* istanbul ignore next */
    on_select(e, suggestion, dataset) {
        ts.ajax.trigger(
            'contextchanged',
            '#layout',
            suggestion.target
        );
    }

    /* istanbul ignore next */
    render_suggestion(suggestion) {
        return `<span class="${suggestion.icon}">${suggestion.value}</span>`;
    }
}

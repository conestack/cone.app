import $ from 'jquery'
import {ViewPortAware, vp_states} from '../src/viewport.js';

let searchbar = null;

export class Searchbar extends ViewPortAware {

    static initialize(context) {
        let elem = $('#cone-searchbar', context);
        if (!elem.length) {
            return;
        }
        searchbar = new Searchbar(elem);
        return searchbar;
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.search_text = $('#livesearch-input', this.elem);
        this.search_group = $('#livesearch-group', this.elem);
        this.dd = $('#cone-livesearch-dropdown', this.elem);

        if(this.vp_state === vp_states.SMALL || this.vp_state === vp_states.MEDIUM) {
            this.dd.addClass('dropdown-menu-end');
            this.search_text.detach().prependTo(this.dd);
        }
    }

    viewport_changed(e) {
        super.viewport_changed(e);
        if(this.vp_state === vp_states.SMALL || this.vp_state === vp_states.MEDIUM) {
            this.dd.addClass('dropdown-menu-end');
            this.search_text.detach().prependTo(this.dd);
        } else {
            this.search_text.detach().prependTo(this.search_group);
            this.dd.removeClass('dropdown-menu-end');
        }
    }
}

$(function() {
    searchbar = Searchbar.initialize();
});

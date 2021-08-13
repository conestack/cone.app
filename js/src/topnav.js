import $ from 'jquery'
import {
    ViewPortAware,
    VP_MOBILE
} from './viewport.js';
import {layout} from './layout.js';

export class Topnav extends ViewPortAware {

    static initialize(context) {
        let elem = $('#topnav', context);
        if (!elem.length) {
            return;
        } else {
            layout.topnav = new Topnav(elem);
        }
        return layout.topnav;
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.content = $('#topnav-content', elem);
        this.toggle_button = $('#mobile-menu-toggle', elem);
        this.logo = $('#cone-logo', elem);
        this._toggle_menu_handle = this.toggle_menu.bind(this);
        this.toggle_button.on('click', this._toggle_menu_handle);

        this.viewport_changed();
    }

    toggle_menu() {
        if(this.content.css('display') === 'none') {
            this.content.slideToggle('fast')
            this.content.css('display', 'flex');
        } else {
            this.content.slideToggle('fast');
        }
    }

    viewport_changed(e) {
        if(e) {
            super.viewport_changed(e);
        }

        if (this.vp_state === VP_MOBILE) {
            this.content.hide();
            this.elem.addClass('mobile');
        } else {
            this.content.show();
            this.elem.removeClass('mobile');
        }
    }
}

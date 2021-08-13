import $ from 'jquery'
import {
    ViewPortAware,
    VP_MOBILE
} from './viewport.js';
import {layout} from './layout.js';
import {toggle_arrow} from './utils.js';

export class Personaltools extends ViewPortAware {

    static initialize(context) {
        let elem = $('#personaltools', context);
        /*  istanbul ignore if */
        if (!elem.length) {
            return;
        } else {
            layout.personaltools = new Personaltools(elem);
        }
        return layout.personaltools;
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.user_menu = $('#user', this.elem);

        this.viewport_changed();
    }

    viewport_changed(e){
        if(e) {
            super.viewport_changed(e);
        }

        if (this.vp_state === VP_MOBILE) {
            this.elem.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                this.user_menu.stop(true, true).slideDown('fast');
                toggle_arrow($('i.dropdown-arrow', '#personaltools'));
            });
            this.elem.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                this.user_menu.stop(true, true).slideUp('fast');
                toggle_arrow($('i.dropdown-arrow', '#personaltools'));
            });
        } else {
            this.elem.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                this.user_menu.show();
            });
            this.elem.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                this.user_menu.hide();
            });
        }
    }
}
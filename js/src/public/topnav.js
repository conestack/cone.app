import $ from 'jquery'
import {
    ViewPortAware,
    VP_MOBILE
} from './viewport.js';
import {toggle_arrow} from './utils.js';
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
        this.tb_dropdowns = $('#toolbar-top>li.dropdown', elem);
        this._toggle_menu_handle = this.toggle_menu.bind(this);
        this.toggle_button.on('click', this._toggle_menu_handle);

        this.viewport_changed();

        // tmp
        this.pt = $('#personaltools');
        this.user =  $('#user');
        this.pt_handle();
        // end tmp
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

            // hide menu on toolbar click
            this.tb_dropdowns.off().on('show.bs.dropdown', () => {
                this.content.hide();
            });
        } else {
            this.content.show();
            this.elem.removeClass('mobile');
            this.tb_dropdowns.off();
        }

        // tmp
        if(this.pt) {
            this.pt_handle();
        }
        // end tmp
    }

    pt_handle() {
        // tmp
        if (this.vp_state === VP_MOBILE) {
            this.pt.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                this.user.stop(true, true).slideDown('fast');
                toggle_arrow($('i.dropdown-arrow', '#personaltools'));
            });
            this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                this.user.stop(true, true).slideUp('fast');
                toggle_arrow($('i.dropdown-arrow', '#personaltools'));
            });
        } else {
            this.pt.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                this.user.show();
            });
            this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                this.user.hide();
            });
        }
    }
}

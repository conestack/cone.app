import $ from 'jquery'
import {ViewPortAware, vp_states} from './viewport.js';
import {MainMenuTop} from './main_menu_top.js';
import {toggle_arrow} from './toggle_arrow.js';

export class Topnav extends ViewPortAware {

    static initialize(context) {
        let elem = $('#topnav', context);
        if (!elem.length) {
            return null;
        }
        topnav = new Topnav(elem);
        return topnav;
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


/*         this.mm_top = MainMenuTop.initialize(); */

        this.viewport_changed();

        // set mainmenu top viewport state
/*         if(this.mm_top !== null) {
            this.mm_top.viewport_changed(this.vp_state);
        } */

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

        // update mainmenu top viewport state
/*         if(this.mm_top !== null) {
            this.mm_top.viewport_changed(this.vp_state);
        } */

        if (this.vp_state === vp_states.MOBILE) {
            this.content.hide();
            this.elem.addClass('mobile');

            // hide menu on toolbar click
            this.tb_dropdowns.off().on('show.bs.dropdown', () => {
                this.content.hide();
            });

/*             if(this.mm_top !== null) {
                this.logo.css('margin-right', 'auto');
            } */
        } else {
            this.content.show();
            this.elem.removeClass('mobile');

            this.tb_dropdowns.off();

/*             if(this.mm_top !== null){
                this.logo.css('margin-right', '2rem');
            } */
        }

        // tmp
        if(this.pt) {
            this.pt_handle();
        }
        // end tmp
    }

    pt_handle() {
        // tmp
        if (this.vp_state === vp_states.MOBILE) {
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

export var topnav = Topnav.initialize();
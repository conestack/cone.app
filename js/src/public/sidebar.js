import $ from 'jquery';
import {
    VP_MOBILE,
    VP_SMALL,
    VP_LARGE
} from './viewport.js';
import {createCookie, readCookie} from './utils.js';
import {ViewPortAware} from './viewport.js';
import {layout} from './layout.js';

export class Sidebar extends ViewPortAware {
    static initialize(context) {
        let elem = $('#sidebar_left', context);

        if(!elem.length) {
            return;
        } else {
            layout.sidebar = new Sidebar(elem);
        }

        return layout.sidebar;
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.content = $('#sidebar_content', elem);

        // DOM elements
        this.toggle_btn = $('#sidebar-toggle-btn', elem);
        this.toggle_arrow_elem = $('i', this.toggle_btn);
        this.lock_switch = $('#toggle-fluid');

        // properties
        this.cookie = null;
        this.collapsed = false;

        // bindings
        this._toggle_menu_handle = this.toggle_menu.bind(this);
        this.toggle_btn.off('click').on('click', this._toggle_menu_handle);

        this._toggle_lock = this.toggle_lock.bind(this);
        this.lock_switch.off('click').on('click', this._toggle_lock);

        // execute initial load
        this.initial_load();
    }

    initial_load() {
        let cookie = readCookie('sidebar');
        if (this.vp_state === VP_MOBILE) {
            this.elem.hide();
        }
        else if (cookie === null) {
            if(this.vp_state !== VP_LARGE) {
                this.collapsed = true;
            } else {
                this.collapsed = false;
            }
        } else {
            this.cookie = cookie === 'true';
            this.collapsed = this.cookie;
            this.lock_switch.addClass('active');
        }

        this.viewport_changed();
    }

    assign_state() {
        let elem_class = this.collapsed === true ? 'collapsed' : 'expanded';
        let button_class = 'bi bi-arrow-' + ((this.collapsed === true) ? 'right':'left') + '-circle';
        this.elem.attr('class', elem_class);
        this.toggle_arrow_elem.attr('class', button_class);

        var evt = $.Event(`sidebar_${elem_class}`);
        $(window).trigger(evt);
    }

    toggle_lock() {
        if(readCookie('sidebar')) {
            createCookie('sidebar', '', -1);
            this.lock_switch.removeClass('active');
            this.cookie = null;
        } else {
            this.lock_switch.addClass('active');
            createCookie('sidebar', this.collapsed, null);
            this.cookie = this.collapsed;
        }
    }

    viewport_changed(e) {
        if (e) {
            super.viewport_changed(e);
        }
        if (this.vp_state === VP_MOBILE) {
            this.collapsed = false;
            this.elem.hide();
        }
        else if (this.cookie !== null) {
            this.collapsed = this.cookie;
            this.elem.show();
        }
        else if (this.vp_state === VP_SMALL) {
            this.elem.show();
            let state = this.vp_state === VP_SMALL;
            /* istanbul ignore else */
            if(state != this.collapsed) {
                this.collapsed = state;
            }
        }
        else {
            this.collapsed = false;
            this.elem.show();
        }

        this.assign_state();
    }

    toggle_menu() {
        this.collapsed = !this.collapsed;

        if (this.lock_switch.hasClass('active')) {
            createCookie('sidebar', this.collapsed, null);
            this.cookie = this.collapsed;
        }
        this.assign_state();
    }
}

import $ from 'jquery';
import {vp_states} from './viewport.js';
import {createCookie, readCookie} from './cookie_functions.js';
import {ViewPortAware} from './viewport.js';

export class SidebarMenu extends ViewPortAware {
    static initialize(context) {
        let elem = $('#sidebar_left', context);

        if(!elem.length) {
            sidebar_menu = null;
        } else {
            sidebar_menu = new SidebarMenu(elem);
        }

        return sidebar_menu;
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
        let vp_state = this.vp_state;
        if (vp_state === vp_states.MOBILE) {
            this.elem.hide();
        } 
        else if (cookie === null) {
            if(vp_state !== vp_states.LARGE) {
                this.collapsed = true;
            }
        } else {
            this.cookie = cookie === 'true';
            this.collapsed = this.cookie;
            this.lock_switch.addClass('active');
        }

        this.assign_state();
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
        super.viewport_changed(e);
        if(this.vp_state === vp_states.MOBILE) {
            this.collapsed = false;
            this.elem.hide();

          /*   if(this.mm_sb !== null) {
                this.topnav.mm_top.elem.css('display', 'none');
            } */
        }
        else if (this.cookie !== null) {
            this.collapsed = this.cookie;
            this.elem.show();
        }
        else if(this.vp_state === vp_states.SMALL) {
            this.elem.show();
            let state = this.vp_state === vp_states.SMALL;
            /* istanbul ignore else */
            if(state != this.collapsed) {
                this.collapsed = state;
            }
        }
        else {
            this.collapsed = false;
            this.elem.show();
        }

      /*   if(this.topnav.mm_top !== null) {
            if(this.vp_state !== vp_states.MOBILE && this.mm_sb !== null) {
                this.topnav.mm_top.elem.css('display', 'flex');
            }
        } */
       
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

export var sidebar_menu = SidebarMenu.initialize();

// $(SidebarMenu.initialize());

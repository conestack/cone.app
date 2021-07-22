import $ from 'jquery';
import {vp_states} from './viewport.js';
import {createCookie, readCookie} from './cookie_functions.js';
import {ViewPortAware} from './viewport.js';

// declare elements
let sidebar_menu = null;
let mm_sb = null;
let topnav = null;
let navtree = null;

export class SidebarMenu extends ViewPortAware {
    static initialize(context, mm_sb, topnav, navtree) {
        let elem = $('#sidebar_left', context);

        if(!elem.length) {
            return;
        }

        sidebar_menu = new SidebarMenu(elem, mm_sb, topnav, navtree);
        return sidebar_menu;
    }

    constructor(elem, mm_sb, topnav, navtree) {
        super();
        this.elem = elem;
        this.content = $('#sidebar_content', elem);

        this.mm_sb = mm_sb;
        this.topnav = topnav;
        this.navtree = navtree;

        if (this.vp_state === vp_states.MOBILE) {
            // move mainmenu sidebar to mobile menu
            if (this.mm_sb !== null) {
                this.mm_sb.elem.detach()
                .appendTo(this.topnav.content)
                .addClass('mobile');
            }
            if (this.navtree !== null && this.topnav !== null) {
                this.navtree.elem.detach().appendTo(this.topnav.content).addClass('mobile');
                this.navtree.content.hide();
                this.navtree.heading.off('click').on('click', () => {
                    this.navtree.content.slideToggle('fast');
                });
            }
        } else {
            if (this.navtree !== null) {
                this.navtree.elem.detach().appendTo(this.content).removeClass('mobile');
                this.navtree.heading.off('click');
                this.navtree.content.show();
            }
            if (this.mm_sb !== null) {
                this.mm_sb.elem.detach()
                .prependTo(this.content)
                .removeClass('mobile');
            }
        }

        if (this.mm_sb === null && this.topnav === null && this.navtree === null) {
            // hide if no children are in content
            this.elem.hide();
            super.unload();
        }

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

        if(this.mm_sb !== null) {
            if(this.collapsed) {
                this.mm_sb.collapse();
            }
            else {
                this.mm_sb.expand();
            }
        }
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

$(function() {
    sidebar_menu = SidebarMenu.initialize();
});
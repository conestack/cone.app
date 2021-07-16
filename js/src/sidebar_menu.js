import $ from 'jquery';
import {vp_states} from './viewport.js';
import {sidebar_menu} from './globals.wip.js';
import {createCookie, readCookie} from './cookie_functions.js';
import {ViewPortAware} from './viewport.js';
import {main_menu_sidebar} from './globals.wip.js';


export class SidebarMenu extends ViewPortAware {

    static initialize(context) {
        let elem = $('#sidebar_left', context);

        if(!elem.length) {
            return;
        }

        if(sidebar_menu !== null) {
            sidebar_menu.unload();
        }

        return new SidebarMenu(elem);
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.content = $('#sidebar_content', elem);

        /* NOTE: trim doesn't work in safe mode, apparently */
        // if(!$.trim(this.content.html()).length) {
        //     // hide sidebar if empty
        //     // trim() ensures execution if content has whitespace
        //     this.elem.hide();
        //     super.unload();
        // }
        this.collapsed = false;

        this.toggle_btn = $('#sidebar-toggle-btn', elem);
        this.toggle_arrow_elem = $('i', this.toggle_btn);
        this.lock_switch = $('#toggle-fluid');
        this.cookie = null;
       
        this._toggle_menu_handle = this.toggle_menu.bind(this);
        this.toggle_btn.off('click').on('click', this._toggle_menu_handle);

        this.initial_load();

        this._toggle_lock = this.toggle_lock.bind(this);
        this.lock_switch.off('click').on('click', this._toggle_lock);
    }

    unload() {
        super.unload();
        this.toggle_btn.off('click', this._toggle_menu_handle);
        this.lock_switch.off('click', this._toggle_lock);
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

    assign_state() {
        let elem_class = this.collapsed === true ? 'collapsed' : 'expanded';
        let button_class = 'bi bi-arrow-' + ((this.collapsed === true) ? 'right':'left') + '-circle';
        this.elem.attr('class', elem_class);
        this.toggle_arrow_elem.attr('class', button_class);

        if(main_menu_sidebar !== null) {
            if(this.collapsed) {
                main_menu_sidebar.collapse();
            }
            else {
                main_menu_sidebar.expand();
            }
        }
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

export var bla = 'bla';
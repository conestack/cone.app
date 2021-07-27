import $ from 'jquery';
import {ViewPortAware, vp_states} from './viewport.js';
import {sidebar_menu} from './sidebar_menu.js';
import {topnav} from './topnav.js';
import {mainmenu_sidebar} from './main_menu_sidebar.js';
import {navtree} from './navtree.js';
import { mainmenu_top } from './main_menu_top.js';

// mobile_nav singleton
export let mobile_nav = null;

export class MobileNav extends ViewPortAware {
    static initialize() {
        if(sidebar_menu === null && topnav === null) {
            mobile_nav = null;
        } else {
            mobile_nav = new MobileNav();
        }

        return mobile_nav;
    }
    constructor() {
        super();

        // // TODO: create topnav if null
        // else if(topnav === null) {
        //     // create topnav or go with sidebar icon bar?
        // }

        // hide if no children are in content
        if (sidebar_menu !== null &&
            mainmenu_sidebar === null &&
            navtree === null
        ){
            sidebar_menu.elem.hide();
            // sidebar.unload();
            $(window).off('viewport_changed', sidebar_menu._viewport_changed_handle);
            return;
        }

        this.viewport_changed();
    }
  
    viewport_changed(e) {
        if(e){
            super.viewport_changed(e);
        }

        if (mainmenu_sidebar !== null) {
            if (this.vp_state === vp_states.MOBILE) {
                mainmenu_sidebar.mv_to_mobile();
                mainmenu_top.elem.hide();
            } else {
                mainmenu_sidebar.mv_to_sidebar();
                mainmenu_top.elem.show();
            }
        } else if (mainmenu_sidebar === null && mainmenu_top !== null) {
            if (this.vp_state === vp_states.MOBILE) {
                mainmenu_top.mv_to_mobile();
            } else {
                mainmenu_top.mv_to_top();
            }
        }

        if(mainmenu_top !== null){
            if(this.vp_state === vp_states.MOBILE) {
                topnav.logo.css('margin-right', 'auto');
            } else {
                topnav.logo.css('margin-right', '2rem');
            }
        }
        if (navtree !== null) {
            if (this.vp_state === vp_states.MOBILE) {
                navtree.mv_to_mobile();
            } else {
                navtree.mv_to_sidebar();
            }
        }
    }
}
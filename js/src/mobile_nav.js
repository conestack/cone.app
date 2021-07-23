import $ from 'jquery';
import {ViewPortAware, vp_states} from './viewport.js';
import {sidebar_menu} from './sidebar_menu.js';
import {topnav} from './topnav.js';
import {mainmenu_sidebar} from './main_menu_sidebar.js';
import {navtree} from './navtree.js';
import { mainmenu_top } from './main_menu_top.js';

// mobile_nav singleton

export class MobileNav extends ViewPortAware {
    constructor() {
        super();

        this.children = [mainmenu_sidebar, navtree, mainmenu_top];

        if(sidebar_menu === null && topnav === null) {
            return null;
        }

        // // TODO: create topnav if null
        // else if(topnav === null) {
        //     // create topnav or go with icon bar?
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
    }
  
    viewport_changed(e) {
        super.viewport_changed(e);

        if (mainmenu_sidebar !== null) {
            if (e.state === vp_states.MOBILE) {
                mainmenu_sidebar.mv_to_mobile();
            } else {
                mainmenu_sidebar.mv_to_sidebar();
            }
        } else if (mainmenu_top !== null) {
            if (e.state === vp_states.MOBILE) {
                mainmenu_top.mv_to_mobile();
            } else {
                mainmenu_top.mv_to_top();
            }
        }

        if (navtree !== null) {
            if (e.state === vp_states.MOBILE) {
                navtree.mv_to_mobile();
            } else {
                navtree.mv_to_sidebar();
            }
        }
    }
}
import $ from 'jquery';
import {ViewPortAware, vp_states} from './viewport.js';
import {sidebar_menu} from './sidebar_menu.js';
import {topnav} from './topnav.js';
import {mainmenu_sidebar} from './main_menu_sidebar.js';
import {navtree} from './navtree.js';

// mobile_nav singleton

export class MobileNav extends ViewPortAware {
    constructor() {
        super();

        if (mainmenu_sidebar === null && topnav === null && navtree === null) {
            // hide if no children are in content
            sidebar.elem.hide();
            // sidebar.unload();
            $(window).off('viewport_changed', sidebar._viewport_changed_handle);
        }
    }
  
    viewport_changed(e) {
        super.viewport_changed(e);
        console.log('vp mobileNav: ' + this.vp_state);
        console.log('vp sidebar: ' + sidebar_menu.vp_state);

        if (this.vp_state === vp_states.MOBILE) {
            // move mainmenu sidebar to mobile menu
            if (mainmenu_sidebar !== null) {
                mainmenu_sidebar.elem.detach()
                .appendTo(topnav.content)
                .addClass('mobile');
                
                topnav.elem.css('display', 'none');
            }
            if (navtree !== null && topnav !== null) {
                navtree.elem.detach().appendTo(this.topnav.content).addClass('mobile');
                navtree.content.hide();
                navtree.heading.off('click').on('click', () => {
                    navtree.content.slideToggle('fast');
                });
            }
        } else {
            if (navtree !== null) {
                navtree.elem.detach().appendTo(sidebar.content).removeClass('mobile');
                navtree.heading.off('click');
                navtree.content.show();
            }
            if (mainmenu_sidebar !== null) {
                mainmenu_sidebar.elem.detach()
                .prependTo(sidebar_menu.content)
                .removeClass('mobile');
            }
        }
    }
}
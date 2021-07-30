import $ from 'jquery';
import {ViewPortAware, vp_states} from './viewport.js';
import {layout} from './layout.js';

// mobile_nav singleton

export class MobileNav extends ViewPortAware {
    static initialize(context) {
        let elem = $('#topnav-content', context);

        if (!elem.length) {
            layout.mobile_nav = null;
        } else {
            layout.mobile_nav = new MobileNav(elem);
        }
        return layout.mobile_nav;
    }

    constructor(elem) {
        super();

        this.elem = elem;
        this.viewport_changed();
    }

    viewport_changed(e) {
        if(e){
            super.viewport_changed(e);
        }

        if (layout.mainmenu_sidebar !== null) {
            if (this.vp_state === vp_states.MOBILE) {
                layout.mainmenu_sidebar.mv_to_mobile(this.elem);
                if(layout.mainmenu_top !== null){
                    layout.mainmenu_top.elem.hide();
                }
            } else {
                layout.mainmenu_sidebar.mv_to_sidebar();
                if(layout.mainmenu_top !== null) {
                    layout.mainmenu_top.elem.show();
                }
            }
        } else if (layout.mainmenu_sidebar === null && layout.mainmenu_top !== null) {
            if (this.vp_state === vp_states.MOBILE) {
                layout.mainmenu_top.mv_to_mobile();
            } else {
                layout.mainmenu_top.mv_to_top();
            }
        }

        if(layout.mainmenu_top !== null){
            if(this.vp_state === vp_states.MOBILE) {
                $('#cone-logo').css('margin-right', 'auto');
            } else {
                $('#cone-logo').css('margin-right', '2rem');
            }
        }
        if (layout.navtree !== null) {
            if (this.vp_state === vp_states.MOBILE) {
                layout.navtree.mv_to_mobile(this.elem);
            } else {
                layout.navtree.mv_to_sidebar();
            }
        }
    }
}

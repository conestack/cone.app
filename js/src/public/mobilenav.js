import $ from 'jquery';
import {
    ViewPortAware,
    VP_MOBILE
} from './viewport.js';
import {toggle_arrow} from './utils.js';
import {layout} from './layout.js';

// mobile_nav singleton

export class MobileNav extends ViewPortAware {
    static initialize(context) {
        let elem = $('#topnav-content', context);

        if (!elem.length) {
            return;
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

        if (this.vp_state === VP_MOBILE) {
            this.mv_mmsb_to_mobile();
            this.mv_mmtop_to_mobile();
            this.mv_navtree_to_mobile();
        } else {
            this.mv_mmsb_to_sidebar();
            this.mv_mmtop_to_top();
            this.mv_navtree_to_sidebar();
        }
    }

    // mainmenu sidebar
    mv_mmsb_to_mobile() {
        let mm_sb = layout.mainmenu_sidebar;
        if(mm_sb === null) {
            return;
        }

        mm_sb.elem
        .detach()
        .appendTo(this.elem)
        .addClass('mobile')
        ;
        mm_sb.expand();
    }

    mv_mmsb_to_sidebar() {
        let mm_sb = layout.mainmenu_sidebar;
        if(mm_sb === null) {
            return;
        }

        mm_sb.elem
            .detach()
            .appendTo(layout.sidebar.content)
            .removeClass('mobile')
        ;
    }

    // navtree
    mv_navtree_to_mobile() {
        let nav = layout.navtree;
        if (nav === null) {
            return;
        }

        nav.elem.detach().appendTo(this.elem).addClass('mobile');
        nav.content.hide();
        nav.heading.off('click').on('click', () => {
            nav.content.slideToggle('fast');
        });
    }

    mv_navtree_to_sidebar() {
        let nav = layout.navtree;
        if (nav === null) {
            return;
        }

        nav.elem
            .detach()
            .appendTo(layout.sidebar.content)
            .removeClass('mobile');
        nav.heading.off('click');
        nav.content.show();
    }

    // mainmenu top
    mv_mmtop_to_mobile() {
        let mm_top = layout.mainmenu_top,
            mm_sb = layout.mainmenu_sidebar;

        if(mm_top === null) {
            return;
        } else if(mm_sb !== null) {
            mm_top.elem.hide();
            return;
        }

        let mm_items = layout.mainmenu_top.main_menu_items;

        for (let i in mm_items) {
            let item = mm_items[i];
            if (item.menu) {
                item.menu.off().detach().appendTo(item.elem).css('left', '0');
                item.elem.off();
                item.arrow.off().on('click', () => {
                    item.menu.slideToggle('fast');
                    toggle_arrow(item.arrow);
                });
            }
        }
    }

    mv_mmtop_to_top() {
        let mm_top = layout.mainmenu_top,
            mm_sb = layout.mainmenu_sidebar;

        if(mm_top === null) {
            return;
        } else if(mm_sb !== null) {
            mm_top.elem.show();
            return;
        }

        let mm_items = mm_top.main_menu_items;

        for (let i in mm_items) {
            let item = mm_items[i];
            if (item.menu) {
                item.menu.detach().appendTo('#layout');
                item.arrow.off();
                item.elem.off().on('mouseenter mouseleave', item._toggle);
                item.menu.off().on('mouseenter mouseleave', () => {
                    item.menu.toggle();
                });
            }
        }
    }
}

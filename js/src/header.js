import $ from 'jquery';
import ts from 'treibstoff';
import { ScrollbarY } from './scrollbar.js';
import { LayoutAware } from './layout.js';

/**
 * Class to manage the header layout and interactions.
 * @extends LayoutAware
 */
export class Header extends LayoutAware {

    /**
     * Initializes the Header instance.
     * @param {Element} context
     */
    static initialize(context) {
        const elem = ts.query_elem('#header-main', context);
        if (!elem) {
            return;
        }
        new Header(elem);
    }

    /**
     * @param {Element} elem The main header element.
     */
    constructor(elem) {
        super(elem);
        this.elem = elem;
        this.header_content = ts.query_elem('#header-content', elem);
        this.navbar_content_wrapper = ts.query_elem('#navbar-content-wrapper', elem);
        this.navbar_content = ts.query_elem('#navbar-content', elem);
        this.navbar_toggler = ts.query_elem('#navbar-toggler', this.elem);
        this.personal_tools = ts.query_elem('#personaltools', elem);
        this.mainmenu = ts.query_elem('#mainmenu', elem);
        this.mainmenu_elems = $('.nav-link.dropdown-toggle', this.mainmenu);

        this.render_mobile_scrollbar = this.render_mobile_scrollbar.bind(this);
        this.mainmenu_elems.each((i, el) => {
            $(el).on('shown.bs.dropdown', this.render_mobile_scrollbar);
            $(el).on('hidden.bs.dropdown', this.render_mobile_scrollbar);
        });

        this.update_personal_tools_room = this.update_personal_tools_room.bind(this);
        if (this.personal_tools) {
            this.personal_tools.on(
                'shown.bs.dropdown hidden.bs.dropdown',
                this.update_personal_tools_room
            );
        }

        this.set_mobile_menu_open = this.set_mobile_menu_open.bind(this);
        this.set_mobile_menu_closed = this.set_mobile_menu_closed.bind(this);
        this.bind();
    }

    /**
     * Destroys the Header instance and cleans up event listeners.
     */
    destroy() {
        super.destroy();
        if (this.mobile_scrollbar) {
            this.mobile_scrollbar.destroy();
            this.mobile_scrollbar = null;
        }
        this.mainmenu_elems.each((i, el) => {
            $(el).off('shown.bs.dropdown', this.render_mobile_scrollbar);
            $(el).off('hidden.bs.dropdown', this.render_mobile_scrollbar);
        });
        if (this.personal_tools) {
            this.personal_tools.off(
                'shown.bs.dropdown hidden.bs.dropdown',
                this.update_personal_tools_room
            );
        }
        const wrapper = this.navbar_content_wrapper;
        wrapper.off('show.bs.collapse shown.bs.collapse', this.set_mobile_menu_open);
        wrapper.off('hide.bs.collapse hidden.bs.collapse', this.set_mobile_menu_closed);
    }

    /**
     * Renders the mobile scrollbar if in compact mode.
     */
    render_mobile_scrollbar() {
        if (this.is_compact && this.mobile_scrollbar) {
            this.mobile_scrollbar.render();
        }
    }

    /**
     * Reserves space below the personal tools for their open dropdown menu
     * while they live in the mobile menu. The menu is positioned absolutely
     * below its toggle, but the mobile menu wrapper clips its overflow for
     * the custom scrollbar, so without the reserved space the menu is cut
     * off and cannot be used. Positioning the menu statically instead would
     * widen its column and shift the other personal tools around.
     */
    update_personal_tools_room() {
        // measure without the previously reserved space
        this.personal_tools.css('margin-bottom', '');
        if (!this.is_super_compact) {
            return;
        }
        const bottom = this.personal_tools[0].getBoundingClientRect().bottom;
        let room = 0;
        $('.dropdown-menu.show', this.personal_tools).each((i, menu) => {
            room = Math.max(room, menu.getBoundingClientRect().bottom - bottom);
        });
        if (room > 0) {
            this.personal_tools.css('margin-bottom', `${room}px`);
        }
        this.render_mobile_scrollbar();
    }

    /**
     * Binds event listeners for bootstrap navbar collapse events.
     */
    bind() {
        const wrapper = this.navbar_content_wrapper;
        wrapper.on('show.bs.collapse shown.bs.collapse', this.set_mobile_menu_open);
        wrapper.on('hidden.bs.collapse', this.set_mobile_menu_closed);
    }

    /**
     * Sets a header class to indicate the mobile menu is open.
     */
    set_mobile_menu_open() {
        this.elem.addClass('mobile-menu-open');
    }

    /**
     * Removes a header class to indicate the mobile menu is closed.
     */
    set_mobile_menu_closed() {
        this.elem.removeClass('mobile-menu-open');
    }

    /**
     * Handles changes (scrollbar and bootstrap dropdown)
     * in the compact state of the header.
     * @param {boolean} val
     */
    on_is_compact(val) {
        if (this.mobile_scrollbar) {
            // remove mobile scrollbar
            this.navbar_content.removeClass('scrollable-content');
            this.mobile_scrollbar.destroy();
            this.mobile_scrollbar = null;
        }
        if (val) {
            this.elem.removeClass('full').removeClass('navbar-expand');
            this.elem.addClass('compact');

            // create mobile scrollbar
            this.navbar_content.addClass('scrollable-content');
            this.mobile_scrollbar = new ScrollbarY(this.navbar_content_wrapper);

            this.navbar_content_wrapper.on('shown.bs.collapse', () => {
                // disable scroll to refresh page on mobile devices
                $('html, body').css('overscroll-behavior', 'none');
                this.mobile_scrollbar.render();
            });
            this.navbar_content_wrapper.on('hide.bs.collapse', () => {
                // enable scroll to refresh page on mobile devices
                $('html, body').css('overscroll-behavior', 'auto');
                this.mobile_scrollbar.scrollbar.hide();
            });
        } else {
            this.elem.removeClass('compact');
            this.elem.addClass('full').addClass('navbar-expand');
        }
    }

    /**
     * Handles changes in the super compact state of the header.
     * @param {boolean} val
     */
    on_is_super_compact(val) {
        const in_navbar_content = ts.query_elem(
            '#personaltools',
            this.navbar_content
        ) !== null;
        if (val) {
            if (!in_navbar_content) {
                this.personal_tools.detach().appendTo(this.navbar_content);
            }
        } else {
            if (in_navbar_content) {
                this.personal_tools.detach().prependTo(this.header_content);
            }
            // close any header dropdowns
            $(".dropdown-menu.show").removeClass('show');
            if (this.personal_tools) {
                this.update_personal_tools_room();
            }
        }
    }
}

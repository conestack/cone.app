import $ from 'jquery';
import ts from 'treibstoff';
import {ScrollbarY} from './scrollbar.js';
import {LayoutAware} from './layout.js';

export class Header extends LayoutAware {

    static initialize(context) {
        const elem = ts.query_elem('#header-main', context);
        if (!elem) {
            return;
        }
        new Header(elem);
    }

    constructor(elem) {
        super(elem);
        this.elem = elem;
        this.logo_placeholder = ts.query_elem('#header-logo-placeholder', elem);
        this.header_content = ts.query_elem('#header-content', elem);
        this.navbar_content_wrapper = ts.query_elem('#navbar-content-wrapper', elem);
        this.navbar_content = ts.query_elem('#navbar-content', elem);
        this.navbar_toggler = ts.query_elem('#navbar-toggler', this.elem);
        this.personal_tools = ts.query_elem('#personaltools', elem);
        this.mainmenu = ts.query_elem('#mainmenu', elem);
        this.mainmenu_elems = $('.nav-link.dropdown-toggle', this.mainmenu);

        // this.render_mobile_scrollbar = this.render_mobile_scrollbar.bind(this);
        this.mainmenu_elems.each((i, el) => {
            $(el).on('shown.bs.dropdown', this.render_mobile_scrollbar.bind(this));
            $(el).on('hidden.bs.dropdown', this.render_mobile_scrollbar.bind(this));
        });

        this.set_mobile_menu_open = this.set_mobile_menu_open.bind(this);
        this.set_mobile_menu_closed = this.set_mobile_menu_closed.bind(this);
        this.bind();

        ts.ajax.attach(this, elem);

        this.render_mobile_scrollbar = this.render_mobile_scrollbar.bind(this);
    }

    destroy() {
        super.destroy();
        this.mainmenu_elems.each((i, el) => {
            $(el).off('shown.bs.dropdown', this.render_mobile_scrollbar.bind(this));
            $(el).off('hidden.bs.dropdown', this.render_mobile_scrollbar.bind(this));
        });
        const wrapper = this.navbar_content_wrapper;
        wrapper.off('show.bs.collapse shown.bs.collapse', this.set_mobile_menu_open);
        wrapper.off('hide.bs.collapse hidden.bs.collapse', this.set_mobile_menu_closed);
    }

    render_mobile_scrollbar() {
        if (this.is_compact && this.mobile_scrollbar) {
            this.mobile_scrollbar.render();
        }
    }

    bind() {
        const wrapper = this.navbar_content_wrapper;
        wrapper.on('show.bs.collapse shown.bs.collapse', this.set_mobile_menu_open);
        wrapper.on('hidden.bs.collapse', this.set_mobile_menu_closed);
    }

    set_mobile_menu_open() {
        this.elem.addClass('mobile-menu-open');
    }

    set_mobile_menu_closed() {
        this.elem.removeClass('mobile-menu-open');
    }

    on_is_compact(val) {
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

            // remove mobile scrollbar
            this.navbar_content.removeClass('scrollable-content');
            if (this.mobile_scrollbar) {
                this.mobile_scrollbar.destroy();
                this.mobile_scrollbar = null;
            }
        }
    }

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
        }
    }

    on_is_sidebar_collapsed(val) {
        if (val) {
            this.logo_placeholder.show();
        } else {
            this.logo_placeholder.hide();
        }
    }
}

import $ from 'jquery';
import ts from 'treibstoff';
import {global_events} from './globals.js';
import { ScrollbarY } from './scrollbar.js';

export class Header extends ts.Events {

    static initialize(context) {
        const elem = ts.query_elem('#header-main', context);
        if (!elem) {
            return;
        }
        new Header(elem);
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.logo_placeholder = ts.query_elem('#header-logo-placeholder', elem);
        this.header_content = ts.query_elem('#header-content', elem);
        this.navbar_content_wrapper = ts.query_elem('#navbar-content-wrapper', elem);
        this.navbar_content = ts.query_elem('#navbar-content', elem);
        this.personal_tools = ts.query_elem('#personaltools', elem);

        this.set_mode = this.set_mode.bind(this);
        global_events.on('on_sidebar_resize', this.set_mode);
        $(window).on('resize', this.set_mode);

        ts.ajax.attach(this, elem);

        new ts.Property(this, 'is_compact', null);
        new ts.Property(this, 'is_super_compact', null);

        this.render_mobile_scrollbar = this.render_mobile_scrollbar.bind(this);

        this.set_mode();
    }

    destroy() {
        $(window).off('resize', this.set_mode);
        global_events.off('on_sidebar_resize', this.set_mode);
    }

    render_mobile_scrollbar() {
        if (this.is_compact && this.mobile_scrollbar) {
            this.mobile_scrollbar.render();
        }
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

            // mainmenu
            this.mainmenu = $('#mainmenu', this.elem).data()
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

        global_events.trigger('on_header_mode_toggle', this);
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

    set_mode(inst, sidebar) {
        if ($(window).width() > this.elem.outerWidth(true)) {
            this.logo_placeholder.hide();
        } else {
            this.logo_placeholder.show();
        }

        this.is_compact = this.elem.outerWidth() < 992; // tablet
        this.is_super_compact = this.elem.outerWidth() < 576; // mobile
    }
}

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
        this.navbar_content_wrapper = $('#navbar-content-wrapper', elem);
        this.navbar_content = $('#navbar-content', elem);

        this.set_mode = this.set_mode.bind(this);
        global_events.on('on_sidebar_resize', this.set_mode);
        $(window).on('resize', this.set_mode);

        ts.ajax.attach(this, elem);

        const taken = $('#personaltools').outerWidth() + $('#header-logo').outerWidth();
        const is_compact = $(window).width() < 768 ||
            (this.elem.outerWidth() < taken + 500);
        new ts.Property(this, 'is_compact', is_compact);

        this.render_scrollbar = this.render_scrollbar.bind(this);
        this.fade_scrollbar = this.fade_scrollbar.bind(this);

        this.set_mode();
    }

    render_scrollbar() {
        if (this.is_compact && this.mobile_scrollbar) {
            this.mobile_scrollbar.render();
        }
    }

    fade_scrollbar() {
        if (!this.mobile_scrollbar.scrollbar.is(':visible')) {
            this.mobile_scrollbar.scrollbar.fadeIn('fast');
        }
        if (this.fade_out_timeout) {
            clearTimeout(this.fade_out_timeout);
        }
        this.fade_out_timeout = setTimeout(() => {
            this.mobile_scrollbar.scrollbar.fadeOut('slow');
        }, 700);
    }

    on_is_compact(val) {
        if (val) {
            console.log('header compact')
            this.elem.removeClass('full').removeClass('navbar-expand');
            this.elem.addClass('compact');
            this.logo_placeholder.hide();

            // create mobile scrollbar
            this.navbar_content.addClass('scrollable-content');
            this.mobile_scrollbar = new ScrollbarY(this.navbar_content_wrapper);
            this.mobile_scrollbar.on('on_position', this.fade_scrollbar);

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
            console.log('header desktop')
            this.elem.removeClass('compact');
            this.elem.addClass('full').addClass('navbar-expand');
            this.logo_placeholder.show();

            // remove mobile scrollbar
            this.navbar_content.removeClass('scrollable-content');
            if (this.mobile_scrollbar) {
                this.mobile_scrollbar.off('on_position', this.fade_scrollbar);
                this.mobile_scrollbar.destroy();
                this.mobile_scrollbar = null;
            }
        }

        global_events.trigger('on_header_mode_toggle', this);
    }

    set_mode() {
        const taken = $('#personaltools').outerWidth() + $('#header-logo').outerWidth();
        this.is_compact = $(window).width() < 768 ||
            (this.elem.outerWidth() < taken + 500);
    }
}

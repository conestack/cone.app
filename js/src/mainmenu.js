import $ from 'jquery';
import ts from 'treibstoff';
import {global_events} from './globals.js';
import { ScrollbarY } from './scrollbar.js';

export class MainMenu extends ts.Events {

    static initialize(context) {
        const elem = ts.query_elem('#mainmenu', context);
        if (!elem) {
            return;
        }
        new MainMenu(elem);
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.height = this.elem.outerHeight();
        this.scrollbar = elem.data('scrollbar');
        this.elems = $('.nav-link.dropdown-toggle', elem);
        this.navbar_toggler = ts.query_elem('.navbar-toggler[data-bs-target="#navbar-content-wrapper"]', $('body'));
        this.navbar_content_wrapper = ts.query_elem('#navbar-content-wrapper', $('body'));

        this.open_dropdown = null;

        ts.ajax.attach(this, elem);

        this.on_show_dropdown_desktop = this.on_show_dropdown_desktop.bind(this);
        this.on_hide_dropdown_desktop = this.on_hide_dropdown_desktop.bind(this);
        this.hide_dropdowns = this.hide_dropdowns.bind(this);
        this.handle = this.handle.bind(this);
        // this.scrollbar.on('on_position', this.hide_dropdowns);
        global_events.on('on_sidebar_resize', this.handle);
        $(window).on('resize', this.handle);
        this.handle();

        const is_mobile = $(window).width() <= 768; // XXX: is mobile from header
        new ts.Property(this, 'is_mobile', is_mobile);
    }

    on_is_mobile(val) {
        // XXX: move some stuff to header!! mobile menu is not only bound to
        // viewport size but also to sidebar width!

        if (val) {
            this.scrollbar.off('on_position', this.hide_dropdowns);
            this.unbind_dropdowns_desktop();
            this.elem.addClass('mobile');

            // create mobile scrollbar
            $('#navbar-content').addClass('scrollable-content');
            this.mobile_scrollbar = new ScrollbarY($('#navbar-content-wrapper'));
            
            $('#navbar-content-wrapper').on('shown.bs.collapse', () => {
                // disable scroll to refresh page on mobile devices
                $('html, body').css('overscroll-behavior', 'none');
                this.mobile_scrollbar.render();
                this.mobile_scrollbar.scrollbar.fadeIn();
            });
            $('#navbar-content-wrapper').on('hide.bs.collapse', () => {
                // enable scroll to refresh page on mobile devices
                $('html, body').css('overscroll-behavior', 'auto');
                // this.mobile_scrollbar.destroy();
                this.mobile_scrollbar.scrollbar.hide();
            });
            this.elems.each((i, el) => {
                $(el).on('shown.bs.dropdown', () => {
                    this.mobile_scrollbar.render();
                });
                $(el).on('hidden.bs.dropdown', () => {
                    this.mobile_scrollbar.render();
                });
            });
        } else {
            this.bind_dropdowns_desktop();
            this.scrollbar.on('on_position', this.hide_dropdowns);
            this.elem.removeClass('mobile');
        }
    }

    on_show_dropdown_desktop(evt) {
        const el = evt.target;
        this.open_dropdown = el;
        this.elem.css('height', '200vh'); // XXX: for some reason 100vh is not enough

        // prevent element being cut by scrollbar while open
        const dropdown = $(el).siblings('ul.dropdown-menu');
        dropdown.css({
            position: 'fixed',
            top: `${this.height}px`,
            left: `${$(el).offset().left}px`
        });
    }

    on_hide_dropdown_desktop(evt) {
        const el = evt.target;
        // return if the click that closes the dropdown opens another dropdown
        if (this.open_dropdown !== el) {
            return;
        }
        this.elem.css('height', '100%');
        this.open_dropdown = null;
    }

    bind_dropdowns_desktop() {
        this.elems.each((i, el) => {
            $(el).on('shown.bs.dropdown', this.on_show_dropdown_desktop);
            $(el).on('hidden.bs.dropdown', this.on_hide_dropdown_desktop);
        });
    }

    unbind_dropdowns_desktop() {
        this.elems.each((i, el) => {
            $(el).off('shown.bs.dropdown', this.on_show_dropdown_desktop);
            $(el).off('hidden.bs.dropdown', this.on_hide_dropdown_desktop);
        });
    }

    hide_dropdowns() {
        this.elems.each((i, el) => {
            $(el).dropdown('hide');
        });
    }

    handle() {
        this.is_mobile = $(window).width() <= 768; // bs5 small/medium breakpoint
        const taken = $('#personaltools').outerWidth() + $('#header-logo').outerWidth();
        if ($('#header-main').outerWidth() < taken + 500) {
            if ($('#header-main').hasClass('navbar-expand')) {
                $('#header-main').removeClass('navbar-expand');
            }
        } else {
            if (!$('#header-main').hasClass('navbar-expand')) {
                $('#header-main').addClass('navbar-expand');
            }
        }
    }
}

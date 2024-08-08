import $ from 'jquery';
import ts from 'treibstoff';
import {global_events} from './globals.js';

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
        this.open_dropdown = null;

        this.elems.each((i, el) => {
            $(el).on('shown.bs.dropdown', () => {
                this.open_dropdown = el;
                this.elem.css('height', '200vh'); // XXX: for some reason 100vh is not enough

                // prevent element being cut by scrollbar while open
                const dropdown = $(el).siblings('ul.dropdown-menu');
                dropdown.css({
                    position: 'fixed',
                    top: `${this.height}px`,
                    left: `${$(el).offset().left}px`
                });
            });
            $(el).on('hidden.bs.dropdown', () => {
                // return if the click that closes the dropdown opens another dropdown
                if (this.open_dropdown !== el) {
                    return;
                }
                this.elem.css('height', '100%');
                this.open_dropdown = null;
            });
        });

        this.hide_dropdowns = this.hide_dropdowns.bind(this);
        this.scrollbar.on('on_position', this.hide_dropdowns);

        ts.ajax.attach(this, elem);

        ///
        this.navbar_toggler = ts.query_elem('.navbar-toggler[data-bs-target="#navbar-content-wrapper"]', $('body'));
        this.navbar_content_wrapper = ts.query_elem('#navbar-content-wrapper', $('body'));
        this.handle = this.handle.bind(this);
        global_events.on('on_sidebar_resize', this.handle);
        $(window).on('resize', this.handle);
        this.handle();
    }

    hide_dropdowns() {
        this.elems.each((i, el) => {
            $(el).dropdown('hide');
        });
    }

    handle() {
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

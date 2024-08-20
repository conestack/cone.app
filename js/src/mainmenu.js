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
        this.navbar_toggler = ts.query_elem('.navbar-toggler[data-bs-target="#navbar-content-wrapper"]', $('body'));
        this.navbar_content_wrapper = ts.query_elem('#navbar-content-wrapper', $('body'));

        this.open_dropdown = null;

        ts.ajax.attach(this, elem);

        this.on_show_dropdown_desktop = this.on_show_dropdown_desktop.bind(this);
        this.on_hide_dropdown_desktop = this.on_hide_dropdown_desktop.bind(this);
        this.hide_dropdowns = this.hide_dropdowns.bind(this);
        this.scrollbar.on('on_position', this.hide_dropdowns);

        this.on_sidebar_resize = this.on_sidebar_resize.bind(this);
        global_events.on('on_sidebar_resize', this.on_sidebar_resize);

        this.on_main_area_mode = this.on_main_area_mode.bind(this);
        global_events.on('on_main_area_mode', this.on_main_area_mode);
    }

    on_sidebar_resize(inst, sidebar) {
        // defer to next frame to ensure elements have correct dimensions
        requestAnimationFrame(() => {
            this.scrollbar.render();
        });
    }

    on_main_area_mode(inst, mainarea) {
        this.hide_dropdowns();

        if (mainarea.is_compact) {
            this.scrollbar.off('on_position', this.hide_dropdowns);
            this.bind_dropdowns_mobile();
        } else {
            this.bind_dropdowns_desktop();
            this.scrollbar.on('on_position', this.hide_dropdowns);
        }
    }

    on_show_dropdown_desktop(evt) {
        const el = evt.target;
        this.open_dropdown = el;
        this.elem.css('height', '200vh'); // XXX: for some reason 100vh is not enough

        // prevent element being cut by scrollbar while open
        const dropdown = $(el).siblings('ul.dropdown-menu');
        dropdown.css({
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

    bind_dropdowns_mobile() {
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
}

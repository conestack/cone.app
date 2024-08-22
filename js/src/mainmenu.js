import $ from 'jquery';
import ts from 'treibstoff';
import { LayoutAware } from './layout.js';

/**
 * Class to manage the main menu of the application.
 * @extends LayoutAware
 */
export class MainMenu extends LayoutAware {

    /**
     * Initializes the MainMenu instance.
     * @param {Element} context
     */
    static initialize(context) {
        const elem = ts.query_elem('#mainmenu', context);
        if (!elem) {
            return;
        }
        new MainMenu(elem);
    }

    /**
     * @param {Element} elem
     */
    constructor(elem) {
        super(elem);
        this.elem = elem;
        this.scrollbar = elem.data('scrollbar');
        this.elems = $('.nav-link.dropdown-toggle', elem);
        this.open_dropdown = null;

        this.on_show_dropdown_desktop = this.on_show_dropdown_desktop.bind(this);
        this.on_hide_dropdown_desktop = this.on_hide_dropdown_desktop.bind(this);
        this.hide_dropdowns = this.hide_dropdowns.bind(this);
        this.scrollbar.on('on_position', this.hide_dropdowns);
    }

    /**
     * Returns the main menu element's outer height.
     */
    get height() {
        return this.elem.outerHeight(true);
    }

    /**
     * Handles changes in the sidebar resize event.
     * @param {} inst
     * @param {Object} sidebar
     */
    on_sidebar_resize(inst, sidebar) {
        super.on_sidebar_resize(inst, sidebar);
        // defer to next frame to ensure elements have correct dimensions
        requestAnimationFrame(() => {
            this.scrollbar.render();
        });
    }

    /**
     * Handles changes in the compact state of the main menu.
     * Binds modified dropdown behavior to bootstrap dropdowns.
     * @param {boolean} val
     */
    on_is_compact(val) {
        this.hide_dropdowns();

        if (val) {
            this.scrollbar.off('on_position', this.hide_dropdowns);
            this.bind_dropdowns_mobile();
        } else {
            this.bind_dropdowns_desktop();
            this.scrollbar.on('on_position', this.hide_dropdowns);
        }
    }

    /**
     * Handles the event when a dropdown is shown on desktop.
     * Sets the dropdown position manually due to position being set as
     * 'static' in css (to avoid dropdowns being cut by overflow: hidden)
     * @param {Event} evt
     */
    on_show_dropdown_desktop(evt) {
        const el = evt.target;
        this.open_dropdown = el;

        // prevent element being cut by scrollbar while open
        const dropdown = $(el).siblings('ul.dropdown-menu');
        dropdown.css({
            top: `${this.height - 1}px`, // remove border from position
            left: `${$(el).offset().left}px`
        });
    }

    /**
     * Handles the event when a dropdown is hidden on desktop.
     * @param {Event} evt
     */
    on_hide_dropdown_desktop(evt) {
        const el = evt.target;
        // return if the click that closes the dropdown opens another dropdown
        if (this.open_dropdown !== el) {
            return;
        }
        this.open_dropdown = null;
    }

    /**
     * Binds the dropdown events for desktop view.
     */
    bind_dropdowns_desktop() {
        // this.elems.on(...) and this.elems.each(...on(...)) are deprecated in jquery 4.0.0-beta.2
        this.elem.on('shown.bs.dropdown', '.nav-link.dropdown-toggle', this.on_show_dropdown_desktop);
        this.elem.on('hidden.bs.dropdown', '.nav-link.dropdown-toggle', this.on_hide_dropdown_desktop);
    }

    /**
     * Unbinds the dropdown events for mobile view.
     */
    bind_dropdowns_mobile() {
        this.elem.off('shown.bs.dropdown', '.nav-link.dropdown-toggle', this.on_show_dropdown_desktop);
        this.elem.off('hidden.bs.dropdown', '.nav-link.dropdown-toggle', this.on_hide_dropdown_desktop);
    }

    /**
     * Hides all dropdowns in the main menu.
     */
    hide_dropdowns() {
        this.elems.each((i, el) => {
            $(el).dropdown('hide');
        });
    }
}

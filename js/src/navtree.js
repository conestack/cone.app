import $ from 'jquery';
import ts from 'treibstoff';

/**
 * Class to manage a collapsible navigation tree component.
 */
export class NavTree {

    /**
     * Initializes the NavTree instance for a given context.
     * @param {Element} context - DOM context.
     */
    static initialize(context) {
        const elem = ts.query_elem('#navtree', context);
        if (!elem) {
            return;
        }
        new NavTree(elem);
    }

    /**
     * Constructs a NavTree instance and sets up its behavior.
     * @param {Element} elem - The root ul element of the navigation tree.
     */
    constructor(elem) {
        this.elem = elem;
        this.dropdown_elem = $('#navigation-collapse', elem);

        // Expand menu if previously opened.
        if (localStorage.getItem('cone.app.navtree.open')) {
            this.dropdown_elem.addClass('show');
        }

        this.set_menu_open = this.set_menu_open.bind(this);
        this.set_menu_closed = this.set_menu_closed.bind(this);

        this.dropdown_elem.on('shown.bs.collapse', this.set_menu_open);
        this.dropdown_elem.on('hidden.bs.collapse', this.set_menu_closed);

        ts.ajax.attach(this, elem);
    }

    /**
     * Handles the event when the navigation menu is opened.
     * Stores the menu state in localStorage.
     * @param {Event} e - Event object.
     */
    set_menu_open(e) {
        localStorage.setItem('cone.app.navtree.open', 'true');
    }

    /**
     * Handles the event when the navigation menu is closed.
     * Removes the menu state from localStorage.
     * @param {Event} e - Event object.
     */
    set_menu_closed(e) {
        localStorage.removeItem('cone.app.navtree.open');
    }

    destroy() {
        this.dropdown_elem.removeClass('show').off();
    }
}

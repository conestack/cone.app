import $ from 'jquery';
import ts from 'treibstoff';
import { global_events } from './globals.js';

/**
 * Class to manage the sidebar of the application.
 * @extends ts.Motion
 */
export class Sidebar extends ts.Motion {

    /**
     * Initializes the Sidebar instance.
     * @param {Element} context
     */
    static initialize(context) {
        const elem = ts.query_elem('#sidebar_left', context);
        if (!elem) {
            return;
        }
        new Sidebar(elem);
    }

    /**
     * Creates an instance of the Sidebar.
     * @param {Element} elem
     */
    constructor(elem) {
        super();
        this.elem = elem;
        elem.css('width', this.sidebar_width + 'px');

        this.scrollbar = ts.query_elem('.scrollable-y', elem).data('scrollbar');

        const scrollable_content = ts.query_elem('.scrollable-content', elem);
        const pad_left = scrollable_content.css('padding-left');
        const pad_right = scrollable_content.css('padding-right');
        const logo_width = $('#header-logo').outerWidth(true);
        elem.css(
            'min-width',
            `calc(${logo_width}px + ${pad_left} + ${pad_right})`
        );

        this.on_click = this.on_click.bind(this);
        const collapse_elem = ts.query_elem('#sidebar_collapse', elem);
        collapse_elem.on('click', this.on_click);

        const resizer_elem = ts.query_elem('#sidebar_resizer', elem);
        this.set_scope(resizer_elem, $(document));

        this.responsive_toggle = this.responsive_toggle.bind(this);
        $(window).on('resize', this.responsive_toggle);
        this.responsive_toggle();

        // Enable scroll to refresh page on mobile devices
        $('html, body').css('overscroll-behavior', 'auto');
    }

    /**
     * Gets the current width of the sidebar from local storage.
     * @returns {number}
     */
    get sidebar_width() {
        return localStorage.getItem('cone-app-sidebar-width') || 300;
    }

    /**
     * Sets the width of the sidebar in local storage.
     * @param {number} width
     */
    set sidebar_width(width) {
        localStorage.setItem('cone-app-sidebar-width', width);
    }

    /**
     * Checks if the sidebar is collapsed.
     * @returns {boolean}
     */
    get collapsed() {
        return this.elem.outerWidth() <= 0;
    }

    /**
     * Toggles the sidebar's responsive state and css class based on its width.
     */
    responsive_toggle() {
        if (this.collapsed) {
            this.elem.removeClass('responsive-expanded');
            this.elem.addClass('responsive-collapsed');
        } else {
            this.elem.addClass('responsive-expanded');
            this.elem.removeClass('responsive-collapsed');
        }

        if (this.collapsed !== this.responsive_collapsed) {
            this.responsive_collapsed = this.collapsed;
            global_events.trigger('on_sidebar_resize', this);
        }
    }

    /**
     * Collapses the sidebar and triggers the resize event.
     */
    collapse() {
        // Enable scroll to refresh page on mobile devices
        $('html, body').css('overscroll-behavior', 'auto');
        this.elem
            .removeClass('expanded')
            .addClass('collapsed');
        global_events.trigger('on_sidebar_resize', this);
    }

    /**
     * Expands the sidebar and triggers the resize event.
     */
    expand() {
        // Disable scroll to refresh page on mobile devices
        $('html, body').css('overscroll-behavior', 'none');
        this.elem
            .removeClass('collapsed')
            .addClass('expanded');
        global_events.trigger('on_sidebar_resize', this);
    }

    /**
     * Handles click events to toggle the sidebar's collapsed state.
     * @param {Event} evt
     */
    on_click(evt) {
        if (this.collapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    /**
     * Handles the mouse move event to adjust the sidebar width.
     * @param {Event} evt
     */
    move(evt) {
        this.scrollbar.pointer_events = false;
        if (evt.pageX <= 115) {
            evt.pageX = 115; // Prevent sidebar from collapsing too much
        }
        this.sidebar_width = parseInt(evt.pageX);
        this.elem.css('width', this.sidebar_width);
        global_events.trigger('on_sidebar_resize', this);
    }

    /**
     * Finalizes the sidebar resizing on mouse up.
     */
    up() {
        this.scrollbar.pointer_events = true;
        global_events.trigger('on_sidebar_resize', this);
    }
}

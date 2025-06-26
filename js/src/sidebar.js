import $, { event } from 'jquery';
import ts from 'treibstoff';
import { global_events } from './globals.js';
import { ResizeAware } from './layout.js';

/**
 * Class to manage the sidebar of the application.
 * @extends ts.Motion
 */
export class Sidebar extends ResizeAware(ts.Motion) {

    /**
     * Creates an instance of the Sidebar.
     * @param {Element} elem
     */
    constructor(elem) {
        super(elem);
        this.elem = elem;
        elem.css('width', this.sidebar_width + 'px');

        this.trigger_event = this.trigger_event.bind(this);
        this.scrollbar = ts.query_elem('.scrollable-y', elem).data('scrollbar');
        this.on_click = this.on_click.bind(this);
        this.collapse_elem = ts.query_elem('#sidebar_collapse', elem);
        this.collapse_elem.on('click', this.on_click);
        this.on_lock = this.on_lock.bind(this);
        this.lock_input = ts.query_elem('.lock-state-input', elem);
        this.lock_elem = ts.query_elem('.lock-state-btn', elem);
        this.lock_elem.on('click', this.on_lock);

        const resizer_elem = ts.query_elem('#sidebar_resizer', elem);
        this.set_scope(resizer_elem, $(document));

        this.responsive_toggle = this.responsive_toggle.bind(this);
        this.responsive_toggle();

        if (this.locked !== undefined && this.locked !== null) {
            this.lock_input.prop('checked', true).trigger('change');
            if (this.locked.collapsed) {
                this.collapse();
            } else {
                this.expand();
            }
        }

        // Enable scroll to refresh page on mobile devices
        $('html, body').css('overscroll-behavior', 'auto');

        ts.ajax.attach(this, elem);
    }

    /**
     * Checks if the sidebar is collapsed.
     * @returns {boolean}
     */
    get collapsed() {
        return this.elem.outerWidth() <= 0;
    }

    /**
     * Handles sidebar responsive collapsed state.
     * Invoked by ResizeAware mixin.
     * @param {*} evt 
     */
    on_window_resize(evt) {
        this.responsive_toggle();
    }

    /**
     * Handles click on the lock switch and sets localStorage collapsed flag.
     */
    on_lock(evt) {
        // checked property sets after on_lock is done
        const checked = !(this.lock_input.get(0).checked);
        if (checked) {
            this.set_state();
        } else {
            this.unset_state();
            this.elem.removeClass('collapsed');
            this.elem.removeClass('expanded');
        }
        if (this.collapsed) {
            this.elem.addClass('collapsed');
        } else {
            this.elem.addClass('expanded');
        }
    }

    /**
     * Toggles the sidebar's responsive state and css class based on its width.
     */
    responsive_toggle() {
        if (!this.locked) {
            this.elem.removeClass('collapsed');
            this.elem.removeClass('expanded');
        }
        if (this.collapsed) {
            this.elem.removeClass('responsive-expanded');
            this.elem.addClass('responsive-collapsed');
        } else {
            this.elem.addClass('responsive-expanded');
            this.elem.removeClass('responsive-collapsed');
        }

        if (this.collapsed !== this.responsive_collapsed) {
            this.responsive_collapsed = this.collapsed;
            this.trigger_event();
        }
    }

    /**
     * Collapses the sidebar and.
     */
    collapse() {
        // Enable scroll to refresh page on mobile devices
        $('html, body').css('overscroll-behavior', 'auto');
        this.elem
            .removeClass('expanded')
            .addClass('collapsed');
        this.trigger_event();
    }

    /**
     * Expands the sidebar.
     */
    expand() {
        // Disable scroll to refresh page on mobile devices
        $('html, body').css('overscroll-behavior', 'none');
        this.elem
            .removeClass('collapsed')
            .addClass('expanded');
        this.trigger_event();
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
        if (this.locked !== undefined && this.locked !== null) {
            this.set_state();
        }
    }

    /**
     * Handles the mouse move event to adjust the sidebar width.
     * @param {Event} evt
     */
    move(evt) {
        this.scrollbar.pointer_events = false;
        this.sidebar_width = this.get_width_from_event(evt);
        this.elem.css('width', this.sidebar_width);
        this.trigger_event();
    }

    /**
     * Finalizes the sidebar resizing on mouse up.
     */
    up() {
        this.scrollbar.pointer_events = true;
        this.trigger_event();
    }

    /* Destroy the sidebar and remove event listeners. */
    destroy() {
        this.reset_state();
        $(window).off('resize', this.on_window_resize);
        this.collapse_elem.off();
        this.scrollbar = null;
        this.elem.off();
        this.lock_elem.off('click', this.on_lock);
    }
}

export class SidebarLeft extends Sidebar {
    /**
     * Initializes the Sidebar instance.
     * @param {Element} context
     */
    static initialize(context) {
        const elem = ts.query_elem('#sidebar_left', context);
        if (!elem) {
            return;
        }
        new SidebarLeft(elem);
    }

    constructor(elem) {
        super(elem);
        this.on_sidebar_right_resize = this.on_sidebar_right_resize.bind(this);
        global_events.on('on_sidebar_right_resize', this.on_sidebar_right_resize);
    }

    /**
     * Returns the locked state set in localStorage.
     */
    get locked() {
        return JSON.parse(localStorage.getItem('cone.app.sidebar_left.locked'));
    }

    /**
     * Gets the current width of the sidebar from local storage.
     * @returns {number}
     */
    get sidebar_width() {
        return localStorage.getItem('cone-app-sidebar-left-width') || 300;
    }

    /**
     * Sets the width of the sidebar in local storage.
     * @param {number} width
     */
    set sidebar_width(width) {
        localStorage.setItem('cone-app-sidebar-left-width', width);
    }

    /**
     * Triggers the resize event.
     */
    trigger_event() {
        global_events.trigger('on_sidebar_left_resize', this);
    }

    /**
     * Calculate sidebar width from move Event.
     */
    get_width_from_event(evt) {
        let width = evt.pageX;

        // Prevent sidebar from collapsing too much and expanding too far
        let sidebar_w = 0;
        if ($('#sidebar_right').length > 0) {
            sidebar_w = $('#sidebar_right').outerWidth();
        }
        const min_w = 115;
        // Allow a minimal content area width of 300px.
        const max_w = $(window).width() - sidebar_w - 300;
        width = Math.max(min_w, Math.min(width, max_w));

        return parseInt(width);
    }

    /**
     * Handle collapsing if sidebar_right resized.
     */
    on_sidebar_right_resize(inst, sb) {
        const max_w = $(window).width() - this.elem.outerWidth() - 300;
        if (!sb.collapsed && $(window).width() < 768) {
            // collapse sidebar if sidebar_right expanded in mobile view
            this.collapse();
            this.elem.addClass('d-none');
        } else if (!sb.collapsed && sb.elem.outerWidth() >= max_w) {
            // collapse sidebar if sidebar_right width exceeds available width
            this.collapse();
        } else if (sb.collapsed) {
            this.elem.removeClass('d-none');
        }
    }

    /**
     * Remembers the sidebar state for repaint.
     */
    set_state() {
        // remember sidebar state
        console.log(this.collapsed)
        localStorage.setItem('cone.app.sidebar_left.locked', JSON.stringify({
            collapsed: this.collapsed
        }));
    }

    /**
     * Unsets the sidebar state in localStorage.
     */
    unset_state() {
        // remember sidebar state
        localStorage.removeItem('cone.app.sidebar_left.locked');
    }

    destroy() {
        super.destroy();
        global_events.off('on_sidebar_right_resize', this.on_sidebar_right_resize);
    }
}

export class SidebarRight extends Sidebar {
    /**
     * Initializes the Sidebar instance.
     * @param {Element} context
     */
    static initialize(context) {
        const elem = ts.query_elem('#sidebar_right', context);
        if (!elem) {
            return;
        }
        new SidebarRight(elem);
    }

    constructor(elem) {
        super(elem);
        this.on_sidebar_left_resize = this.on_sidebar_left_resize.bind(this);
        global_events.on('on_sidebar_left_resize', this.on_sidebar_left_resize);
    }

    /**
     * Returns the locked state set in localStorage.
     */
    get locked() {
        return JSON.parse(localStorage.getItem('cone.app.sidebar_right.locked'));
    }

    /**
     * Gets the current width of the sidebar from local storage.
     * @returns {number}
     */
    get sidebar_width() {
        return localStorage.getItem('cone-app-sidebar-right-width') || 300;
    }

    /**
     * Sets the width of the sidebar in local storage.
     * @param {number} width
     */
    set sidebar_width(width) {
        localStorage.setItem('cone-app-sidebar-right-width', width);
    }

    /**
     * Triggers the resize event.
     */
    trigger_event() {
        global_events.trigger('on_sidebar_right_resize', this);
    }

    /**
     * Calculate sidebar width from move Event.
     */
    get_width_from_event(evt) {
        let width = $(window).outerWidth() - evt.pageX;
        // Prevent sidebar from collapsing too much and expanding too far
        let sidebar_w = 0;
        if ($('#sidebar_left').length > 0) {
            sidebar_w = $('#sidebar_left').outerWidth();
        }
        const min_w = 115;
        // Allow a minimal content area width of 300px.
        const max_w = $(window).width() - sidebar_w - 300;
        width = Math.max(min_w, Math.min(width, max_w));

        return parseInt(width);
    }

    /**
     * Handle collapsing if sidebar_left resized.
     */
    on_sidebar_left_resize(inst, sb) {
        const max_w = $(window).width() - this.elem.outerWidth() - 300;
        if (!sb.collapsed && $(window).width() < 768) {
            // collapse sidebar if sidebar_left expanded in mobile view
            this.collapse();
            this.elem.addClass('d-none');
        } else if (!sb.collapsed && sb.elem.outerWidth() >= max_w) {
            // collapse sidebar if sidebar_left width exceeds available width
            this.collapse();
        } else if (sb.collapsed) {
            this.elem.removeClass('d-none');
        }
    }

    /**
     * Remembers the sidebar state for repaint.
     */
    set_state() {
        // remember sidebar state
        console.log(this.collapsed)
        localStorage.setItem('cone.app.sidebar_right.locked', JSON.stringify({
            collapsed: this.collapsed
        }));
    }

    /**
     * Unsets the sidebar state in localStorage.
     */
    unset_state() {
        // remember sidebar state
        localStorage.removeItem('cone.app.sidebar_right.locked');
    }

    destroy() {
        super.destroy();
        global_events.off('on_sidebar_left_resize', this.on_sidebar_left_resize);
    }
}

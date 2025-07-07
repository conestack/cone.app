import $, { event } from 'jquery';
import ts from 'treibstoff';
import { global_events } from './globals.js';
import { ResizeAware } from './layout.js';


export class SidebarControl extends ts.Events {
    constructor(sidebar_content, elem) {
        super(elem);
        this.elem = elem;
        const target = this.target = elem.data('target');
        this.parent = sidebar_content;
        this.related_tile = $(`[data-tile="${target}"]`, this.parent.tiles_container);
        this.on_click = this.on_click.bind(this);
        this.compile();

        ts.ajax.attach(this, elem);
    }

    compile() {
        this.elem.on('click', this.on_click);
    }

    on_click(e) {
        e.preventDefault();
        this.parent.activate_tile(this);
    }

    activate_tile() {
        this.elem.addClass('active');
        this.related_tile.removeClass('d-none');
        this.parent.sidebar.elem.attr('tile', this.target);
    }

    deactivate_tile() {
        this.elem.removeClass('active');
        this.related_tile.addClass('d-none');
    }

    destroy() {
        this.elem.off('click', this.on_click);
    }
}

export class SidebarContent extends ts.Events {
    constructor(sidebar, elem) {
        super(elem);
        this.sidebar = sidebar;
        this.elem = elem;
        this.navigation = $('.sidebar-controls', this.sidebar.elem);
        this.tiles_container = $('.sidebar-tiles', this.elem);
        this.controls = [];
        this.compile();

        if (this.controls.length > 0) {
            this.activate_tile(this.controls[0]);
        }
    }

    compile() {
        $('.sidebar-control', this.navigation).each((i, el) => {
            this.controls.push(new SidebarControl(this, $(el)));
        });
    }

    activate_tile(tile) {
        this.deactivate_all();
        tile.activate_tile();
    }

    deactivate_all() {
        for (const control of this.controls) {
            control.deactivate_tile();
        }
    }
}


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

        this.moving = false;
        this.trigger_event = this.trigger_event.bind(this);
        this.scrollbar = ts.query_elem('.scrollable-y', elem).data('scrollbar');
        this.on_click = this.on_click.bind(this);
        this.collapse_elem = ts.query_elem('#sidebar_collapse', elem);
        this.collapse_elem.on('click', this.on_click);
        this.on_lock = this.on_lock.bind(this);
        this.lock_input = ts.query_elem('.lock-state-input', elem);
        this.lock_elem = ts.query_elem('.lock-state-btn', elem);
        this.lock_elem.on('click', this.on_lock);

        this.resizer_elem = ts.query_elem('#sidebar_resizer', elem);
        this.set_scope(this.resizer_elem, $(document));

        this.responsive_toggle = this.responsive_toggle.bind(this);
        this.responsive_toggle();

        if (this.locked !== undefined && this.locked !== null) {
            this.lock_input.prop('checked', true).trigger('change');
            if (this.disable_lock) return;
            if (this.locked.collapsed) {
                this.collapse();
            } else {
                this.expand();
            }
        }
        this.disable_or_enable_interaction = this.disable_or_enable_interaction.bind(this);
        this.disable_or_enable_interaction();

        // Enable scroll to refresh page on mobile devices
        $('html, body').css('overscroll-behavior', 'auto');

        const content_elem = $('.sidebar-content', elem);
        this.sidebar_content = new SidebarContent(this, content_elem);

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
        this.disable_or_enable_interaction();
    }

    /**
     * Handles disabling and enabling of collapse and resize elements.
     */
    disable_or_enable_interaction() {
        const locked = this.locked;
        if (locked && !this.disable_lock) {
            $('.collapse_btn', this.collapse_elem).addClass('disabled');
            this.resizer_elem.addClass('d-none');
        } else {
            $('.collapse_btn', this.collapse_elem).removeClass('disabled');
            this.resizer_elem.removeClass('d-none');
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

        if ($(window).width() < 768) {
            // disable locking functionality on mobile
            this.disable_lock = true;
            if (this.locked && !this.locked.collapsed) {
                // collapse sidebar even if locked in expanded state
                this.collapse();
            }
        } else {
            // enable locking functionality on tablet/desktop
            this.disable_lock = false;
            if (this.locked && !this.locked.collapsed && this.collapsed) {
                // expand sidebar if previously collapsed due to viewport width
                this.expand();
            } else if (this.locked && this.locked.collapsed && !this.collapsed) {
                // collapse sidebar if previously expanded in mobile view
                this.collapse();
            }
        }
        if (this.locked) {
            this.disable_or_enable_interaction();
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
        if (this.locked !== undefined && this.locked !== null && !this.disable_lock) {
            this.set_state();
        }
    }

    /**
     * Handles the mouse move event to adjust the sidebar width.
     * @param {Event} evt
     */
    move(evt) {
        if (this.locked) return;
        this.moving = true;
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
        this.moving = false;
    }

    /**
     * Handle collapsing if sibling sidebar resized.
     */
    on_sibling_sidebar_resize(inst, sb) {
        const max_w = $(window).width() - this.elem.outerWidth() - 300;
        const is_mobile = $(window).width() < 768;
        const is_locked_expanded = this.locked && !this.locked.collapsed;
        const sb_exceeds_width = sb.elem.outerWidth() >= max_w;

        if (!sb.collapsed && is_mobile) {
            // collapse sidebar if sibling sidebar expanded in mobile view
            this.collapse();
            this.elem.addClass('d-none');
        } else if (!sb.collapsed && sb_exceeds_width && (!sb.moving || !this.locked)) {
            // collapse sidebar on sibling sidebar expand if not locked and
            // sibling sidebar width exceeds available width
            this.collapse();
        } else if (sb.collapsed && is_locked_expanded && this.collapsed && !is_mobile) {
            // expand sidebar if locked in expanded state but previously
            // collapsed due to viewport width
            this.expand();
            this.elem.removeClass('d-none');
        } else if (sb.collapsed) {
            this.elem.removeClass('d-none');
        }
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
        this.on_sibling_sidebar_resize(inst, sb);
    }

    /**
     * Remembers the sidebar state for repaint.
     */
    set_state() {
        // remember sidebar state
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
        this.on_sibling_sidebar_resize(inst, sb);
    }

    /**
     * Remembers the sidebar state for repaint.
     */
    set_state() {
        // remember sidebar state
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

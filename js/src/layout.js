import $ from 'jquery';
import ts from 'treibstoff';
import { global_events } from './globals.js';

/**
 * Class to manage the main area of the application.
 * @extends ts.Events
 */
export class MainArea extends ts.Events {

    /**
     * Initializes the MainArea instance.
     * @param {Element} context
     */
    static initialize(context) {
        const elem = ts.query_elem('#main-area', context);
        if (!elem) {
            return;
        }
        new MainArea(elem);
    }

    /**
     * @param {Element} elem The main area element.
     */
    constructor(elem) {
        super();
        this.elem = elem;

        new ts.Property(this, 'is_compact', null);
        new ts.Property(this, 'is_super_compact', null);

        this.set_mode = this.set_mode.bind(this);
        global_events.on('on_sidebar_resize', this.set_mode);
        $(window).on('resize', this.set_mode);
        this.set_mode();

        ts.ajax.attach(this, elem);
    }

    /**
     * Destroys the MainArea instance and cleans up event listeners.
     */
    destroy() {
        $(window).off('resize', this.set_mode);
        global_events.off('on_sidebar_resize', this.set_mode);
    }

    /**
     * Sets the compact state based on the current width of the main area element.
     */
    set_mode() {
        this.is_compact = this.elem.outerWidth() < 992; // tablet
        this.is_super_compact = this.elem.outerWidth() < 576; // mobile
    }

    /**
     * Handles changes in the compact state of the main area.
     * @param {boolean} val
     */
    on_is_compact(val) {
        if (val) {
            this.elem.removeClass('full');
            this.elem.addClass('compact');
        } else {
            this.elem.removeClass('compact');
            this.elem.addClass('full');
        }

        global_events.trigger('on_main_area_mode', this);
    }

    /**
     * Handles changes in the super compact state of the main area.
     * @param {boolean} val
     */
    on_is_super_compact(val) {
        if (val) {
            this.elem.addClass('super-compact');
        } else {
            this.elem.removeClass('super-compact');
        }

        global_events.trigger('on_main_area_mode', this);
    }

    destroy() {
        $(window).off('resize', this.set_mode);
    }
}

/**
 * Base class for subclasses that inherit layout-aware behavior.
 * @extends ts.Events
 */
export class LayoutAware extends ts.Events {

    /**
     * @param {Element} elem
     */
    constructor(elem) {
        super();
        this.elem = elem;

        new ts.Property(this, 'is_compact', null);
        new ts.Property(this, 'is_super_compact', null);
        new ts.Property(this, 'is_sidebar_collapsed', null);

        this.set_mode = this.set_mode.bind(this);
        global_events.on('on_main_area_mode', this.set_mode);

        this.on_sidebar_resize = this.on_sidebar_resize.bind(this);
        global_events.on('on_sidebar_resize', this.on_sidebar_resize);

        ts.ajax.attach(this, elem);
    }

    /**
     * Destroys the LayoutAware instance and cleans up event listeners.
     */
    destroy() {
        global_events.off('on_main_area_mode', this.set_mode);
        global_events.off('on_sidebar_resize', this.on_sidebar_resize);
    }

    /**
     * Sets the layout mode based on the main area's state.
     * @param {} inst
     * @param {MainArea} mainarea
     */
    set_mode(inst, mainarea) {
        this.is_compact = mainarea.is_compact;
        this.is_super_compact = mainarea.is_super_compact;
    }

    /**
     * Handles changes in the compact state of the main area layout.
     * @param {boolean} val Indicates if the main area layout is compact.
     */
    on_is_compact(val) {
        if (val) {
            this.elem.removeClass('full');
            this.elem.addClass('compact');
        } else {
            this.elem.removeClass('compact');
            this.elem.addClass('full');
        }
    }

    /**
     * Handles changes in the super compact state of the main area layout.
     * @param {boolean} val Indicates if the main area layout is super compact.
     */
    on_is_super_compact(val) {
        if (val) {
            this.elem.addClass('super-compact');
        } else {
            this.elem.removeClass('super-compact');
        }
    }

    /**
     * Handles changes on the sidebar resize event.
     * @param {} inst
     * @param {Object} sidebar
     */
    on_sidebar_resize(inst, sidebar) {
        this.is_sidebar_collapsed = sidebar.collapsed;
    }

    /**
     * Handles changes in the sidebar collapsed state.
     * @param {boolean} val
     */
    on_is_sidebar_collapsed(val) {
        // ...
    }
}

/**
 * A mixin to add window resize awareness to a class.
 * 
 * This mixin expects that the class it extends has an `elem` property.
 * It attaches a resize event listener to the window that triggers the 
 * `on_window_resize` method defined in the subclass.
 * 
 * @param {class} Base - The base class to extend.
 * @returns {class}
 */
export const ResizeAware = (Base) => class extends Base {

    /**
     * @param  {...any} args
     */
    constructor(...args) {
        super(...args);

        if (this.elem) {
            ts.ajax.attach(this, this.elem);
        }

        this.on_window_resize = this.on_window_resize.bind(this);

        $(window).on('resize', this.on_window_resize);
    }

    /**
     * Handler for the window resize event.
     * 
     * This method should be overridden in the subclass to define custom resize 
     * behavior.
     */
    on_window_resize(evt) {
        // Call `on_window_resize` of the base class, if it exists
        if (super.on_window_resize) {
            super.on_window_resize(evt);
        }
    }

    /**
     * Removes the resize event handler from the window.
     */
    destroy() {
        try {
            super.destroy();
        } catch (error) {
            console.warn(error);
        } finally {
            $(window).off('resize', this.on_window_resize);
        }
    }
};

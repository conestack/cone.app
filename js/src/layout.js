import $ from 'jquery';
import ts from 'treibstoff';
import {global_events} from './globals.js';

export class MainArea extends ts.Events {

    static initialize(context) {
        const elem = ts.query_elem('#main-area', context);
        if (!elem) {
            return;
        }
        new MainArea(elem);
    }

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

    destroy() {
        $(window).off('resize', this.set_mode);
        global_events.off('on_sidebar_resize', this.set_mode);
    }

    set_mode() {
        this.is_compact = this.elem.outerWidth() < 992; // tablet
        this.is_super_compact = this.elem.outerWidth() < 576; // mobile
    }

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

    on_is_super_compact(val) {
        if (val) {
            this.elem.addClass('super-compact');
        } else {
            this.elem.removeClass('super-compact');
        }

        global_events.trigger('on_main_area_mode', this);
    }
}

export class LayoutAware extends ts.Events {

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

    destroy() {
        global_events.off('on_main_area_mode', this.set_mode);
        global_events.off('on_sidebar_resize', this.on_sidebar_resize);
    }

    set_mode(inst, mainarea) {
        this.is_compact = mainarea.is_compact;
        this.is_super_compact = mainarea.is_super_compact;
    }

    on_is_compact(val) {
        if (val) {
            this.elem.removeClass('full');
            this.elem.addClass('compact');
        } else {
            this.elem.removeClass('compact');
            this.elem.addClass('full');
        }
    }

    on_is_super_compact(val) {
        if (val) {
            this.elem.addClass('super-compact');
        } else {
            this.elem.removeClass('super-compact');
        }
    }

    on_sidebar_resize(inst, sidebar) {
        this.is_sidebar_collapsed = sidebar.collapsed;
    }

    on_is_sidebar_collapsed(val) {
        // ...
    }
}

import $ from 'jquery';
import ts from 'treibstoff';
import {global_events} from './globals.js';

export class Sidebar extends ts.Motion {

    static initialize(context) {
        const elem = ts.query_elem('#sidebar_left', context);
        if (!elem) {
            return;
        }
        new Sidebar(elem);
    }

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
        )

        this.on_click = this.on_click.bind(this);
        const collapse_elem = ts.query_elem('#sidebar_collapse', elem);
        collapse_elem.on('click', this.on_click);

        const resizer_elem = ts.query_elem('#sidebar_resizer', elem);
        this.set_scope(resizer_elem, $(document));
    }

    get sidebar_width() {
        return localStorage.getItem('cone-app-sidebar-width') || 300;
    }

    set sidebar_width(width) {
        localStorage.setItem('cone-app-sidebar-width', width);
    }

    get collapsed() {
        return this.elem.css('width') === '0px';
    }

    collapse() {
        this.elem
            .removeClass('expanded')
            .addClass('collapsed');
        global_events.trigger('on_sidebar_resize', this);
    }

    expand() {
        this.elem
            .removeClass('collapsed')
            .addClass('expanded');
        global_events.trigger('on_sidebar_resize', this);
    }

    on_click(evt) {
        if (this.collapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    move(evt) {
        this.scrollbar.disabled = true;
        if (evt.pageX <= 115) {
            evt.pageX = 115;
        }
        this.sidebar_width = parseInt(evt.pageX);
        this.elem.css('width', this.sidebar_width);
        global_events.trigger('on_sidebar_resize', this);
    }

    up() {
        this.scrollbar.disabled = false;
        global_events.trigger('on_sidebar_resize', this);
    }
}

import $ from 'jquery';
import ts from 'treibstoff';
import {global_events} from './globals.js';

export class PersonalTools extends ts.Events {

    static initialize(context) {
        const elem = ts.query_elem('#header-main', context);
        if (!elem) {
            return;
        }
        new PersonalTools(elem);
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.personal_tools = ts.query_elem('#personaltools', elem);
        this.navbar_content = ts.query_elem('#navbar-content', elem);
        this.header_content = ts.query_elem('#header-content', elem);
        this.scrollbar = ts.query_elem('.scrollable-x', elem).data('scrollbar');

        this.render = this.render.bind(this);
        $(window).on('resize', this.render);

        this.on_sidebar_resize = this.on_sidebar_resize.bind(this);
        global_events.on('on_sidebar_resize', this.on_sidebar_resize);

        this.render();
        ts.ajax.attach(this, elem);
    }

    destroy() {
        $(window).off('resize', this.render);
        global_events.off('on_sidebar_resize', this.on_sidebar_resize);
    }

    on_sidebar_resize(inst) {
        this.scrollbar.render();
        this.scrollbar.position = this.scrollbar.position;
    }

    render() {
        const window_width = $(window).width();
        // boostrap 5 breakpoints
        const window_sm = window_width <= 576;
        const window_lg = window_width <= 992;
        const navbar_content = this.navbar_content;
        const in_navbar_content = ts.query_elem(
            '#personaltools',
            navbar_content
        ) !== null;

        if (window_sm) {
            if (!in_navbar_content) {
                this.personal_tools.detach().appendTo(navbar_content);
            }
        } else if (in_navbar_content) {
            this.personal_tools.detach().prependTo(this.header_content);
            // close any header dropdowns
            $(".dropdown-menu.show").removeClass('show');
        }

        if (window_lg) {
            this.disable_scrolling();
        } else {
            navbar_content.removeClass('show');
            // prevent content from expanding again on resize
            this.enable_scrolling();
        }
    }

    disable_scrolling() {
        const scrollbar = this.scrollbar;
        if (!scrollbar.disabled) {
            scrollbar.position = 0;
            scrollbar.disabled = true;
        }
    }

    enable_scrolling() {
        const scrollbar = this.scrollbar;
        if (scrollbar.disabled) {
            scrollbar.disabled = false;
        }
    }
}

import $ from 'jquery';
import ts from 'treibstoff';

export class Header extends ts.Events {

    static initialize(context) {
        new Header(context);
    }

    constructor(context) {
        super();
        this.elem = $('#header-main', context);
        this.header_tools = $('#header-tools', this.elem);
        this.navbar_content = $('#navbar-content', this.elem);
        this.header_content = $('#header-content', this.elem);
        this.scrollable = $('.scrollable-x', this.elem);

        this.place_elements = this.place_elements.bind(this);
        $(window).on('resize', this.place_elements);
        this.place_elements();

        ts.ajax.attach(this, this.elem);
    }

    destroy() {
        $(window).off('resize', this.place_elements);
    }

    place_elements() {
        const window_width = $(window).width();
        // boostrap 5 breakpoints
        const window_sm = window_width <= 576;
        const window_lg = window_width <= 992;
        const in_navbar_content = $('#header-tools', this.navbar_content).length > 0;

        if (window_sm) {
            if (!in_navbar_content) {
                this.header_tools.detach().appendTo(this.navbar_content);
            }
        } else if (in_navbar_content) {
            this.header_tools.detach().prependTo(this.header_content);
            // close any header dropdowns
            $(".dropdown-menu.show").removeClass('show');
        }

        if (window_lg) {
            this.disable_horizontal_scrolling();
        } else {
            this.navbar_content.removeClass('show');
            // prevent content from expanding again on resize
            this.enable_horizontal_scrolling();
        }
    }

    disable_horizontal_scrolling() {
        this.scrollable.each((i, item) => {
            const scrollbar = $(item).data('scrollbar');
            if (!scrollbar.disabled) {
                scrollbar.reset();
                scrollbar.disable();
            }
        });
    }

    enable_horizontal_scrolling() {
        this.scrollable.each((i, item) => {
            const scrollbar = $(item).data('scrollbar');
            if (scrollbar.disabled) {
                scrollbar.bind();
            }
        });
    }
}
import $ from 'jquery';
import ts from 'treibstoff';

export class Sidebar extends ts.Motion {

    static initialize(context) {
        const elem = ts.query_elem('#sidebar_left', context);
        if (!elem) {
            return;
        }
        new Sidebar(context, elem);
    }

    constructor(context, elem) {
        super();
        this.elem = elem;
        this.resizer_elem = $('#sidebar_resizer', context);
        this.collapse_elem = $('#sidebar_collapse', context);

        this.on_click = this.on_click.bind(this);
        this.collapse_elem.on('click', this.on_click);

        const sidebar_width = localStorage.getItem('cone.app.sidebar_width') || 300;
        this.elem.css('width', sidebar_width + 'px');

        const pad_left = $('.scrollable-content', this.elem).css('padding-left');
        const pad_right = $('.scrollable-content', this.elem).css('padding-right');
        const logo_width = $('#header-logo').outerWidth(true);
        this.elem.css(
            'min-width',
            `calc(${logo_width}px + ${pad_left} + ${pad_right})`
        )
        this.set_scope(this.resizer_elem, $(document));
    }

    get collapsed() {
        return this.elem.css('width') === '0px';
    }

    on_click(evt) {
        if (this.collapsed) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    collapse() {
        this.elem.removeClass('expanded');
        this.elem.addClass('collapsed');
    }

    expand() {
        this.elem.removeClass('collapsed');
        this.elem.addClass('expanded');
    }

    move(evt) {
        // prevent scrollbar from toggling
        $('.scrollable-y', this.elem).css('pointer-events', 'none');
        if (evt.pageX <= 115) {
            evt.pageX = 115;
        }
        this.sidebar_width = parseInt(evt.pageX);
        this.elem.css('width', this.sidebar_width);
    }

    up(evt) {
        // enable scrollbar toggling again
        $('.scrollable-y', this.elem).css('pointer-events', 'all');
        localStorage.setItem(
            'cone.app.sidebar_width',
            this.sidebar_width
        );
    }
}
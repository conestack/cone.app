import $ from 'jquery';
import ts from 'treibstoff';
import {global_events} from './globals.js';

export class Header extends ts.Events {

    static initialize(context) {
        const elem = ts.query_elem('#header-main', context);
        if (!elem) {
            return;
        }
        new Header(elem);
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.logo_placeholder = ts.query_elem('#header-logo-placeholder', elem);

        this.toggle_placeholder = this.toggle_placeholder.bind(this);
        global_events.on('on_sidebar_resize', this.toggle_placeholder);
        $(window).on('resize', this.toggle_placeholder);

        ts.ajax.attach(this, elem);

        this.toggle_placeholder();
    }

    toggle_placeholder() {
        if ($(window).width() > this.elem.outerWidth()) {
            this.logo_placeholder.hide();
        } else {
            this.logo_placeholder.show();
        }
    }
}

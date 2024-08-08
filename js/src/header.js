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

        this.set_mobile = this.set_mobile.bind(this);
        global_events.on('on_sidebar_resize', this.set_mobile);
        $(window).on('resize', this.set_mobile);

        ts.ajax.attach(this, elem);

        const is_mobile = $(window).width() > this.elem.outerWidth();
        new ts.Property(this, 'is_mobile', is_mobile);
    }

    on_is_mobile(val) {
        console.log(val)
        // XXX: move stuff from mainmenu here
        // XXX: append mobile css class
        if (val) {
            console.log('header mobile')
            this.logo_placeholder.hide();
        } else {
            console.log('header desktop')
            this.logo_placeholder.show();
        }
    }

    set_mobile() {
        this.is_mobile = ($(window).width() > this.elem.outerWidth());
    }
}

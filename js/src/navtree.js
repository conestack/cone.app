import $ from 'jquery'
import { topnav } from './topnav.js';
import { sidebar_menu } from './sidebar_menu.js';

export class Navtree {

    static initialize(context) {
        let elem = $('#navtree', context);
        if (!elem.length) { 
            return null;
        }
/*         if (navtree !== null) {
            navtree.unload();
        } */
        navtree = new Navtree(elem);
        return navtree;
    }

    constructor(elem) {
        this.elem = elem;
        this.content = $('#navtree-content', elem);
        this.heading = $('#navtree-heading', elem);
        this.toggle_elems = $('li.navtreelevel_1', elem);

        this._mouseenter_handle = this.align_width.bind(this);
        this.toggle_elems.on('mouseenter', this._mouseenter_handle);
        this._restore = this.restore_width.bind(this);
        this.toggle_elems.on('mouseleave', this._restore); //restore original size

        this.scrollbar_handle();
    }

    unload() {
        super.unload();
        this.heading.off('click');
        this.toggle_elems.off('mouseenter', this._mouseenter_handle)
                         .off('mouseleave', this._restore);
    }

    align_width(evt) {
        let target = $(evt.currentTarget);
        target.addClass('hover');
        if (target.outerWidth() > $('ul', target).outerWidth()) {
            $('ul', target).css('width', target.outerWidth());
        } else {
            target.css('width', $('ul', target).outerWidth());
        }
    }

    restore_width(evt) {
        $(evt.currentTarget).css('width', 'auto');
        $(evt.currentTarget).removeClass('hover');
    }

    scrollbar_handle(){
        $(window)
        .on('dragstart', () => {
            this.toggle_elems.off('mouseenter', this._mouseenter_handle);
        })
        .on('dragend', () => {
            this.toggle_elems.on('mouseenter', this._mouseenter_handle);
        });
    }

    mv_to_mobile() {
        this.elem.detach().appendTo(topnav.content).addClass('mobile');
        this.content.hide();
        this.heading.off('click').on('click', () => {
            this.content.slideToggle('fast');
        });
    }

    mv_to_sidebar() {
        this.elem
            .detach()
            .appendTo(sidebar_menu.content)
            .removeClass('mobile');
        this.heading.off('click');
        this.content.show();
    }
}

export var navtree = Navtree.initialize();
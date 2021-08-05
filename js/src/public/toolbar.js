import $ from 'jquery'
import {
    ViewPortAware,
    VP_MOBILE
} from './viewport.js';
import {layout} from './layout.js';

export class Toolbar extends ViewPortAware {

    static initialize(context) {
        let elem = $('#toolbar-top', context);
        /* istanbul ignore if */
        if (!elem.length) {
            return;
        } else {
            layout.toolbar = new Toolbar(elem);
        }
        return layout.toolbar;
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.dropdowns = $('li.dropdown', this.elem);
        this.mark_read = $('#noti_mark_read', this.elem);
        
        this._mark = this.mark_as_read.bind(this);
        this.mark_read.off().on('click', this._mark);
        
        this.handle_dd();
        this.viewport_changed();
    }

    handle_dd() {
        for(let item of this.dropdowns){
            let elem = $(item);
            let icon = $('i', elem);
            if (icon.length === 0) {
                icon = $('img', elem);
            }
            let menu = $('ul', elem);

            icon.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                menu.css('display', 'flex');
            });
            icon.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                menu.css('display', 'none');
            });
        }
    }

    viewport_changed(e){
        if (e) {
            super.viewport_changed(e);
        }

        if(this.vp_state === VP_MOBILE){
             // hide menu on toolbar click
             this.dropdowns.off().on('show.bs.dropdown', () => {
                layout.topnav.content.hide();
            });
        } else {
            this.dropdowns.off();
        }
    }

    mark_as_read(e) {
        e.stopPropagation();
        $('li.notification').removeClass('unread').addClass('read');
    }
}
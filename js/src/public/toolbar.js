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

        this.viewport_changed();
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
}
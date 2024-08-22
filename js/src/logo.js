import ts from 'treibstoff';
import {LayoutAware} from './layout.js';

export class Logo extends LayoutAware {

    static initialize(context) {
        const elem = ts.query_elem('#header-logo', context);
        if (!elem) {
            return;
        }
        new Logo(elem);
    }

    on_sidebar_resize(inst, sidebar) {
        if (sidebar.collapsed) {
            this.elem.removeClass('text-white');
        } else {
            this.elem.addClass('text-white');
        }
    }
}

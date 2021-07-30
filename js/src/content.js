import $ from 'jquery'
import {layout} from './layout.js';

let content = null;

export class Content {

    static initialize(context) {
        let elem = $('#page-content-wrapper', context);
        if (!elem.length) {
            return;
        } else {
            layout.content = new Content(elem);
        }
        return layout.content;
    }

    constructor(elem) {
        this.elem = elem;
        // this.scrollbar = new ScrollBarY(elem);
    }
}

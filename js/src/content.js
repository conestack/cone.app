import $ from 'jquery'

export class Content {

    static initialize(context) {
        let elem = $('#page-content-wrapper', context);
        if (!elem.length) {
            content = null;
        } else {
            content = new Content(elem);
        }
        return content;
    }

    constructor(elem) {
        this.elem = elem;
        // this.scrollbar = new ScrollBarY(elem);
    }
}

export var content = Content.initialize();
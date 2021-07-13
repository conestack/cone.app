import $ from 'jquery'

const content = null;

export class Content {

    static initialize(context) {
        let elem = $('#page-content-wrapper', context);
        if (!elem.length) {
            return;
        }
        return new Content(elem);
    }

    constructor(elem) {
        this.elem = elem;
        // this.scrollbar = new ScrollBarY(elem);
    }
}

$(function() {
    content = Content.initialize();
});
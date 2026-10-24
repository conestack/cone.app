import $ from 'jquery';
import { keys } from './keybinder.js';

export class Selectable {
    constructor(options) {
        // on_firstclick, on_select callbacks in options
        this.options = options;
        this.selected = [];
        // range start for shift click selection
        this.anchor = null;
        this.firstclick = true;
    }

    reset() {
        this.selected = [];
    }

    add(elem) {
        this.remove(elem);
        this.selected.push(elem);
    }

    remove(elem) {
        const reduced = $.grep(this.selected, (item) => item !== elem);
        this.selected = reduced;
    }

    select_no_key(container, elem) {
        container.children().removeClass('selected');
        elem.addClass('selected');
        this.reset();
        this.add(elem.get(0));
        this.anchor = elem.get(0);
    }

    select_ctrl_down(elem) {
        elem.toggleClass('selected');
        if (elem.hasClass('selected')) {
            this.add(elem.get(0));
        } else {
            this.remove(elem.get(0));
        }
        this.anchor = elem.get(0);
    }

    select_shift_down(container, elem) {
        const items = container.children();
        const anchor_index = items.toArray().indexOf(this.anchor);
        if (anchor_index === -1) {
            this.select_no_key(container, elem);
            return;
        }
        const current_index = items.index(elem);
        const start = Math.min(anchor_index, current_index);
        const end = Math.max(anchor_index, current_index);
        items.removeClass('selected');
        this.selected = items
            .slice(start, end + 1)
            .addClass('selected')
            .get();
    }

    handle_click(evt) {
        evt.preventDefault();
        const elem = $(evt.currentTarget);
        const container = elem.parent();
        if (!keys.ctrl_down && !keys.shift_down) {
            this.select_no_key(container, elem);
        } else if (keys.ctrl_down) {
            this.select_ctrl_down(elem);
        } else if (keys.shift_down) {
            this.select_shift_down(container, elem);
        }
        if (this.firstclick) {
            this.firstclick = false;
            this.notify('on_firstclick', this, elem);
        }
        this.notify('on_select', this);
    }

    notify(e, ...args) {
        if (this.options?.[e]) {
            this.options[e](...args);
        }
    }

    bind(elem) {
        elem.off('click').on('click', this.handle_click.bind(this));
    }
}

// Selectable items
$.fn.selectable = function (options) {
    var api = new Selectable(options);
    api.bind(this);
    this.data('selectable', api);
    return this;
};

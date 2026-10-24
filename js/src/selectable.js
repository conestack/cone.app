import $ from 'jquery';
import { keys } from './keybinder.js';

export class Selectable {
    constructor(options) {
        // on_firstclick, on_select callbacks in options
        this.options = options;
        this.selected = [];
        this.select_direction = 0;
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
    }

    select_ctrl_down(elem) {
        elem.toggleClass('selected');
        if (elem.hasClass('selected')) {
            this.add(elem.get(0));
        } else {
            this.remove(elem.get(0));
        }
    }

    get_nearest(container, current_index) {
        // get nearest next selected item from current index
        const selected = container.children('.selected');
        // -1 means no other selected item
        let nearest = -1;
        let selected_index, selected_elem;
        $(selected).each(function () {
            selected_elem = $(this);
            selected_index = selected_elem.index();
            if (nearest === -1) {
                nearest = selected_index;
            } else if (current_index > selected_index) {
                if (this.select_direction > 0) {
                    if (selected_index < nearest) {
                        nearest = selected_index;
                    }
                } else {
                    if (selected_index > nearest) {
                        nearest = selected_index;
                    }
                }
            } else if (current_index < selected_index) {
                /* c8 ignore next 3 -- unreachable, items are visited in ascending index order */
                if (selected_index < nearest) {
                    nearest = selected_index;
                }
            }
        });
        return nearest;
    }

    select_shift_down(container, elem) {
        const current_index = elem.index();
        const nearest = this.get_nearest(container, current_index);
        if (nearest === -1) {
            elem.addClass('selected');
            this.add(elem.get(0));
        } else {
            container.children().removeClass('selected');
            let start, end;
            if (current_index < nearest) {
                this.select_direction = -1;
                start = current_index;
                end = nearest;
            } else {
                this.select_direction = 1;
                start = nearest;
                end = current_index;
            }
            this.reset();
            const that = this;
            container
                .children()
                .slice(start, end + 1)
                .addClass('selected')
                .each(function () {
                    that.add(this);
                });
        }
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

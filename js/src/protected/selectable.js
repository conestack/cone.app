import $ from 'jquery';

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
        let reduced = $.grep(this.selected, function(item, index) {
            return item !== elem;
        });
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
        let selected = container.children('.selected');
        // -1 means no other selected item
        let nearest = -1;
        let selected_index, selected_elem;
        $(selected).each(function() {
            selected_elem = $(this);
            selected_index = selected_elem.index();
            if (nearest == -1) {
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
                if (selected_index < nearest) {
                    nearest = selected_index;
                }
            }
        });
        return nearest;
    }

    select_shift_down(container, elem) {
        let current_index = elem.index();
        let nearest = this.get_nearest(container, current_index);
        if (nearest == -1) {
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
            let that = this;
            container.children()
                     .slice(start, end + 1)
                     .addClass('selected')
                     .each(function() {
                         that.add(this);
                     });
        }
    }

    handle_click(e) {
        e.preventDefault();
        let elem = $(e.currentTarget);
        let container = elem.parent();
        if (!cone.keys.ctrl_down && !cone.keys.shift_down) {
            this.select_no_key(container, elem);
        } else if (cone.keys.ctrl_down) {
            this.select_ctrl_down(elem);
        } else if (cone.keys.shift_down) {
            this.select_shift_down(container, elem);
        }
        if (this.firstclick) {
            this.firstclick = false;
            this.notify('on_firstclick', this, elem);
        }
        this.notify('on_select', this);
    }

    notify(e, ...args) {
        if (this.options && this.options[e]) {
            this.options[e](...args);
        }
    }

    bind(elem) {
        elem.off('click').on('click', this.handle_click.bind(this));
    }
}
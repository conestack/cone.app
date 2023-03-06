import $ from 'jquery';
import ts from 'treibstoff';

export class BatchedItemsFilter {

    constructor(elem, name) {
        this.elem = elem;
        this.name = name;
    }

    set_filter(val) {
        let elem = this.elem,
            target = ts.ajax.parse_target(elem.attr('ajax:target')),
            event = elem.attr('ajax:event');
        target.params[this.name] = val;
        if (elem.attr('ajax:path')) {
            let path_event = elem.attr('ajax:path-event');
            if (!path_event) {
                path_event = event;
            }
            // path always gets calculated from target
            ts.ajax.path({
                path: target.path + target.query + '&' + this.name + '=' + val,
                event: path_event,
                target: target
            });
        }
        let defs = event.split(':');
        ts.ajax.trigger({
            name: defs[0],
            selector: defs[1],
            target: target
        });
    }
}

export class BatchedItemsSize extends BatchedItemsFilter {

    static initialize(context,
                      selector='.batched_items_slice_size select') {
        $(selector, context).each(function() {
            new BatchedItemsSize($(this));
        });
    }

    constructor(elem) {
        super(elem, 'size');
        elem.off('change').on('change', this.change_handle.bind(this));
    }

    change_handle(evt) {
        let option = $('option:selected', this.elem).first();
        this.set_filter(option.val());
    }
}

export class BatchedItemsSearch extends BatchedItemsFilter {

    static initialize(context,
                      selector='.batched_items_filter input',
                      name='term') {
        $(selector, context).each(function() {
            new BatchedItemsSearch($(this), name);
        });
    }

    constructor(elem, name) {
        super(elem, name);
        elem.off('focus').on('focus', this.focus_handle.bind(this));
        elem.off('keypress').on('keypress', this.keypress_handle.bind(this));
        elem.off('keyup').on('keyup', this.keyup_handle.bind(this));
        elem.off('change').on('change', this.change_handle.bind(this));
    }

    focus_handle(evt) {
        // reset filter input field if marked as empty filter
        let elem = this.elem;
        if (elem.hasClass('empty_filter')) {
            elem.val('');
            elem.removeClass('empty_filter');
        }
    }

    keypress_handle(evt) {
        // prevent default action when pressing enter
        if (evt.keyCode == 13) {
            evt.preventDefault();
        }
    }

    keyup_handle(evt) {
        // trigger search when releasing enter
        if (evt.keyCode == 13) {
            evt.preventDefault();
            this.set_filter(this.elem.attr('value'));
        }
    }

    change_handle(evt) {
        // trigger search on input change
        evt.preventDefault();
        this.set_filter(this.elem.attr('value'));
    }
}

export function batcheditems_handle_filter(elem, param, val) {
    ts.deprecate('batcheditems_handle_filter', 'BatchedItems.set_filter', '1.1');
    new BatchedItemsFilter(elem, param).set_filter(val);
}

export function batcheditems_size_binder(context, size_selector) {
    ts.deprecate('batcheditems_size_binder', 'BatchedItems.bind_size', '1.1');
    if (!size_selector) {
        size_selector = '.batched_items_slice_size select';
    }
    BatchedItemsSize.initialize(context, size_selector);
}

export function batcheditems_filter_binder(context, filter_selector, filter_name) {
    ts.deprecate('batcheditems_filter_binder', 'BatchedItems.bind_search', '1.1');
    if (!filter_selector) {
        filter_selector = '.batched_items_filter input';
    }
    if (!filter_name) {
        filter_name = 'term';
    }
    BatchedItemsSearch.initialize(context, filter_selector, filter_name);
}

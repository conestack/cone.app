import $ from 'jquery';
import ts from 'treibstoff';

export class BatchedItems {

    static initialize(context) {
        BatchedItems.bind_size(context);
        BatchedItems.bind_search(context);
    }

    static set_filter(elem, param, val) {
        let target = ts.ajax.parsetarget(elem.attr('ajax:target')),
            event = elem.attr('ajax:event');
        target.params[param] = val;
        if (elem.attr('ajax:path')) {
            let path_event = elem.attr('ajax:path-event');
            if (!path_event) {
                path_event = event;
            }
            // path always gets calculated from target
            ts.ajax.path({
                path: target.path + target.query + '&' + param + '=' + val,
                event: path_event,
                target: target
            });
        }
        let defs = event.split(':');
        ts.ajax.trigger(defs[0], defs[1], target);
    }

    static bind_size(context,
                     size_selector='.batched_items_slice_size select') {
        $(size_selector, context).off('change').on('change', function(evt) {
            let selection = $(evt.currentTarget),
                option = $('option:selected', selection).first();
            BatchedItems.set_filter(selection, 'size', option.val());
        });
    }

    static bind_search(context,
                       filter_selector='.batched_items_filter input',
                       filter_name='term') {
        let search_input = $(filter_selector, context);
        // reset filter input field if marked as empty filter
        if (search_input.hasClass('empty_filter')) {
            search_input.on('focus', function() {
                this.value = '';
                $(this).removeClass('empty_filter');
            });
        }
        // prevent default action when pressing enter
        search_input.off('keypress').on('keypress', function(evt) {
            if (evt.keyCode == 13) {
                evt.preventDefault();
            }
        });
        // trigger search when releasing enter
        search_input.off('keyup').on('keyup', function(evt) {
            if (evt.keyCode == 13) {
                evt.preventDefault();
                let input = $(this);
                BatchedItems.set_filter(input, filter_name, input.attr('value'));
            }
        });
        // trigger search on input change
        search_input.off('change').on('change', function(evt) {
            evt.preventDefault();
            let input = $(this);
            BatchedItems.set_filter(input, filter_name, input.attr('value'));
        });
    }
}

export function batcheditems_handle_filter(elem, param, val) {
    ts.deprecate('batcheditems_handle_filter', 'BatchedItems.set_filter', '1.1');
    BatchedItems.set_filter(elem, param, val);
}

export function batcheditems_size_binder(context, size_selector) {
    ts.deprecate('batcheditems_size_binder', 'BatchedItems.bind_size', '1.1');
    if (!size_selector) {
        size_selector = '.batched_items_slice_size select';
    }
    BatchedItems.bind_size(context, size_selector);
}

export function batcheditems_filter_binder(context, filter_selector, filter_name) {
    ts.deprecate('batcheditems_filter_binder', 'BatchedItems.bind_search', '1.1');
    if (!filter_selector) {
        filter_selector = '.batched_items_filter input';
    }
    if (!filter_name) {
        filter_name = 'term';
    }
    BatchedItems.bind_search(context, filter_selector, filter_name);
}

import $ from 'jquery';

export class BatchedItems {
    constructor(context) {
        //
    }

    size_binder(context, size_selector) {
         // use default selector if not passed
        if (!size_selector) {
            size_selector = '.batched_items_slice_size select';
        }
        // lookup selection field by selector
        let selection = $(size_selector, context);
        // handle filter on selection change
        selection.off('change').on('change', function(event) {
            let option = $('option:selected', $(this)).first();
            let size = option.val();
            cone.batcheditems_handle_filter(selection, 'size', size);
        });
    }

    filter_binder(context, filter_selector, filter_name) {
        // use default selector if not passed
        if (!filter_selector) {
            filter_selector = '.batched_items_filter input';
        }
        // use default filter name if not passed
        if (!filter_name) {
            filter_name = 'term';
        }
        // lookup search field by selector
        let searchfield = $(filter_selector, context);
        // trigger search function
        let trigger_search = function(input) {
            let term = input.attr('value');
            cone.batcheditems_handle_filter(input, filter_name, term);
        };
        // reset filter input field if marked as empty filter
        if (searchfield.hasClass('empty_filter')) {
            searchfield.on('focus', function() {
            this.value = '';
            $(this).removeClass('empty_filter');
            });
        }
        // prevent default action when pressing enter
        searchfield.off('keypress').on('keypress', function(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
            }
        });
        // trigger search when releasing enter
        searchfield.off('keyup').on('keyup', function(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                trigger_search($(this));
            }
        });
        // trigger search on input change
        searchfield.off('change').on('change', function(event) {
            event.preventDefault();
            trigger_search($(this));
        });
    }

    items_binder(context, size_selector, filter_selector) {
       this.size_binder(context, size_selector);
       this.filter_binder(context, filter_selector);
    }

    handle_filter(elem, param, val) {
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
}

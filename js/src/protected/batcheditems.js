import $ from 'jquery';
import ts from 'treibstoff';

export class BatchedItems {

    static initialize(context) {
        new BatchedItems(
            context,
            '.batched_items_slice_size select',
            '.batched_items_filter input',
            'term'
        );
    }

    constructor(context, size_selector, filter_selector, filter_name) {
        this.context = context;
        this.size_selector = size_selector;
        this.filter_selector = filter_selector;
        this.filter_name = filter_name;
        this.bind_size();
        this.bind_search();
    }

    bind_size() {
        $(
            this.size_selector,
            this.context
        ).off('change').on('change', function(evt) {
            let selection = $(evt.currentTarget),
                option = $('option:selected', selection).first();
            this.set_filter(selection, 'size', option.val());
        }.bind(this));
    }

    bind_search() {
        let search_input = $(this.filter_selector, this.context);
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
                let input = $(evt.currentTarget);
                this.set_filter(input, this.filter_name, input.attr('value'));
            }
        }.bind(this));
        // trigger search on input change
        search_input.off('change').on('change', function(evt) {
            evt.preventDefault();
            let input = $(evt.currentTarget);
            this.set_filter(input, this.filter_name, input.attr('value'));
        }.bind(this));
    }

    set_filter(elem, param, val) {
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

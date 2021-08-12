/*
 * cone.app protected JS
 *
 * Requires:
 *     jquery
 *     treibstoff
 */

(function($, ts) {

    cone = {

        // object to store global flags
        flags: {},

        batcheditems_handle_filter: function(elem, param, val) {
            var target = ts.ajax.parsetarget(elem.attr('ajax:target')),
                event = elem.attr('ajax:event');
            target.params[param] = val;
            if (elem.attr('ajax:path')) {
                var path_event = elem.attr('ajax:path-event');
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
            var defs = event.split(':');
            ts.ajax.trigger(defs[0], defs[1], target);
        },

        batcheditems_size_binder: function(context, size_selector) {
            ts.deprecate('batcheditems_size_binder', 'BatchedItems', 'next release');
            // use default selector if not passed
            if (!size_selector) {
                size_selector = '.batched_items_slice_size select';
            }
            // lookup selection field by selector
            var selection = $(size_selector, context);
            // handle filter on selection change
            selection.off('change').on('change', function(event) {
                var option = $('option:selected', $(this)).first();
                var size = option.val();
                cone.batcheditems_handle_filter(selection, 'size', size);
            });
        },

        batcheditems_filter_binder: function(context,
                                             filter_selector,
                                             filter_name) {
            ts.deprecate('batcheditems_filter_binder', 'BatchedItems', 'next release');
            // use default selector if not passed
            if (!filter_selector) {
                filter_selector = '.batched_items_filter input';
            }
            // use default filter name if not passed
            if (!filter_name) {
                filter_name = 'term';
            }
            // lookup search field by selector
            var searchfield = $(filter_selector, context);
            // trigger search function
            var trigger_search = function(input) {
                var term = input.attr('value');
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
    };

})(jQuery, treibstoff);

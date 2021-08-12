var cone_protected = (function (exports, $, ts) {
    'use strict';

    
    if (window.cone === undefined) {
        window.cone = {};
    }


    class BatchedItems {

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

    class TableToolBar extends BatchedItems {

        static initialize(context) {
            new TableToolBar(
                context,
                '.table_length select',
                '.table_filter input',
                'term'
            );
        }

        constructor(context, size_selector, filter_selector, filter_name) {
            super(context, size_selector, filter_selector, filter_name);
        }
    }

    let keys = {
        shift_down: false,
        ctrl_down: false
    };

    /**
     * XXX: Use ``ts.KeyState`` instead.
     *      Need a mechanism to attach and unload instances with ``ts.ajax`` first.
     */
    class KeyBinder {

        constructor() {
            $(window).on('keydown', this.key_down.bind(this));
            $(window).on('keyup', this.key_up.bind(this));
        }

        key_down(e) {
            switch (e.keyCode || e.which) {
                case 16:
                    keys.shift_down = true;
                    break;
                case 17:
                    keys.ctrl_down = true;
                    break;
            }
        }

        key_up(e) {
            switch (e.keyCode || e.which) {
                case 16:
                    keys.shift_down = false;
                       break;
                case 17:
                    keys.ctrl_down = false;
                    break;
            }
        }
    }

    $(function() {
        new KeyBinder();

        //ts.ajax.register(cone.Settingstabs.bind(cone), true);
        ts.ajax.register(BatchedItems.initialize, true);
        ts.ajax.register(TableToolBar.initialize, true);
        //ts.ajax.register(cone.Sharing.bind(cone), true);
        //ts.ajax.register(cone.CopySupport.bind(cone), true);
        //var refbrowser = yafowil.referencebrowser;
        //ts.ajax.register(refbrowser.browser_binder.bind(refbrowser), true);
        //ts.ajax.register(refbrowser.add_reference_binder.bind(refbrowser));
        //ts.ajax.register(refbrowser.remove_reference_binder.bind(refbrowser));
    });

    exports.BatchedItems = BatchedItems;
    exports.KeyBinder = KeyBinder;
    exports.TableToolBar = TableToolBar;
    exports.keys = keys;

    Object.defineProperty(exports, '__esModule', { value: true });


    Object.assign(window.cone, exports);


    return exports;

}({}, jQuery, treibstoff));

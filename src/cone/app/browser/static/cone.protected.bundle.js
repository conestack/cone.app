var cone_protected = (function (exports, $, ts) {
    'use strict';

    
    if (window.cone === undefined) {
        window.cone = {};
    }


    class CopySupport {

        static initialize(context) {
            new CopySupport(context);
        }

        constructor(context) {
            this.cut_cookie = 'cone.app.copysupport.cut';
            this.copy_cookie = 'cone.app.copysupport.copy';

            this.context = context;

            this.paste_action = $('a#toolbaraction-paste', context);
            this.paste_action.off('click').on('click', this.handle_paste.bind(this));

            this.copyable = $('table tr.selectable.copysupportitem', context);
            if (!this.copyable.length) {
                return;
            }

            this.cut_action = $('a#toolbaraction-cut', context);
            this.cut_action.off('click').on('click', this.handle_cut.bind(this));

            this.copy_action = $('a#toolbaraction-copy', context);
            this.copy_action.off('click').on('click', this.handle_copy.bind(this));

            this.selectable = this.copyable.selectable({
                on_firstclick: this.on_firstclick.bind(this),
                on_select: this.on_select.bind(this)
            }).data('selectable');

            this.read_selected_from_cookie(this.cut_cookie, 'copysupport_cut');
            this.read_selected_from_cookie(this.copy_cookie, '');
        }

        on_firstclick(selectable, elem) {
        }

        on_select(selectable) {
        }

        write_selected_to_cookie(name) {
            let selected = $(this.selectable.selected);
            let ids = new Array();
            selected.each(function() {
                ids.push($(this).attr('ajax:target'));
            });
            let cookie = ids.join('::');
            ts.create_cookie(name, cookie);
            if (cookie.length) {
                $(this.paste_action).removeClass('disabled');
            } else {
                $(this.paste_action).addClass('disabled');
            }
        }

        read_selected_from_cookie(name, css) {
            let cookie = ts.read_cookie(name);
            if (!cookie) {
                return;
            }
            let ids = cookie.split('::');
            let that = this;
            let elem, target;
            $('table tr.selectable', this.context).each(function() {
                elem = $(this);
                target = elem.attr('ajax:target');
                for (let idx in ids) {
                    if (ids[idx] == target) {
                        elem.addClass('selected');
                        if (css) {
                            elem.addClass(css);
                        }
                        that.selectable.add(elem.get(0));
                        break;
                    }
                }
            });
        }

        handle_cut(evt) {
            evt.preventDefault();
            ts.create_cookie(this.copy_cookie, '', 0);
            this.write_selected_to_cookie(this.cut_cookie);
            this.copyable.removeClass('copysupport_cut');
            $(this.selectable.selected).addClass('copysupport_cut');
        }

        handle_copy(evt) {
            evt.preventDefault();
            ts.create_cookie(this.cut_cookie, '', 0);
            this.write_selected_to_cookie(this.copy_cookie);
            this.copyable.removeClass('copysupport_cut');
        }

        handle_paste(evt) {
            evt.preventDefault();
            let elem = $(evt.currentTarget);
            if (elem.hasClass('disabled')) {
                return;
            }
            let target = ts.ajax.parsetarget(elem.attr('ajax:target'));
            ts.ajax.action({
                name: 'paste',
                mode: 'NONE',
                selector: 'NONE',
                url: target.url,
                params: target.params
            });
        }
    }

    class SettingsTabs {

        static initialize(context) {
            new SettingsTabs(context);
        }

        constructor(context) {
            this.tabs = $('ul.settingstabs a', context);
            this.tabs.on('click', this.load_tab).first().trigger('click');
        }

        load_tab(evt) {
            evt.preventDefault();
            let elem = $(this);
            let target = ts.ajax.parsetarget(elem.attr('ajax:target'));
            ts.ajax.request({
                url: target.url,
                params: target.params,
                success: function(data, status, request) {
                    let tabs = $(elem).parent().parent();
                    $('li', tabs).removeClass('active');
                    elem.parent().addClass('active');
                    $('.settingstabpane')
                        .html(data)
                        .css('display', 'block')
                        .tsajax();
                }
            });
        }
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

    class Sharing {

        static initialize(context) {
            new Sharing(context);
        }

        constructor(context) {
            let checkboxes = $('input.add_remove_role_for_principal', context);
            checkboxes.off('change').on('change', this.set_principal_role);
        }

        set_principal_role(evt) {
            evt.preventDefault();
            let checkbox = $(this);
            let action;
            if (this.checked) {
                action = 'add_principal_role';
            } else {
                action = 'remove_principal_role';
            }
            let url = checkbox.parent().attr('ajax:target');
            let params = {
                id: checkbox.attr('name'),
                role: checkbox.attr('value')
            };
            ts.ajax.action({
                name: action,
                mode: 'NONE',
                selector: 'NONE',
                url: url,
                params: params
            });
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

    class Selectable {

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

        handle_click(evt) {
            evt.preventDefault();
            let elem = $(evt.currentTarget);
            let container = elem.parent();
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
            if (this.options && this.options[e]) {
                this.options[e](...args);
            }
        }

        bind(elem) {
            elem.off('click').on('click', this.handle_click.bind(this));
        }
    }

    // Selectable items
    $.fn.selectable = function(options) {
        var api = new Selectable(options);
        api.bind(this);
        this.data('selectable', api);
        return this;
    };

    $(function() {
        new KeyBinder();

        ts.ajax.register(SettingsTabs.initialize, true);
        ts.ajax.register(BatchedItems.initialize, true);
        ts.ajax.register(TableToolBar.initialize, true);
        ts.ajax.register(Sharing.initialize, true);
        ts.ajax.register(CopySupport.initialize, true);
        //var refbrowser = yafowil.referencebrowser;
        //ts.ajax.register(refbrowser.browser_binder.bind(refbrowser), true);
        //ts.ajax.register(refbrowser.add_reference_binder.bind(refbrowser));
        //ts.ajax.register(refbrowser.remove_reference_binder.bind(refbrowser));
    });

    exports.BatchedItems = BatchedItems;
    exports.CopySupport = CopySupport;
    exports.KeyBinder = KeyBinder;
    exports.Selectable = Selectable;
    exports.SettingsTabs = SettingsTabs;
    exports.Sharing = Sharing;
    exports.TableToolBar = TableToolBar;
    exports.keys = keys;

    Object.defineProperty(exports, '__esModule', { value: true });


    Object.assign(window.cone, exports);


    return exports;

}({}, jQuery, treibstoff));

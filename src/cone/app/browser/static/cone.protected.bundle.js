var cone = (function (exports, $) {
    'use strict';

    class CopySupport {
        constructor(context) {
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

        // cut_cookie: 'cone.app.copysupport.cut',
        // copy_cookie: 'cone.app.copysupport.copy',

        on_firstclick(selectable, elem) {
            // tmp
            console.log('click');
            // end tmp
        }

        on_select(selectable) {
            //
        }

        write_selected_to_cookie(name) {
            let selected = $(this.selectable.selected);
            let ids = new Array();
            selected.each(function() {
                ids.push($(this).attr('ajax:target'));
            });
            let cookie = ids.join('::');
            createCookie(name, cookie);
            if (cookie.length) {
                $(this.paste_action).removeClass('disabled');
            } else {
                $(this.paste_action).addClass('disabled');
            }
        }

        read_selected_from_cookie(name, css) {
            let cookie = readCookie(name);
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

        handle_cut(e) {
            e.preventDefault();
            createCookie(this.copy_cookie, '', 0);
            this.write_selected_to_cookie(this.cut_cookie);
            this.copyable.removeClass('copysupport_cut');
            $(this.selectable.selected).addClass('copysupport_cut');
        }

        handle_copy(e) {
            e.preventDefault();
            createCookie(this.cut_cookie, '', 0);
            this.write_selected_to_cookie(this.copy_cookie);
            this.copyable.removeClass('copysupport_cut');
        }

        handle_paste(e) {
            e.preventDefault();
            let elem = $(e.currentTarget);
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

    class Settingstabs {
        constructor(context) {
            this.elems = $('ul.settingstabs a', context);

            this._bind = this.bind_settings.bind(this);
            this.elems.on('click', this._bind);
        }

        bind_settings(e) {
            e.preventDefault();
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
            this.elems.first().trigger('click');
        }
    }

    class BatchedItems {
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

    class ReferenceBrowser {
        constructor(context) {
            // target: null
        }

        overlay() {
            // XXX
            return $('#ajax-overlay').data('overlay');
        }

        browser_binder(context) {
            $('.referencebrowser_trigger', context).referencebrowser();
        }

        add_reference_binder(context) {
            $('a.addreference').off('click').on('click', function(event) {
                event.preventDefault();
                yafowil.referencebrowser.addreference($(this));
            });
        }

        remove_reference_binder(context) {
            $('a.removereference').off('click').on('click', function(event) {
                event.preventDefault();
                yafowil.referencebrowser.removereference($(this));
            });
        }

        addreference(elem) {
            let target = $(this.target);
            let uid = elem.attr('id');
            uid = uid.substring(4, uid.length);
            let label = $('.reftitle', elem.parent()).html();
            if (this.singlevalue()) {
                target.attr('value', label);
                let sel = '[name="' + target.attr('name') + '.uid"]';
                $(sel).attr('value', uid);
                this._set_selected_on_ajax_target(target.parent(), [uid]);
                this.overlay().close();
                return;
            }
            if (this.multivalue()) {
                if ($('[value="' + uid + '"]', target.parent()).length) {
                    return;
                }
                let option = $('<option></option>');
                option.val(uid).html(label).attr('selected', 'selected');
                target.append(option);
            }
            this._reset_selected(target);
            this._toggle_enabled(elem);
        }

        removereference(elem) {
            let target = $(this.target);
            let uid = elem.attr('id');
            uid = uid.substring(4, uid.length);
            if (this.singlevalue()) {
                target.attr('value', '');
                let sel = '[name="' + target.attr('name') + '.uid"]';
                $(sel).attr('value', '');
            }
            if (this.multivalue()) {
                let sel = '[value="' + uid + '"]';
                if (!$(sel, target.parent()).length) {
                    return;
                }
                $(sel, target).remove();
            }
            this._reset_selected(target);
            this._toggle_enabled(elem);
        }

        singlevalue() {
            return this.target.tagName == 'INPUT';
        }

        multivalue() {
            return this.target.tagName == 'SELECT';
        }

        _toggle_enabled(elem) {
            $('a', elem.parent()).toggleClass('disabled');
        }

        _reset_selected(elem) {
            let selected = new Array();
            if (this.singlevalue()) {
                selected.push(elem.attr('value'));
            }
            if (this.multivalue()) {
                $('[selected=selected]', elem).each(function() {
                    selected.push($(this).attr('value'));
                });
            }
            this._set_selected_on_ajax_target(elem.parent(), selected);
            let overlay = this.overlay().getOverlay();
            let rb;
            $('div.referencebrowser a', overlay).each(function() {
                let link = $(this);
                if (link.attr('ajax:target')) {
                    rb = yafowil.referencebrowser;
                    rb._set_selected_on_ajax_target(link, selected);
                }
            });
        }

        _set_selected_on_ajax_target(elem, selected) {
            let target = ts.ajax.parsetarget(elem.attr('ajax:target'));
            target.params.selected = selected.join(',');
            let query = new Array();
            for (let name in target.params) {
                query.push(name + '=' + target.params[name]);
            }
            elem.attr('ajax:target', target.url + '?' + query.join('&'));
        }
    }

    class TableToolBar extends BatchedItems {
        constructor(context) {
            //
        }

        tabletoolbarbinder(context) {
            this.items_binder(
                context,
                '.table_length select',
                '.table_filter input'
            );
        }
    }

    class Sharing {
        constructor(context) {
            //
        }

        sharingbinder(context) {
            let checkboxes = $('input.add_remove_role_for_principal', context);
            checkboxes.off('change').on('change', function(e) {
                e.preventDefault();
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
            });
        }
    }

    // keydown / keyup binder for shift and ctrl keys

    class KeyBinder {
        constructor() {
            this._keydown = this.key_down.bind(this);
            this._keyup = this.key_up.bind(this);
            $(document).on('keydown', this._keydown);
            $(document).on('keyup', this._keyup);
        }

        key_down(e) {
            switch (e.keyCode || e.which) {
                case 16:
                    cone.keys.shift_down = true;
                    break;
                case 17:
                    cone.keys.ctrl_down = true;
                    break;
            }
        }

        key_up(e) {
            switch (e.keyCode || e.which) {
                case 16:
                    cone.keys.shift_down = false;
                       break;
                case 17:
                    cone.keys.ctrl_down = false;
                    break;
            }
        }
    }

    $(function($, ts) {
        // TODO:

        // initial binding
        cone.KeyBinder();

        // add binders to treibstoff binding callbacks
        ts.ajax.register(cone.Settingstabs.bind(cone), true);
        ts.ajax.register(cone.BatchedItems.bind(cone), true);
        ts.ajax.register(cone.TableToolBar.bind(cone), true);
        ts.ajax.register(cone.Sharing.bind(cone), true);
        ts.ajax.register(cone.CopySupport.bind(cone), true);
        var refbrowser = yafowil.referencebrowser;
        ts.ajax.register(refbrowser.browser_binder.bind(refbrowser), true);
        ts.ajax.register(refbrowser.add_reference_binder.bind(refbrowser));
        ts.ajax.register(refbrowser.remove_reference_binder.bind(refbrowser));
    });

    exports.BatchedItems = BatchedItems;
    exports.CopySupport = CopySupport;
    exports.KeyBinder = KeyBinder;
    exports.ReferenceBrowser = ReferenceBrowser;
    exports.Selectable = Selectable;
    exports.Settingstabs = Settingstabs;
    exports.Sharing = Sharing;
    exports.TableToolBar = TableToolBar;

    Object.defineProperty(exports, '__esModule', { value: true });


    window.cone = exports;


    return exports;

}({}, jQuery));

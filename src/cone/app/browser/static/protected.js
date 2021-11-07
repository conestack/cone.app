/*
 * cone.app protected JS
 *
 * Requires:
 *     jquery
 *     bdajax
 */

if (typeof(window['yafowil']) == "undefined") yafowil = {};

(function($) {

    $(document).ready(function() {

        // initial binding
        cone.key_binder();

        // add binders to bdajax binding callbacks
        bdajax.register(cone.settingstabsbinder.bind(cone), true);
        bdajax.register(cone.batcheditemsbinder.bind(cone), true);
        bdajax.register(cone.tabletoolbarbinder.bind(cone), true);
        bdajax.register(cone.sharingbinder.bind(cone), true);
        bdajax.register(cone.copysupportbinder.bind(cone), true);
        var refbrowser = yafowil.referencebrowser;
        bdajax.register(refbrowser.browser_binder.bind(refbrowser), true);
        bdajax.register(refbrowser.add_reference_binder.bind(refbrowser));
        bdajax.register(refbrowser.remove_reference_binder.bind(refbrowser));
        bdajax.register(cone.Translation.initialize, true);
    });

    cone = {

        // object to store global flags
        flags: {},

        // keyboard control keys status
        keys: {},

        // keydown / keyup binder for shift and ctrl keys
        key_binder: function() {
            $(document).on('keydown', function(event) {
                switch (event.keyCode || event.which) {
                    case 16:
                        cone.keys.shift_down = true;
                        break;
                    case 17:
                        cone.keys.ctrl_down = true;
                        break;
                }
            });
            $(document).on('keyup', function(event) {
                switch (event.keyCode || event.which) {
                    case 16:
                        cone.keys.shift_down = false;
                           break;
                    case 17:
                        cone.keys.ctrl_down = false;
                        break;
                }
            });
        },

        settingstabsbinder: function(context) {
            $('ul.settingstabs a', context).on('click', function(event) {
                event.preventDefault();
                var elem = $(this);
                var target = bdajax.parsetarget(elem.attr('ajax:target'));
                bdajax.request({
                    url: target.url,
                    params: target.params,
                    success: function(data, status, request) {
                        var tabs = $(elem).parent().parent();
                        $('li', tabs).removeClass('active');
                        elem.parent().addClass('active');
                        $('.settingstabpane')
                            .html(data)
                            .css('display', 'block')
                            .bdajax();
                    }
                });
            }).first().trigger('click');
        },

        // XXX: better naming
        batcheditems_handle_filter: function(elem, param, val) {
            var target = bdajax.parsetarget(elem.attr('ajax:target')),
                event = elem.attr('ajax:event');
            target.params[param] = val;
            if (elem.attr('ajax:path')) {
                var path_event = elem.attr('ajax:path-event');
                if (!path_event) {
                    path_event = event;
                }
                // path always gets calculated from target
                bdajax.path({
                    path: target.path + target.query + '&' + param + '=' + val,
                    event: path_event,
                    target: target
                });
            }
            var defs = event.split(':');
            bdajax.trigger(defs[0], defs[1], target);
        },

        batcheditems_size_binder: function(context, size_selector) {
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
        },

        batcheditemsbinder: function(context, size_selector, filter_selector) {
            cone.batcheditems_size_binder(context, size_selector);
            cone.batcheditems_filter_binder(context, filter_selector);
        },

        tabletoolbarbinder: function(context) {
            this.batcheditemsbinder(
                context,
                '.table_length select',
                '.table_filter input'
            );
        },

        sharingbinder: function(context) {
            var checkboxes = $('input.add_remove_role_for_principal', context);
            checkboxes.off('change').on('change', function(event) {
                event.preventDefault();
                var checkbox = $(this);
                var action;
                if (this.checked) {
                    action = 'add_principal_role';
                } else {
                    action = 'remove_principal_role';
                }
                var url = checkbox.parent().attr('ajax:target');
                var params = {
                    id: checkbox.attr('name'),
                    role: checkbox.attr('value')
                };
                bdajax.action({
                    name: action,
                    mode: 'NONE',
                    selector: 'NONE',
                    url: url,
                    params: params
                });
            });
        },

        copysupportbinder: function(context) {
            new cone.CopySupport(context);
        }
    };

    cone.CopySupport = function(context) {
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
    };

    cone.CopySupport.prototype = {
        cut_cookie: 'cone.app.copysupport.cut',
        copy_cookie: 'cone.app.copysupport.copy',

        on_firstclick: function(selectable, elem) {
        },

        on_select: function(selectable) {
        },

        write_selected_to_cookie: function(name) {
            var selected = $(this.selectable.selected);
            var ids = new Array();
            selected.each(function() {
                ids.push($(this).attr('ajax:target'));
            });
            var cookie = ids.join('::');
            createCookie(name, cookie);
            if (cookie.length) {
                $(this.paste_action).removeClass('disabled');
            } else {
                $(this.paste_action).addClass('disabled');
            }
        },

        read_selected_from_cookie: function(name, css) {
            var cookie = readCookie(name);
            if (!cookie) {
                return;
            }
            var ids = cookie.split('::');
            var that = this;
            var elem, target;
            $('table tr.selectable', this.context).each(function() {
                elem = $(this);
                target = elem.attr('ajax:target');
                for (var idx in ids) {
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
        },

        handle_cut: function(event) {
            event.preventDefault();
            createCookie(this.copy_cookie, '', 0);
            this.write_selected_to_cookie(this.cut_cookie);
            this.copyable.removeClass('copysupport_cut');
            $(this.selectable.selected).addClass('copysupport_cut');
        },

        handle_copy: function(event) {
            event.preventDefault();
            createCookie(this.cut_cookie, '', 0);
            this.write_selected_to_cookie(this.copy_cookie);
            this.copyable.removeClass('copysupport_cut');
        },

        handle_paste: function(event) {
            event.preventDefault();
            var elem = $(event.currentTarget);
            if (elem.hasClass('disabled')) {
                return;
            }
            var target = bdajax.parsetarget(elem.attr('ajax:target'));
            bdajax.action({
                name: 'paste',
                mode: 'NONE',
                selector: 'NONE',
                url: target.url,
                params: target.params
            });
        }
    };

    cone.Selectable = function(options) {
        // on_firstclick, on_select callbacks in options
        this.options = options;
        this.selected = [];
        this.select_direction = 0;
        this.firstclick = true;
    };

    cone.Selectable.prototype = {
        reset: function() {
            this.selected = [];
        },

        add: function(elem) {
            this.remove(elem);
            this.selected.push(elem);
        },

        remove: function(elem) {
            var reduced = $.grep(this.selected, function(item, index) {
                return item !== elem;
            });
            this.selected = reduced;
        },

        select_no_key: function(container, elem) {
            container.children().removeClass('selected');
            elem.addClass('selected');
            this.reset();
            this.add(elem.get(0));
        },

        select_ctrl_down: function(elem) {
            elem.toggleClass('selected');
            if (elem.hasClass('selected')) {
                this.add(elem.get(0));
            } else {
                this.remove(elem.get(0));
            }
        },

        get_nearest: function(container, current_index) {
            // get nearest next selected item from current index
            var selected = container.children('.selected');
            // -1 means no other selected item
            var nearest = -1;
            var selected_index, selected_elem;
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
        },

        select_shift_down: function(container, elem) {
            var current_index = elem.index();
            var nearest = this.get_nearest(container, current_index);
            if (nearest == -1) {
                elem.addClass('selected');
                this.add(elem.get(0));
            } else {
                container.children().removeClass('selected');
                var start, end;
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
                var that = this;
                container.children()
                         .slice(start, end + 1)
                         .addClass('selected')
                         .each(function() {
                             that.add(this);
                         });
            }
        },

        handle_click: function(event) {
            event.preventDefault();
            var elem = $(event.currentTarget);
            var container = elem.parent();
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
        },

        notify: function(event, ...args) {
            if (this.options && this.options[event]) {
                this.options[event](...args);
            }
        },

        bind: function(elem) {
            elem.off('click').on('click', this.handle_click.bind(this));
        }
    };

    // Selectable items
    $.fn.selectable = function(options) {
        var api = new cone.Selectable(options);
        api.bind(this);
        this.data('selectable', api);
        return this;
    };

    // Reference Browser
    $.fn.referencebrowser = function() {
        this.off('click').on('click', function() {
            var elem = $(this);
            var wrapper = elem.parent();
            var sel = '[name="' + elem.data('reference-name') + '"]';
            yafowil.referencebrowser.target = $(sel, wrapper).get(0);
            bdajax.overlay({
                action: 'referencebrowser',
                target: wrapper.attr('ajax:target')
            });
        });
        return this;
    };

    // extend yafowil by reference browser widget.
    $.extend(yafowil, {

        referencebrowser: {

            target: null,

            overlay: function() {
                return $('#ajax-overlay').data('overlay');
            },

            browser_binder: function(context) {
                $('.referencebrowser_trigger', context).referencebrowser();
            },

            add_reference_binder: function(context) {
                $('a.addreference').off('click').on('click', function(event) {
                    event.preventDefault();
                    yafowil.referencebrowser.addreference($(this));
                });
            },

            remove_reference_binder: function(context) {
                $('a.removereference').off('click').on('click', function(event) {
                    event.preventDefault();
                    yafowil.referencebrowser.removereference($(this));
                });
            },

            addreference: function(elem) {
                var target = $(this.target);
                var uid = elem.attr('id');
                uid = uid.substring(4, uid.length);
                var label = $('.reftitle', elem.parent()).html();
                if (this.singlevalue()) {
                    target.attr('value', label);
                    var sel = '[name="' + target.attr('name') + '.uid"]';
                    $(sel).attr('value', uid);
                    this._set_selected_on_ajax_target(target.parent(), [uid]);
                    this.overlay().close();
                    return;
                }
                if (this.multivalue()) {
                    if ($('[value="' + uid + '"]', target.parent()).length) {
                        return;
                    }
                    var option = $('<option></option>');
                    option.val(uid).html(label).attr('selected', 'selected');
                    target.append(option);
                }
                this._reset_selected(target);
                this._toggle_enabled(elem);
            },

            removereference: function(elem) {
                var target = $(this.target);
                var uid = elem.attr('id');
                uid = uid.substring(4, uid.length);
                if (this.singlevalue()) {
                    target.attr('value', '');
                    var sel = '[name="' + target.attr('name') + '.uid"]';
                    $(sel).attr('value', '');
                }
                if (this.multivalue()) {
                    var sel = '[value="' + uid + '"]';
                    if (!$(sel, target.parent()).length) {
                        return;
                    }
                    $(sel, target).remove();
                }
                this._reset_selected(target);
                this._toggle_enabled(elem);
            },

            singlevalue: function() {
                return this.target.tagName == 'INPUT';
            },

            multivalue: function() {
                return this.target.tagName == 'SELECT';
            },

            _toggle_enabled: function(elem) {
                $('a', elem.parent()).toggleClass('disabled');
            },

            _reset_selected: function(elem) {
                var selected = new Array();
                if (this.singlevalue()) {
                    selected.push(elem.attr('value'));
                }
                if (this.multivalue()) {
                    $('[selected=selected]', elem).each(function() {
                        selected.push($(this).attr('value'));
                    });
                }
                this._set_selected_on_ajax_target(elem.parent(), selected);
                var overlay = this.overlay().getOverlay();
                var rb;
                $('div.referencebrowser a', overlay).each(function() {
                    var link = $(this);
                    if (link.attr('ajax:target')) {
                        rb = yafowil.referencebrowser;
                        rb._set_selected_on_ajax_target(link, selected);
                    }
                });
            },

            _set_selected_on_ajax_target: function(elem, selected) {
                var target = bdajax.parsetarget(elem.attr('ajax:target'));
                target.params.selected = selected.join(',');
                var query = new Array();
                for (var name in target.params) {
                    query.push(name + '=' + target.params[name]);
                }
                elem.attr('ajax:target', target.url + '?' + query.join('&'));
            }
        }
    });

    cone.Translation = class {

        static initialize(context) {
            $('.translation-nav', context).each(function() {
                new cone.Translation($(this));
            });
        }

        constructor(nav_elem) {
            this.nav_elem = nav_elem;
            this.fields_elem = nav_elem.next();
            this.show_lang_handle = this.show_lang_handle.bind(this);
            $('li > a', nav_elem).on('click', this.show_lang_handle);
            if ($('li.error', nav_elem).length) {
                $('li.error:first > a', nav_elem).click();
            } else {
                $('li.active > a', nav_elem).click();
            }
            this.fields_elem.show();
        }

        show_lang_handle(evt) {
            evt.preventDefault();
            this.nav_elem.children().removeClass('active');
            this.fields_elem.children().hide();
            let elem = $(evt.currentTarget);
            elem.parent().addClass('active');
            $(elem.attr('href'), this.fields_elem).show();
        }
    };

})(jQuery);

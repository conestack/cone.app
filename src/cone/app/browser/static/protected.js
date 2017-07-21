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
        bdajax.register(cone.selectable.binder.bind(cone.selectable), true);
        bdajax.register(cone.copysupportbinder.bind(cone), true);
        var referencebrowser = yafowil.referencebrowser;
        bdajax.register(
            referencebrowser.browser_binder.bind(referencebrowser),
            true
        );
        bdajax.register(
            referencebrowser.add_reference_binder.bind(referencebrowser)
        );
        bdajax.register(
            referencebrowser.remove_reference_binder.bind(referencebrowser)
        );
    });

    cone = {

        // object to store global flags
        flags: {},

        // keyboard control keys status
        keys: {},

        // keydown / keyup binder for shift and ctrl keys
        key_binder: function() {
            $(document).bind('keydown', function(event) {
                switch (event.keyCode || event.which) {
                    case 16:
                        cone.keys.shift_down = true;
                        break;
                    case 17:
                        cone.keys.ctrl_down = true;
                        break;
                }
            });
            $(document).bind('keyup', function(event) {
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
            $('ul.settingstabs a', context).bind('click', function(event) {
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

        batcheditemsbinder: function(context, size_selector, filter_selector) {
            if (!size_selector) {
                size_selector = '.batched_items_slice_size select';
            }
            var selection = $(size_selector, context);
            selection.unbind('change').bind('change', function(event) {
                var option = $('option:selected', $(this)).first();
                var size = option.val();
                cone.batcheditems_handle_filter(selection, 'size', size);
            });
            var trigger_search = function(input) {
                var term = input.attr('value');
                cone.batcheditems_handle_filter(input, 'term', term);
            };
            if (!filter_selector) {
                filter_selector = '.batched_items_filter input';
            }
            var searchfield = $(filter_selector, context);
            searchfield.unbind('keypress').bind('keypress', function(event) {
                if (event.keyCode == 13) {
                    event.preventDefault();
                }
            });
            searchfield.unbind('keyup').bind('keyup', function(event) {
                if (event.keyCode == 13) {
                    event.preventDefault();
                    trigger_search($(this));
                }
            });
            searchfield.unbind('change').bind('change', function(event) {
                event.preventDefault();
                trigger_search($(this));
            });
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
            checkboxes.unbind('change').bind('change', function(event) {
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
            var cut_cookie = 'cone.app.copysupport.cut';
            var copy_cookie = 'cone.app.copysupport.copy';
            var write_selected_to_cookie = function(name) {
                var selected = $(cone.selectable.selected);
                var ids = new Array();
                selected.each(function() {
                    ids.push($(this).attr('ajax:target'));
                });
                var cookie = ids.join('::');
                createCookie(name, cookie);
                if (cookie.length) {
                    return true;
                }
                return false;
            };
            $('a#toolbaraction-cut', context)
                    .unbind('click').bind('click', function(event) {
                event.preventDefault();
                createCookie(copy_cookie, '', 0);
                var selected_exist = 
                    write_selected_to_cookie(cut_cookie);
                if (selected_exist) {
                    $('a#toolbaraction-paste').removeClass('disabled');
                }
                var selectable = $('.selectable');
                selectable.removeClass('copysupport_cut');
                var selected = $(cone.selectable.selected);
                selected.each(function() {
                    elem = $(this);
                    elem.addClass('copysupport_cut');
                });
                cone.selectable.reset();
            });
            $('a#toolbaraction-copy', context)
                    .unbind('click').bind('click', function(event) {
                event.preventDefault();
                createCookie(cut_cookie, '', 0);
                var selected_exist = 
                    write_selected_to_cookie(copy_cookie);
                if (selected_exist) {
                    $('a#toolbaraction-paste').removeClass('disabled');
                }
                var selectable = $('.selectable');
                selectable.removeClass('copysupport_cut');
                cone.selectable.reset();
            });
            $('a#toolbaraction-paste', context).unbind('click')
                    .bind('click', function(event) {
                event.preventDefault();
                var elem = $(this);
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
            });
        }
    }

    /*
     * Selectable Items
     * ================
     * 
     * Markup
     * ------
     * 
     *     <div>
     *       <div class="selectable">selectable 1</div>
     *       <div class="selectable">selectable 2</div>
     *     </div>
     * 
     * Script
     * ------
     * 
     *     $('div.selectable').selectable();
     */
    $.fn.selectable = function() {
        this.unbind('click').bind('click', function(event) {
            event.preventDefault();
            $(document).unbind('mousedown')
                       .bind('mousedown', function(event) {
                var elem = $(event.target);
                // XXX: currently static selector
                if (elem.parents('.selectable').length) {
                    return true;
                }
                $('.selectable').removeClass('selected');
                $(document).unbind('mousedown');
                return false;
            });
            var elem = $(event.currentTarget);
            var container = elem.parent();
            if (!cone.keys.ctrl_down && !cone.keys.shift_down) {
                container.children().removeClass('selected');
                elem.addClass('selected');
                cone.selectable.reset();
                cone.selectable.add(event.currentTarget);
            } else {
                if (cone.keys.ctrl_down) {
                    elem.toggleClass('selected');
                    if (elem.hasClass('selected')) {
                        cone.selectable.add(event.currentTarget);
                    } else {
                        cone.selectable.remove(event.currentTarget);
                    }
                }
                if (cone.keys.shift_down) {
                    var selected = container.children('.selected');
                    // get nearest next selected item, disable others
                    var current_index = elem.index();
                    // -1 means no other selected item
                    var nearest = -1;
                    var selected_index, selected_elem;
                    $(selected).each(function() {
                        selected_elem = $(this);
                        selected_index = selected_elem.index();
                        if (nearest == -1) {
                            nearest = selected_index;
                        } else if (current_index > selected_index) {
                            if (cone.flags.select_direction > 0) {
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
                    if (nearest == -1) {
                        elem.addClass('selected');
                        cone.selectable.add(event.currentTarget);
                    } else {
                        container.children().removeClass('selected');
                        var start, end;
                        if (current_index < nearest) {
                            cone.flags.select_direction = -1;
                            start = current_index;
                            end = nearest;
                        } else {
                            cone.flags.select_direction = 1;
                            start = nearest;
                            end = current_index;
                        }
                        cone.selectable.reset();
                        container.children()
                                 .slice(start, end + 1)
                                 .addClass('selected')
                                 .each(function() {
                                     cone.selectable.add(this);
                                 });
                    }
                }
            }
        });
        return this;
    }

    $.extend(cone, {

        selectable: {

            // current selected dom elements
            selected: [],

            // reset
            reset: function() {
                cone.selectable.selected = [];
            },

            // add element to selected
            add: function(elem) {
                cone.selectable.remove(elem);
                cone.selectable.selected.push(elem);
            },

            // remove element from selected
            remove: function(elem) {
                var reduced = $.grep(cone.selectable.selected,
                                     function(item, index) {
                    return item !== elem;
                });
                cone.selectable.selected = reduced;
            },

            binder: function(context) {
                $('table tr.selectable', context).selectable();
            }
        }
    });

    /*
     * Reference Browser
     * =================
     * 
     * Markup
     * ------
     * 
     *     <input type="text" name="foo" class="referencebrowser" />
     *     <input type="hidden" name="foo.uid" value="" />
     * 
     * for single value reference or
     * 
     *     <select name="foo" class="referencebrowser" />
     * 
     * for multi valued reference.
     * 
     * Script
     * ------
     * 
     *     $('input.referencebrowser').referencebrowser();
     */
    $.fn.referencebrowser = function() {
        var icon = $(
            '<span class="ion-android-share referencebrowser_trigger"></span>');
        this.after(icon);
        icon = this.next();
        icon.unbind('click');
        icon.bind('click', function() {
            var elem = $(this);
            yafowil.referencebrowser.target = elem.prev().get(0);
            bdajax.overlay({
                action: 'referencebrowser',
                target: elem.parent().attr('ajax:target')
            });
        });
        return this;
    }

    // extend yafowil by reference browser widget.
    $.extend(yafowil, {

        referencebrowser: {

            target: null,

            overlay: function() {
                return $('#ajax-overlay').data('overlay');
            },

            browser_binder: function(context) {
                $('input.referencebrowser', context).referencebrowser();
                $('select.referencebrowser', context).referencebrowser();
            },

            add_reference_binder: function(context) {
                $('a.addreference').unbind('click')
                                   .bind('click', function(event) {
                    event.preventDefault();
                    yafowil.referencebrowser.addreference($(this));
                });
            },

            remove_reference_binder: function(context) {
                $('a.removereference').unbind('click')
                                      .bind('click', function(event) {
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

})(jQuery);
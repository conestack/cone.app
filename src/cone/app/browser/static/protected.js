/*
 * cone.app protected JS
 *
 * Requires:
 *     jquery
 *     treibstoff
 */

if (window.yafowil === undefined) yafowil = {};

(function($, ts) {

    $(document).ready(function() {
        var refbrowser = yafowil.referencebrowser;
        ts.ajax.register(refbrowser.browser_binder.bind(refbrowser), true);
        ts.ajax.register(refbrowser.add_reference_binder.bind(refbrowser));
        ts.ajax.register(refbrowser.remove_reference_binder.bind(refbrowser));
    });

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

    // Reference Browser
    $.fn.referencebrowser = function() {
        this.off('click').on('click', function() {
            var elem = $(this);
            var wrapper = elem.parent();
            var sel = '[name="' + elem.data('reference-name') + '"]';
            yafowil.referencebrowser.target = $(sel, wrapper).get(0);
            ts.ajax.overlay({
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
                // XXX
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
                var target = ts.ajax.parsetarget(elem.attr('ajax:target'));
                target.params.selected = selected.join(',');
                var query = new Array();
                for (var name in target.params) {
                    query.push(name + '=' + target.params[name]);
                }
                elem.attr('ajax:target', target.url + '?' + query.join('&'));
            }
        }
    });

})(jQuery, treibstoff);

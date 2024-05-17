var cone_app_protected = (function (exports, $, ts) {
    'use strict';

    class BatchedItemsFilter {
        constructor(elem, name) {
            this.elem = elem;
            this.name = name;
        }
        set_filter(val) {
            let elem = this.elem,
                target = ts.ajax.parse_target(elem.attr('ajax:target')),
                event = elem.attr('ajax:event');
            target.params[this.name] = val;
            if (elem.attr('ajax:path')) {
                let path_event = elem.attr('ajax:path-event');
                if (!path_event) {
                    path_event = event;
                }
                ts.ajax.path({
                    path: target.path + target.query + '&' + this.name + '=' + val,
                    event: path_event,
                    target: target
                });
            }
            let defs = event.split(':');
            ts.ajax.trigger({
                name: defs[0],
                selector: defs[1],
                target: target
            });
        }
    }
    class BatchedItemsSize extends BatchedItemsFilter {
        static initialize(context,
                          selector='.batched_items_slice_size select') {
            $(selector, context).each(function() {
                new BatchedItemsSize($(this));
            });
        }
        constructor(elem) {
            super(elem, 'size');
            elem.off('change').on('change', this.change_handle.bind(this));
        }
        change_handle(evt) {
            let option = $('option:selected', this.elem).first();
            this.set_filter(option.val());
        }
    }
    class BatchedItemsSearch extends BatchedItemsFilter {
        static initialize(context,
                          selector='.batched_items_filter input',
                          name='term') {
            $(selector, context).each(function() {
                new BatchedItemsSearch($(this), name);
            });
        }
        constructor(elem, name) {
            super(elem, name);
            elem.off('focus').on('focus', this.focus_handle.bind(this));
            elem.off('keypress').on('keypress', this.keypress_handle.bind(this));
            elem.off('keyup').on('keyup', this.keyup_handle.bind(this));
            elem.off('change').on('change', this.change_handle.bind(this));
        }
        focus_handle(evt) {
            let elem = this.elem;
            if (elem.hasClass('empty_filter')) {
                elem.val('');
                elem.removeClass('empty_filter');
            }
        }
        keypress_handle(evt) {
            if (evt.keyCode == 13) {
                evt.preventDefault();
            }
        }
        keyup_handle(evt) {
            if (evt.keyCode == 13) {
                evt.preventDefault();
                this.set_filter(this.elem.val());
            }
        }
        change_handle(evt) {
            evt.preventDefault();
            this.set_filter(this.elem.val());
        }
    }
    function batcheditems_handle_filter(elem, param, val) {
        ts.deprecate('batcheditems_handle_filter', 'BatchedItems.set_filter', '1.1');
        new BatchedItemsFilter(elem, param).set_filter(val);
    }
    function batcheditems_size_binder(context, size_selector) {
        ts.deprecate('batcheditems_size_binder', 'BatchedItems.bind_size', '1.1');
        if (!size_selector) {
            size_selector = '.batched_items_slice_size select';
        }
        BatchedItemsSize.initialize(context, size_selector);
    }
    function batcheditems_filter_binder(context, filter_selector, filter_name) {
        ts.deprecate('batcheditems_filter_binder', 'BatchedItems.bind_search', '1.1');
        if (!filter_selector) {
            filter_selector = '.batched_items_filter input';
        }
        if (!filter_name) {
            filter_name = 'term';
        }
        BatchedItemsSearch.initialize(context, filter_selector, filter_name);
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
            let target = ts.ajax.parse_target(elem.attr('ajax:target'));
            ts.ajax.action({
                name: 'paste',
                mode: 'NONE',
                selector: 'NONE',
                url: target.url,
                params: target.params
            });
        }
    }

    let keys = {
        shift_down: false,
        ctrl_down: false
    };
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

    class ReferenceHandle {
        static initialize(context) {
            if (!context) {
                return;
            }
            let ol_elem = context.parents('div.modal');
            if (!ol_elem.length) {
                return;
            }
            let ol = ol_elem.data('overlay'),
                target = ol.ref_target;
            $('a.addreference', context).each(function() {
                new AddReferenceHandle($(this), target, ol);
            });
            $('a.removereference', context).each(function() {
                new RemoveReferenceHandle($(this), target, ol);
            });
        }
        constructor(elem, target, overlay) {
            this.elem = elem;
            this.target = target;
            this.target_tag = target.get(0).tagName;
            this.overlay = overlay;
        }
        single_value() {
            return this.target_tag == 'INPUT';
        }
        multi_value() {
            return this.target_tag == 'SELECT';
        }
        toggle_enabled(elem) {
            $('a', elem.parent()).toggleClass('disabled');
        }
        reset_selected(elem) {
            let selected = new Array();
            if (this.single_value()) {
                selected.push(elem.attr('value'));
            }
            if (this.multi_value()) {
                $('[selected=selected]', elem).each(function() {
                    selected.push($(this).attr('value'));
                });
            }
            this.set_selected_on_ajax_target(elem.parent(), selected);
            let overlay = this.overlay;
            let that = this;
            $('div.referencebrowser a', overlay.elem).each(function() {
                let link = $(this);
                if (link.attr('ajax:target')) {
                    that.set_selected_on_ajax_target(link, selected);
                }
            });
        }
        set_selected_on_ajax_target(elem, selected) {
            let target = ts.ajax.parse_target(elem.attr('ajax:target'));
            target.params.selected = selected.join(',');
            let query = new Array();
            for (let name in target.params) {
                query.push(name + '=' + target.params[name]);
            }
            elem.attr('ajax:target', target.url + '?' + query.join('&'));
        }
    }
    class AddReferenceHandle extends ReferenceHandle {
        constructor(elem, target, overlay) {
            super(elem, target, overlay);
            elem.off('click').on('click', this.add_reference.bind(this));
        }
        add_reference(evt) {
            evt.preventDefault();
            let elem = this.elem;
            let target = this.target;
            let uid = elem.attr('id');
            uid = uid.substring(4, uid.length);
            let label = $('.reftitle', elem.parent()).html();
            if (this.single_value()) {
                target.attr('value', label);
                let sel = '[name="' + target.attr('name') + '.uid"]';
                $(sel).attr('value', uid);
                this.set_selected_on_ajax_target(target.parent(), [uid]);
                this.overlay.close();
                return;
            }
            if (this.multi_value()) {
                if ($('[value="' + uid + '"]', target.parent()).length) {
                    return;
                }
                let option = $('<option></option>');
                option.val(uid).html(label).attr('selected', 'selected');
                target.append(option);
                target.trigger('change');
            }
            this.reset_selected(target);
            this.toggle_enabled(elem);
        }
    }
    class RemoveReferenceHandle extends ReferenceHandle {
        constructor(elem, target, overlay) {
            super(elem, target, overlay);
            elem.off('click').on('click', this.remove_reference.bind(this));
        }
        remove_reference(evt) {
            evt.preventDefault();
            let elem = this.elem;
            let target = this.target;
            let uid = elem.attr('id');
            uid = uid.substring(4, uid.length);
            if (this.single_value()) {
                target.attr('value', '');
                let sel = '[name="' + target.attr('name') + '.uid"]';
                $(sel).attr('value', '');
            }
            if (this.multi_value()) {
                let sel = '[value="' + uid + '"]';
                if (!$(sel, target.parent()).length) {
                    return;
                }
                $(sel, target).remove();
                target.trigger('change');
            }
            this.reset_selected(target);
            this.toggle_enabled(elem);
        }
    }
    class ReferenceBrowserLoader {
        static initialize(context) {
            $('.referencebrowser_trigger', context).each(function() {
                new ReferenceBrowserLoader($(this));
            });
        }
        constructor(elem) {
            this.wrapper = elem.parent();
            let sel = `[name="${elem.data('reference-name')}"]`;
            this.target = $(sel, this.wrapper);
            elem.off('click').on('click', this.load_ref_browser.bind(this));
        }
        load_ref_browser(evt) {
            evt.preventDefault();
            let ol = ts.ajax.overlay({
                action: 'referencebrowser',
                target: this.wrapper.attr('ajax:target'),
                on_complete: this.on_complete.bind(this)
            });
            ol.ref_target = this.target;
        }
        on_complete(inst) {
            let target = this.target;
            $('a.addreference', inst.elem).each(function() {
                new AddReferenceHandle($(this), target, inst);
            });
            $('a.removereference', inst.elem).each(function() {
                new RemoveReferenceHandle($(this), target, inst);
            });
        }
    }
    function referencebrowser_on_array_add(inst, context) {
        ReferenceBrowserLoader.initialize(context);
    }
    function referencebrowser_on_array_index(inst, row, index) {
        $('.referencebrowser_trigger', row).each(function() {
            let trigger = $(this),
                ref_name = trigger.data('reference-name'),
                base_id = inst.base_id,
                base_name = base_id.replace(/\-/g, '.');
            trigger.data('reference-name', inst.set_value_index(
                ref_name,
                base_name,
                index,
                '.'
            ));
        });
    }
    $(function() {
        if (window.yafowil_array === undefined) {
            return;
        }
        yafowil_array.on_array_event('on_add', referencebrowser_on_array_add);
        yafowil_array.on_array_event('on_index', referencebrowser_on_array_index);
    });

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

    class TableToolbar {
        static initialize(context) {
            BatchedItemsSize.initialize(context, '.table_length select');
            BatchedItemsSearch.initialize(context, '.table_filter input');
        }
    }

    class Translation {
        static initialize(context) {
            $('.translation-nav', context).each(function() {
                new Translation($(this));
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
    }

    class Colormode {
        static initialize(context) {
            new Colormode(context);
        }
        constructor(context) {
            this.elem = $('#colortoggle-switch', context);
            this.compile();
            this.set_theme(this.preferred_theme);
            this.elem.on('change', (c) => {
                if (this.elem.is(':checked')) {
                    this.set_theme('dark');
                } else {
                    this.set_theme('light');
                }
            });
        }
        get stored_theme() {
            return localStorage.getItem('bootstrap-theme') || null;
        }
        get preferred_theme() {
            if (this.stored_theme) {
                return this.stored_theme;
            }
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        compile() {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (this.stored_theme !== 'light' || this.stored_theme !== 'dark') {
                  this.set_theme(this.preferred_theme);
                }
            });
        }
        set_theme(theme) {
            if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
              document.documentElement.setAttribute('data-bs-theme', 'dark');
              this.elem.trigger('click');
            } else {
              document.documentElement.setAttribute('data-bs-theme', theme);
            }
            localStorage.setItem('bootstrap-theme', theme);
            if (theme === 'dark' && !this.elem.is(':checked')) {
                this.elem.trigger('click');
            }
        }
    }

    class Scrollbar extends ts.Events {
        static initialize(context) {
            $('.scrollable-x', context).each(function() {
                new ScrollbarX($(this));
            });
            $('.scrollable-y', context).each(function() {
                new ScrollbarY($(this));
            });
        }
        constructor(elem) {
            super();
            this.elem = elem;
            this.elem.data('scrollbar', this);
            this.content = $('.scrollable-content', this.elem);
            this.position = 0;
            this.unit = 50;
            this.disabled = null;
            this.on_scroll = this.on_scroll.bind(this);
            this.on_click = this.on_click.bind(this);
            this.on_drag = this.on_drag.bind(this);
            this.on_hover = this.on_hover.bind(this);
            this.on_resize = this.on_resize.bind(this);
            ts.ajax.attach(this, this.elem);
            this.compile();
            this.bind();
            ts.clock.schedule_frame(() => this.update());
        }
        bind() {
            this.disabled = false;
            this.elem.on('mousewheel wheel', this.on_scroll);
            this.scrollbar.on('click', this.on_click);
            this.thumb.on('mousedown', this.on_drag);
            this.elem.on('mouseenter mouseleave', this.on_hover);
            $(window).on('resize', this.on_resize);
        }
        disable() {
            this.disabled = true;
            this.elem.off('mousewheel wheel', this.on_scroll);
            this.scrollbar.off('click', this.on_click);
            this.thumb.off('mousedown', this.on_drag);
            this.elem.off('mouseenter mouseleave', this.on_hover);
            $(window).off('resize', this.on_resize);
        }
        destroy() {
            $(window).off('resize', this.on_resize);
        }
        compile() {
            ts.compile_template(this, `
        <div class="scrollbar" t-elem="scrollbar">
          <div class="scroll-handle" t-elem="thumb">
          </div>
        </div>
        `, this.elem);
        }
        update() {
            throw 'Abstract Scrollbar does not implement update()';
        }
        update(attr) {
            this.scrollbar.css(attr, this.scrollsize);
            if(this.contentsize <= this.scrollsize) {
                this.thumbsize = this.scrollsize;
            } else {
                this.thumbsize = Math.pow(this.scrollsize, 2) / this.contentsize;
            }
            this.thumb.css(attr, this.thumbsize);
            this.set_position();
        }
        reset() {
            this.position = 0;
            this.set_position();
        }
        unload() {
            this.scrollbar.off('click', this.on_click);
            this.elem.off('mousewheel wheel', this.on_scroll);
            this.elem.off('mouseenter mouseleave', this.on_hover);
            this.thumb.off('mousedown', this.on_drag);
        }
        on_hover(e) {
            e.preventDefault();
            e.stopPropagation();
            const container = this.elem.get(0);
            const is_inside_container = $(container).has(e.target).length > 0 || $(container).is(e.target);
            if (is_inside_container && this.contentsize > this.scrollsize) {
                if (e.type === 'mouseenter') {
                    this.scrollbar.stop(true, true).fadeIn();
                } else if (e.type === 'mouseleave') {
                    if (e.relatedTarget !== this.elem.get(0)) {
                        this.scrollbar.stop(true, true).fadeOut();
                    }
                }
            }
        }
        on_scroll(e) {
            if (this.contentsize <= this.scrollsize) {
                return;
            }
            let evt = e.originalEvent;
            if (typeof evt.deltaY === 'number') {
                if(evt.deltaY > 0) {
                    this.position += this.unit;
                }
                else if(evt.deltaY < 0) {
                    this.position -= this.unit;
                }
            }
            this.set_position();
        }
        prevent_overflow() {
            let threshold = this.contentsize - this.scrollsize;
            if(this.position >= threshold) {
                this.position = threshold;
            } else if(this.position <= 0) {
                this.position = 0;
            }
        }
        on_click(e) {
            e.preventDefault();
            this.thumb.addClass('active');
            let evt_data = this.get_evt_data(e),
                new_thumb_pos = evt_data - this.offset - this.thumbsize / 2;
            this.position = this.contentsize * new_thumb_pos / this.scrollsize;
            this.set_position();
            this.thumb.removeClass('active');
        }
        on_drag(e) {
            e.preventDefault();
            var evt = $.Event('dragstart');
            $(window).trigger(evt);
            function on_move(e) {
                let mouse_pos_on_move = this.get_evt_data(e) - this.offset,
                    new_thumb_pos = thumb_position + mouse_pos_on_move - mouse_pos;
                this.position = this.contentsize * new_thumb_pos / this.scrollsize;
                this.set_position();
            }
            function on_up() {
                var evt = $.Event('dragend');
                $(window).trigger(evt);
                $(document)
                    .off('mousemove', _on_move)
                    .off('mouseup', _on_up);
                this.thumb.removeClass('active');
                this.elem.on('mouseenter mouseleave', this.on_hover);
            }
            let _on_move = on_move.bind(this),
                _on_up = on_up.bind(this),
                mouse_pos = this.get_evt_data(e) - this.offset,
                thumb_position = this.position / (this.contentsize / this.scrollsize);
            this.thumb.addClass('active');
            this.elem.off('mouseenter mouseleave', this.on_hover);
            $(document)
                .on('mousemove', _on_move)
                .on('mouseup', _on_up);
        }
    }
    class ScrollbarX extends Scrollbar {
        get offset() {
            return this.elem.offset().left;
        }
        get contentsize() {
            return this.content.outerWidth();
        }
        get scrollsize() {
            return this.elem.outerWidth();
        }
        compile() {
            super.compile();
            this.thumb.css('height', '6px');
            this.scrollbar
                .css('height', '6px')
                .css('width', this.scrollsize);
            this.thumbsize = this.scrollsize / (this.contentsize / this.scrollsize);
            this.thumb.css('width', this.thumbsize);
        }
        update() {
            super.update('width');
        }
        on_resize() {
            this.update();
        }
        set_position() {
            this.prevent_overflow();
            let thumb_pos = this.position / (this.contentsize / this.scrollsize);
            this.content.css('right', this.position + 'px');
            this.thumb.css('left', thumb_pos + 'px');
            this.trigger('on_position');
        }
        get_evt_data(e) {
            return e.pageX;
        }
    }class ScrollbarY extends Scrollbar {
        get offset() {
            return this.elem.offset().top;
        }
        get contentsize() {
            return this.content.outerHeight();
        }
        get scrollsize() {
            return this.elem.outerHeight();
        }
        compile() {
            super.compile();
            this.thumb.css('width', '6px');
            this.scrollbar
                .css('width', '6px')
                .css('top', '0px')
                .css('height', this.scrollsize);
            this.thumbsize = this.scrollsize / (this.contentsize / this.scrollsize);
            this.thumb.css('height', this.thumbsize);
        }
        update() {
            super.update('height');
        }
        on_resize() {
            this.update();
        }
        set_position() {
            this.prevent_overflow();
            let thumb_pos = this.position / (this.contentsize / this.scrollsize);
            this.content.css('bottom', this.position + 'px');
            this.thumb.css('top', thumb_pos + 'px');
            this.trigger('on_position');
        }
        get_evt_data(e) {
            return e.pageY;
        }
    }

    class Sidebar extends ts.Motion {
        static initialize(context) {
            new Sidebar(context);
        }
        constructor(context) {
            super();
            this.elem = $('#sidebar_left', context);
            this.resizer_elem = $('#sidebar_resizer', context);
            this.collapse_elem = $('#sidebar_collapse', context);
            this.on_click = this.on_click.bind(this);
            this.collapse_elem.on('click', this.on_click);
            const sidebar_width = localStorage.getItem('cone.app.sidebar_width') || 300;
            this.elem.css('width', sidebar_width + 'px');
            const pad_left = $('.scrollable-content', this.elem).css('padding-left');
            const pad_right = $('.scrollable-content', this.elem).css('padding-right');
            const logo_width = $('#header-logo').outerWidth(true);
            this.elem.css(
                'min-width',
                `calc(${logo_width}px + ${pad_left} + ${pad_right})`
            );
            this.set_scope(this.resizer_elem, $(document));
        }
        get collapsed() {
            return this.elem.css('width') === '0px';
        }
        on_click(evt) {
            if (this.collapsed) {
                this.expand();
            } else {
                this.collapse();
            }
        }
        collapse() {
            this.elem.removeClass('expanded');
            this.elem.addClass('collapsed');
        }
        expand() {
            this.elem.removeClass('collapsed');
            this.elem.addClass('expanded');
        }
        move(evt) {
            $('.scrollable-y', this.elem).css('pointer-events', 'none');
            if (evt.pageX <= 115) {
                evt.pageX = 115;
            }
            this.sidebar_width = parseInt(evt.pageX);
            this.elem.css('width', this.sidebar_width);
        }
        up(evt) {
            $('.scrollable-y', this.elem).css('pointer-events', 'all');
            localStorage.setItem(
                'cone.app.sidebar_width',
                this.sidebar_width
            );
        }
    }

    class Header extends ts.Events {
        static initialize(context) {
            new Header(context);
        }
        constructor(context) {
            super();
            this.elem = $('#header-main', context);
            this.header_tools = $('#header-tools', this.elem);
            this.navbar_content = $('#navbar-content', this.elem);
            this.header_content = $('#header-content', this.elem);
            this.scrollable = $('.scrollable-x', this.elem);
            this.place_elements = this.place_elements.bind(this);
            $(window).on('resize', this.place_elements);
            this.place_elements();
            ts.ajax.attach(this, this.elem);
        }
        destroy() {
            $(window).off('resize', this.place_elements);
        }
        place_elements() {
            const window_width = $(window).width();
            const window_sm = window_width <= 576;
            const window_lg = window_width <= 992;
            const in_navbar_content = $('#header-tools', this.navbar_content).length > 0;
            if (window_sm) {
                if (!in_navbar_content) {
                    this.header_tools.detach().appendTo(this.navbar_content);
                }
            } else if (in_navbar_content) {
                this.header_tools.detach().prependTo(this.header_content);
                $(".dropdown-menu.show").removeClass('show');
            }
            if (window_lg) {
                this.disable_horizontal_scrolling();
            } else {
                this.navbar_content.removeClass('show');
                this.enable_horizontal_scrolling();
            }
        }
        disable_horizontal_scrolling() {
            this.scrollable.each((i, item) => {
                const scrollbar = $(item).data('scrollbar');
                if (!scrollbar.disabled) {
                    scrollbar.reset();
                    scrollbar.disable();
                }
            });
        }
        enable_horizontal_scrolling() {
            this.scrollable.each((i, item) => {
                const scrollbar = $(item).data('scrollbar');
                if (scrollbar.disabled) {
                    scrollbar.bind();
                }
            });
        }
    }

    class Selectable {
        constructor(options) {
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
            let selected = container.children('.selected');
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
    $.fn.selectable = function(options) {
        var api = new Selectable(options);
        api.bind(this);
        this.data('selectable', api);
        return this;
    };

    function createCookie(name, value, days) {
        ts.deprecate('createCookie', 'ts.create_cookie', '1.1');
        ts.create_cookie(name, value, days);
    }
    function readCookie(name) {
        ts.deprecate('readCookie', 'ts.read_cookie', '1.1');
        return ts.read_cookie(name);
    }

    $(function() {
        new KeyBinder();
        ts.ajax.register(BatchedItemsSize.initialize, true);
        ts.ajax.register(BatchedItemsSearch.initialize, true);
        ts.ajax.register(CopySupport.initialize, true);
        ts.ajax.register(ReferenceBrowserLoader.initialize, true);
        ts.ajax.register(ReferenceHandle.initialize, true);
        ts.ajax.register(Sharing.initialize, true);
        ts.ajax.register(TableToolbar.initialize, true);
        ts.ajax.register(Translation.initialize, true);
        ts.ajax.register(Colormode.initialize, true);
        ts.ajax.register(Scrollbar.initialize, true);
        ts.ajax.register(Sidebar.initialize, true);
        ts.ajax.register(Header.initialize, true);
    });

    exports.AddReferenceHandle = AddReferenceHandle;
    exports.BatchedItemsFilter = BatchedItemsFilter;
    exports.BatchedItemsSearch = BatchedItemsSearch;
    exports.BatchedItemsSize = BatchedItemsSize;
    exports.Colormode = Colormode;
    exports.CopySupport = CopySupport;
    exports.Header = Header;
    exports.KeyBinder = KeyBinder;
    exports.ReferenceBrowserLoader = ReferenceBrowserLoader;
    exports.ReferenceHandle = ReferenceHandle;
    exports.RemoveReferenceHandle = RemoveReferenceHandle;
    exports.Scrollbar = Scrollbar;
    exports.ScrollbarX = ScrollbarX;
    exports.ScrollbarY = ScrollbarY;
    exports.Selectable = Selectable;
    exports.Sharing = Sharing;
    exports.Sidebar = Sidebar;
    exports.TableToolbar = TableToolbar;
    exports.Translation = Translation;
    exports.batcheditems_filter_binder = batcheditems_filter_binder;
    exports.batcheditems_handle_filter = batcheditems_handle_filter;
    exports.batcheditems_size_binder = batcheditems_size_binder;
    exports.createCookie = createCookie;
    exports.keys = keys;
    exports.readCookie = readCookie;

    Object.defineProperty(exports, '__esModule', { value: true });


    window.cone = window.cone || {};
    Object.assign(window.cone, exports);

    window.createCookie = createCookie;
    window.readCookie = readCookie;


    return exports;

})({}, jQuery, treibstoff);

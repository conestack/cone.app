var cone = (function (exports, $, ts) {
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

    class ColorMode {
        static get media_query() {
            return window.matchMedia('(prefers-color-scheme: dark)');
        }
        static get stored_theme() {
            return localStorage.getItem('cone-app-color-theme');
        }
        static set stored_theme(theme) {
            localStorage.setItem('cone-app-color-theme', theme);
        }
        static get preferred_theme() {
            if (this.stored_theme) {
                return this.stored_theme;
            }
            return this.media_query.matches ? 'dark' : 'light';
        }
        static watch(handle) {
            this.media_query.addEventListener('change', handle);
        }
        static set_theme(theme) {
            const elem = document.documentElement;
            if (theme === 'auto' && this.media_query.matches) {
                elem.setAttribute('data-bs-theme', 'dark');
            } else {
                elem.setAttribute('data-bs-theme', theme);
            }
        }
        constructor() {
            this.bind();
            ColorMode.set_theme(ColorMode.preferred_theme);
        }
        bind() {
            ColorMode.watch(() => {
                const stored_theme = this.stored_theme;
                if (stored_theme !== 'light' || stored_theme !== 'dark') {
                    ColorMode.set_theme(ColorMode.preferred_theme);
                }
            });
        }
    }
    class ColorToggler extends ts.ChangeListener {
        static initialize(context) {
            const elem = ts.query_elem('#colortoggle-switch', context);
            if (!elem) {
                return;
            }
            new ColorToggler(elem);
        }
        constructor(elem) {
            super({elem: elem});
            this.update();
            ColorMode.watch(() => {
                this.update();
            });
        }
        update() {
            const preferred_theme = ColorMode.preferred_theme;
            const elem = this.elem;
            const checked = elem.is(':checked');
            if (preferred_theme === 'dark' && !checked) {
                elem.prop('checked', true);
            } else if (preferred_theme === 'light' && checked) {
                elem.prop('checked', false);
            }
        }
        on_change() {
            const theme = this.elem.is(':checked') ? 'dark' : 'light';
            ColorMode.set_theme(theme);
            ColorMode.stored_theme = theme;
        }
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

    class LiveSearch {
        static initialize(context, factory=null) {
            const elem = ts.query_elem('input#search-text', context);
            if (!elem) {
                return;
            }
            if (factory === null) {
                factory = cone.LiveSearch;
            }
            new factory(elem);
        }
        constructor(elem) {
            this.elem = elem;
            this.target = `${elem.data('search-target')}/livesearch`;
            this.content = $('#content');
            this.result = null;
            this._term = '';
            this._minlen = 3;
            this._delay = 250;
            this._timeout_event = null;
            this._in_progress = false;
            this.on_keydown = this.on_keydown.bind(this);
            this.on_change = this.on_change.bind(this);
            this.on_result = this.on_result.bind(this);
            elem.on('keydown', this.on_keydown);
            elem.on('change', this.on_change);
        }
        search() {
            this._in_progress = true;
            ts.http_request({
                url: this.target,
                params: {term: this._term},
                type: 'json',
                success: this.on_result
            });
            this._in_progress = false;
        }
        render_no_results() {
            ts.compile_template(this, `
        <h5 class="card-title">No search results</h5>
        `, this.result);
        }
        render_suggestion(item) {
            ts.compile_template(this, `
        <div class="mb-4">
          <h5 class="card-title">
            <a href="${item.target}"
               ajax:bind="click"
               ajax:event="contextchanged:#layout"
               ajax:target="${item.target}">
              <i class="${item.icon}"></i>
              ${item.value}
            </a>
          </h5>
          <p class="card-text">
            ${item.description === undefined ? '' : item.description}
          </p>
        </div>
        `, this.result);
        }
        on_result(data, status, request) {
            this.content.empty();
            ts.compile_template(this, `
        <div class="card mt-2">
          <div class="card-body" t-elem="result">
            <h3 class="card-title mb-3">Search results for "${this._term}"</h3>
          </div>
        </div>
        `, this.content);
            if (!data.length) {
                this.render_no_results();
            } else {
                ts.compile_template(this, `
            <p class="card-text mb-3">
              <span>${data.length} Results</span>
            </p>
            `, this.result);
                for (const item of data) {
                    this.render_suggestion(item);
                }
            }
            this.result.tsajax();
        }
        on_keydown(evt) {
            if (evt.keyCode === 13) {
                return;
            }
            ts.clock.schedule_frame(() => {
                if (this._term !== this.elem.val()) {
                    this.elem.trigger('change');
                }
            });
        }
        on_change(evt) {
            if (this._in_progress) {
                return;
            }
            const term = this.elem.val();
            if (this._term === term) {
                return;
            }
            this._term = term;
            if (this._term.length < this._minlen) {
                return;
            }
            if (this._timeout_event !== null) {
                this._timeout_event.cancel();
            }
            this._timeout_event = ts.clock.schedule_timeout(() => {
                this._timeout_event = null;
                this.search();
            }, this._delay);
        }
    }

    class GlobalEvents extends ts.Events {
        on_sidebar_resize(inst) {
        }
        on_header_mode_toggle(inst) {
        }
    }
    const global_events = new GlobalEvents();

    class PersonalTools extends ts.Events {
        static initialize(context) {
            const elem = ts.query_elem('#header-main', context);
            if (!elem) {
                return;
            }
            new PersonalTools(elem);
        }
        constructor(elem) {
            super();
            this.elem = elem;
            this.personal_tools = ts.query_elem('#personaltools', elem);
            this.navbar_content = ts.query_elem('#navbar-content', elem);
            this.header_content = ts.query_elem('#header-content', elem);
            this.scrollbar = ts.query_elem('.scrollable-x', elem).data('scrollbar');
            this.render = this.render.bind(this);
            $(window).on('resize', this.render);
            this.on_sidebar_resize = this.on_sidebar_resize.bind(this);
            global_events.on('on_sidebar_resize', this.on_sidebar_resize);
            this.render();
            ts.ajax.attach(this, elem);
        }
        destroy() {
            $(window).off('resize', this.render);
            global_events.off('on_sidebar_resize', this.on_sidebar_resize);
        }
        on_sidebar_resize(inst) {
            this.scrollbar.render();
            this.scrollbar.position = this.scrollbar.position;
        }
        render() {
            const window_width = $(window).width();
            const window_sm = window_width <= 576;
            const window_lg = window_width <= 992;
            const navbar_content = this.navbar_content;
            const in_navbar_content = ts.query_elem(
                '#personaltools',
                navbar_content
            ) !== null;
            if (window_sm) {
                if (!in_navbar_content) {
                    this.personal_tools.detach().appendTo(navbar_content);
                }
            } else if (in_navbar_content) {
                this.personal_tools.detach().prependTo(this.header_content);
                $(".dropdown-menu.show").removeClass('show');
            }
            if (window_lg) {
                this.disable_scrolling();
            } else {
                navbar_content.removeClass('show');
                this.enable_scrolling();
            }
        }
        disable_scrolling() {
            const scrollbar = this.scrollbar;
            if (!scrollbar.disabled) {
                scrollbar.position = 0;
                scrollbar.disabled = true;
            }
        }
        enable_scrolling() {
            const scrollbar = this.scrollbar;
            if (scrollbar.disabled) {
                scrollbar.disabled = false;
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

    class Scrollbar extends ts.Motion {
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
            if (this.elem.data('scrollbar')) {
                console.warn('cone.app: Only one Scrollbar can be bound to each element.');
                return;
            }
            this.elem.data('scrollbar', this);
            this.content = ts.query_elem('> .scrollable-content', elem);
            this.on_scroll = this.on_scroll.bind(this);
            this.on_click = this.on_click.bind(this);
            this.on_hover = this.on_hover.bind(this);
            this.on_resize = this.on_resize.bind(this);
            this.compile();
            this.position = 0;
            this.scroll_step = 50;
            new ts.Property(this, 'disabled', false);
            ts.ajax.attach(this, this.elem);
            ts.clock.schedule_frame(() => this.render());
            const is_mobile = $(window).width() <= 768;
            new ts.Property(this, 'is_mobile', is_mobile);
        }
        get position() {
            return this._position || 0;
        }
        set position(position) {
            this._position = this.safe_position(position);
            this.update();
            this.trigger('on_position', this._position);
        }
        get pointer_events() {
            return this.elem.css('pointer-events') === 'all';
        }
        set pointer_events(value) {
            this.elem.css('pointer-events', value ? 'all' : 'none');
        }
        on_is_mobile(val) {
            if (val && this.contentsize > this.scrollsize) {
                this.scrollbar.stop(true, true).show();
                this.elem.off('mouseenter mouseleave', this.on_hover);
            } else {
                this.scrollbar.stop(true, true).hide();
                this.elem.on('mouseenter mouseleave', this.on_hover);
            }
        }
        bind() {
            this.pointer_events = true;
            this.elem.on('mousewheel wheel', this.on_scroll);
            this.scrollbar.on('click', this.on_click);
            this.set_scope(this.thumb, $(document), this.elem);
            $(window).on('resize', this.on_resize);
        }
        unbind() {
            this.elem.off('mousewheel wheel', this.on_scroll);
            this.elem.off('mouseenter mouseleave', this.on_hover);
            this.scrollbar.off('click', this.on_click);
            $(this.thumb).off('mousedown', this._down_handle);
            $(window).off('resize', this.on_resize);
        }
        destroy() {
            this.unbind();
            this.scrollbar.remove();
            this.elem.data('scrollbar', null);
        }
        compile() {
            ts.compile_template(this, `
        <div class="scrollbar" t-elem="scrollbar">
          <div class="scroll-handle" t-elem="thumb">
          </div>
        </div>
        `, this.elem);
        }
        render(attr) {
            this.scrollbar.css(attr, this.scrollsize);
            if (this.contentsize <= this.scrollsize) {
                this.thumbsize = this.scrollsize;
            } else {
                this.thumbsize = Math.pow(this.scrollsize, 2) / this.contentsize;
            }
            this.thumb.css(attr, this.thumbsize);
            this.update();
        }
        safe_position(position) {
            if (this.contentsize <= this.scrollsize) {
                return position;
            }
            const max_pos = this.contentsize - this.scrollsize;
            if (position >= max_pos) {
                position = max_pos;
            } else if (position <= 0) {
                position = 0;
            }
            return position;
        }
        on_disabled(value) {
            if (value) {
                this.unbind();
            } else {
                this.bind();
            }
        }
        on_resize() {
            this.is_mobile = $(window).width() <= 768;
            this.render();
        }
        on_hover(evt) {
            evt.preventDefault();
            evt.stopPropagation();
            const elem = this.elem;
            if (
                (elem.has(evt.target).length > 0 || elem.is(evt.target)) &&
                this.contentsize > this.scrollsize
            ) {
                if (evt.type === 'mouseenter') {
                    this.scrollbar.stop(true, true).fadeIn();
                } else if (
                    evt.type === 'mouseleave' &&
                    evt.relatedTarget !== elem.get(0)
                ) {
                    this.scrollbar.stop(true, true).fadeOut();
                }
            }
        }
        on_scroll(evt) {
            if (this.contentsize <= this.scrollsize) {
                return;
            }
            let evt_ = evt.originalEvent;
            if (typeof evt_.deltaY === 'number') {
                if (evt_.deltaY > 0) {
                    this.position += this.scroll_step;
                } else if (evt_.deltaY < 0) {
                    this.position -= this.scroll_step;
                }
            }
        }
        on_click(evt) {
            evt.preventDefault();
            this.thumb.addClass('active');
            let position = this.pos_from_evt(evt),
                thumb_pos = position - this.offset - this.thumbsize / 2;
            this.position = this.contentsize * thumb_pos / this.scrollsize;
            this.thumb.removeClass('active');
        }
        touchstart(evt) {
            const touch = evt.originalEvent.touches[0];
            this._touch_start_y = touch.pageY;
            this._start_position = this.position;
        }
        touchmove(evt) {
            if (this.contentsize <= this.scrollsize) {
                return;
            }
            const touch = evt.originalEvent.touches[0];
            const deltaY = touch.pageY - this._touch_start_y;
            this.position = this._start_position - deltaY;
        }
        touchend(evt) {
            delete this._touch_start_y;
            delete this._start_position;
        }
        down(evt) {
            this._mouse_pos = this.pos_from_evt(evt) - this.offset;
            this._thumb_pos = this.position / (this.contentsize / this.scrollsize);
            this.elem.off('mouseenter mouseleave', this.on_hover);
            this.thumb.addClass('active');
        }
        move(evt) {
            let mouse_pos = this.pos_from_evt(evt) - this.offset,
                thumb_pos = this._thumb_pos + mouse_pos - this._mouse_pos;
            this.position = this.contentsize * thumb_pos / this.scrollsize;
        }
        up(evt) {
            delete this._mouse_pos;
            delete this._thumb_pos;
            this.elem.on('mouseenter mouseleave', this.on_hover);
            this.thumb.removeClass('active');
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
        render() {
            super.render('width');
        }
        update() {
            let thumb_pos = this.position / (this.contentsize / this.scrollsize);
            this.content.css('right', this.position + 'px');
            this.thumb.css('left', thumb_pos + 'px');
        }
        pos_from_evt(e) {
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
        render() {
            super.render('height');
        }
        update() {
            let thumb_pos = this.position / (this.contentsize / this.scrollsize);
            this.content.css('bottom', this.position + 'px');
            this.thumb.css('top', thumb_pos + 'px');
        }
        pos_from_evt(e) {
            return e.pageY;
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

    class Sidebar extends ts.Motion {
        static initialize(context) {
            const elem = ts.query_elem('#sidebar_left', context);
            if (!elem) {
                return;
            }
            new Sidebar(elem);
        }
        constructor(elem) {
            super();
            this.elem = elem;
            elem.css('width', this.sidebar_width + 'px');
            this.scrollbar = ts.query_elem('.scrollable-y', elem).data('scrollbar');
            const scrollable_content = ts.query_elem('.scrollable-content', elem);
            const pad_left = scrollable_content.css('padding-left');
            const pad_right = scrollable_content.css('padding-right');
            const logo_width = $('#header-logo').outerWidth(true);
            elem.css(
                'min-width',
                `calc(${logo_width}px + ${pad_left} + ${pad_right})`
            );
            this.on_click = this.on_click.bind(this);
            const collapse_elem = ts.query_elem('#sidebar_collapse', elem);
            collapse_elem.on('click', this.on_click);
            const resizer_elem = ts.query_elem('#sidebar_resizer', elem);
            this.set_scope(resizer_elem, $(document));
            $('html, body').css('overscroll-behavior', 'auto');
        }
        get sidebar_width() {
            return localStorage.getItem('cone-app-sidebar-width') || 300;
        }
        set sidebar_width(width) {
            localStorage.setItem('cone-app-sidebar-width', width);
        }
        get collapsed() {
            return this.elem.css('width') === '0px';
        }
        collapse() {
            $('html, body').css('overscroll-behavior', 'auto');
            this.elem
                .removeClass('expanded')
                .addClass('collapsed');
            global_events.trigger('on_sidebar_resize', this);
        }
        expand() {
            $('html, body').css('overscroll-behavior', 'none');
            this.elem
                .removeClass('collapsed')
                .addClass('expanded');
            global_events.trigger('on_sidebar_resize', this);
        }
        on_click(evt) {
            if (this.collapsed) {
                this.expand();
            } else {
                this.collapse();
            }
        }
        move(evt) {
            this.scrollbar.pointer_events = false;
            if (evt.pageX <= 115) {
                evt.pageX = 115;
            }
            this.sidebar_width = parseInt(evt.pageX);
            this.elem.css('width', this.sidebar_width);
            global_events.trigger('on_sidebar_resize', this);
        }
        up() {
            this.scrollbar.pointer_events = true;
            global_events.trigger('on_sidebar_resize', this);
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
            $('div.invalid-feedback', nav_elem.parent()).show();
            this.nav_elem = nav_elem;
            this.fields_elem = nav_elem.next();
            this.show_lang_handle = this.show_lang_handle.bind(this);
            $('li > a', nav_elem).on('click', this.show_lang_handle);
            if ($('li.error', nav_elem).length) {
                $('li.error:first > a', nav_elem).trigger('click');
            } else {
                $('li > a.active', nav_elem).trigger('click');
            }
            this.fields_elem.show();
        }
        show_lang_handle(evt) {
            evt.preventDefault();
            $('li > a', this.nav_elem).removeClass('active');
            this.fields_elem.children().hide();
            let elem = $(evt.currentTarget);
            elem.addClass('active');
            $(elem.attr('href'), this.fields_elem).show();
        }
    }

    class MainMenu extends ts.Events {
        static initialize(context) {
            const elem = ts.query_elem('#mainmenu', context);
            if (!elem) {
                return;
            }
            new MainMenu(elem);
        }
        constructor(elem) {
            super();
            this.elem = elem;
            this.height = this.elem.outerHeight();
            this.scrollbar = elem.data('scrollbar');
            this.elems = $('.nav-link.dropdown-toggle', elem);
            this.navbar_toggler = ts.query_elem('.navbar-toggler[data-bs-target="#navbar-content-wrapper"]', $('body'));
            this.navbar_content_wrapper = ts.query_elem('#navbar-content-wrapper', $('body'));
            this.open_dropdown = null;
            ts.ajax.attach(this, elem);
            this.on_show_dropdown_desktop = this.on_show_dropdown_desktop.bind(this);
            this.on_hide_dropdown_desktop = this.on_hide_dropdown_desktop.bind(this);
            this.hide_dropdowns = this.hide_dropdowns.bind(this);
            this.scrollbar.on('on_position', this.hide_dropdowns);
            this.on_header_mode_toggle = this.on_header_mode_toggle.bind(this);
            global_events.on('on_header_mode_toggle', this.on_header_mode_toggle);
        }
        on_header_mode_toggle(inst, header) {
            this.hide_dropdowns();
            if (header.is_compact) {
                this.scrollbar.off('on_position', this.hide_dropdowns);
                this.bind_dropdowns_mobile(header);
            } else {
                this.bind_dropdowns_desktop(header);
                this.scrollbar.on('on_position', this.hide_dropdowns);
            }
        }
        on_show_dropdown_desktop(evt) {
            const el = evt.target;
            this.open_dropdown = el;
            this.elem.css('height', '200vh');
            const dropdown = $(el).siblings('ul.dropdown-menu');
            dropdown.css({
                top: `${this.height}px`,
                left: `${$(el).offset().left}px`
            });
        }
        on_hide_dropdown_desktop(evt) {
            const el = evt.target;
            if (this.open_dropdown !== el) {
                return;
            }
            this.elem.css('height', '100%');
            this.open_dropdown = null;
        }
        bind_dropdowns_desktop(header) {
            this.elems.each((i, el) => {
                $(el).on('shown.bs.dropdown', this.on_show_dropdown_desktop);
                $(el).on('hidden.bs.dropdown', this.on_hide_dropdown_desktop);
                $(el).off('shown.bs.dropdown', header.render_scrollbar.bind(header));
                $(el).off('hidden.bs.dropdown', header.render_scrollbar.bind(header));
            });
        }
        bind_dropdowns_mobile(header) {
            this.elems.each((i, el) => {
                $(el).off('shown.bs.dropdown', this.on_show_dropdown_desktop);
                $(el).off('hidden.bs.dropdown', this.on_hide_dropdown_desktop);
                $(el).on('shown.bs.dropdown', header.render_scrollbar.bind(header));
                $(el).on('hidden.bs.dropdown', header.render_scrollbar.bind(header));
            });
        }
        hide_dropdowns() {
            this.elems.each((i, el) => {
                $(el).dropdown('hide');
            });
        }
    }

    class Header extends ts.Events {
        static initialize(context) {
            const elem = ts.query_elem('#header-main', context);
            if (!elem) {
                return;
            }
            new Header(elem);
        }
        constructor(elem) {
            super();
            this.elem = elem;
            this.logo_placeholder = ts.query_elem('#header-logo-placeholder', elem);
            this.navbar_content_wrapper = $('#navbar-content-wrapper', elem);
            this.navbar_content = $('#navbar-content', elem);
            this.set_mode = this.set_mode.bind(this);
            global_events.on('on_sidebar_resize', this.set_mode);
            $(window).on('resize', this.set_mode);
            ts.ajax.attach(this, elem);
            const taken = $('#personaltools').outerWidth() + $('#header-logo').outerWidth();
            const is_compact = $(window).width() < 768 ||
                (this.elem.outerWidth() < taken + 500);
            new ts.Property(this, 'is_compact', is_compact);
            this.render_scrollbar = this.render_scrollbar.bind(this);
            this.fade_scrollbar = this.fade_scrollbar.bind(this);
            this.set_mode();
        }
        render_scrollbar() {
            if (this.is_compact && this.mobile_scrollbar) {
                this.mobile_scrollbar.render();
            }
        }
        fade_scrollbar() {
            if (!this.mobile_scrollbar.scrollbar.is(':visible')) {
                this.mobile_scrollbar.scrollbar.fadeIn('fast');
            }
            if (this.fade_out_timeout) {
                clearTimeout(this.fade_out_timeout);
            }
            this.fade_out_timeout = setTimeout(() => {
                this.mobile_scrollbar.scrollbar.fadeOut('slow');
            }, 700);
        }
        on_is_compact(val) {
            if (val) {
                console.log('header compact');
                this.elem.removeClass('full').removeClass('navbar-expand');
                this.elem.addClass('compact');
                this.logo_placeholder.hide();
                this.navbar_content.addClass('scrollable-content');
                this.mobile_scrollbar = new ScrollbarY(this.navbar_content_wrapper);
                this.mobile_scrollbar.on('on_position', this.fade_scrollbar);
                this.navbar_content_wrapper.on('shown.bs.collapse', () => {
                    $('html, body').css('overscroll-behavior', 'none');
                    this.mobile_scrollbar.render();
                });
                this.navbar_content_wrapper.on('hide.bs.collapse', () => {
                    $('html, body').css('overscroll-behavior', 'auto');
                    this.mobile_scrollbar.scrollbar.hide();
                });
                this.mainmenu = $('#mainmenu', this.elem).data();
            } else {
                console.log('header desktop');
                this.elem.removeClass('compact');
                this.elem.addClass('full').addClass('navbar-expand');
                this.logo_placeholder.show();
                this.navbar_content.removeClass('scrollable-content');
                if (this.mobile_scrollbar) {
                    this.mobile_scrollbar.off('on_position', this.fade_scrollbar);
                    this.mobile_scrollbar.destroy();
                    this.mobile_scrollbar = null;
                }
            }
            global_events.trigger('on_header_mode_toggle', this);
        }
        set_mode() {
            const taken = $('#personaltools').outerWidth() + $('#header-logo').outerWidth();
            this.is_compact = $(window).width() < 768 ||
                (this.elem.outerWidth() < taken + 500);
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
        new ColorMode();
        ts.ajax.register(BatchedItemsSize.initialize, true);
        ts.ajax.register(BatchedItemsSearch.initialize, true);
        ts.ajax.register(CopySupport.initialize, true);
        ts.ajax.register(ReferenceBrowserLoader.initialize, true);
        ts.ajax.register(ReferenceHandle.initialize, true);
        ts.ajax.register(Sharing.initialize, true);
        ts.ajax.register(TableToolbar.initialize, true);
        ts.ajax.register(Translation.initialize, true);
        ts.ajax.register(ColorToggler.initialize, true);
        ts.ajax.register(Scrollbar.initialize, true);
        ts.ajax.register(Sidebar.initialize, true);
        ts.ajax.register(PersonalTools.initialize, true);
        ts.ajax.register(LiveSearch.initialize, true);
        ts.ajax.register(MainMenu.initialize, true);
        ts.ajax.register(Header.initialize, true);
    });

    exports.AddReferenceHandle = AddReferenceHandle;
    exports.BatchedItemsFilter = BatchedItemsFilter;
    exports.BatchedItemsSearch = BatchedItemsSearch;
    exports.BatchedItemsSize = BatchedItemsSize;
    exports.ColorMode = ColorMode;
    exports.ColorToggler = ColorToggler;
    exports.CopySupport = CopySupport;
    exports.GlobalEvents = GlobalEvents;
    exports.Header = Header;
    exports.KeyBinder = KeyBinder;
    exports.LiveSearch = LiveSearch;
    exports.MainMenu = MainMenu;
    exports.PersonalTools = PersonalTools;
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
    exports.global_events = global_events;
    exports.keys = keys;
    exports.readCookie = readCookie;

    Object.defineProperty(exports, '__esModule', { value: true });


    window.createCookie = createCookie;
    window.readCookie = readCookie;


    return exports;

})({}, jQuery, treibstoff);

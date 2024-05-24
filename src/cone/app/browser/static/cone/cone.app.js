var cone = (function (exports, $$1, ts) {
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
            $$1(selector, context).each(function() {
                new BatchedItemsSize($$1(this));
            });
        }
        constructor(elem) {
            super(elem, 'size');
            elem.off('change').on('change', this.change_handle.bind(this));
        }
        change_handle(evt) {
            let option = $$1('option:selected', this.elem).first();
            this.set_filter(option.val());
        }
    }
    class BatchedItemsSearch extends BatchedItemsFilter {
        static initialize(context,
                          selector='.batched_items_filter input',
                          name='term') {
            $$1(selector, context).each(function() {
                new BatchedItemsSearch($$1(this), name);
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

    class Colormode extends ts.ChangeListener {
        static set_theme(theme, elem) {
            if (theme === 'auto' && this.match_media.matches) {
                elem.get(0).setAttribute('data-bs-theme', 'dark');
            } else {
                elem.get(0).setAttribute('data-bs-theme', theme);
            }
        }
        static get match_media() {
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
            return this.match_media.matches ? 'dark' : 'light';
        }
        constructor() {
            super({elem: $(document.documentElement)});
            this.bind();
            this.constructor.set_theme(this.constructor.preferred_theme, this.elem);
        }
        bind() {
            const stored_theme = this.stored_theme;
            this.constructor.match_media.addEventListener('change', () => {
                if (stored_theme !== 'light' || stored_theme !== 'dark') {
                    this.constructor.set_theme(this.constructor.preferred_theme, this.elem);
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
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                this.update();
            });
        }
        update() {
            const preferred_theme = Colormode.preferred_theme;
            if (preferred_theme === 'dark' && !this.elem.is(':checked')) {
                this.elem.get(0).checked = true;
            } else if (preferred_theme == 'light' && this.elem.is(':checked')) {
                this.elem.get(0).checked = false;
            }
        }
        on_change() {
            const document_elem = $(document.documentElement);
            const theme = this.elem.is(':checked') ? 'dark' : 'light';
            Colormode.set_theme(theme, document_elem);
            Colormode.stored_theme = theme;
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
            this.paste_action = $$1('a#toolbaraction-paste', context);
            this.paste_action.off('click').on('click', this.handle_paste.bind(this));
            this.copyable = $$1('table tr.selectable.copysupportitem', context);
            if (!this.copyable.length) {
                return;
            }
            this.cut_action = $$1('a#toolbaraction-cut', context);
            this.cut_action.off('click').on('click', this.handle_cut.bind(this));
            this.copy_action = $$1('a#toolbaraction-copy', context);
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
            let selected = $$1(this.selectable.selected);
            let ids = new Array();
            selected.each(function() {
                ids.push($$1(this).attr('ajax:target'));
            });
            let cookie = ids.join('::');
            ts.create_cookie(name, cookie);
            if (cookie.length) {
                $$1(this.paste_action).removeClass('disabled');
            } else {
                $$1(this.paste_action).addClass('disabled');
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
            $$1('table tr.selectable', this.context).each(function() {
                elem = $$1(this);
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
            $$1(this.selectable.selected).addClass('copysupport_cut');
        }
        handle_copy(evt) {
            evt.preventDefault();
            ts.create_cookie(this.cut_cookie, '', 0);
            this.write_selected_to_cookie(this.copy_cookie);
            this.copyable.removeClass('copysupport_cut');
        }
        handle_paste(evt) {
            evt.preventDefault();
            let elem = $$1(evt.currentTarget);
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
            $$1(window).on('keydown', this.key_down.bind(this));
            $$1(window).on('keyup', this.key_up.bind(this));
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
        }
        on_select(evt, suggestion, dataset) {
            if (!suggestion.target) {
                console.log('No suggestion target defined.');
                return;
            }
            ts.ajax.trigger(
                'contextchanged',
                '#layout',
                suggestion.target
            );
        }
        render_suggestion(suggestion) {
            return `<span class="${suggestion.icon}"></span>${suggestion.value}`;
        }
    }

    class GlobalEvents extends ts.Events {
        on_sidebar_resize(inst) {
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
            $$1(window).on('resize', this.render);
            this.on_sidebar_resize = this.on_sidebar_resize.bind(this);
            global_events.on('on_sidebar_resize', this.on_sidebar_resize);
            this.render();
            ts.ajax.attach(this, elem);
        }
        destroy() {
            $$1(window).off('resize', this.render);
            global_events.off('on_sidebar_resize', this.on_sidebar_resize);
        }
        on_sidebar_resize(inst) {
            this.scrollbar.render();
            this.scrollbar.position = this.scrollbar.position;
        }
        render() {
            const window_width = $$1(window).width();
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
                $$1(".dropdown-menu.show").removeClass('show');
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
            $$1('a.addreference', context).each(function() {
                new AddReferenceHandle($$1(this), target, ol);
            });
            $$1('a.removereference', context).each(function() {
                new RemoveReferenceHandle($$1(this), target, ol);
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
            $$1('a', elem.parent()).toggleClass('disabled');
        }
        reset_selected(elem) {
            let selected = new Array();
            if (this.single_value()) {
                selected.push(elem.attr('value'));
            }
            if (this.multi_value()) {
                $$1('[selected=selected]', elem).each(function() {
                    selected.push($$1(this).attr('value'));
                });
            }
            this.set_selected_on_ajax_target(elem.parent(), selected);
            let overlay = this.overlay;
            let that = this;
            $$1('div.referencebrowser a', overlay.elem).each(function() {
                let link = $$1(this);
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
            let label = $$1('.reftitle', elem.parent()).html();
            if (this.single_value()) {
                target.attr('value', label);
                let sel = '[name="' + target.attr('name') + '.uid"]';
                $$1(sel).attr('value', uid);
                this.set_selected_on_ajax_target(target.parent(), [uid]);
                this.overlay.close();
                return;
            }
            if (this.multi_value()) {
                if ($$1('[value="' + uid + '"]', target.parent()).length) {
                    return;
                }
                let option = $$1('<option></option>');
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
                $$1(sel).attr('value', '');
            }
            if (this.multi_value()) {
                let sel = '[value="' + uid + '"]';
                if (!$$1(sel, target.parent()).length) {
                    return;
                }
                $$1(sel, target).remove();
                target.trigger('change');
            }
            this.reset_selected(target);
            this.toggle_enabled(elem);
        }
    }
    class ReferenceBrowserLoader {
        static initialize(context) {
            $$1('.referencebrowser_trigger', context).each(function() {
                new ReferenceBrowserLoader($$1(this));
            });
        }
        constructor(elem) {
            this.wrapper = elem.parent();
            let sel = `[name="${elem.data('reference-name')}"]`;
            this.target = $$1(sel, this.wrapper);
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
            $$1('a.addreference', inst.elem).each(function() {
                new AddReferenceHandle($$1(this), target, inst);
            });
            $$1('a.removereference', inst.elem).each(function() {
                new RemoveReferenceHandle($$1(this), target, inst);
            });
        }
    }
    function referencebrowser_on_array_add(inst, context) {
        ReferenceBrowserLoader.initialize(context);
    }
    function referencebrowser_on_array_index(inst, row, index) {
        $$1('.referencebrowser_trigger', row).each(function() {
            let trigger = $$1(this),
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
    $$1(function() {
        if (window.yafowil_array === undefined) {
            return;
        }
        yafowil_array.on_array_event('on_add', referencebrowser_on_array_add);
        yafowil_array.on_array_event('on_index', referencebrowser_on_array_index);
    });

    class Scrollbar extends ts.Events {
        static initialize(context) {
            $$1('.scrollable-x', context).each(function() {
                new ScrollbarX($$1(this));
            });
            $$1('.scrollable-y', context).each(function() {
                new ScrollbarY($$1(this));
            });
        }
        constructor(elem) {
            super();
            this.elem = elem;
            this.elem.data('scrollbar', this);
            this.content = ts.query_elem('.scrollable-content', elem);
            this.on_scroll = this.on_scroll.bind(this);
            this.on_click = this.on_click.bind(this);
            this.on_drag = this.on_drag.bind(this);
            this.on_hover = this.on_hover.bind(this);
            this.on_resize = this.on_resize.bind(this);
            this.compile();
            this.position = 0;
            this.scroll_step = 50;
            new ts.Property(this, 'disabled', false);
            ts.ajax.attach(this, this.elem);
            ts.clock.schedule_frame(() => this.render());
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
        bind() {
            this.pointer_events = true;
            this.elem.css('pointer-events', 'all');
            this.elem.on('mousewheel wheel', this.on_scroll);
            this.scrollbar.on('click', this.on_click);
            this.thumb.on('mousedown', this.on_drag);
            this.elem.on('mouseenter mouseleave', this.on_hover);
            $$1(window).on('resize', this.on_resize);
        }
        unbind() {
            this.elem.off('mousewheel wheel', this.on_scroll);
            this.scrollbar.off('click', this.on_click);
            this.thumb.off('mousedown', this.on_drag);
            this.elem.off('mouseenter mouseleave', this.on_hover);
            $$1(window).off('resize', this.on_resize);
        }
        destroy() {
            this.unbind();
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
            if(this.contentsize <= this.scrollsize) {
                this.thumbsize = this.scrollsize;
            } else {
                this.thumbsize = Math.pow(this.scrollsize, 2) / this.contentsize;
            }
            this.thumb.css(attr, this.thumbsize);
            this.update();
        }
        safe_position(position) {
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
            this.render();
        }
        on_hover(e) {
            e.preventDefault();
            e.stopPropagation();
            const elem = this.elem;
            if (
                (elem.has(e.target).length > 0 || elem.is(e.target)) &&
                this.contentsize > this.scrollsize
            ) {
                if (e.type === 'mouseenter') {
                    this.scrollbar.stop(true, true).fadeIn();
                } else if (e.type === 'mouseleave' && e.relatedTarget !== elem.get(0)) {
                    this.scrollbar.stop(true, true).fadeOut();
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
                    this.position += this.scroll_step;
                }
                else if(evt.deltaY < 0) {
                    this.position -= this.scroll_step;
                }
            }
        }
        on_click(e) {
            e.preventDefault();
            this.thumb.addClass('active');
            let position = this.pos_from_evt(e),
                thumb_pos = position - this.offset - this.thumbsize / 2;
            this.position = this.contentsize * thumb_pos / this.scrollsize;
            this.thumb.removeClass('active');
        }
        on_drag(e) {
            e.preventDefault();
            var evt = $$1.Event('dragstart');
            $$1(window).trigger(evt);
            function on_move(e) {
                let mouse_pos_on_move = this.pos_from_evt(e) - this.offset,
                    new_thumb_pos = thumb_position + mouse_pos_on_move - mouse_pos;
                this.position = this.contentsize * new_thumb_pos / this.scrollsize;
            }
            function on_up() {
                var evt = $$1.Event('dragend');
                $$1(window).trigger(evt);
                $$1(document)
                    .off('mousemove', _on_move)
                    .off('mouseup', _on_up);
                this.thumb.removeClass('active');
                this.elem.on('mouseenter mouseleave', this.on_hover);
            }
            let _on_move = on_move.bind(this),
                _on_up = on_up.bind(this),
                mouse_pos = this.pos_from_evt(e) - this.offset,
                thumb_position = this.position / (this.contentsize / this.scrollsize);
            this.thumb.addClass('active');
            this.elem.off('mouseenter mouseleave', this.on_hover);
            $$1(document)
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
            let checkboxes = $$1('input.add_remove_role_for_principal', context);
            checkboxes.off('change').on('change', this.set_principal_role);
        }
        set_principal_role(evt) {
            evt.preventDefault();
            let checkbox = $$1(this);
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
            const logo_width = $$1('#header-logo').outerWidth(true);
            elem.css(
                'min-width',
                `calc(${logo_width}px + ${pad_left} + ${pad_right})`
            );
            this.on_click = this.on_click.bind(this);
            const collapse_elem = ts.query_elem('#sidebar_collapse', elem);
            collapse_elem.on('click', this.on_click);
            const resizer_elem = ts.query_elem('#sidebar_resizer', elem);
            this.set_scope(resizer_elem, $$1(document));
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
            this.elem
                .removeClass('expanded')
                .addClass('collapsed');
            global_events.trigger('on_sidebar_resize', this);
        }
        expand() {
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
            $$1('.translation-nav', context).each(function() {
                new Translation($$1(this));
            });
        }
        constructor(nav_elem) {
            this.nav_elem = nav_elem;
            this.fields_elem = nav_elem.next();
            this.show_lang_handle = this.show_lang_handle.bind(this);
            $$1('li > a', nav_elem).on('click', this.show_lang_handle);
            if ($$1('li.error', nav_elem).length) {
                $$1('li.error:first > a', nav_elem).click();
            } else {
                $$1('li.active > a', nav_elem).click();
            }
            this.fields_elem.show();
        }
        show_lang_handle(evt) {
            evt.preventDefault();
            this.nav_elem.children().removeClass('active');
            this.fields_elem.children().hide();
            let elem = $$1(evt.currentTarget);
            elem.parent().addClass('active');
            $$1(elem.attr('href'), this.fields_elem).show();
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
            let reduced = $$1.grep(this.selected, function(item, index) {
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
            $$1(selected).each(function() {
                selected_elem = $$1(this);
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
            let elem = $$1(evt.currentTarget);
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
    $$1.fn.selectable = function(options) {
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

    $$1(function() {
        new KeyBinder();
        new Colormode();
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
    });

    exports.AddReferenceHandle = AddReferenceHandle;
    exports.BatchedItemsFilter = BatchedItemsFilter;
    exports.BatchedItemsSearch = BatchedItemsSearch;
    exports.BatchedItemsSize = BatchedItemsSize;
    exports.ColorToggler = ColorToggler;
    exports.Colormode = Colormode;
    exports.CopySupport = CopySupport;
    exports.GlobalEvents = GlobalEvents;
    exports.KeyBinder = KeyBinder;
    exports.LiveSearch = LiveSearch;
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

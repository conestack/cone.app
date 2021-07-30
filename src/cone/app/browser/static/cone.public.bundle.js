var cone = (function (exports, $$1) {
    'use strict';

    // viewport states
    const vp_states = {
        MOBILE: 0,
        SMALL: 1,
        MEDIUM: 2,
        LARGE: 3
    };

    // viewport singleton

    class ViewPort {
        constructor() {
            this.state = null;

            this._mobile_query = `(max-width:559.9px)`;
            this._small_query = `(min-width:560px) and (max-width: 989.9px)`;
            this._medium_query = `(min-width:560px) and (max-width: 1200px)`;
            this.update_viewport();
            $$1(window).on('resize', this.resize_handle.bind(this));
        }

        update_viewport() {
            if (window.matchMedia(this._mobile_query).matches) {
                this.state = vp_states.MOBILE;
            } else if (window.matchMedia(this._small_query).matches) {
                this.state = vp_states.SMALL;
            } else if (window.matchMedia(this._medium_query).matches) {
                this.state = vp_states.MEDIUM;
            } else {
                this.state = vp_states.LARGE;
            }
        }

        resize_handle(e) {
            let state = this.state;
            this.update_viewport();
            if (e && state != this.state) {
                var evt = $$1.Event('viewport_changed');
                evt.state = this.state;
                $$1(window).trigger(evt);
            }
        }
    }

    // create viewport singleton
    const vp = new ViewPort();

    class ViewPortAware {

        constructor() {
            this.vp_state = vp.state;

            this._viewport_changed_handle = this.viewport_changed.bind(this);
            $$1(window).on('viewport_changed', this._viewport_changed_handle);
        }

        unload() {
            $$1(window).off('viewport_changed', this._viewport_changed_handle);
        }

        viewport_changed(e) {
            this.vp_state = e.state;
        }
    }

    /* Taken from Plone */

    function createCookie(name, value, days) {
        var date,
            expires;
        if (days) {
            date = new Date();        
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toGMTString();
        } else {
            expires = "";
        }
        document.cookie = name + "=" + escape(value) + expires + "; path=/;";
    }

    function readCookie(name) {
        var nameEQ = name + "=",
            ca = document.cookie.split(';'),
            i,
            c;
        for(i = 0; i < ca.length;i = i + 1) {
            c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(nameEQ) === 0) {
                return unescape(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    }

    let layout = {
        theme_switcher: null,
        mainmenu_top: null,
        mainmenu_sidebar: null,
        navtree: null,
        sidebar: null,
        mobile_nav: null,
        content: null,
        topnav: null,
        searchbar: null
    };

    class Sidebar extends ViewPortAware {
        static initialize(context) {
            let elem = $$1('#sidebar_left', context);

            if(!elem.length) {
                return;
            } else {
                layout.sidebar = new Sidebar(elem);
            }

            return layout.sidebar;
        }

        constructor(elem) {
            super();
            this.elem = elem;
            this.content = $$1('#sidebar_content', elem);

            // DOM elements
            this.toggle_btn = $$1('#sidebar-toggle-btn', elem);
            this.toggle_arrow_elem = $$1('i', this.toggle_btn);
            this.lock_switch = $$1('#toggle-fluid');

            // properties
            this.cookie = null;
            this.collapsed = false;

            // bindings
            this._toggle_menu_handle = this.toggle_menu.bind(this);
            this.toggle_btn.off('click').on('click', this._toggle_menu_handle);

            this._toggle_lock = this.toggle_lock.bind(this);
            this.lock_switch.off('click').on('click', this._toggle_lock);

            // execute initial load
            this.initial_load();
        }

        initial_load() {
            let cookie = readCookie('sidebar');
            if (this.vp_state === vp_states.MOBILE) {
                this.elem.hide();
            }
            else if (cookie === null) {
                if(this.vp_state !== vp_states.LARGE) {
                    this.collapsed = true;
                } else {
                    this.collapsed = false;
                }
            } else {
                this.cookie = cookie === 'true';
                this.collapsed = this.cookie;
                this.lock_switch.addClass('active');
            }

            this.viewport_changed();
        }

        assign_state() {
            let elem_class = this.collapsed === true ? 'collapsed' : 'expanded';
            let button_class = 'bi bi-arrow-' + ((this.collapsed === true) ? 'right':'left') + '-circle';
            this.elem.attr('class', elem_class);
            this.toggle_arrow_elem.attr('class', button_class);

            var evt = $$1.Event(`sidebar_${elem_class}`);
            $$1(window).trigger(evt);
        }

        toggle_lock() {
            if(readCookie('sidebar')) {
                createCookie('sidebar', '', -1);
                this.lock_switch.removeClass('active');
                this.cookie = null;
            } else {
                this.lock_switch.addClass('active');
                createCookie('sidebar', this.collapsed, null);
                this.cookie = this.collapsed;
            }
        }

        viewport_changed(e) {
            if (e) {
                super.viewport_changed(e);
            }
            if (this.vp_state === vp_states.MOBILE) {
                this.collapsed = false;
                this.elem.hide();
            }
            else if (this.cookie !== null) {
                this.collapsed = this.cookie;
                this.elem.show();
            }
            else if (this.vp_state === vp_states.SMALL) {
                this.elem.show();
                let state = this.vp_state === vp_states.SMALL;
                /* istanbul ignore else */
                if(state != this.collapsed) {
                    this.collapsed = state;
                }
            }
            else {
                this.collapsed = false;
                this.elem.show();
            }

            this.assign_state();
        }

        toggle_menu() {
            this.collapsed = !this.collapsed;

            if (this.lock_switch.hasClass('active')) {
                createCookie('sidebar', this.collapsed, null);
                this.cookie = this.collapsed;
            }
            this.assign_state();
        }
    }

    /* toggle vertical arrow icon */

    function toggle_arrow(arrow) {
        if (arrow.hasClass('bi-chevron-up')) {
            arrow.removeClass('bi-chevron-up');
            arrow.addClass('bi-chevron-down');
        } else {
            arrow.removeClass('bi-chevron-down');
            arrow.addClass('bi-chevron-up');
        }
    }

    class MainMenuSidebar {

        static initialize(context) {
            let elem = $$1('#mainmenu_sidebar', context);
            if(!elem.length || layout.sidebar === null) {
                return;
            } else {
                if( layout.mainmenu_sidebar !== null) {
                    layout.mainmenu_sidebar.unload();
                }
                layout.mainmenu_sidebar = new MainMenuSidebar(elem);
            }
            return layout.mainmenu_sidebar;
        }

        constructor(elem) {
            this.elem = elem;
            this.items = $$1('>li:not(".sidebar-heading")', this.elem);
            this.arrows = $$1('i.dropdown-arrow', this.items);
            this.menus = $$1('.sb-menu', this.elem);

            this.initial_cookie();

            this._collapse = this.collapse.bind(this);
            this._expand = this.expand.bind(this);

            if (layout.sidebar.collapsed) {
                this.collapse();
            } else {
                this.expand();
            }

            $$1(window).on('sidebar_collapsed', this._collapse);
            $$1(window).on('sidebar_expanded', this._expand);
        }

        unload() {
            this.items.off();
            this.arrows.off();
        }

        initial_cookie() {
            let cookie = readCookie('sidebar menus');
            if(cookie) {
                this.display_data = cookie.split(',');
            } else {
                this.display_data = [];
                for(let elem of this.menus) {
                    this.display_data.push('none');
                }
            }
        }

        collapse() {
            $$1('ul', this.items).hide();
            this.arrows.off('click');

            for(let item of this.items) {
                let elem = $$1(item);
                let menu = $$1('ul', elem);

                elem.off().on('mouseenter', mouse_in);

                function mouse_in() {
                    elem.addClass('hover');
                    let elem_w = elem.outerWidth(),
                        menu_w = menu.outerWidth();
                    if(elem_w > menu_w) {
                        menu.css('width', elem_w);
                    } else {
                        elem.css('width', menu_w);
                    }
                    menu.show();
                }

                elem.on('mouseleave', () => {
                    menu.hide();
                    elem.removeClass('hover')
                        .css('width', 'auto');
                });

                // stop event on scrollbar drag
                $$1(window)
                .on('dragstart', () => {
                    elem.off('mouseenter', mouse_in);
                })
                .on('dragend', () => {
                    elem.on('mouseenter', mouse_in);
                });
            }
        }

        expand() {
            this.items.off('mouseenter mouseleave');

            for(let i = 0; i < this.menus.length; i++) {
                let elem = this.menus[i],
                    arrow = $$1('i.dropdown-arrow', elem),
                    menu = $$1('ul.cone-mainmenu-dropdown-sb', elem)
                ;

                menu.css('display', this.display_data[i]);

                if(menu.css('display') === 'block') {
                    arrow.removeClass('bi-chevron-down')
                         .addClass('bi-chevron-up');
                } else {
                    arrow.removeClass('bi-chevron-up')
                         .addClass('bi-chevron-down');
                }

                arrow.off().on('click', () => {
                    let display = menu.css('display') === 'block' ? 'none' : 'block' ;
                    menu.slideToggle('fast');
                    toggle_arrow(arrow);
                    this.display_data[i] = display; 
                    createCookie('sidebar menus', this.display_data, null);
                });
            }
        }

        mv_to_mobile(mobile_content) {
            this.elem
                .detach()
                .appendTo(mobile_content)
                .addClass('mobile')
            ;
            this.expand();
        }

        mv_to_sidebar() {
            this.elem
                .detach()
                .appendTo(layout.sidebar.content)
                .removeClass('mobile')
            ;
        }
    }

    class ScrollBar {

        constructor(elem) {
            // scroll container
            this.elem = elem;
            // content to scroll
            this.content = $$1('>', this.elem);
            this.scrollbar = $$1('<div class="scrollbar" />');
            this.thumb = $$1('<div class="scroll-handle" />');

            this.position = 0;
            this.unit = 10;

            this.compile();
            this.observe_container();

            this._scroll = this.scroll_handle.bind(this);
            this.elem.on('mousewheel wheel', this._scroll);

            this._click_handle = this.click_handle.bind(this);
            this.scrollbar.on('click', this._click_handle);

            this._drag_handle = this.drag_handle.bind(this);
            this.thumb.on('mousedown', this._drag_handle);

            this._mousehandle = this.mouse_in_out.bind(this);
            this.elem.on('mouseenter mouseleave', this._mousehandle);
        }

        observe_container() {
            this.scrollbar_observer = new ResizeObserver(entries => {
                for (let entry of entries) {
                    this.update();
                }
            });
            this.scrollbar_observer.observe(this.elem.get(0));
        }

        /* istanbul ignore next */
        compile() {
            // abstract, implemented in subclass
        }

        /* istanbul ignore next */
        update() {
            // abstract, implemented in subclass
        }

        unload() {
            this.scrollbar.off('click', this._click_handle);
            this.elem.off('mousewheel wheel', this._scroll);
            this.elem.off('mouseenter mouseleave', this._mousehandle);
            this.thumb.off('mousedown', this._drag_handle);
            this.scrollbar_observer.unobserve(this.elem.get(0));
        }

        mouse_in_out(e) {
            /* istanbul ignore else */
            if(this.contentsize > this.scrollsize) {
                if(e.type == 'mouseenter') {
                    this.scrollbar.fadeIn();
                } else {
                    this.scrollbar.fadeOut();
                }
            }
        }

        scroll_handle(e) {
            if(this.contentsize <= this.scrollsize) {
                return;
            }
            let evt = e.originalEvent;
            /* istanbul ignore else */
            if (typeof evt.deltaY === 'number') {
                // down
                if(evt.deltaY > 0) {
                    this.position += this.unit;
                }
                // up
                /* istanbul ignore else */
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
            } /* istanbul ignore else */
            else if(this.position <= 0) {
                this.position = 0;
            }
        }

        click_handle(e) {
            e.preventDefault(); // prevent text selection
            this.thumb.addClass('active');
            let evt_data = this.get_evt_data(e),
                new_thumb_pos = evt_data - this.get_offset() - this.thumbsize / 2;
            this.position = this.contentsize * new_thumb_pos / this.scrollsize;
            this.set_position();
            this.thumb.removeClass('active');
        }

        drag_handle(e) {
            e.preventDefault();
            var evt = $$1.Event('dragstart');
            $$1(window).trigger(evt);

            let _on_move = on_move.bind(this),
                _on_up = on_up.bind(this),
                mouse_pos = this.get_evt_data(e) - this.get_offset(),
                thumb_position = this.position / (this.contentsize / this.scrollsize);
            this.thumb.addClass('active');

            this.elem.off('mouseenter mouseleave', this._mousehandle);

            $$1(document)
                .on('mousemove', _on_move)
                .on('mouseup', _on_up);

            function on_move(e) {
                let mouse_pos_on_move = this.get_evt_data(e) - this.get_offset(),
                    new_thumb_pos = thumb_position + mouse_pos_on_move - mouse_pos;
                this.position = this.contentsize * new_thumb_pos / this.scrollsize;
                this.set_position();
            }
            function on_up() {
                var evt = $$1.Event('dragend');
                $$1(window).trigger(evt);
                $$1(document)
                    .off('mousemove', _on_move)
                    .off('mouseup', _on_up);
                this.thumb.removeClass('active');
                this.elem.on('mouseenter mouseleave', this._mousehandle);
            }
        }
    }

    class ScrollBarX extends ScrollBar {

        constructor(elem) {
            super(elem);
        }

        compile() {
            this.content.addClass('scroll-content');
            this.elem
                .addClass('scroll-container')
                .prepend(this.scrollbar);
            this.scrollbar.append(this.thumb);
            this.thumb.css('height', '6px');
            this.scrollbar.css('height', '6px');

            this.scrollsize = this.elem.outerWidth();
            this.contentsize = this.content.outerWidth();

            this.scrollbar.css('width', this.scrollsize);
            this.thumbsize = this.scrollsize / (this.contentsize / this.scrollsize);
            this.thumb.css('width', this.thumbsize);
        }

        update() {
            this.scrollsize = this.elem.outerWidth();
            this.scrollbar.css('width', this.scrollsize);

            if(this.content.outerWidth() !== this.contentsize) {
                this.contentsize = this.content.outerWidth();
            }
            if(this.contentsize <= this.scrollsize) {
                this.thumbsize = this.scrollsize;
            } else {
                this.thumbsize = Math.pow(this.scrollsize, 2) / this.contentsize;
            }

            this.thumb.css('width', this.thumbsize);
            this.set_position();
        }

        set_position() {
            this.prevent_overflow();
            let thumb_pos = this.position / (this.contentsize / this.scrollsize);
            this.content.css('right', this.position + 'px');
            this.thumb.css('left', thumb_pos + 'px');
        }

        get_evt_data(e) {
            return e.pageX;
        }

        get_offset() {
            return this.elem.offset().left;
        }
    }
    class ScrollBarY extends ScrollBar {

        constructor(elem) {
            super(elem);
        }

        compile() {
            this.content.addClass('scroll-content');
            this.elem
                .addClass('scroll-container')
                .prepend(this.scrollbar);
            this.scrollbar.append(this.thumb);
            this.thumb.css('width', '6px');
            this.scrollbar.css('width', '6px');
            this.scrollbar.css('right', '0px');

            this.scrollsize = this.elem.outerHeight();
            this.contentsize = this.content.outerHeight();

            this.scrollbar.css('height', this.scrollsize);
            this.thumbsize = this.scrollsize / (this.contentsize / this.scrollsize);
            this.thumb.css('height', this.thumbsize);
        }

        update() {
            this.scrollsize = this.elem.outerHeight();
            this.scrollbar.css('height', this.scrollsize);

            if(this.content.outerHeight() !== this.contentsize) {
                this.contentsize = this.content.outerHeight();
            }
            if(this.contentsize <= this.scrollsize) {
                this.thumbsize = this.scrollsize;
            } else {
                this.thumbsize = Math.pow(this.scrollsize, 2) / this.contentsize;
            }

            this.thumb.css('height', this.thumbsize);
            this.set_position();
        }

        set_position() {
            this.prevent_overflow();
            let thumb_pos = this.position / (this.contentsize / this.scrollsize);
            this.content.css('bottom', this.position + 'px');
            this.thumb.css('top', thumb_pos + 'px');
        }

        get_evt_data(e) {
            return e.pageY;
        }

        get_offset() {
            return this.elem.offset().top;
        }
    }

    /* cone Main Menu Item */

    class MainMenuItem {

        constructor(elem) {
            this.elem = elem;
            this.children = elem.data('menu-items');
            if(!this.children){
                return;
            }
            this.menu = $$1(`
            <div class="cone-mainmenu-dropdown">
                <ul class="mainmenu-dropdown">
                </ul>
            </div>
        `);
            this.dd = $$1('ul', this.menu);
            this.arrow = $$1('i.dropdown-arrow', this.elem);
            this.render_dd();

            this._toggle = this.mouseenter_toggle.bind(this);
            this.elem.off().on('mouseenter mouseleave', this._toggle);
            this.menu.off().on('mouseenter mouseleave', () => {
                this.menu.toggle();
            });
        }

        render_dd() {
            for (let i in this.children) {
                let menu_item = this.children[i];
                let dd_item = $$1(`
              <li class="${menu_item.selected ? 'active': ''}">
                <a href="${menu_item.url}"
                   title="${menu_item.title}">
                  <i class="${menu_item.icon}"></i>
                  <span>
                    ${menu_item.title ? menu_item.title : '&nbsp;'}
                  </span>
                </a>
              </li>
            `);
                this.dd.append(dd_item);
            }
            this.menu.appendTo('#layout');
        }

        mv_to_mobile() {
            this.menu.off().detach().appendTo(this.elem).css('left', '0');
            this.elem.off();
            this.arrow.off().on('click', () => {
                this.menu.slideToggle('fast');
                toggle_arrow(this.arrow);
            });
        }

        mv_to_top() {
            this.menu.detach().appendTo('#layout');
            this.arrow.off();
            this.elem.off().on('mouseenter mouseleave', this._toggle);
            this.menu.off().on('mouseenter mouseleave', () => {
                this.menu.toggle();
            });
        }

        mouseenter_toggle(e) {
            this.menu.offset({left: this.elem.offset().left});
            if(e.type === 'mouseenter') {
                this.menu.css('display', 'block');
            } else {
                this.menu.css('display', 'none');
            }
        }
    }

    class MainMenuTop {

        static initialize(context) {
            let elem = $$1('#main-menu', context);
            if(!elem.length) {
                return;
            } else {
                layout.mainmenu_top = new MainMenuTop(elem);
            }
            return layout.mainmenu_top;
        }

        constructor(elem) {
            this.elem = elem;
            new ScrollBarX(elem);
            this.main_menu_items = [];
            let that = this;

            this.content = $$1('ul#mainmenu');
            $$1('li', this.content).each(function() {
                let main_menu_item = new MainMenuItem($$1(this));
                that.main_menu_items.push(main_menu_item);
            });

            this.handle_scrollbar();
        }

        handle_scrollbar() {
            for(let item of this.main_menu_items) {
                $$1(window)
                .on('dragstart', () => {
                    item.elem.off('mouseenter mouseleave', item._toggle);
                })
                .on('dragend', () => {
                    item.elem.on('mouseenter mouseleave', item._toggle);
                });
            }
        }

        mv_to_mobile() {
            for (let i in this.main_menu_items) {
                let item = this.main_menu_items[i];
                if (item.menu) {
                    item.mv_to_mobile();
                }
            }
        }

        mv_to_top() {
            for (let i in this.main_menu_items) {
                let item = this.main_menu_items[i];
                if (item.menu) {
                    item.mv_to_top();
                }
            }
        }
    }

    class Searchbar extends ViewPortAware {

        static initialize(context) {
            let elem = $$1('#cone-searchbar', context);
            if (!elem.length) {
                return;
            } else {
                layout.searchbar = new Searchbar(elem);
            }

            return layout.searchbar;
        }

        constructor(elem) {
            super();
            this.elem = elem;
            this.search_text = $$1('#livesearch-input', this.elem);
            this.search_group = $$1('#livesearch-group', this.elem);
            this.dd = $$1('#cone-livesearch-dropdown', this.elem);

            if(this.vp_state === vp_states.SMALL || this.vp_state === vp_states.MEDIUM) {
                this.dd.addClass('dropdown-menu-end');
                this.search_text.detach().prependTo(this.dd);
            }
        }

        viewport_changed(e) {
            super.viewport_changed(e);
            if(this.vp_state === vp_states.SMALL || this.vp_state === vp_states.MEDIUM) {
                this.dd.addClass('dropdown-menu-end');
                this.search_text.detach().prependTo(this.dd);
            } else {
                this.search_text.detach().prependTo(this.search_group);
                this.dd.removeClass('dropdown-menu-end');
            }
        }
    }

    class Content {

        static initialize(context) {
            let elem = $$1('#page-content-wrapper', context);
            if (!elem.length) {
                return;
            } else {
                layout.content = new Content(elem);
            }
            return layout.content;
        }

        constructor(elem) {
            this.elem = elem;
            // this.scrollbar = new ScrollBarY(elem);
        }
    }

    class Topnav extends ViewPortAware {

        static initialize(context) {
            let elem = $$1('#topnav', context);
            if (!elem.length) {
                return;
            } else {
                layout.topnav = new Topnav(elem);
            }
            return layout.topnav;
        }

        constructor(elem) {
            super();
            this.elem = elem;
            this.content = $$1('#topnav-content', elem);
            this.toggle_button = $$1('#mobile-menu-toggle', elem);
            this.logo = $$1('#cone-logo', elem);
            this.tb_dropdowns = $$1('#toolbar-top>li.dropdown', elem);
            this._toggle_menu_handle = this.toggle_menu.bind(this);
            this.toggle_button.on('click', this._toggle_menu_handle);

            this.viewport_changed();

            // tmp
            this.pt = $$1('#personaltools');
            this.user =  $$1('#user');
            this.pt_handle();
            // end tmp
        }

        toggle_menu() {
            if(this.content.css('display') === 'none') {
                this.content.slideToggle('fast');
                this.content.css('display', 'flex');
            } else {
                this.content.slideToggle('fast');
            }
        }

        viewport_changed(e) {
            if(e) {
                super.viewport_changed(e);
            }

            if (this.vp_state === vp_states.MOBILE) {
                this.content.hide();
                this.elem.addClass('mobile');

                // hide menu on toolbar click
                this.tb_dropdowns.off().on('show.bs.dropdown', () => {
                    this.content.hide();
                });
            } else {
                this.content.show();
                this.elem.removeClass('mobile');
                this.tb_dropdowns.off();
            }

            // tmp
            if(this.pt) {
                this.pt_handle();
            }
            // end tmp
        }

        pt_handle() {
            // tmp
            if (this.vp_state === vp_states.MOBILE) {
                this.pt.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                    this.user.stop(true, true).slideDown('fast');
                    toggle_arrow($$1('i.dropdown-arrow', '#personaltools'));
                });
                this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                    this.user.stop(true, true).slideUp('fast');
                    toggle_arrow($$1('i.dropdown-arrow', '#personaltools'));
                });
            } else {
                this.pt.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                    this.user.show();
                });
                this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                    this.user.hide();
                });
            }
        }
    }

    class Navtree {

        static initialize(context) {
            let elem = $$1('#navtree', context);
            if (!elem.length) { 
                return;
            } else {
                layout.navtree = new Navtree(elem);
            }
            return layout.navtree;
        }

        constructor(elem) {
            this.elem = elem;
            this.content = $$1('#navtree-content', elem);
            this.heading = $$1('#navtree-heading', elem);
            this.toggle_elems = $$1('li.navtreelevel_1', elem);

            this._mouseenter_handle = this.align_width.bind(this);
            this.toggle_elems.on('mouseenter', this._mouseenter_handle);
            this._restore = this.restore_width.bind(this);
            this.toggle_elems.on('mouseleave', this._restore); //restore original size

            this.scrollbar_handle();
        }

        unload() {
            this.heading.off('click');
            this.toggle_elems.off('mouseenter', this._mouseenter_handle)
                             .off('mouseleave', this._restore);
        }

        align_width(evt) {
            let target = $$1(evt.currentTarget);
            target.addClass('hover');
            if (target.outerWidth() > $$1('ul', target).outerWidth()) {
                $$1('ul', target).css('width', target.outerWidth());
            } else {
                target.css('width', $$1('ul', target).outerWidth());
            }
        }

        restore_width(evt) {
            $$1(evt.currentTarget).css('width', 'auto');
            $$1(evt.currentTarget).removeClass('hover');
        }

        scrollbar_handle(){
            $$1(window)
            .on('dragstart', () => {
                this.toggle_elems.off('mouseenter', this._mouseenter_handle);
            })
            .on('dragend', () => {
                this.toggle_elems.on('mouseenter', this._mouseenter_handle);
            });
        }

        mv_to_mobile(mobile_content) {
            this.elem.detach().appendTo(mobile_content).addClass('mobile');
            this.content.hide();
            this.heading.off('click').on('click', () => {
                this.content.slideToggle('fast');
            });
        }

        mv_to_sidebar() {
            this.elem
                .detach()
                .appendTo(layout.sidebar.content)
                .removeClass('mobile');
            this.heading.off('click');
            this.content.show();
        }
    }

    const default_themes = [
        '/static/light.css',
        '/static/dark.css'
    ];

    class ThemeSwitcher {

        static initialize(context) {
            let elem = $$1('#switch_mode', context);
            if (!elem.length) {
                return;
            } else {
                layout.theme_switcher = new ThemeSwitcher(elem);
            }
            return layout.theme_switcher;
        }

        constructor(elem) {
            this.elem = elem;
            this.modes = default_themes;
            this.link = $$1('head #colormode-styles');
            this.elem.off('click').on('click', this.switch_theme.bind(this));
            let current = readCookie('modeswitch');
            if (!current) {
                current = this.modes[0];
            }
            this.current = current;
        }

        get current() {
            return this.link.attr('href');
        }

        set current(value) {
            this.link.attr('href', value);
            createCookie('modeswitch', value, null);
            let checked = value === this.modes[0] ? false : true;
            this.elem.prop('checked', checked);
        }

        switch_theme(e) {
            e.stopPropagation();
            let modes = this.modes;
            this.current = this.current === modes[0] ? modes[1] : modes[0];
        }
    }

    // mobile_nav singleton

    class MobileNav extends ViewPortAware {
        static initialize(context) {
            let elem = $$1('#topnav-content', context);

            if (!elem.length) {
                return;
            } else {
                layout.mobile_nav = new MobileNav(elem);
            }
            return layout.mobile_nav;
        }

        constructor(elem) {
            super();

            this.elem = elem;
            this.viewport_changed();
        }

        viewport_changed(e) {
            if(e){
                super.viewport_changed(e);
            }

            if (layout.mainmenu_sidebar !== null) {
                if (this.vp_state === vp_states.MOBILE) {
                    layout.mainmenu_sidebar.mv_to_mobile(this.elem);
                    if(layout.mainmenu_top !== null){
                        layout.mainmenu_top.elem.hide();
                    }
                } else {
                    layout.mainmenu_sidebar.mv_to_sidebar();
                    if(layout.mainmenu_top !== null) {
                        layout.mainmenu_top.elem.show();
                    }
                }
            } else if (layout.mainmenu_sidebar === null && layout.mainmenu_top !== null) {
                if (this.vp_state === vp_states.MOBILE) {
                    layout.mainmenu_top.mv_to_mobile();
                } else {
                    layout.mainmenu_top.mv_to_top();
                }
            }

            if(layout.mainmenu_top !== null){
                if(this.vp_state === vp_states.MOBILE) {
                    $$1('#cone-logo').css('margin-right', 'auto');
                } else {
                    $$1('#cone-logo').css('margin-right', '2rem');
                }
            }
            if (layout.navtree !== null) {
                if (this.vp_state === vp_states.MOBILE) {
                    layout.navtree.mv_to_mobile(this.elem);
                } else {
                    layout.navtree.mv_to_sidebar();
                }
            }
        }
    }

    $(function() {
        bdajax.register(Topnav.initialize, true);
        bdajax.register(MainMenuTop.initialize, true);
        bdajax.register(Searchbar.initialize, true);
        bdajax.register(ThemeSwitcher.initialize, true);
        bdajax.register(Sidebar.initialize, true);
        bdajax.register(MainMenuSidebar.initialize, true);
        bdajax.register(Navtree.initialize, true);
        bdajax.register(Content.initialize, true);
        bdajax.register(MobileNav.initialize, true);
    });

    exports.Content = Content;
    exports.MainMenuItem = MainMenuItem;
    exports.MainMenuSidebar = MainMenuSidebar;
    exports.MainMenuTop = MainMenuTop;
    exports.MobileNav = MobileNav;
    exports.Navtree = Navtree;
    exports.ScrollBar = ScrollBar;
    exports.ScrollBarX = ScrollBarX;
    exports.ScrollBarY = ScrollBarY;
    exports.Searchbar = Searchbar;
    exports.Sidebar = Sidebar;
    exports.ThemeSwitcher = ThemeSwitcher;
    exports.Topnav = Topnav;
    exports.ViewPortAware = ViewPortAware;
    exports.createCookie = createCookie;
    exports.default_themes = default_themes;
    exports.layout = layout;
    exports.readCookie = readCookie;
    exports.toggle_arrow = toggle_arrow;
    exports.vp = vp;
    exports.vp_states = vp_states;

    Object.defineProperty(exports, '__esModule', { value: true });

    var old_cone = window.cone;
    exports.noConflict = function() {
        window.cone = old_cone;
        return this;
    }
    window.cone = exports;

    return exports;

}({}, jQuery));

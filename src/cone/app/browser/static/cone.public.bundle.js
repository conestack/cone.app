var cone = (function (exports, $, ts) {
    'use strict';

    const VP_MOBILE = 0;
    const VP_SMALL = 1;
    const VP_MEDIUM = 2;
    const VP_LARGE = 3;

    // viewport singleton

    class ViewPort {

        constructor() {
            this.state = null;

            this._mobile_query = `(max-width:559.9px)`;
            this._small_query = `(min-width:560px) and (max-width: 989.9px)`;
            this._medium_query = `(min-width:560px) and (max-width: 1200px)`;
            this.update_viewport();
            $(window).on('resize', this.resize_handle.bind(this));
        }

        update_viewport() {
            if (window.matchMedia(this._mobile_query).matches) {
                this.state = VP_MOBILE;
            } else if (window.matchMedia(this._small_query).matches) {
                this.state = VP_SMALL;
            } else if (window.matchMedia(this._medium_query).matches) {
                this.state = VP_MEDIUM;
            } else {
                this.state = VP_LARGE;
            }
        }

        resize_handle(e) {
            let state = this.state;
            this.update_viewport();
            if (e && state != this.state) {
                var evt = $.Event('viewport_changed');
                evt.state = this.state;
                $(window).trigger(evt);
            }
        }
    }

    // create viewport singleton
    const vp = new ViewPort();

    class ViewPortAware {

        constructor() {
            this.vp_state = vp.state;

            this._viewport_changed_handle = this.viewport_changed.bind(this);
            $(window).on('viewport_changed', this._viewport_changed_handle);
        }

        unload() {
            $(window).off('viewport_changed', this._viewport_changed_handle);
        }

        viewport_changed(e) {
            this.vp_state = e.state;
        }
    }

    function create_cookie(name, value, days) {
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

    function createCookie(name, value, days) {
        ts.deprecate('createCookie', 'cone.create_cookie', '2.0');
        create_cookie(name, value, days);
    }

    function read_cookie(name) {
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

    function readCookie(name) {
        ts.deprecate('readCookie', 'cone.read_cookie', '2.0');
        return read_cookie(name);
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
    /* calculate passed time from timestamp */
    function time_delta_str(time, end) {
        let now;
        /* istanbul ignore else */
        if (end) {
            now = end;
        } else {
            now = new Date();
        }

        // Compute time difference in milliseconds
        let timeDiff = now.getTime() - time.getTime();

        // Convert from milliseconds to seconds
        let seconds = timeDiff / 1000;

        // Convert from seconds to minutes
        let minutes = Math.floor(seconds / 60);

        // Convert from minutes to hours
        let hours = Math.floor(minutes / 60);

        // Convert from hours to days
        let days = Math.floor(hours / 24);

        // Convert from days to months
        let months = Math.floor(days / 30);

        // Convert from months to years
        let years = Math.floor(days / 365);

        if (years > 0) {
            if (years > 2) {
                return 'a long time ago';
            } else if (years === 2) {
                return '2 years ago';
            } else if (years === 1) {
                return 'a year ago';
            }
        } else if (months > 0) {
            if (months > 1) {
                return `${months} months ago`;
            } else {
                return 'a month ago';
            }
        } else if (days > 0) {
            if (days === 1) {
                return 'a day ago';
            } else {
                return `${days} days ago`;
            }
        } else if (hours > 0) {
            if (hours === 1) {
                return 'an hour ago';
            } else {
                return `${hours} hours ago`;
            }
        } else if (minutes > 0) {
            if (minutes === 1) {
                return 'a minute ago';
            } else {
                return `${minutes} minutes ago`;
            }
        } else if (seconds > 0) {
            return 'just now';
        }
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
        searchbar: null,
        toolbar: null,
        personaltools: null
    };

    class Sidebar extends ViewPortAware {
        static initialize(context) {
            let elem = $('#sidebar_left', context);

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
            this.content = $('#sidebar_content', elem);

            // DOM elements
            this.toggle_btn = $('#sidebar-toggle-btn', elem);
            this.toggle_arrow_elem = $('i', this.toggle_btn);
            this.lock_switch = $('#toggle-fluid');

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
            let cookie = read_cookie('sidebar');
            if (this.vp_state === VP_MOBILE) {
                this.elem.hide();
            }
            else if (cookie === null) {
                if(this.vp_state !== VP_LARGE) {
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

            var evt = $.Event(`sidebar_${elem_class}`);
            $(window).trigger(evt);
        }

        toggle_lock() {
            if(read_cookie('sidebar')) {
                create_cookie('sidebar', '', -1);
                this.lock_switch.removeClass('active');
                this.cookie = null;
            } else {
                this.lock_switch.addClass('active');
                create_cookie('sidebar', this.collapsed, null);
                this.cookie = this.collapsed;
            }
        }

        viewport_changed(e) {
            if (e) {
                super.viewport_changed(e);
            }
            if (this.vp_state === VP_MOBILE) {
                this.collapsed = false;
                this.elem.hide();
            }
            else if (this.cookie !== null) {
                this.collapsed = this.cookie;
                this.elem.show();
            }
            else if (this.vp_state === VP_SMALL) {
                this.elem.show();
                let state = this.vp_state === VP_SMALL;
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
                create_cookie('sidebar', this.collapsed, null);
                this.cookie = this.collapsed;
            }
            this.assign_state();
        }
    }

    class ScrollBar {

        constructor(elem) {
            // scroll container
            this.elem = elem;
            // content to scroll
            this.content = $('>', this.elem);
            this.scrollbar = $('<div class="scrollbar" />');
            this.thumb = $('<div class="scroll-handle" />');

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
            throw 'Abstract ScrollBar does not implement compile()';
        }

        /* istanbul ignore next */
        update() {
            // abstract, implemented in subclass
            throw 'Abstract ScrollBar does not implement update()';
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
            var evt = $.Event('dragstart');
            $(window).trigger(evt);

            let _on_move = on_move.bind(this),
                _on_up = on_up.bind(this),
                mouse_pos = this.get_evt_data(e) - this.get_offset(),
                thumb_position = this.position / (this.contentsize / this.scrollsize);
            this.thumb.addClass('active');

            this.elem.off('mouseenter mouseleave', this._mousehandle);

            $(document)
                .on('mousemove', _on_move)
                .on('mouseup', _on_up);

            function on_move(e) {
                let mouse_pos_on_move = this.get_evt_data(e) - this.get_offset(),
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

    class MainMenuSidebar {

        static initialize(context) {
            let elem = $('#mainmenu_sidebar', context);
            if(!elem.length) {
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
            this.items = $('>li:not(".sidebar-heading")', this.elem);
            this.arrows = $('i.dropdown-arrow', this.items);
            this.menus = $('.sb-menu', this.elem);

            this.initial_cookie();

            this._collapse = this.collapse.bind(this);
            this._expand = this.expand.bind(this);

            if (layout.sidebar.collapsed) {
                this.collapse();
            } else {
                this.expand();
            }

            $(window).on('sidebar_collapsed', this._collapse);
            $(window).on('sidebar_expanded', this._expand);
        }

        unload() {
            this.items.off();
            this.arrows.off();
        }

        initial_cookie() {
            let cookie = read_cookie('sidebar menus');
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
            $('ul', this.items).hide();
            this.arrows.off('click');

            for(let item of this.items) {
                let elem = $(item);
                let menu = $('ul', elem);

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
                $(window)
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
                    arrow = $('i.dropdown-arrow', elem),
                    menu = $('ul.cone-mainmenu-dropdown-sb', elem)
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
                    create_cookie('sidebar menus', this.display_data, null);
                });
            }
        }
    }

    class MainMenuTop {

        static initialize(context) {
            let elem = $('#main-menu', context);
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

            this.content = $('ul#mainmenu');
            $('li', this.content).each(function() {
                let main_menu_item = new MainMenuItem($(this));
                that.main_menu_items.push(main_menu_item);
            });
            layout.topnav.logo.addClass('m_right');

            this.handle_scrollbar();
        }

        handle_scrollbar() {
            for(let item of this.main_menu_items) {
                $(window)
                .on('dragstart', () => {
                    item.elem.off('mouseenter mouseleave', item._toggle);
                })
                .on('dragend', () => {
                    item.elem.on('mouseenter mouseleave', item._toggle);
                });
            }
        }
    }

    class MainMenuItem {

        constructor(elem) {
            this.elem = elem;
            this.children = elem.data('menu-items');
            if(!this.children){
                return;
            }
            this.menu = $(`
            <div class="cone-mainmenu-dropdown">
                <ul class="mainmenu-dropdown">
                </ul>
            </div>
        `);
            this.dd = $('ul', this.menu);
            this.arrow = $('i.dropdown-arrow', this.elem);
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
                let dd_item = $(`
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

        mouseenter_toggle(e) {
            this.menu.offset({left: this.elem.offset().left});
            if(e.type === 'mouseenter') {
                this.menu.css('display', 'block');
            } else {
                this.menu.css('display', 'none');
            }
        }
    }

    class Searchbar extends ViewPortAware {

        static initialize(context, factory=null) {
            let elem = $('#cone-searchbar', context);
            /* istanbul ignore if */
            if (!elem.length) {
                return;
            }
            if (factory === null) {
                factory = Searchbar;
            }
            layout.searchbar = new factory(elem);
            return layout.searchbar;
        }

        constructor(elem) {
            super();
            this.elem = elem;
            this.search_text = $('#livesearch-input', this.elem);
            this.search_text.on('click', this.livesearch_handle.bind(this));
            this.search_group = $('#livesearch-group', this.elem);
            this.dd = $('#cone-livesearch-dropdown', this.elem);

            this.result_header = $('#livesearch-result-header');
            this.results = $('#cone-livesearch-results');

            if(this.vp_state === VP_SMALL || this.vp_state === VP_MEDIUM) {
                this.dd.addClass('dropdown-menu-end');
                this.search_text.detach().prependTo(this.dd);
            }
        }

        livesearch_handle(e) {
            
            this.dd.on('click', (e) => {
                e.preventDefault();
            });
            // TODO: work on livesearch
            let dots = $(
                `<div class="loading-dots">
                <i class="bi bi-circle-fill"></i>
                <i class="bi bi-circle-fill"></i>
                <i class="bi bi-circle-fill"></i>
            </div>`
            );

            this.result_header.append(dots);

            let timeout = 0;
            let characters = 0;

            this.search_text.off().on('keydown', (e) => {
                e.preventDefault();
            });

            this.search_text.off().on('keyup', (e) => {
                if (e.code === 'Backspace' && characters > 0) {
                    characters -= 1;
                } else {
                    characters += 1;
                }
                if (characters >= 3) {
                    $('.search-result').remove();
                    $('.loading-dots').show();
                    clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        $('.loading-dots').hide();
                        ts.ajax.request({
                            url: 'livesearch',
                            params: {
                                term: this.search_text.val(),
                            },
                            type: 'json',
                            success: (data, status, request) => {
                                console.log('request response received here');
                                console.log(data);
                                for (let result of data) {
                                    let res = this.render_suggestion(result);
                                    let li_elem = $(`<li class="search-result">${res}</li>`);
                                    this.results.append(li_elem);
                                }
                            }
                        });
                    }, 800);
                } else {
                    $('.search-result').remove();
                    $('.loading-dots').show();
                    clearTimeout(timeout);
                }
            });
        }

        viewport_changed(e) {
            super.viewport_changed(e);
            if(this.vp_state === VP_SMALL || this.vp_state === VP_MEDIUM) {
                this.dd.addClass('dropdown-menu-end');
                this.search_text.detach().prependTo(this.dd);
            } else {
                this.search_text.detach().prependTo(this.search_group);
                this.dd.removeClass('dropdown-menu-end');
            }
        }

        /* istanbul ignore next */
        on_select(e, suggestion, dataset) {
            ts.ajax.trigger(
                'contextchanged',
                '#layout',
                suggestion.target
            );
        }

        /* istanbul ignore next */
        render_suggestion(suggestion) {
            return `<span class="${suggestion.icon}">${suggestion.value}</span>`;
        }
    }

    class Content {

        static initialize(context) {
            let elem = $('#page-content-wrapper', context);
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
            let elem = $('#topnav', context);
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
            this.content = $('#topnav-content', elem);
            this.toggle_button = $('#mobile-menu-toggle', elem);
            this.logo = $('#cone-logo', elem);
            this._toggle_menu_handle = this.toggle_menu.bind(this);
            this.toggle_button.on('click', this._toggle_menu_handle);

            this.viewport_changed();
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

            if (this.vp_state === VP_MOBILE) {
                this.content.hide();
                this.elem.addClass('mobile');
            } else {
                this.content.show();
                this.elem.removeClass('mobile');
            }
        }
    }

    class Navtree {

        static initialize(context) {
            let elem = $('#navtree', context);
            if (!elem.length) { 
                return;
            } else {
                layout.navtree = new Navtree(elem);
            }
            return layout.navtree;
        }

        constructor(elem) {
            this.elem = elem;
            this.content = $('#navtree-content', elem);
            this.heading = $('#navtree-heading', elem);
            this.toggle_elems = $('li.navtreelevel_1', elem);

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
            let target = $(evt.currentTarget);
            target.addClass('hover');
            if (target.outerWidth() > $('ul', target).outerWidth()) {
                $('ul', target).css('width', target.outerWidth());
            } else {
                target.css('width', $('ul', target).outerWidth());
            }
        }

        restore_width(evt) {
            $(evt.currentTarget).css('width', 'auto');
            $(evt.currentTarget).removeClass('hover');
        }

        scrollbar_handle(){
            $(window)
            .on('dragstart', () => {
                this.toggle_elems.off('mouseenter', this._mouseenter_handle);
            })
            .on('dragend', () => {
                this.toggle_elems.on('mouseenter', this._mouseenter_handle);
            });
        }
    }

    const default_themes = [
        '/static/light.css',
        '/static/dark.css'
    ];

    class ThemeSwitcher {

        static initialize(context) {
            let elem = $('#switch_mode', context);
            /* istanbul ignore if */
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
            this.link = $('head #colormode-styles');
            this.elem.off('click').on('click', this.switch_theme.bind(this));
            let current = read_cookie('modeswitch');
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
            create_cookie('modeswitch', value, null);
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
            let elem = $('#topnav-content', context);

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

            if (this.vp_state === VP_MOBILE) {
                this.mv_mmsb_to_mobile();
                this.mv_mmtop_to_mobile();
                this.mv_navtree_to_mobile();
            } else {
                this.mv_mmsb_to_sidebar();
                this.mv_mmtop_to_top();
                this.mv_navtree_to_sidebar();
            }
        }

        // mainmenu sidebar
        mv_mmsb_to_mobile() {
            let mm_sb = layout.mainmenu_sidebar;
            if(mm_sb === null) {
                return;
            }

            mm_sb.elem
            .detach()
            .appendTo(this.elem)
            .addClass('mobile')
            ;
            mm_sb.expand();
        }

        mv_mmsb_to_sidebar() {
            let mm_sb = layout.mainmenu_sidebar;
            if(mm_sb === null) {
                return;
            }

            mm_sb.elem
                .detach()
                .appendTo(layout.sidebar.content)
                .removeClass('mobile')
            ;
        }

        // navtree
        mv_navtree_to_mobile() {
            let nav = layout.navtree;
            if (nav === null) {
                return;
            }

            nav.elem.detach().appendTo(this.elem).addClass('mobile');
            nav.content.hide();
            nav.heading.off('click').on('click', () => {
                nav.content.slideToggle('fast');
            });
        }

        mv_navtree_to_sidebar() {
            let nav = layout.navtree;
            if (nav === null) {
                return;
            }

            nav.elem
                .detach()
                .appendTo(layout.sidebar.content)
                .removeClass('mobile');
            nav.heading.off('click');
            nav.content.show();
        }

        // mainmenu top
        mv_mmtop_to_mobile() {
            let mm_top = layout.mainmenu_top,
                mm_sb = layout.mainmenu_sidebar;

            if(mm_top === null) {
                return;
            } else if(mm_sb !== null) {
                mm_top.elem.hide();
                return;
            }

            let mm_items = layout.mainmenu_top.main_menu_items;

            for (let i in mm_items) {
                let item = mm_items[i];
                if (item.menu) {
                    item.menu.off().detach().appendTo(item.elem).css('left', '0');
                    item.elem.off();
                    item.arrow.off().on('click', () => {
                        item.menu.slideToggle('fast');
                        toggle_arrow(item.arrow);
                    });
                }
            }
        }

        mv_mmtop_to_top() {
            let mm_top = layout.mainmenu_top,
                mm_sb = layout.mainmenu_sidebar;

            if(mm_top === null) {
                return;
            } else if(mm_sb !== null) {
                mm_top.elem.show();
                return;
            }

            let mm_items = mm_top.main_menu_items;

            for (let i in mm_items) {
                let item = mm_items[i];
                if (item.menu) {
                    item.menu.detach().appendTo('#layout');
                    item.arrow.off();
                    item.elem.off().on('mouseenter mouseleave', item._toggle);
                    item.menu.off().on('mouseenter mouseleave', () => {
                        item.menu.toggle();
                    });
                }
            }
        }
    }

    class Toolbar extends ViewPortAware {

        static initialize(context) {
            let elem = $('#toolbar-top', context);
            /* istanbul ignore if */
            if (!elem.length) {
                return;
            } else {
                layout.toolbar = new Toolbar(elem);
            }
            return layout.toolbar;
        }

        constructor(elem) {
            super();
            this.elem = elem;
            this.dropdowns = $('li.dropdown', this.elem);
            this.mark_read_btn = $('#noti_mark_read', this.elem);
            this.sort_priority_btn = $('#noti_sort_priority', this.elem);
            this.sort_date_btn =$('#noti_sort_date', this.elem);

            this._mark = this.mark_as_read.bind(this);
            this.mark_read_btn.off().on('click', this._mark);

            this._sort_p = this.sort_priority.bind(this);
            this.sort_priority_btn.off().on('click', this._sort_p);

            this._sort_d = this.sort_date.bind(this);
            this.sort_date_btn.on('click',this._sort_d);

            $('i.bi-x-circle').on('click', function(e) {
                e.stopPropagation();
                $(this).parent('li').hide();
            });
            
            this.handle_dd();
            this.viewport_changed();
            this.set_noti_time();
        }

        handle_dd() {
            for(let item of this.dropdowns){
                let elem = $(item);
                let icon = $('i', elem);
                if (icon.length === 0) {
                    icon = $('img', elem);
                }
                let menu = $('ul', elem);

                icon.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                    menu.css('display', 'flex');
                });
                icon.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                    menu.css('display', 'none');
                });
            }
        }

        viewport_changed(e){
            if (e) {
                super.viewport_changed(e);
            }

            if(this.vp_state === VP_MOBILE){
                 // hide menu on toolbar click
                 this.dropdowns.off().on('show.bs.dropdown', () => {
                    layout.topnav.content.hide();
                });
            } else {
                this.dropdowns.off();
            }
        }

        mark_as_read(e) {
            e.stopPropagation();
            $('li.notification').removeClass('unread').addClass('read');
        }

        sort_priority(e) {
            e.stopPropagation();

            let arrow = $('.arrow-small', this.sort_priority_btn);
            if (arrow.hasClass('bi-arrow-up')) {
                arrow.removeClass('bi-arrow-up').addClass('bi-arrow-down');
                sort_descend();
            } else if (arrow.hasClass('bi-arrow-down')) {
                arrow.removeClass('bi-arrow-down').addClass('bi-arrow-up');
                sort_ascend();
            }

            function sort_descend() {
                for (let item of $('li.notification', '#notifications')){
                    let elem = $(item);

                    if (elem.hasClass('high')){
                        elem.css('order', '0');
                    } else if (elem.hasClass('medium')) {
                        elem.css('order', '1');
                    } else if (elem.hasClass('low')) {
                        elem.css('order', '2');
                    } else {
                        elem.css('order', '3');
                    }
                }
            }

            function sort_ascend() {
                for (let item of $('li.notification', '#notifications')){
                    let elem = $(item);

                    if (elem.hasClass('high')){
                        elem.css('order', '3');
                    } else if (elem.hasClass('medium')) {
                        elem.css('order', '2');
                    } else if (elem.hasClass('low')) {
                        elem.css('order', '1');
                    } else {
                        elem.css('order', '0');
                    }
                }
            }
        }

        set_noti_time() {
            for (let item of $('li.notification', '#notifications')) {
                let elem = $(item);

                let time_stamp = new Date(elem.data('timestamp'));
                let time_display = time_delta_str(time_stamp);

                $('p.timestamp', elem).text(time_display);
            }
        }

        sort_date(e) {
            e.stopPropagation();

            let msgs = [];
            for (let item of $('li.notification', '#notifications')) {
                let elem = $(item);
                let timestamp = new Date(elem.data('timestamp'));
                msgs.push({element: elem, timestamp: timestamp});
            }

            let arrow = $('.arrow-small', this.sort_date_btn);
            if (arrow.hasClass('bi-arrow-up')) {
                arrow.removeClass('bi-arrow-up').addClass('bi-arrow-down');
                msgs.sort(function(a,b){
                    return new Date(b.timestamp) - new Date(a.timestamp);
                });
            } else if (arrow.hasClass('bi-arrow-down')) {
                arrow.removeClass('bi-arrow-down').addClass('bi-arrow-up');
                msgs.sort(function(a,b){
                    return new Date(a.timestamp) - new Date(b.timestamp);
                });
            }

            for(let i in msgs) {
                let msg = msgs[i];
                msg.element.css('order', i);
            }
        }
    }

    class Personaltools extends ViewPortAware {

        static initialize(context) {
            let elem = $('#personaltools', context);
            /*  istanbul ignore if */
            if (!elem.length) {
                return;
            } else {
                layout.personaltools = new Personaltools(elem);
            }
            return layout.personaltools;
        }

        constructor(elem) {
            super();
            this.elem = elem;
            this.user_menu = $('#user', this.elem);

            this.viewport_changed();
        }

        viewport_changed(e){
            if(e) {
                super.viewport_changed(e);
            }

            if (this.vp_state === VP_MOBILE) {
                this.elem.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                    this.user_menu.stop(true, true).slideDown('fast');
                    toggle_arrow($('i.dropdown-arrow', '#personaltools'));
                });
                this.elem.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                    this.user_menu.stop(true, true).slideUp('fast');
                    toggle_arrow($('i.dropdown-arrow', '#personaltools'));
                });
            } else {
                this.elem.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                    this.user_menu.show();
                });
                this.elem.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                    this.user_menu.hide();
                });
            }
        }
    }

    $(function() {
        ts.ajax.register(Topnav.initialize, true);
        ts.ajax.register(MainMenuTop.initialize, true);
        ts.ajax.register(Searchbar.initialize, true);
        ts.ajax.register(Toolbar.initialize, true);
        ts.ajax.register(Personaltools.initialize, true);
        ts.ajax.register(ThemeSwitcher.initialize, true);
        ts.ajax.register(Sidebar.initialize, true);
        ts.ajax.register(MainMenuSidebar.initialize, true);
        ts.ajax.register(Navtree.initialize, true);
        ts.ajax.register(Content.initialize, true);
        ts.ajax.register(MobileNav.initialize, true);
    });

    exports.Content = Content;
    exports.MainMenuItem = MainMenuItem;
    exports.MainMenuSidebar = MainMenuSidebar;
    exports.MainMenuTop = MainMenuTop;
    exports.MobileNav = MobileNav;
    exports.Navtree = Navtree;
    exports.Personaltools = Personaltools;
    exports.ScrollBar = ScrollBar;
    exports.ScrollBarX = ScrollBarX;
    exports.ScrollBarY = ScrollBarY;
    exports.Searchbar = Searchbar;
    exports.Sidebar = Sidebar;
    exports.ThemeSwitcher = ThemeSwitcher;
    exports.Toolbar = Toolbar;
    exports.Topnav = Topnav;
    exports.VP_LARGE = VP_LARGE;
    exports.VP_MEDIUM = VP_MEDIUM;
    exports.VP_MOBILE = VP_MOBILE;
    exports.VP_SMALL = VP_SMALL;
    exports.ViewPortAware = ViewPortAware;
    exports.createCookie = createCookie;
    exports.create_cookie = create_cookie;
    exports.default_themes = default_themes;
    exports.layout = layout;
    exports.readCookie = readCookie;
    exports.read_cookie = read_cookie;
    exports.time_delta_str = time_delta_str;
    exports.toggle_arrow = toggle_arrow;
    exports.vp = vp;

    Object.defineProperty(exports, '__esModule', { value: true });


    window.cone = exports;

    // B/C
    window.createCookie = exports.create_cookie;
    window.readCookie = exports.read_cookie;


    return exports;

}({}, jQuery, treibstoff));

var ts = (function (exports, $) {
    'use strict';

    /* Viewport states for responsive tests */

    var karma_vp_states = ['mobile', 'small', 'medium', 'large'];

    /* globals get exported to be accessed from other modules */

    const cone$1 = {
        // viewport state is defined by window width
        viewportState: null,
    };

    // viewport states
    const vp_states = {
        MOBILE: 0,
        SMALL: 1,
        MEDIUM: 2,
        LARGE: 3
    };
    const VP_MOBILE = 0;
    const VP_SMALL = 1;
    const VP_MEDIUM = 2;
    const VP_LARGE = 3;

    class ViewPort {

        constructor() {
            this.state = null;
            cone$1.viewportState = this.state;

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

    class ViewPortAware {

        constructor() {
            this.vp_state = cone$1.viewportState;

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

    /* $(function() {
        // create viewport singleton
        cone_viewport = new ViewPort();
    }); */

    class Content {

        static initialize(context) {
            let elem = $('#page-content-wrapper', context);
            if (!elem.length) {
                return;
            }
            return new Content(elem);
        }

        constructor(elem) {
            this.elem = elem;
            // this.scrollbar = new ScrollBarY(elem);
        }
    }

    $(function() {
        Content.initialize();
    });

    /* cone Main Menu Item */

    class MainMenuItem extends cone.ViewPortAware {

        constructor(elem) {
            super(elem);
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

            if(this.vp_state === cone.VP_MOBILE){
                this.mv_to_mobile();
            } else {
                this.elem.off().on('mouseenter mouseleave', this._toggle);
                this.menu.off().on('mouseenter mouseleave', () => {
                    this.menu.toggle();
                });
            }
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

        mv_to_mobile() {
            if(cone.main_menu_sidebar) {
                return;
            }
            this.menu.off().detach().appendTo(this.elem).css('left', '0');
            this.elem.off();
            this.arrow.off().on('click', () => {
                this.menu.slideToggle('fast');
                cone.toggle_arrow(this.arrow);
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

    class MainMenuSidebar extends cone.ViewPortAware {

        static initialize(context) {
            let elem = $('#mainmenu_sidebar', context);
            if(!elem.length) {
                return;
            }
            if(cone.main_menu_sidebar !== null) {
                cone.main_menu_sidebar.unload();
            }
            cone.main_menu_sidebar = new cone.MainMenuSidebar(elem);
        }

        constructor(elem) {
            super();
            this.elem = elem;
            this.items = $('>li:not(".sidebar-heading")', this.elem);
            this.arrows = $('i.dropdown-arrow', this.items);
            this.menus = $('.sb-menu', this.elem);

            this.initial_cookie();

            if (this.vp_state === cone.VP_MOBILE) {
                this.mv_to_mobile();
            }

            this._collapse = this.collapse.bind(this);
            this._expand = this.expand.bind(this);
        }

        unload() {
            super.unload();
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

        viewport_changed(e) {
            super.viewport_changed(e);
            if (this.vp_state === cone.VP_MOBILE) {
                this.mv_to_mobile();
            } 
            else {
                this.mv_to_sidebar();
            }
        }

        mv_to_mobile() {
            this.elem.detach()
            .appendTo(cone.topnav.content)
            .addClass('mobile');
        }

        mv_to_sidebar() {
            this.elem.detach()
            .prependTo(cone.sidebar_menu.content)
            .removeClass('mobile');
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
                    cone.toggle_arrow(arrow);
                    this.display_data[i] = display; 
                    createCookie('sidebar menus', this.display_data, null);
                });
            }
        }

    }

    class MainMenuTop extends cone.ViewPortAware {

        static initialize(context) {
            let elem = $('#main-menu', context);
            if(!elem.length) {
                return;
            }
            if(cone.main_menu_top !== null) {
                cone.main_menu_top.unload();
            }
            cone.main_menu_top = new cone.MainMenuTop(elem);
        }

        constructor(elem) {
            super();
            this.elem = elem;
            new cone.ScrollBarX(elem);
            this.main_menu_items = [];
            let that = this;
            $('li', elem).each(function() {
                let main_menu_item = new cone.MainMenuItem($(this));
                that.main_menu_items.push(main_menu_item);
            });

            if(this.vp_state !== cone.VP_MOBILE) {
                cone.topnav.logo.css('margin-right', '2rem');
            } else {
                cone.topnav.logo.css('margin-right', 'auto');
                if (cone.main_menu_sidebar) {
                    this.elem.css('display', 'none');
                }
            }

            this.handle_scrollbar();
        }

        unload() {
            super.unload();
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

        viewport_changed(e) {
            super.viewport_changed(e);
            if(this.vp_state === cone.VP_MOBILE) {
                cone.topnav.logo.css('margin-right', 'auto');
            } else {
                cone.topnav.logo.css('margin-right', '2rem');
            }
            if(cone.main_menu_sidebar) {
                if(this.vp_state === cone.VP_MOBILE) {
                    this.elem.css('display', 'none');
                } else {
                    this.elem.css('display', 'flex');
                }
                return;
            }

            for (let i in this.main_menu_items) {
                let item = this.main_menu_items[i];
                if (item.menu) {
                    if (this.vp_state === cone.VP_MOBILE) {
                        item.mv_to_mobile();
                    } else {
                        item.mv_to_top();
                    }
                }
            }
        }
    }

    class Navtree extends cone.ViewPortAware {

        static initialize(context) {
            let elem = $('#navtree', context);
            if (!elem.length) {
                return;
            }
            if (cone.navtree !== null) {
                cone.navtree.unload();
            }
            cone.navtree = new cone.Navtree(elem);
        }

        constructor(elem) {
            super();
            this.elem = elem;
            this.content = $('#navtree-content', elem);
            this.heading = $('#navtree-heading', elem);
            this.toggle_elems = $('li.navtreelevel_1', elem);

            if (this.vp_state === cone.VP_MOBILE) {
                this.mv_to_mobile();
            }

            this._mouseenter_handle = this.align_width.bind(this);
            this.toggle_elems.on('mouseenter', this._mouseenter_handle);
            this._restore = this.restore_width.bind(this);
            this.toggle_elems.on('mouseleave', this._restore); //restore original size

            this.scrollbar_handle();
        }

        unload() {
            super.unload();
            this.heading.off('click');
            this.toggle_elems.off('mouseenter', this._mouseenter_handle)
                             .off('mouseleave', this._restore);
        }

        mv_to_mobile() {
            this.elem.detach().appendTo(cone.topnav.content).addClass('mobile');
            this.content.hide();
            this.heading.off('click').on('click', () => {
                this.content.slideToggle('fast');
            });
        }

        viewport_changed(e) {
            super.viewport_changed(e);
            if (this.vp_state === cone.VP_MOBILE) {
                this.mv_to_mobile();
            } else {
                this.elem.detach().appendTo(cone.sidebar_menu.content).removeClass('mobile');
                this.heading.off('click');
                this.content.show();
            }
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

    class Searchbar extends ViewPortAware {

        static initialize(context) {
            let elem = $('#cone-searchbar', context);
            if (!elem.length) {
                return;
            }
            return new Searchbar(elem);
        }

        constructor(elem) {
            super();
            this.elem = elem;
            this.search_text = $('#livesearch-input', this.elem);
            this.search_group = $('#livesearch-group', this.elem);
            this.dd = $('#cone-livesearch-dropdown', this.elem);

            if(this.vp_state === VP_SMALL || this.vp_state === VP_MEDIUM) {
                this.dd.addClass('dropdown-menu-end');
                this.search_text.detach().prependTo(this.dd);
            }
        }

        viewport_changed(e) {
            super.viewport_changed(e);
            if(this.vp_state ===VP_SMALL || this.vp_state === VP_MEDIUM) {
                this.dd.addClass('dropdown-menu-end');
                this.search_text.detach().prependTo(this.dd);
            } else {
                this.search_text.detach().prependTo(this.search_group);
                this.dd.removeClass('dropdown-menu-end');
            }
        }
    }

    $(function() {
        Searchbar.initialize();
    });

    /* Taken from Plone */

    function createCookie$1(name, value, days) {
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

    function readCookie$1(name) {
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

    class SidebarMenu extends ViewPortAware {

        static initialize(context) {
            let elem = $('#sidebar_left', context);
            if (!elem.length) {
                return;
            }
            if (cone$1.sidebar_menu.exists) {
                console.log('sidebar already exists');
                // cone.sidebar_menu.unload();
            }
            return new SidebarMenu(elem);
        }

        constructor(elem) {
            super();
            this.elem = elem;
            this.content = $('#sidebar_content', elem);

            cone$1.sidebar_menu.exists = true;

            /* if(!$.trim(this.content.html()).length) {
                // hide sidebar if empty
                // trim() ensures execution if content has whitespace
                this.elem.hide();
                super.unload();
            } */
            //this.scrollbar = new ScrollBarSidebar(elem);
            this.collapsed = false;

            this.toggle_btn = $('#sidebar-toggle-btn', elem);
            this.toggle_arrow_elem = $('i', this.toggle_btn);
            this.lock_switch = $('#toggle-fluid');
            this.cookie = null;
           
            this._toggle_menu_handle = this.toggle_menu.bind(this);
            this.toggle_btn.off('click').on('click', this._toggle_menu_handle);

            this.initial_load();

            this._toggle_lock = this.toggle_lock.bind(this);
            this.lock_switch.off('click').on('click', this._toggle_lock);
        }

        unload() {
            super.unload();
            this.toggle_btn.off('click', this._toggle_menu_handle);
            this.lock_switch.off('click', this._toggle_lock);
        }

        initial_load() {
            let cookie = readCookie$1('sidebar');
            let vp_state = this.vp_state;
            if (vp_state === vp_states.MOBILE) {
                this.elem.hide();
            } 
            else if (cookie === null) {
                if(vp_state !== vp_states.LARGE) {
                    this.collapsed = true;
                }
            } else {
                this.cookie = cookie === 'true';
                this.collapsed = this.cookie;
                this.lock_switch.addClass('active');
            }

            this.assign_state();
        }

        toggle_lock() {
            if(readCookie$1('sidebar')) {
                createCookie$1('sidebar', '', -1);
                this.lock_switch.removeClass('active');
                this.cookie = null;
            } else {
                this.lock_switch.addClass('active');
                createCookie$1('sidebar', this.collapsed, null);
                this.cookie = this.collapsed;
            }
        }

        viewport_changed(e) {
            super.viewport_changed(e);
            if(this.vp_state === vp_states.MOBILE) {
                this.collapsed = false;
                this.elem.hide();
            }
            else if (this.cookie !== null) {
                this.collapsed = this.cookie;
                this.elem.show();
            }
            else if(this.vp_state === vp_states.SMALL) {
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

        assign_state() {
            let elem_class = this.collapsed === true ? 'collapsed' : 'expanded';
            let button_class = 'bi bi-arrow-' + ((this.collapsed === true) ? 'right':'left') + '-circle';
            this.elem.attr('class', elem_class);
            this.toggle_arrow_elem.attr('class', button_class);

            // if(cone.main_menu_sidebar !== null) {
            //     if(this.collapsed) {
            //         cone.main_menu_sidebar.collapse();
            //     }
            //     else {
            //         cone.main_menu_sidebar.expand();
            //     }
            // }
        }

        toggle_menu() {
            this.collapsed = !this.collapsed;
            
            if (this.lock_switch.hasClass('active')) {
                createCookie$1('sidebar', this.collapsed, null);
                this.cookie = this.collapsed;
            }
            this.assign_state();
        }
    }

    $(function() {
        SidebarMenu.initialize();
        // cone.sidebar_menu.unload = sidebar_menu._unload;
    });

    class ThemeSwitcher {

        static initialize(context, modes) {
            let elem = $('#switch_mode', context);
            if (!elem.length) {
                return;
            }
            cone.theme_switcher = new cone.ThemeSwitcher(elem, modes);
        }

        constructor(elem, modes) {
            this.elem = elem;
            this.modes = modes;
            this.link = $('head #colormode-styles');
            this.elem.off('click').on('click', this.switch_theme.bind(this));
            let current = readCookie('modeswitch');
            if (!current) {
                current = modes[0];
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

    class Topnav extends ViewPortAware {

        static initialize(context) {
            let elem = $('#topnav', context);
            if (!elem.length) {
                return;
            }
            return new Topnav(elem);
        }

        constructor(elem) {
            super();
            this.elem = elem;
            this.content = $('#topnav-content', elem);
            this.toggle_button = $('#mobile-menu-toggle', elem);
            this.logo = $('#cone-logo', elem);
            this.tb_dropdowns = $('#toolbar-top>li.dropdown', elem);
            this._toggle_menu_handle = this.toggle_menu.bind(this);
            this.toggle_button.on('click', this._toggle_menu_handle);

            if (this.vp_state === vp_states.MOBILE) {
                this.content.hide();
                this.elem.addClass('mobile');
                this.tb_dropdowns.off().on('show.bs.dropdown', () => {
                    this.content.hide();
                });
            }

            // tmp
            this.pt = $('#personaltools');
            this.user =  $('#user');
            this.pt_handle();
            // end tmp
        }

        unload() {
            super.unload();
            this.toggle_button.off('click', this._toggle_menu_handle);
            this.tb_dropdowns.off('show.bs.dropdown');
        }

        toggle_menu() {
            this.content.slideToggle('fast');
            // slideToggle overrides display flex with block, we need flex
            if (this.content.css('display') === 'block') {
                this.content.css('display', 'flex');
            }
        }

        viewport_changed(e) {
            super.viewport_changed(e);
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
            this.pt_handle();
            // end tmp
        }

        pt_handle() {
            // tmp
            if (this.vp_state === vp_states.MOBILE) {
                this.pt.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                    this.user.stop(true, true).slideDown('fast');
                    toggle_arrow($('i.dropdown-arrow', '#personaltools'));
                });
                this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                    this.user.stop(true, true).slideUp('fast');
                    toggle_arrow($('i.dropdown-arrow', '#personaltools'));
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

    exports.Content = Content;
    exports.MainMenuItem = MainMenuItem;
    exports.MainMenuSidebar = MainMenuSidebar;
    exports.MainMenuTop = MainMenuTop;
    exports.Navtree = Navtree;
    exports.ScrollBar = ScrollBar;
    exports.ScrollBarX = ScrollBarX;
    exports.ScrollBarY = ScrollBarY;
    exports.Searchbar = Searchbar;
    exports.SidebarMenu = SidebarMenu;
    exports.ThemeSwitcher = ThemeSwitcher;
    exports.Topnav = Topnav;
    exports.VP_LARGE = VP_LARGE;
    exports.VP_MEDIUM = VP_MEDIUM;
    exports.VP_MOBILE = VP_MOBILE;
    exports.VP_SMALL = VP_SMALL;
    exports.ViewPort = ViewPort;
    exports.ViewPortAware = ViewPortAware;
    exports.createCookie = createCookie$1;
    exports.karma_vp_states = karma_vp_states;
    exports.readCookie = readCookie$1;
    exports.toggle_arrow = toggle_arrow;
    exports.vp_states = vp_states;

    Object.defineProperty(exports, '__esModule', { value: true });

    var old_ts = window.ts;
    exports.noConflict = function() {
        window.ts = old_ts;
        return this;
    }
    window.ts = exports;

    return exports;

}({}, jQuery));

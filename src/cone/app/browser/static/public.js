/*
 * cone.app public JS
 *
 * Requires:
 *     jquery
 *     bdajax
 *     typeahead.js
 */

// var livesearch_options = new Object();

(function($) {

    // cone namespace
    cone = {
        theme_switcher: null,
        searchbar_handler: null,
        content: null,
        scrollbars: [],
        default_themes: [
            '/static/light.css',
            '/static/dark.css'
        ],
        dragging: false,
        searchbar: null,
    };

    // viewport related
    cone.viewport = null;
    cone.VP_MOBILE = 0;
    cone.VP_SMALL = 1;
    cone.VP_MEDIUM = 2;
    cone.VP_LARGE = 3;

    // layout components
    cone.sidebar_menu = null;
    cone.main_menu_top = null;
    cone.main_menu_sidebar = null;
    cone.navtree = null;
    cone.topnav = null;

    $(function() {
        // create viewport singleton
        cone.viewport = new cone.ViewPort();

        bdajax.register(function(context) {
            cone.ThemeSwitcher.initialize(context, cone.default_themes);
            cone.Topnav.initialize(context);
            cone.MainMenuSidebar.initialize(context);
            cone.MainMenuTop.initialize(context);

            cone.SidebarMenu.initialize(context);

            cone.Searchbar.initialize(context);
            cone.Navtree.initialize(context);
            cone.Content.initialize(context);

            $('.scroll-container', context).each(function() {
                let condition = $(this).find('.scroll-content').outerWidth(true) > $(this).outerWidth(true);
                let scrollbar = (condition) ?
                    new cone.ScrollBarX($(this)) :
                    new cone.ScrollBarY($(this));
            });
        }, true);

        // bdajax.register(livesearch.binder.bind(livesearch), true);

    });

    // XXX: move to cone.utils
    function toggle_arrow(arrow) {
        if (arrow.hasClass('bi-chevron-up')) {
            arrow.removeClass('bi-chevron-up');
            arrow.addClass('bi-chevron-down');
        } else {
            arrow.removeClass('bi-chevron-down');
            arrow.addClass('bi-chevron-up');
        }
    }

    function dd_reset(arrow, dropdown) {
        arrow.attr('class', 'dropdown-arrow bi bi-chevron-down');
        dropdown.hide();
    }

    // viewport singleton
    cone.ViewPort = class {

        constructor() {
            this.state = null;
            this._mobile_query = `(max-width:560px)`;
            this._small_query = `(min-width:560px) and (max-width: 990px)`;
            this._medium_query = `(min-width:560px) and (max-width: 1200px)`;
            this.update_viewport(null);
            $(window).on('resize', this.update_viewport.bind(this));
        }

        update_viewport(e) {
            let state = this.state;
            if (window.matchMedia(this._mobile_query).matches) {
                this.state = cone.VP_MOBILE;
            } else if (window.matchMedia(this._small_query).matches) {
                this.state = cone.VP_SMALL;
            } else if (window.matchMedia(this._medium_query).matches) {
                this.state = cone.VP_MEDIUM;
            } else {
                this.state = cone.VP_LARGE;
            }
            if (e && state != this.state) {
                var evt = $.Event('viewport_changed');
                evt.state = this.state;
                $(window).trigger(evt);
            }
        }
    }

    cone.ViewPortAware = class {

        constructor() {
            this._viewport_changed_handle = this.viewport_changed.bind(this);
            $(window).on('viewport_changed', this._viewport_changed_handle);
        }

        unload() {
            $(window).off('viewport_changed', this._viewport_changed_handle);
        }

        viewport_changed(e) {
        }
    }

    // layout component
    cone.ViewComponent = class {

        constructor(elem, global_name=null) {
            this.elem = elem;
            this._observe_removed();
            if (global_name) {
                cone[global_name] = this;
            }
        }

        _observe_removed() {
            let elem = this.elem.get(0);
            let that = this;
            let observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    mutation.removedNodes.forEach(node => {
                        if (Object.is(elem, node)) {
                            observer.disconnect();
                            that.unload();
                        }
                    });
                });
            });
            observer.observe(elem.parentNode, {childList: true});
        }

        unload() {
            // abstract, implement on subclass
        }
    }

    cone.ScrollBar = class {

        constructor(context) {
            cone.scrollbars.push(this);
            this.container = context;
            this.content = $('>', this.container);

            this.scrollbar = $('<div class="scrollbar" />');
            this.thumb = $('<div class="scroll-handle" />');
            this.thickness = '6px';

            $(this.create_elems.bind(this));
    
            this.position = 0;
            this.thumb_pos = 0;
            this.thumb_dim = 0;
            this.thumb_end = 0;
            this.factor = 0;
            this.space_between = 0;

            this.unit = 10;
            this.scrollbar_unit = 0;

            this._handle = this.update_dimensions.bind(this); // bind this required!
            $(this._handle); // jquery required!
            
            const scrollbar_observer = new ResizeObserver(entries => {
                for(let entry of entries) {
                    $(this._handle);
                }
            });
            scrollbar_observer.observe(this.container.get(0));

            this._scroll = this.scroll_handle.bind(this);
            this.container.off().on('mousewheel wheel', this._scroll);

            this._drag_start = this.drag_start.bind(this);
            this.scrollbar.off().on('mousedown', this._drag_start);

            this._mousehandle = this.mouse_in_out.bind(this);
            this.container.off(
                'mouseenter mouseleave',
                this._mousehandle
            ).on('mouseenter mouseleave', this._mousehandle);
        }

        create_elems() {
            // abstract, implemented in subclass
        }

        update_dimensions() {
            // abstract, implemented in subclass
        }

        drag_start() {
            // abstract, implemented in subclass
        }

        unload() {
            this.scrollbar.off();
            this.container.off();
        }

        mouse_in_out(e) {
            if(cone.dragging || this.content_dim <= this.container_dim) {
                return;
            } else {
                if(e.type == 'mouseenter') {
                    this.scrollbar.fadeIn();
                } else {
                    this.scrollbar.fadeOut();
                }
            }
        }

        scroll_handle(e) {
            if(this.content_dim < this.container_dim) {
                return;
            }
            if (typeof e.originalEvent.wheelDelta == 'number' || typeof e.originalEvent.deltaY == 'number') {

                // scroll event data
                if(e.originalEvent.wheelDelta < 0 || e.originalEvent.deltaY > 0) { // down
                    this.position -= this.unit;
                    this.thumb_pos += this.scrollbar_unit;

                    if(this.thumb_pos >= this.container_dim - this.thumb_dim) { // stop scrolling on end
                        this.thumb_pos = this.container_dim - this.thumb_dim;
                        this.position = this.container_dim - this.content_dim;
                    }
                };

                if(e.originalEvent.wheelDelta > 0 || e.originalEvent.deltaY < 0) { // up
                    this.position += this.unit;
                    this.thumb_pos -= this.scrollbar_unit;

                    if(this.position > 0) { // stop scrolling on start
                        this.position = 0;
                        this.thumb_pos = 0;
                    }
                }
            }
            this.set_position();
        }
    }

    cone.ScrollBarX = class extends cone.ScrollBar {

        constructor(elem) {
            super(elem);
            this.elem = elem;

            this.container_dim = this.container.outerWidth(true);
            this.content_dim = this.content.outerWidth(true);

            this.offset = this.container.offset().left;
        }

        create_elems() {
            this.content.addClass('scroll-content');
            this.elem.addClass('scroll-container');
            this.container.prepend(this.scrollbar);
            this.scrollbar.append(this.thumb);
            this.thumb.css('height', this.thickness);
            this.scrollbar.css('height', this.thickness);
        }

        update_dimensions() {
            this.content_dim = this.content.outerWidth(true);
            this.container_dim = this.container.outerWidth(true);
            this.factor = this.content_dim / this.container_dim;
            this.thumb_dim = this.container_dim / this.factor;
            this.thumb_end = this.thumb.offset().left + this.thumb_dim;
            this.container_end = this.container.offset().left + this.container_dim;

            this.scrollbar.css('width', this.container_dim);
            this.thumb.css('width', this.thumb_dim);

            this.scrollbar_unit = this.container_dim / (this.content_dim / this.unit);
            this.space_between = this.container_dim - this.thumb_dim;
        }

        set_position() {
            this.content.css('left', this.position + 'px');
            this.thumb.css('left', this.thumb_pos + 'px');
        }

        drag_start(evt) {
            evt.preventDefault(); // prevent text selection
            this.thumb.addClass('active');

            let mouse_pos = evt.pageX - this.offset,
                thumb_diff = this.container_dim - this.thumb_dim,
                new_thumb_pos = 0;

            // case click
            if(mouse_pos < this.thumb_pos || mouse_pos > (this.thumb_pos + this.thumb_dim)) {
                if(mouse_pos < this.thumb_pos) {
                    if(mouse_pos <= this.thumb_pos / 2) {
                        new_thumb_pos = 0;
                    } else {
                        new_thumb_pos = mouse_pos- this.thumb_dim / 2;
                    }
                } else if(mouse_pos > this.thumb_pos + this.thumb_dim){
                    if(mouse_pos > this.space_between + this.thumb_dim / 2) {
                        new_thumb_pos = thumb_diff;
                    } else {
                        new_thumb_pos = mouse_pos - this.thumb_dim / 2;
                    }
                }
                this.thumb.css('left', new_thumb_pos);
                this.content.css('left', - (new_thumb_pos * this.factor));
                this.thumb_pos = new_thumb_pos;
            // case drag
            } else {
                cone.dragging = true;
                $(document).on('mousemove', onMouseMove.bind(this));

                function onMouseMove(evt) {
                    let mouse_pos_on_move = evt.pageX - this.offset;
                    let diff = mouse_pos_on_move - mouse_pos;
                    new_thumb_pos = this.thumb_pos + diff;
                    if(new_thumb_pos <= 0) {
                        new_thumb_pos = 0;
                    } else if (new_thumb_pos >= thumb_diff) {
                        new_thumb_pos = thumb_diff;
                    }
                    this.thumb.css('left', new_thumb_pos);
                    this.content.css('left', - (new_thumb_pos * this.factor));
                }

                $(document).on('mouseup', onMouseUp.bind(this));
                function onMouseUp() {
                    cone.dragging = false;
                    $(document).off('mousemove mouseup');
                    this.thumb.removeClass('active');
                    this.thumb_pos = new_thumb_pos;
                }
            }


        }
    };

    cone.ScrollBarY = class extends cone.ScrollBar {

        constructor(elem) {
            super(elem);
            this.elem = elem;

            this.container_dim = this.container.outerHeight(true);
            this.content_dim = (this.content.length) ? this.content.outerHeight(true) : 0;

            this.offset = this.container.offset().top;
        }

        create_elems() {
            this.content.addClass('scroll-content');
            this.elem.addClass('scroll-container');
            this.container.prepend(this.scrollbar);
            this.scrollbar.append(this.thumb);
            this.thumb.css('width', this.thickness);
            this.scrollbar.css('width', this.thickness);
        }

        update_dimensions() {
            this.content_dim = this.content.outerHeight(true);
            this.container_dim = this.container.outerHeight(true);
            this.factor = this.content_dim / this.container_dim;
            this.thumb_dim = this.container_dim / this.factor;
            this.thumb_end = this.thumb.offset().top + this.thumb_dim;
            this.container_end = this.container.offset().top + this.container_dim;

            this.scrollbar.css('height', this.container_dim);
            this.thumb.css('height', this.thumb_dim);

            this.scrollbar_unit = this.container_dim / (this.content_dim / this.unit);
            this.space_between = this.container_dim - this.thumb_dim;
        }

        set_position() {
            this.content.css('top', this.position + 'px');
            this.thumb.css('top', this.thumb_pos + 'px');
        }

        drag_start(evt) {
            // prevent text selection
            evt.preventDefault();
            this.thumb.addClass('active');

            let mouse_pos = evt.pageY - this.offset,
                thumb_diff = this.container_dim - this.thumb_dim,
                new_thumb_pos = 0;

            // case click
            if (mouse_pos < this.thumb_pos || mouse_pos > (this.thumb_pos + this.thumb_dim)) {
                if (mouse_pos < this.thumb_pos) {
                    if (mouse_pos <= this.thumb_pos / 2) {
                        new_thumb_pos = 0;
                    } else {
                        new_thumb_pos = mouse_pos- this.thumb_dim / 2;
                    }
                } else if (mouse_pos > this.thumb_pos + this.thumb_dim){
                    if (mouse_pos > this.space_between + this.thumb_dim / 2) {
                        new_thumb_pos = thumb_diff;
                    } else {
                        new_thumb_pos = mouse_pos - this.thumb_dim / 2;
                    }
                }
                this.thumb.css('top', new_thumb_pos);
                this.content.css('top', - (new_thumb_pos * this.factor));
                this.thumb_pos = new_thumb_pos;
            // case drag
            } else {
                cone.dragging = true;
                $(document).on(
                    'mousemove',
                    onMouseMove.bind(this)
                ).on('mouseup', onMouseUp.bind(this));

                function onMouseMove(evt) {      
                    let mouse_pos_on_move = evt.pageY - this.offset;
                    let diff = mouse_pos_on_move - mouse_pos;
                    new_thumb_pos = this.thumb_pos + diff;
                    if(new_thumb_pos <= 0) {
                        new_thumb_pos = 0;
                    } else if (new_thumb_pos >= thumb_diff) {
                        new_thumb_pos = thumb_diff;
                    }
                    this.thumb.css('top', new_thumb_pos);
                    this.content.css('top', - (new_thumb_pos * this.factor));
                }

                function onMouseUp() {
                    cone.dragging = false;
                    $(document).off('mousemove mouseup');
                    this.thumb.removeClass('active');
                    this.thumb_pos = new_thumb_pos;
                }
            }
        }
    }

    cone.ScrollBarSidebar = class extends cone.ScrollBarY {
        constructor(elem) {
            super(elem);
            this.elem = elem;
            this.content = $('#sidebar_content');
        }
    }

    cone.Content = class {

        static initialize(context) {
            let elem = $('#page-content-wrapper', context);
            if (!elem.length) {
                return;
            }
            cone.content = new cone.Content(elem);
        }

        constructor(elem) {
            this.elem = elem;
            this.scrollbar = new cone.ScrollBarY(elem);
        }
    }

    cone.MainMenuItem = class {

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
            this._render = this.render_dd.bind(this);
            $(this._render);
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
            let menu = this.menu;
            let elem = this.elem;
            menu.off().detach().appendTo(elem).css('left', '0');
            elem.off();
            this.arrow.off().on('click', function(){
                menu.slideToggle('fast');
                toggle_arrow(this);
            });
        }

        mv_to_top() {
            let menu = this.menu;
            let elem = this.elem;
            menu.detach().appendTo('#layout');
            this.arrow.off();
            elem.off().on('mouseenter mouseleave', function(e) {
                if(cone.dragging) {
                    return;
                }
                menu.offset({left: elem.offset().left});
                if(e.type === 'mouseenter') {
                    menu.show();
                } else {
                    menu.hide();
                }
            });
            menu.off().on('mouseenter mouseleave', function() {
                menu.toggle();
            })
        }
    }

    cone.MainMenuTop = class extends cone.ViewPortAware {

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

            // wip
            for (let i in this.main_menu_items) {
                let item = this.main_menu_items[i];
                if (!item.menu) {
                    return;
                }
                if(cone.viewport.state === cone.VP_MOBILE && !cone.main_menu_sidebar.length){
                    item.mv_to_mobile();
                } else {
                    item.mv_to_top();
                }
            }
        }

        unload() {
            super.unload();
        }

        viewport_changed(e) {
            if (cone.viewport.state === cone.VP_MOBILE) {
                if (!cone.main_menu_sidebar.elem.length) {
                    for (let i in this.main_menu_items) {
                        let item = this.main_menu_items[i];
                        if (!item.menu) {
                            return;
                        }
                        item.mv_to_mobile();
                        
                    }
                } else {
                    this.elem.hide();
                }
            } else {
                this.elem.show();
                for (let i in this.main_menu_items) {
                    let item = this.main_menu_items[i];
                    if (!item.menu) {
                        return;
                    }
                    item.mv_to_top();
                }
            }
        }
    }

    cone.MainMenuSidebar = class extends cone.ViewPortAware {

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
            this.items = $('>li', this.elem);
            this.arrows = $('i.dropdown-arrow', this.items);
            this.dropdowns = $('ul', this.items);
            this.dd_sel = 'ul.cone-mainmenu-dropdown-sb';
            this.menus = $('.sb-menu', this.elem);

            if (cone.viewport.state === cone.VP_MOBILE) {
                this.mv_to_mobile();
            } 
    
            this._mousein = this.mousein_handle.bind(this);
            this._mouseout = this.mouseout_handle.bind(this);
            this._toggle = this.toggle_dropdown.bind(this);
            this._bind_collapse = this.bind_collapse.bind(this);
            this._bind_expand = this.bind_expand.bind(this);
        }

        unload() {
            super.unload();
        }

        viewport_changed(e) {
            dd_reset(this.arrows, this.dropdowns);
            if (cone.viewport.state === cone.VP_MOBILE) {
                this.mv_to_mobile();
            } 
            else {
                this.mv_to_sidebar();
            }
        }

        mousein_handle(evt) {
            let target = $(evt.currentTarget);
            // if (cone.dragging) {
            //     return;
            // }
            target.addClass('hover');
            if(target.outerWidth() > $('ul', target).outerWidth()) {
                $('ul', target).css('width', target.outerWidth());
            } else {
                target.css('width', $('ul', target).outerWidth());
            }
            $(this.dd_sel, target).show();
        }
    
        mouseout_handle(evt) {
            $(this.dd_sel).hide();
            $(evt.currentTarget).removeClass('hover');
            $(evt.currentTarget).css('width', 'auto');
        }
    
        toggle_dropdown(evt) {
            let target = $(evt.currentTarget);
            let item = target.parent().parent();
            $(this.dd_sel, item).slideToggle('fast');
            toggle_arrow(target);
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

        bind_collapse() {
            this.dropdowns.hide();
            this.arrows.off('click');
            this.items.off().on('mouseenter', this._mousein);
            this.items.on('mouseleave', this._mouseout);
        }

        bind_expand() {
            this.items.off('mouseenter mouseleave');
            this.arrows.off().on('click', this._toggle);
        }
    }

    cone.Topnav = class extends cone.ViewPortAware {

        static initialize(context) {
            let elem = $('#topnav', context);
            if (!elem.length) {
                return;
            }
            if(cone.topnav !== null) {
                cone.topnav.unload();
            }
            cone.topnav = new cone.Topnav(elem);
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

            if (cone.viewport.state === cone.VP_MOBILE) {
                this.elem.addClass('mobile');
                this.tb_dropdowns.off().on('show.bs.dropdown', function() {
                    cone.topnav.content.hide();
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
        }

        toggle_menu() {
            this.content.slideToggle('fast');
            // XXX: this always sets display flex. why not via CSS file directly then?
            // XXX: because slideToggle overwrites display:flex with display:block / display:none
            // setting display to flex!important disables slideToggle behaviour (L)
            if (this.content.css('display') === 'block') {
                this.content.css('display', 'flex');
            }
        }

        viewport_changed(e) {
            if(!cone.main_menu_top.elem.length) {
                this.logo.css('margin-right', 'auto');
            }
            if (cone.viewport.state === cone.VP_MOBILE) {
                this.content.hide();
                this.elem.addClass('mobile');
                // hide menu on toolbar click
                this.tb_dropdowns.off().on('show.bs.dropdown', function() {
                    cone.topnav.content.hide();
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
            let user = this.user;
            if (cone.viewport.state === cone.VP_MOBILE) {
                this.pt.off('show.bs.dropdown').on('show.bs.dropdown', function() {
                    user.stop(true, true).slideDown('fast');
                    toggle_arrow($('i.dropdown-arrow', '#personaltools'));
                });
                this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', function() {
                    user.stop(true, true).slideUp('fast');
                    toggle_arrow($('i.dropdown-arrow', '#personaltools'));
                });
            } else {
                this.pt.off('show.bs.dropdown').on('show.bs.dropdown', function() {
                    user.show();
                });
                this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', function() {
                    user.hide();
                });
            }
        }
    }

    cone.SidebarMenu = class extends cone.ViewPortAware {

        static initialize(context) {
            let elem = $('#sidebar_left', context);
            if (!elem.length) {
                return;
            }
            if (cone.sidebar_menu !== null) {
                cone.sidebar_menu.unload();
            }
            cone.sidebar_menu = new cone.SidebarMenu(elem);
        }

        constructor(elem) {
            super();
            this.elem = elem;
            //this.scrollbar = new cone.ScrollBarSidebar(elem);

            this.content = $('#sidebar_content', elem);
            this.collapsed = false;

            let cookie = readCookie('sidebar');
            this.cookie = null;
            if(cookie) {
                this.cookie = cookie === "true" ? true : false;
            }

            this.toggle_btn = $('#sidebar-toggle-btn', elem);
            this.toggle_arrow = $('i', this.toggle_btn);

            this._toggle_menu_handle = this.toggle_menu.bind(this)
            this.toggle_btn.off('click').on('click', this._toggle_menu_handle);

            let vp_state = cone.viewport.state;
            if (vp_state === cone.VP_MOBILE) {
                this.elem.hide();
            } 
            else if (this.cookie === true || vp_state !== cone.VP_LARGE) {
                this.collapsed = true;
            } 
            this.assign_state();
        }

        unload() {
            super.unload();
            this.toggle_btn.off('click', this._toggle_menu_handle);
        }

        viewport_changed(e) {
            if(cone.viewport.state === cone.VP_MOBILE) {
                this.collapsed = false;
                this.elem.hide();
            }
            else if (this.cookie !== null) {
                this.collapsed = this.cookie;
                this.elem.show();
            }
            else {
                this.elem.show();
                let state = cone.viewport.state === cone.VP_SMALL;
                if(state != this.collapsed) {
                    this.collapsed = state;
                }
            }
            this.assign_state();
        }

        assign_state() {
            let elem_class = this.collapsed === true ? 'collapsed' : 'expanded';
            let button_class = 'bi bi-arrow-' + ((this.collapsed === true) ? 'right':'left') + '-circle';
            this.elem.attr('class', elem_class);
            this.toggle_arrow.attr('class', button_class);

            if(this.collapsed) {
                cone.main_menu_sidebar.bind_collapse();
            }
            else {
                cone.main_menu_sidebar.bind_expand();
            }
        }

        toggle_menu() {
            dd_reset(cone.main_menu_sidebar.arrows, cone.main_menu_sidebar.dropdowns);
            this.collapsed = !this.collapsed;
            this.assign_state();

            createCookie('sidebar', this.collapsed, null);
            this.cookie = this.collapsed;
        }
    };

    cone.Navtree = class extends cone.ViewPortAware {

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
            this.toggle_elems = $('li.navtreelevel_1', navtree);

            if (cone.viewport.state === cone.VP_MOBILE) {
                this.mv_to_mobile();
            }

            this._mouseenter_handle = this.align_width.bind(this);
            this.toggle_elems.on('mouseenter', this._mouseenter_handle);
            this._restore = this.restore_width.bind(this);
            this.toggle_elems.on('mouseleave', this._restore); //restore original size
        }

        unload() {
            super.unload();
            this.toggle_elems.off();
        }

        mv_to_mobile() {
            console.log('mv to mobile');
            this.elem.detach().appendTo(cone.topnav.content).addClass('mobile');
            this.content.hide();
            this.heading.off('click').on('click', content_toggle.bind(this));
    
            function content_toggle() {
                this.content.slideToggle('fast');
                toggle_arrow($('i.dropdown-arrow', this));
            }
        }

        viewport_changed(e) {
            if (cone.viewport.state === cone.VP_MOBILE) {
                this.mv_to_mobile();
            } else {
                this.elem.detach().appendTo(cone.sidebar_menu.content).removeClass('mobile');
                this.heading.off('click');
                this.content.show();
            }
        }

        align_width(evt) {
            if(cone.dragging) {
                return;
            }
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
    }

    cone.ThemeSwitcher = class {

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
            this.elem.on('click', this.switch_theme.bind(this));
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
    };

    cone.Searchbar = class extends cone.ViewPortAware {

        static initialize(context) {
            let elem = $('#cone-searchbar', context);
            if (!elem.length) {
                return;
            }
            if (cone.searchbar !== null) {
                cone.searchbar.unload();
            }
            cone.searchbar = new cone.Searchbar(elem);
        }

        constructor(elem) {
            super();
            this.elem = elem;
            this.search_text = $('#livesearch-input', this.elem);
            this.search_group = $('#livesearch-group', this.elem);
            this.dd = $('#cone-livesearch-dropdown', this.elem);
            this.viewport_changed(null);
        }

        viewport_changed(e) {
            if(cone.viewport.state === cone.VP_MEDIUM) {
                this.dd.addClass('dropdown-menu-end');
                this.search_text.detach().prependTo(this.dd);
            } else {
                this.search_text.detach().prependTo(this.search_group);
                this.dd.removeClass('dropdown-menu-end');
            }
        }
    }

    // livesearch = {
    //     binder: function(context) {
    //         var livesearch_source = new Bloodhound({
    //             datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
    //             queryTokenizer: Bloodhound.tokenizers.whitespace,
    //             remote: 'livesearch?term=%QUERY'
    //         });
    //         livesearch_source.initialize();
    //         var input = $('input#livesearch');
    //         var options = {
    //             name: 'livesearch',
    //             displayKey: 'value',
    //             source: livesearch_source.ttAdapter()
    //         };
    //         $.extend(options, livesearch_options);
    //         input.typeahead(null, options);
    //     }
    // };

})(jQuery);

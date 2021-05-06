/*
 * cone.app public JS
 *
 * Requires:
 *     jquery
 *     bdajax
 *     typeahead.js
 */

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
    dragging: false
};

// var livesearch_options = new Object();

(function($) {

    // viewport related
    cone.viewport = null;
    cone.VP_MOBILE = 0;
    cone.VP_SMALL = 1;
    cone.VP_MEDIUM = 2;
    cone.VP_LARGE = 3;

    // layout components
    cone.sidebar_menu = null;
    cone.main_menu = null;
    cone.navtree = null;
    cone.topnav = null;

    $(function() {
        // create viewport singleton
        cone.viewport = new cone.ViewPort();

        bdajax.register(function(context) {
            let theme_switcher = new cone.ThemeSwitcher(context, cone.default_themes);
            theme_switcher.current =
                readCookie('modeswitch') != null ?
                readCookie('modeswitch') :
                cone.theme_switcher.modes[0];

            new cone.Topnav(context);
            new cone.MainMenu(context);
            new cone.SidebarMenu(context);

            cone.topnav.viewport_changed(null);
            cone.main_menu.viewport_changed(null);
            cone.sidebar_menu.viewport_changed(null);

            new cone.Searchbar(context);
            new cone.Navtree(context);
            new cone.Content(context);

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

        constructor(context) {
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

        constructor(context) {
            cone.content = this;
            this.elem = $('#page-content-wrapper');
            this.scrollbar = new cone.ScrollBarY(this.elem);
        }
    }

    cone.MainMenuItem = class {

        constructor(elem) {
            this.elem = elem;
            this.children = this.elem.data('menu-items');
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
                if(e.type == 'mouseenter') {
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

    cone.MainMenu = class extends cone.ViewPortAware {

        constructor(context) {
            let mm_top = $('#main-menu', context);
            let mm_top_scrollbar = new cone.ScrollBarX(mm_top);

            let mm_sb = $('#mainmenu_sidebar', context);
            if(!mm_top.length && !mm_sb.length) {
                return;
            }
            if(cone.main_menu !== null) {
                cone.main_menu.unload();
            }

            super();

            this.mm_top = mm_top;
            this.main_menu_items = [];
            let that = this;
            
            $('li', mm_top).each(function() {
                let main_menu_item = new cone.MainMenuItem($(this));
                that.main_menu_items.push(main_menu_item);
            });

            this.mm_sb = mm_sb;
            this.sb_items = $('>li', this.mm_sb);
            this.sb_arrows = $('i.dropdown-arrow', this.sb_items);
            this.sb_dropdowns = $('ul', this.sb_items);
            this.sb_dd_sel = 'ul.cone-mainmenu-dropdown-sb';

            this.sb_menus = $('.sb-menu', this.mm_sb);

            //this.viewport_changed(null);
    
            this._mousein_sb = this.mousein_sidebar.bind(this);
            this._mouseout_sb = this.mouseout_sidebar.bind(this);
            this._toggle = this.toggle_dropdown.bind(this);
            this._bind = this.bind_events_sidebar.bind(this);
    
            cone.main_menu = this;
        }
    
        viewport_changed(e) {
            dd_reset(this.sb_arrows, this.sb_dropdowns);
            if (cone.viewport.state === cone.VP_MOBILE) {
                if (this.mm_sb.length) {
                    $(this._bind);
                    this.mm_top.hide();
                    this.mm_sb.detach()
                        .appendTo(cone.topnav.content)
                        .addClass('mobile');
                } else {
                    for (let i in this.main_menu_items) {
                        let item = this.main_menu_items[i];
                        if (!item.menu) {
                            return;
                        }
                        item.mv_to_mobile();
                    }
                }
            } else {
                if (this.mm_sb.length) {
                    this.mm_sb.detach()
                        .prependTo(cone.sidebar_menu.content)
                        .removeClass('mobile');
                }
                this.mm_top.show();
                for (let i in this.main_menu_items) {
                    let item = this.main_menu_items[i];
                    if (!item.menu) {
                        return;
                    }
                    item.mv_to_top();
                }
            }
        }
    
        mousein_sidebar(evt) {
            let target = $(evt.currentTarget);
            if (cone.dragging) {
                return;
            }
            target.addClass('hover');
            $(this.sb_dd_sel, target).show();
            if(target.outerWidth() > $('ul', target).outerWidth()) {
                $('ul', target).css('width', target.outerWidth());
            } else {
                target.css('width', $('ul', target).outerWidth());
            }
        }
    
        mouseout_sidebar(evt) {
            $(this.sb_dd_sel).hide();
            $(evt.currentTarget).removeClass('hover');
            $(evt.currentTarget).css('width', 'auto');
        }
    
        toggle_dropdown(evt) {
            let target = $(evt.currentTarget);
            let item = target.parent().parent();
            $(this.sb_dd_sel, item).slideToggle('fast');
            toggle_arrow(target);
        }
    
        bind_events_sidebar() {
            if (cone.sidebar_menu.state) {
                this.sb_dropdowns.hide();
                this.sb_arrows.off('click');
                this.sb_items.off().on('mouseenter', this._mousein_sb);
                this.sb_items.on('mouseleave', this._mouseout_sb);
            } else {
                this.sb_items.off('mouseenter mouseleave');
                this.sb_arrows.off().on('click', this._toggle);
            }
        }
    }

    cone.Topnav = class extends cone.ViewPortAware {

        constructor(context) {
            let elem = $('#topnav', context);
            if (!elem.length) {
                return;
            }
            if(cone.topnav !== null) {
                cone.topnav.unload();
            }

            super();

            this.elem = elem;
            this.content = $('#topnav-content');
            this.toggle_button = $('#mobile-menu-toggle');
            this.logo = $('#cone-logo');
            this.tb_dropdowns = $('#toolbar-top>li.dropdown');
            
            this._toggle_menu_handle = this.toggle_menu.bind(this);
            this.toggle_button.on('click', this._toggle_menu_handle);

            // tmp
            this.pt = $('#personaltools');
            this.user =  $('#user');
            this.pt_handle();
            // end tmp

            cone.topnav = this;
        }

        unload() {
            super.unload();
            this.toggle_button.off('click', this._toggle_menu_handle);
        }

        toggle_menu() {
            this.content.slideToggle('fast');
            if(this.content.css('display') == 'block') {
                this.content.css('display', 'flex');
            }
        }

        viewport_changed(e) {
            if(!cone.main_menu.mm_top.length) {
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
        }

        pt_handle() {
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

        constructor(context) {
            if (cone.sidebar_menu !== null) {
                cone.sidebar_menu.unload();
            }
            super();

            cone.sidebar_menu = this;

            this.elem = $('#sidebar_left');
            this.scrollbar = new cone.ScrollBarSidebar(this.elem);

            this.content = $('#sidebar_content');
            this.state = null;
            this.cookie = null;

            this.toggle_btn = $('#sidebar-toggle-btn');
            this.toggle_arrow = $('i', this.toggle_btn);

            this.handle_cookie();

            this._toggle_menu_handle = this.toggle_menu.bind(this)
            this.toggle_btn.off('click').on('click', this._toggle_menu_handle);
        }

        unload() {
            super.unload();
            this.toggle_btn.off('click', this._toggle_menu_handle);
        }

        assign_state() {
            let elem_class = this.state === true ? 'collapsed' : 'expanded';
            let button_class = 'bi bi-arrow-' + ((this.state === true) ? 'right':'left') + '-circle';
            this.elem.attr('class', elem_class);
            this.toggle_arrow.attr('class', button_class);
            $(cone.main_menu._bind);
        }

        viewport_changed(e) {
            if (cone.viewport.state === cone.VP_MOBILE) {
                this.state = false;
                this.elem.hide();
            } else {
                this.state = this.cookie;
                this.elem.show();
            }
            this.assign_state();

            if (this.cookie === null) {
                let state = cone.viewport.state === cone.VP_SMALL;
                if(state != this.state) {
                    this.state = state;
                    this.assign_state();
                }
            }
        }

        handle_cookie() {
            let cookie = readCookie('sidebar');
            if(cookie == "true") {
                cookie = true;
            } else if(cookie == "false") {
                cookie = false;
            } else {
                cookie = null;
            }
            this.state = cookie;
            //this._assign_state;
            this.cookie = cookie;
        }

        toggle_menu() {
            dd_reset(cone.main_menu.sb_arrows, cone.main_menu.sb_dropdowns);
            this.state = (this.state) ? false:true;
            this.assign_state();

            createCookie('sidebar', this.state, null);
            this.cookie = this.state;
        }
    };

    cone.Navtree = class extends cone.ViewPortAware {

        constructor(context) {
            let navtree = $('#navtree', context);
            if (!navtree.length) {
                return;
            }
            if (cone.navtree !== null) {
                cone.navtree.unload();
            }

            super();

            this.navtree = navtree;
            this.content = $('#navtree-content', this.navtree);
            this.heading = $('#navtree-heading', this.navtree);
            this.toggle_elems = $('li.navtreelevel_1', navtree);

            this.viewport_changed(null);

            this._mouseenter_handle = this.align_width.bind(this);
            this.toggle_elems.on('mouseenter', this._mouseenter_handle);
            this._restore = this.restore_width.bind(this);
            this.toggle_elems.on('mouseleave', this._restore); //restore original size
            cone.navtree = this;
        }

        unload() {
            super.unload();
            this.toggle_elems.off();
        }

        viewport_changed(e) {
            if (cone.viewport.state === cone.VP_MOBILE) {
                this.navtree.detach().appendTo(cone.topnav.content).addClass('mobile');
                let content = this.content;
                this.heading.off('click').on('click', function() {
                    content.slideToggle('fast');
                    toggle_arrow($('i.dropdown-arrow', this));
                })
                this.content.hide();
            } else {
                this.navtree.detach().appendTo(cone.sidebar_menu.content).removeClass('mobile');
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

        constructor(context, modes) {
            let elem = $('#switch_mode');
            if (!elem.length) {
                return;
            }
            cone.theme_switcher = this;
            this.elem = elem;
            this.modes = modes;
            this.link = $('head #colormode-styles');
            this.state = false;
            this.elem.off().on('click', this.switch_theme.bind(this));
            this.switch_checkbox();
        }

        get current() {
            return this.link.attr('href');
        }

        set current(value) {
            this.link.attr('href', value);
        }

        switch_checkbox() {
            if(readCookie('modeswitch') != null){
                let state = readCookie('modeswitch') === this.modes[0] ? false:true;
                this.elem.prop('checked', state);
            }
        }

        switch_theme(evt) {
            evt.stopPropagation();
            let theme = this.current === this.modes[0] ? this.modes[1] : this.modes[0];
            this.current = theme;
            createCookie("modeswitch", theme, null);
            this.switch_checkbox();
        }
    };

    cone.Searchbar = class extends cone.ViewPortAware {

        constructor(context) {
            let elem = $('#cone-searchbar');
            if (!elem.length) {
                return;
            }
            if (cone.searchbar_handler !== null) {
                cone.searchbar_handler.unload();
            }

            super();

            this.elem = elem;
            this.search_text = $('#livesearch-input', this.elem);
            this.search_group = $('#livesearch-group', this.elem);
            this.dd = $('#cone-livesearch-dropdown', this.elem);

            this.viewport_changed(null);

            cone.searchbar_handler = this;
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

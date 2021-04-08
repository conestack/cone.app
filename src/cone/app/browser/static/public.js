/*
 * cone.app public JS
 *
 * Requires:
 *     jquery
 *     bdajax
 *     typeahead.js
 */

cone = {
    sidebar_menu: null,
    main_menu: null,
    theme_switcher: null,
    searchbar_handler: null,
    navtree: null,
    topnav: null,
    view_mobile: null,
    vp_flag: true,
    default_themes: [
        '/static/light.css',
        '/static/dark.css'
    ]
};

$(function() {
    let state = null;

    if(window.matchMedia(`(max-width:560px)`).matches) {
        state = true;
     } else {
        state = false;
     }
     cone.view_mobile = state;
})

$(window).on('resize', function(evt) {
    let state = null;

    if(window.matchMedia(`(max-width:560px)`).matches) {
       state = true;
    } else {
       state = false;
    }
    let flag = state !== cone.view_mobile;
    cone.view_mobile = state;
    cone.vp_flag = flag;

    if(flag) { // reset dropdowns
        console.log('reset dropdowns');
        $('.dropdown-arrow').attr('class', 'dropdown-arrow bi bi-chevron-down');
        $('.cone-mainmenu-dropdown-sb').hide();
        $('.cone-mainmenu-dropdown').hide();
        if ($('.dropdown-menu').is(":visible")) {
            console.log('a dropdown-menu is visible');
            $('.dropdown').trigger('click.bs.dropdown'); 
        }
    }
});

// dropdown arrows
function dd_click(arrow) {
    let currentMode = $(arrow).attr('class');
    let mode = 'dropdown-arrow bi bi-chevron-';
    let newMode = mode + ((currentMode == mode + 'down') ? 'up':'down');
    $(arrow).attr('class', newMode);
}

// additional livesearch options
var livesearch_options = new Object();

(function($) {

    $(function() {
        bdajax.register(function(context) {
            new cone.ThemeSwitcher(context, cone.default_themes);
            new cone.SidebarMenu(context);
            new cone.Topnav(context);
            new cone.Searchbar(context);
            new cone.MainMenu(context);
            new cone.Navtree(context);
        }, true);
        bdajax.register(livesearch.binder.bind(livesearch), true);
    });

    cone.MainMenuItem = class {

        constructor(mm_top) {
            this.elem = mm_top;
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
            console.log('cone.main_menu_item.mv_to_mobile()');
            let menu = this.menu;
            let elem = this.elem;
            menu.off();
            elem.off();
            menu.css('left', '0');
            if(!elem.children('div').length) {
                menu.detach().appendTo(elem);
            }
            $('.dropdown-arrow', elem).off().on('click', function(evt){
                console.log('top mm click');
                menu.slideToggle('fast');
                dd_click(this);
            });
        }

        mv_to_top() {
            console.log('cone.main_menu_item.mv_to_top()');
            let menu = this.menu;
            let elem = this.elem;
            if(elem.children('div').length) {
                menu.detach().appendTo('#layout');
            }
            $('.dropdown-arrow', this.elem).off();
            elem.off().on('mouseenter mouseleave', function(e) {
                menu.toggle();
                menu.offset({left: elem.offset().left});
            });
            menu.off().on('mouseenter mouseleave', function(e) {
                menu.toggle();
            })
        }
    }

    cone.MainMenu = class {

        constructor(context) {
            if(cone.main_menu !== null){
                cone.main_menu.unload();
            }
    
            let mm_top = $('#main-menu', context);
            let mm_sb = $('#mainmenu_sidebar', context);
            if(!mm_top.length && !mm_sb.length) {
                return;
            }
            this.mm_top = mm_top;
            this.mm_sb = mm_sb;
            this.main_menu_items = [];
            let that = this;
            
            $('.mainmenu-item', mm_top).each(function() {
                let main_menu_item = new cone.MainMenuItem($(this));
                that.main_menu_items.push(main_menu_item);
            });
    
            this._handle = this.handle_visibility.bind(this);
            $(this._handle);
            $(window).on('resize', this._handle);
    
            this._mousein_sb = this.mousein_sidebar.bind(this);
            this._mouseout_sb = this.mouseout_sidebar.bind(this);
            this._toggle = this.toggle_dropdown.bind(this);
            this._bind = this.bind_events_sidebar.bind(this);
    
            cone.main_menu = this;
        }
    
        unload() {
            $(window).off('resize', this._handle);
        }
    
        handle_visibility(evt) {
            if(!cone.vp_flag) {
                return;
            }
            if(!this.mm_top.length) {
                $('#cone-logo').css('margin-right', 'auto');
            }
            this.mm_top.scrollLeft(this.mm_top.outerWidth());
            console.log('MainMenu.handle_visibility');

            if(cone.view_mobile) {
                console.log('cone.view_mobile');
                if(this.mm_sb.length) {
                    this.mm_top.hide();
                    this.mm_sb.detach().appendTo('#topnav-content').addClass('mobile');
                } else {
                    for(let i in cone.main_menu.main_menu_items) {
                        let item = cone.main_menu.main_menu_items[i];
                        if(!item.menu) {
                            return;
                        }
                        item.mv_to_mobile();
                    }
                }
            }
            else {
                console.log('cone.view_desktop');
                if(this.mm_sb.length) {
                    this.mm_sb.detach().prependTo('#sidebar_left').removeClass('mobile');
                }
                this.mm_top.show();
                for(let i in this.main_menu_items){
                    let item = this.main_menu_items[i];
                    if(!item.menu) {
                        return;
                    }
                    item.mv_to_top();
                }
            }
        }
    
        mousein_sidebar(evt) {
            console.log('mousein');
            let target = $(evt.currentTarget);
            $('.cone-mainmenu-dropdown-sb', target).show();
            if(target.outerWidth() > $('ul', target).outerWidth()) {
                $('ul', target).css('width', target.outerWidth());
            } else {
                target.css('width', $('ul', target).outerWidth());
            }
        }
    
        mouseout_sidebar(evt) {
            console.log('mouseout');
            $('.cone-mainmenu-dropdown-sb').hide();
            $(evt.currentTarget).css('width', 'auto');
        }
    
        toggle_dropdown(evt) {
            let target = $(evt.currentTarget);
            let item = target.parent().parent();
            $('.cone-mainmenu-dropdown-sb', item).slideToggle('fast');
            dd_click(target);
        }
    
        bind_events_sidebar() {
            console.log('cone.sidebar_menu.collapsed: ' + cone.sidebar_menu.state);
            let elem = $('.sb-menu', this.mm_sb);
            if(cone.sidebar_menu.state == true){
                $('.cone-mainmenu-dropdown-sb').hide();
                $('.dropdown-arrow', elem).off('click');
                elem.off().on('mouseenter', this._mousein_sb);
                elem.on('mouseleave', this._mouseout_sb);
            } else {
                elem.off('mouseenter mouseleave');
                $('.dropdown-arrow', elem).off().on('click', this._toggle);
            }
        }
    }

    cone.Topnav = class {

        constructor(context) {

            let elem = $('#topnav', context);
            if (!elem.length) {
                return;
            }
            if(cone.topnav !== null) {
                cone.topnav.unload();
            }

            this.elem = elem;
            this.content = $('#topnav-content', elem);
            this.toggle_button = $('#mobile-menu-toggle', elem);
            
            this._toggle = this.toggle_menu.bind(this);
            this.toggle_button.on('click', this._toggle);

            this._handle = this.handle_visibility.bind(this);
            $(this._handle);
            $(window).on('resize', this._handle);

            this.pt = $('#personaltools', context);
            this._pt_handle = this.pt_handle.bind(this);
            $(this._pt_handle);
            $(window).on('resize', this._pt_handle);

            cone.topnav = this;
        }

        unload() {
            $(window).off('resize', this._handle);
            this.toggle_button.off('click', this.toggle_menu.bind(this));
        }

        toggle_menu(evt) {
            this.content.slideToggle('fast');
            if(this.content.css('display') == 'block') {
                this.content.css('display', 'flex');
            }
        }

        handle_visibility(evt) {
            if(!cone.vp_flag) {
                return;
            }
            if (cone.view_mobile) {
                this.content.hide();
                this.elem.addClass('mobile');
                // hide menu on toolbar click
                $('#toolbar-top>.dropdown').off().on('show.bs.dropdown', function() {
                    console.log('hide mobile menu on toolbar click');
                    cone.topnav.content.hide();
                });
            } else {
                this.content.show();
                this.elem.removeClass('mobile');
                $('#toolbar-top>.dropdown').off();
            }
        }

        pt_handle() {
            if(!cone.vp_flag) {
                return;
            }

            if(cone.view_mobile) {
                this.pt.off('show.bs.dropdown').on('show.bs.dropdown', function() {
                    $('#user', this).stop(true, true).slideDown('fast');
                    dd_click($('.dropdown-arrow', '#personaltools'));
                });
                this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', function() {
                    $('#user', this).stop(true, true).slideUp('fast');
                    dd_click($('.dropdown-arrow', '#personaltools'));
                });
            } else {
                this.pt.off('show.bs.dropdown').on('show.bs.dropdown', function() {
                    $('#user', this).show();
                });
                this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', function() {
                    $('#user', this).hide();
                });
            }
        }
    }

    cone.SidebarMenu = class {

        constructor(context) {
            if (cone.sidebar_menu !== null) {
                cone.sidebar_menu.unload();
            }
            cone.sidebar_menu = this;
            this.sidebar = $('#sidebar_left');
            this.state = null;
            this.flag = true;
            this.toggle_btn = $('#sidebar-toggle-btn');
            this.toggled = false;

            this._toggle = this.toggle_menu.bind(this);
            this.toggle_btn.on('click', this._toggle);

            this._resize_handle = this.handle_menu_visibility.bind(this);
            $(this._resize_handle);
            $(window).on('resize', this._resize_handle);
            this.handle_menu_visibility(null);

            this._handle_state = this.handle_state.bind(this);
            $(this._handle_state);
            $(window).on('resize', this._handle_state);
        }

        unload() {
            $(window).off('resize', this._resize_handle);
        }

        handle_state() {
            if(this.toggled) {
                return;
            }

            let state = null;

            if(!cone.view_mobile && window.matchMedia(`(max-width: 990px)`).matches) {
                this.sidebar.addClass('collapsed').removeClass('expanded');
                state = true;
            } else {
                this.sidebar.addClass('expanded').removeClass('collapsed');
                state = false;
            }
            let flag = state !== this.state;
            this.state = state;

            if(flag) {
                $(cone.main_menu._bind);
                console.log('cone.main_menu._bind');
            }
        }

        toggle_menu(evt) {
            console.log('sidebar toggle click');
            this.toggled = true;

            if(this.sidebar.hasClass('collapsed')){
                this.sidebar.removeClass('collapsed').addClass('expanded');
                this.state = false;
            } else if(this.sidebar.hasClass('expanded')) {
                this.sidebar.removeClass('expanded').addClass('collapsed');
                this.state = true;
            }
            this.flag = true;
            $(cone.main_menu._bind);
            console.log('cone.main_menu._bind');
        }

        handle_menu_visibility(evt) {
            if(!cone.vp_flag) {
                return;
            }
            console.log('Sidebar.handle_menu_visibility');
            if (cone.view_mobile) {
                this.sidebar.hide();
            } else {
                this.sidebar.show();
            }
        }
    };

    cone.Navtree = class {

        constructor(context) {

            let navtree = $('#navtree', context);
            if (!navtree.length) {
                return;
            }
            if (cone.navtree !== null) {
                cone.navtree.unload();
            }
            this.navtree = navtree;
            this._resize_handle = this.toggle_visibility.bind(this);
            $(this._resize_handle);
            $(window).on('resize', this._resize_handle);
            this._mouseenter_handle = this.align_width.bind(this);
            $('.navtreelevel_1', navtree).on('mouseenter', this._mouseenter_handle);
            this._restore = this.restore_width.bind(this);
            $('.navtreelevel_1', navtree).on('mouseleave', this._restore); //restore original size
            cone.navtree = this;
        }

        unload() {
            $(window).off('resize', this._resize_handle);
            $('.navtreelevel_1', this.navtree).off();
        }

        toggle_visibility(evt) {
            if(!cone.vp_flag) {
                return;
            }
            // console.log('Navtree.toggle_visibility');
            if (cone.view_mobile) {
                $('#navtree-content', this.navtree).hide();
                this.navtree.detach().appendTo('#topnav-content').addClass('mobile');
                $('#navtree-heading', this.navtree).off('click').on('click', function(evt) {
                    $('#navtree-content', this.navtree).slideToggle('fast');
                    dd_click($('.dropdown-arrow', this));
                })
            } else {
                $('#navtree-heading', this.navtree).off('click');
                this.navtree.detach().appendTo('#sidebar_left').removeClass('mobile');
                $('#navtree-content', this.navtree).show();
            }
        }

        align_width(evt) {
            let target = $(evt.currentTarget);
            if(target.outerWidth() > $('ul', target).outerWidth()) {
                $('ul', target).css('width', target.outerWidth());
            } else {
                target.css('width', $('ul', target).outerWidth());
            }
        }

        restore_width(evt) {
            $(evt.currentTarget).css('width', 'auto');
        }
    }

    cone.ThemeSwitcher = class {

        constructor(context, modes) {
            let elem = $('input.switch_mode', context);
            if (!elem.length) {
                return;
            }
            cone.theme_switcher = this;
            this.elem = elem;
            this.modes = modes;
            this.link = $('head #colormode-styles');
            this.elem.on('click', this.switch_theme.bind(this));
        }

        get current() {
            return this.link.attr('href');
        }

        set current(value) {
            this.link.attr('href', value);
        }

        switch_theme(evt) {
            evt.stopPropagation();
            let theme = this.current === this.modes[0] ? this.modes[1] : this.modes[0]
            this.current = theme;
        }
    };

    cone.Searchbar = class {

        constructor(context, threshold_1, threshold_2) {

            let elem = $('#cone-searchbar', context);
            if (!elem.length) {
                return;
            }
            if (cone.searchbar_handler !== null) {
                cone.searchbar_handler.unload();
            }

            this.elem = elem;
            this.searchbar = $('#cone-searchbar');
            this.search_text = $('#livesearch-input');
            this.dd = $('#cone-livesearch-dropdown');

            this._handle = this.handle_visibility.bind(this);
            $(window).on('resize', this._handle);

            cone.searchbar_handler = this;
        }

        unload() {
            $(window).off('resize', this._handle);
        }

        handle_visibility(evt){
            if(window.matchMedia(`(min-width:560px) and (max-width: 1200px)`).matches) {
                this.dd.addClass('dropdown-menu-end');
                this.search_text.detach().prependTo('#cone-livesearch-dropdown');
            } else {
                this.search_text.detach().prependTo('#livesearch-group');
                this.dd.removeClass('dropdown-menu-end');
            }
        }
    }

    livesearch = {
        binder: function(context) {
            var livesearch_source = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                remote: 'livesearch?term=%QUERY'
            });
            livesearch_source.initialize();
            var input = $('input#livesearch');
            var options = {
                name: 'livesearch',
                displayKey: 'value',
                source: livesearch_source.ttAdapter()
            };
            $.extend(options, livesearch_options);
            input.typeahead(null, options);
        }
    };

})(jQuery);

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

$(window).on('resize', function() {
    let state = null;

     if(window.matchMedia(`(max-width:560px)`).matches) {
        state = true;
     } else {
        state = false;
     }

     let flag = state !== cone.view_mobile;
     cone.view_mobile = state;
     cone.vp_flag = flag;
});

// additional livesearch options
var livesearch_options = new Object();

(function($) {

    $(function() {
        bdajax.register(function(context) {
            new cone.ThemeSwitcher(context, cone.default_themes);
            new cone.SidebarMenu(context);
            new cone.Topnav(context);
            new cone.Searchbar(context, 200, 130);
            new cone.MainMenu(context);
            new cone.Navtree(context);
        }, true);
        bdajax.register(livesearch.binder.bind(livesearch), true);
    });

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
            $('.navtreelevel_1', this.navtree).off('mouseenter', this._mouseenter_handle);
        }

        toggle_visibility(evt) {
            if(!cone.vp_flag) {
                return;
            }
            console.log('Navtree.toggle_visibility');
            if (cone.view_mobile) {
                $('#navtree-content', this.navtree).hide();
                this.navtree.detach().appendTo('#topnav-content').addClass('mobile');
                $('#navtree-heading', this.navtree).off('click').on('click', function(e) {
                    $('#navtree-content', this.navtree).slideToggle('fast');
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
            this._render = this.render_dd.bind(this);
            $(this._render);

            let main_menu_item = this;
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
            menu.hide();

            if(!elem.children('div').length) {
                menu.detach().appendTo(elem);
            }
            $('a.dropdown-arrow', elem).off().on('click', function(e){
                menu.slideToggle('fast');
            });
            elem.off();
            menu.off();
            menu.css('left', '0');
        }

        mv_to_top() {
            let menu = this.menu;
            let elem = this.elem;
            menu.hide();

            if(elem.children('div').length) {
                menu.detach().appendTo('#layout');
            }
            
            $('a.dropdown-arrow', this.elem).off();
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

            let elem = $('#main-menu', context);
            if(!elem.length){
                return;
            }
            if(cone.main_menu !== null){
                cone.main_menu.unload();
            }
            this.elem = elem;
            this.main_menu_items = [];
            let that = this;
            $('.scroll-container', $('#topnav')).scrollLeft(elem.outerWidth()); // scroll to right (rtl scroll direction)

            $('.mainmenu-item', elem).each(function() {
                let main_menu_item = new cone.MainMenuItem($(this));
                that.main_menu_items.push(main_menu_item);
            });

            this._handle = this.handle_visibility.bind(this);
            $(this._handle);
            $(window).on('resize', this._handle);

            cone.main_menu = this;
        }

        unload() {
            $(window).off('resize', this._handle);
        }

        handle_visibility(evt) {
            if(!cone.vp_flag) {
                return;
            }
            console.log('MainMenu.handle_visibility');
            $('.cone-mainmenu-dropdown').hide();

            for(let i in cone.main_menu.main_menu_items){
                let item = cone.main_menu.main_menu_items[i];
                if(!item.menu) {
                    return;
                }
                if(cone.view_mobile){
                    console.log('main_menu_item.mv_to_mobile');
                    item.mv_to_mobile();
                } else {
                    console.log('main_menu_item.mv_to_top');
                    item.mv_to_top();
                } 
            }
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
            console.log('Topnav.handle_visibility');
            this.content.hide();
            if (cone.view_mobile) {
                this.elem.addClass('mobile');
            } else {
                this.elem.removeClass('mobile');
            }
        }
    }

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

    cone.SidebarMenu = class {

        constructor(context) {
            if (cone.sidebar_menu !== null) {
                cone.sidebar_menu.unload();
            }
            cone.sidebar_menu = this;
            this.sidebar = $('#sidebar_left');
            this.toggle_btn = $('#sidebar-toggle-btn');

            this.toggle_btn.on('click', this.toggle_menu.bind(this));
            this._resize_handle = this.handle_menu_visibility.bind(this);
            $(this._resize_handle);
            $(window).on('resize', this._resize_handle);
            this.handle_menu_visibility(null);
        }

        unload() {
            $(window).off('resize', this._resize_handle);
        }

        toggle_menu(evt) {
            console.log('sidebar toggle click');
            if(this.sidebar.hasClass('collapsed')){
                this.sidebar.removeClass('collapsed');
                this.sidebar.addClass('expanded');
            } else if(this.sidebar.hasClass('expanded')) {
                this.sidebar.removeClass('expanded');
                this.sidebar.addClass('collapsed');
            }
        }

        handle_menu_visibility(evt) {
            if(window.matchMedia(`(max-width: 991.9px)`).matches) {
                this.sidebar.addClass('collapsed');
                this.sidebar.removeClass('expanded');
            } else {
                this.sidebar.addClass('expanded');
                this.sidebar.removeClass('collapsed');
            }

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

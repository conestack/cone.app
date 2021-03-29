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
    // mobile_menu: null,
    navtree: null,
    topnav: null,
    default_themes: [
        '/static/light.css',
        '/static/dark.css'
    ]
};

// additional livesearch options
var livesearch_options = new Object();

(function($) {

    $(function() {
        bdajax.register(function(context) {
            new cone.ThemeSwitcher(context, cone.default_themes);
            new cone.SidebarMenu(context, 560);
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
            $(window).on('resize', this._resize_handle);
            this._mouseenter_handle = this.align_width.bind(this);
            $('.navtreelevel_1', navtree).on('mouseenter', this._mouseenter_handle);
            cone.navtree = this;
        }

        unload() {
            $(window).off('resize', this._resize_handle);
            $('.navtreelevel_1', this.navtree).off('mouseenter', this._mouseenter_handle);
        }

        toggle_visibility(evt) {
            console.log('Navtree.toggle_visibility');
            if (window.matchMedia(`(max-width:560px)`).matches) {
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
            this.dropdown = $('ul', this.menu);
            $(this.render_dd());
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
                this.dropdown.append(dd_item);
            }
            this.menu.appendTo('#layout');
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

            $('.mainmenu-item').each(function() {
                let main_menu_item = new cone.MainMenuItem($(this));
                that.main_menu_items.push(main_menu_item);
            });

            this._resize_handle = this.handle_visibility.bind(this);
            $(window).on('resize', this._resize_handle);

            this._toggle_mb = this.toggle_mobile.bind(this);
            this._toggle_h = this.toggle_hover.bind(this);

            cone.main_menu = this;
        }

        unload() {
            $(window).off('resize', this._resize_handle);

            for(let i in this.main_menu_items){
                let item = this.main_menu_items[i];

                item.elem.off();
                item.menu.off();
                $('a.dropdown-arrow', item.elem).off('click', this._toggle_dd);
            }
        }

        handle_visibility() {
            for(let i in this.main_menu_items){
                let item = this.main_menu_items[i];
                if(!item.menu) {
                    return;
                }
                if(window.matchMedia(`(max-width:560px)`).matches) {
                    item.menu.detach().appendTo(item.elem);
                    $('a.dropdown-arrow', item.elem).off('click').on('click', this._toggle_mb);
                } else {
                    $('a.dropdown-arrow', item.elem).off('click', this._toggle_mb);
                    item.menu.detach().appendTo('#layout');

                    item.elem.off().on('mouseenter mouseleave', this._toggle_h);
                    item.menu.off().on('mouseenter mouseleave', this._toggle_h);
                }
            }
        }

        toggle_mobile(evt) {
            evt.preventDefault();
            let target = $(evt.currentTarget);
            console.log('elem.toggle_dropdown');
            console.log(target);
            $('div', target.parent('li')).slideToggle('fast');
        }

        toggle_hover(evt) {
            item.elem.toggleClass('active');
            item.menu.toggle();
            item.menu.offset({left: item.elem.offset().left});
            item.elem.toggleClass('active');
            $(this).toggle();
        }

        handle_visibility_bk() {
            
            for(let i in this.main_menu_items){
                let item = this.main_menu_items[i];

                if(!item.menu) {
                    return;
                }

                if(window.matchMedia(`(max-width:560px)`).matches) {
                    item.menu.detach().appendTo(item.elem);
                    $('a.dropdown-arrow', item.elem).off().on('click', function(evt) {
                        evt.preventDefault();
                        console.log('clicked arrow');
                        item.menu.slideToggle('fast');
                    });
                } else {
                    item.menu.detach().appendTo('#layout');

                    item.elem.off().on('mouseenter mouseleave', function(e) {
                        item.elem.toggleClass('active');
                        item.menu.toggle();
                        item.menu.offset({left: item.elem.offset().left});
                    });
                    item.menu.off().on('mouseenter mouseleave', function(e) {
                        item.elem.toggleClass('active');
                        $(this).toggle();
                    })
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
            this.toggle_button = $('#mobile-menu-toggle', elem);
            this.toggle_button.off().on('click', this.toggle_menu.bind(this));

            this._handle = this.handle_visibility.bind(this);
            $(window).on('resize', this._handle);

            cone.topnav = this;
        }

        toggle_menu(evt) {
            $('#topnav-content').slideToggle('fast');
            if($('#topnav-content').css('display') == 'block') {
                $('#topnav-content').css('display', 'flex');
            }
        }

        handle_visibility(evt) {
            console.log('Topnav.handle_visibility');
            if (window.matchMedia(`(max-width: 560px)`).matches) {
                this.elem.addClass('mobile');
            } else {
                this.elem.removeClass('mobile');
            }
        }
    }

    cone.Searchbar = class {

        constructor(context, threshold_1, threshold_2) {
            cone.searchbar_handler = this;

            this._handle = this.handle_visibility.bind(this);
            $(this._handle);
            $(window).on('resize', this._handle);

            this.dd = $('#cone-livesearch-dropdown');
            this.searchbar = $('#cone-searchbar');
            this.search_text = $('#livesearch-input');
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

        constructor(context, threshold) {
            if (cone.sidebar_menu !== null) {
                cone.sidebar_menu.unload();
            }
            cone.sidebar_menu = this;
            this.threshold = threshold;
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
            if(this.sidebar.hasClass('collapsed')){
                this.sidebar.removeClass('collapsed');
                this.sidebar.addClass('expanded');
            } else if(this.sidebar.hasClass('expanded')) {
                this.sidebar.removeClass('expanded');
                this.sidebar.addClass('collapsed');
            }
        }

        handle_menu_visibility(evt) {
            if (window.matchMedia(`(max-width: ${this.threshold}px)`).matches) {
                this.sidebar.hide();
            } else {
                this.sidebar.show();
                if(window.matchMedia(`(max-width: 991.9px)`).matches) {
                    this.sidebar.addClass('collapsed');
                    this.sidebar.removeClass('expanded');
                } else {
                    this.sidebar.addClass('expanded');
                    this.sidebar.removeClass('collapsed');
                }
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

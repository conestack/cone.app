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
    default_themes: [
        'static/light.css',
        'static/dark.css'
    ]
};

// additional livesearch options
var livesearch_options = new Object();

(function($) {

    $(function() {
        bdajax.register(function(context) {
            new cone.ThemeSwitcher(context, cone.default_themes);
            new cone.SidebarMenu(context, 575.9);
            new cone.Searchbar(context, 250, 130);
            new cone.MainMenu(context);
        }, true);
        bdajax.register(livesearch.binder.bind(livesearch), true);
    });

    //searchbar
    cone.Searchbar = class {

        constructor(context, threshold_1, threshold_2) {
            cone.searchbar_handler = this;
            this.threshold_1 = threshold_1;
            this.threshold_2 = threshold_2;

            this._get_total_width = this.get_total_width.bind(this);
            $(window).on('resize', this._get_total_width);

            this.searchbar_btn = $('#searchbar-button', context);
            this.searchbar_text = $('#search-text', context);
            this.toolbar_top = $('#toolbar-top', context);
            this.searchbar = $('#topnav-searchbar', context);
            this.topnav_children = $('#topnav-container').children('div').not('#topnav-searchbar');
            this.mobile_menu = $('#sidebar_left');

            this._resize_handle = this.resize_handle.bind(this);
            $(this._resize_handle);
            $(window).on('resize', this._resize_handle);
            // this.searchbar_btn.on('click', this._resize_handle);
        }

        get_total_width() {
            console.log("get total width");
            console.log(this.topnav_children);

            let total_width = 0;
            $(this.topnav_children).each(function(index) {
                total_width += parseInt($(this).outerWidth(true), 10);
            });

            let free_space = $(window).width() - total_width;

            console.log('total width:' + total_width);
            console.log('window width:' + $(window).width());
            console.log('free space:' + free_space);

            return free_space;
        }

        resize_handle() { // calculate width of children in containerfluid and adjust searchbar
            let free_space = this.get_total_width();
            switch(true) {
                case free_space <= 130:
                    console.log("free space under 130");
                    this.searchbar_btn.toggleClass('red');
                    // this.searchbar.detach().prependTo('#sidebar_left', context)
                    break;
                case free_space <= 250:
                    console.log("free space under 250 and over 130");

                    if(this.searchbar.hasClass('expanded')) {
                        this.searchbar.removeClass('expanded');
                    } else {
                        this.searchbar_btn.on('click', event => { //expand
                            console.log("clicked");
                            console.log(this.topnav_children.last().width());
                            this.searchbar_text.css('width', (free_space + this.topnav_children.last().width() - this.searchbar_btn.width() - 20));
                            this.topnav_children.last().fadeToggle(300);
                            this.searchbar.toggleClass('expanded', false);
                            this.searchbar_text.animate({width:'toggle'}, 'fast'); 
                        });
                    }
                    break;

                default: //free space over 250px
                    this.searchbar.addClass('expanded');
                    console.log("free space over 250");
                    break;
            }
        }
    }

    //main menu
    cone.MainMenu = class {
        constructor(context) {
            this.menu_toggle = $('#hamburger-menu-toggle', context);
            if (!this.menu_toggle.length) {
                return;
            }
            if (cone.main_menu !== null) {
                cone.main_menu.unload();
            }
            cone.main_menu = this;
            this.mainmenu = $('#mainmenu');
            this.mobile_content = $('#mobile-menu-content', context);
            this.mobile_btn = $('#mobile-menu-btn', context);
            this.mobile_menu = $('#mobile-menu', context);
            // this.logo = $('#cone-logo', context);
            this.topnav_children = $('#topnav-container', context).children('div');
            this.menu_objects = this.mainmenu.children('li');
            this.mainmenu_titles = $('.mainmenu-title', context);

            this._handle_visibility = this.handle_visibility.bind(this)
            $(window).on('resize', this._handle_visibility);
            $(this._handle_visibility);

            // this.menu_toggle.on('click', this.toggle_menu.bind(this));
        }

        get_free_space() {
            let total_width = 0;
            $(this.topnav_children).each(function(index) {
                total_width += parseInt($(this).outerWidth(true), 10);
            });
            console.log('MAINMENU width:' + total_width);
            return ( $(window).width() - total_width );  
        }

        handle_visibility() {
            let free_space = this.get_free_space();
            console.log(free_space);
            switch(true){
                case free_space <= 0:
                    console.log('zu klein');
                    this.mainmenu_titles.css('display', 'none');
                    break;
                default:
                    this.mainmenu_titles.css('display', 'inline-block');
                    break;
            }
        }

        /* toggle_menu(evt) {
            this.mobile_content.toggle();
        } */
    };

    //sidebar menu
    cone.SidebarMenu = class {

        constructor(context, threshold) {
            this.menu_toggle = $('#hamburger-menu-toggle', context);
            if (!this.menu_toggle.length) {
                return;
            }
            if (cone.sidebar_menu !== null) {
                cone.sidebar_menu.unload();
            }
            cone.sidebar_menu = this;
            this.threshold = threshold;
            this.sidebar = $('#sidebar_left');
            this.menu_toggle.on('click', this.toggle_menu.bind(this));
            this._resize_handle = this.handle_menu_visibility.bind(this)
            $(window).on('resize', this._resize_handle);
            this.handle_menu_visibility(null);
        }

        unload() {
            $(window).off('resize', this._resize_handle);
        }

        toggle_menu(evt) {
            this.sidebar.toggle();
        }

        handle_menu_visibility(evt) {
            if (window.matchMedia(`(max-width: ${this.threshold}px)`).matches) {
                this.sidebar.hide();
            } else {
                this.sidebar.show();
            }
        }
    };

    //cone theme switcher
    cone.ThemeSwitcher = class {

        constructor(context, modes) {
            let theme_switch = $('body .switch_mode', context);
            if (!theme_switch.length) {
                return;
            }
            cone.theme_switcher = this;
            this.modes = modes;
            this.link = $('head #colormode-styles');
            this.current = this.link.attr('href');
            theme_switch.on('click', this.switch_theme.bind(this));
        }

        switch_theme(evt) {
            this.current = this.current === this.modes[0] ? this.modes[1] : this.modes[0];
            this.link.attr('href', this.current);
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
            var input = $('input#search-text');
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

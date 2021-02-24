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
    mobile_menu: null,
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
            new cone.Searchbar(context, 200, 130);
            new cone.MainMenu(context);
            new cone.MobileMenu(context);
        }, true);
        bdajax.register(livesearch.binder.bind(livesearch), true);
    });

    
    //mobile menu
    cone.MobileMenu = class {
        constructor(context) {
            cone.mobile_menu = this;
    
            this.logo = $('#cone-logo', context);
            this.mobile_btn = $('#hamburger-menu-toggle', context);
            this.mobile_menu = $('#mobile-menu', context);
            this.mobile_content = $('#mobile-menu-content', context);
            this.mobile_items = $('#mobile-menu-content', context).children('div');
    
            this._mobile_handler = this.mobile_handler.bind(this);
            $(this._mobile_handler);
            $(window).on('resize', this._mobile_handler);

            this._mobile_toggle = this.toggle_mobile_menu.bind(this);
            this.mobile_btn.on('click', this._mobile_toggle);
        }

        mobile_handler() {

            if ($(".mobile").length) {
                $('.mobile').detach().appendTo(this.mobile_content);
                this.logo.hide();
                this.mobile_menu.css('display', 'inline-block');
                console.log('appended to mobile');
            } else if (this.mobile_content.find('div')) {
                this.mobile_menu.hide();
                this.logo.show();
                this.mobile_items.each(function() {
                    $(this).detach().prependTo('#topnav-container');
                    console.log('appended to topnav');
                });
                console.log('removed from mobile');
            } else {
                console.log('there is/was nothing in mobile');
            }
        }

        toggle_mobile_menu() {
            this.mobile_content.toggle();
        }
    }

    //main menu
    cone.MainMenu = class {
        constructor(context) {

            if (cone.main_menu !== null) {
                cone.main_menu.unload();
            }

            cone.main_menu = this;
            this.mainmenu_list = $('#mainmenu', context);
            this.topnav_children = $('#topnav-container', context).children('div');
            this.mainmenu = $('#main-menu', context);
            this.menu_objects = this.mainmenu_list.children('li');
            this.mainmenu_titles = $('.mainmenu-title', context);
            this.topnav_element = $('.topnav-element', context);
            this.mainmenu_item = $('.mainmenu-item', context);

            this.free_space = 0;
            this.menu_width = 0;

            this._get_menu_width = this.get_menu_width.bind(this);
            $(this._get_menu_width);

            this._calc_free_space = this.calc_free_space.bind(this);
            $(this._calc_free_space);
            $(window).on('resize', this._calc_free_space);

            this._handle_visibility = this.handle_visibility.bind(this);
            $(this._handle_visibility);
            $(window).on('resize', this._handle_visibility);

        }

        get_menu_width() {
            let menu_width = 0;
            $('.mainmenu-item').each(function(index) {
                menu_width += parseInt($(this).outerWidth(true), 10);
                console.log(menu_width);
            });
            this.menu_width = menu_width;
            console.log('main menu width: ' + this.menu_width);
        }

        calc_free_space() {
            let total_width = 0;
            this.topnav_children.each(function(index) {
                total_width += parseInt($(this).outerWidth(true), 10);
            })
            this.free_space = $(window).width() - total_width ;
            console.log('free space: ' + this.free_space);
            console.log('total width: ' + total_width);
        }

        handle_visibility() {
            if (this.free_space <= 0 && this.mainmenu.hasClass('expanded')) { //collapse
                this.mainmenu_titles.css('display', 'none'); 
                this.mainmenu.addClass('collapsed');
                this.mainmenu.removeClass('expanded');
                console.log('collapsed');
            } 
            else if (this.free_space > this.menu_width){ //expand
                this.mainmenu_titles.css('display', 'inline-block');
                this.mainmenu.removeClass('collapsed');
                this.mainmenu.addClass('expanded');
                console.log('enough space expand');
            }
            else if (this.free_space <= 0 && 
                this.mainmenu.hasClass('collapsed') && 
                $('#topnav-searchbar').hasClass('mobile') ) { //mobile - adjust
                this.mainmenu.removeClass('collapsed');
                this.mainmenu.addClass('mobile');
                this.mainmenu_list.toggleClass('navbar-nav');
            }
           
        }
    }

    //searchbar
    cone.Searchbar = class {

        constructor(context, threshold_1, threshold_2) {
            cone.searchbar_handler = this;
            this.threshold_1 = threshold_1;
            this.threshold_2 = threshold_2;

            this.searchbar_btn = $('#searchbar-button', context);
            this.searchbar_text = $('.twitter-typeahead', context);
            this.toolbar_top = $('#toolbar-top', context);
            this.searchbar = $('#topnav-searchbar', context);
            this.topnav = $('#topnav-container', context);
            this.topnav_children = this.topnav.children('div').not(this.searchbar);

            this.free_space = 0;

            this._get_total_width = this.get_total_width.bind(this);
            $(window).on('resize', this._get_total_width);
            $(this._get_total_width);

            this._resize_handle = this.resize_handle.bind(this);
            $(this._resize_handle);
            $(window).on('resize', this._resize_handle);
        }

        get_total_width() { // calculate width of children in topnav
            let total_width = 0;
            $(this.topnav_children).each(function(index) {
                total_width += parseInt($(this).outerWidth(true), 10);
            });

            this.free_space = $(window).width() - total_width;
            console.log('searchbar free space: ' + this.free_space);
        }

        resize_handle() { // adjust searchbar

            switch(true) {
                case this.free_space <= 130: // mobile
                    if($('#main-menu').hasClass('collapsed')) {
                        this.searchbar.removeClass('collapsed');
                        this.searchbar.addClass('mobile');
                        // console.log('searchbar mobile');
                    }
                    break;

                case this.free_space <= 250: // collapsed
                    if(this.searchbar.hasClass('mobile')){
                        this.searchbar.removeClass('mobile');
                    }

                    $('.twitter-typeahead').css('width', '0');

                   /*  if(this.searchbar.hasClass('mobile')) {
                        this.searchbar.removeClass('mobile');
                    } */
                    if(this.searchbar.hasClass('expanded')) {
                        this.searchbar.removeClass('expanded');
                    }
                    this.searchbar.addClass('collapsed');

                    this.searchbar_btn.on('click', event => {
                        if(this.searchbar.hasClass('expanded')) {
                            this.searchbar_text.animate({width:0}, 'fast');
                            this.searchbar.removeClass('expanded');
                            this.searchbar.addClass('collapsed');
                            console.log('close');
                        } else {
                            this.searchbar.removeClass('collapsed');
                            this.searchbar.addClass('expanded');
                            this.searchbar_text.animate({width:this.free_space}, 'fast');
                            console.log('open');
                        }
                    });
                    break;

                default: //free space over 250px
                $('.twitter-typeahead').css('width', '200px');
                    if(this.searchbar.hasClass('collapsed')){
                        this.searchbar.removeClass('collapsed');
                    }
                    this.searchbar.addClass('expanded');
                    break;
            }
        }
    }

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

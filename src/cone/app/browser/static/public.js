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
    
            this.logo = $('#cone-logo');
            this.mobile_btn = $('#hamburger-menu-toggle');
            this.mobile_menu = $('#mobile-menu');
            this.mobile_content = $('#mobile-menu-content');
            this.mobile_items = $('#mobile-menu-content').children('div');
            this.topnav_items = $('#topnav-container').children('div');
    
            this._mobile_handler = this.mobile_handler.bind(this);
            $(this._mobile_handler);
            $(window).on('resize', this._mobile_handler);

            this._mobile_toggle = this.toggle_mobile_menu.bind(this);
            this.mobile_btn.on('click', this._mobile_toggle);
        }

        mobile_handler(evt) {
            if(this.mobile_menu.hasClass('active')){
                this.logo.hide();
                this.mobile_menu.css('display', 'inline-block');
            } else {
                this.mobile_menu.hide();
                this.logo.css('display', 'inline-block');
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
            this.topnav_children = $('#topnav-container').children('div');

            this.topnav_mainmenu = $('#topnav-mainmenu');
            this.mainmenu_list = this.topnav_mainmenu.children('ul');
            this.topnav_menu_icons = $('#topnav-mainmenu').children('li').find('i');

            this.topnav_mainmenu_titles = this.topnav_mainmenu.find('.mainmenu-title');

            this.free_space = 0;
            this.menu_width = parseFloat($('#topnav-mainmenu').outerWidth(true), 10);
            this.menu_width_collapsed = parseFloat(this.topnav_menu_icons.each(function(){
                this.menu_width_collapsed += $(this).outerWidth(true);
                console.log(this.menu_width_collapsed);
            }));

            this._calc_free_space = this.calc_free_space.bind(this);
            $(this._calc_free_space);
            $(window).on('resize', this._calc_free_space);

            this._handle_visibility = this.handle_visibility.bind(this);
            $(this._handle_visibility);
            $(window).on('resize', this._handle_visibility);

        }

        calc_free_space() {
            let total_width = 0;
            this.topnav_children.each(function(index) {
                total_width += parseInt($(this).outerWidth(true), 10);
            })
            this.free_space = $(window).width() - total_width ;
            // console.log('free space: ' + this.free_space);
            // console.log('total width: ' + total_width);
            // console.log(this.menu_width);
        }

        handle_visibility(evt) {
            if (this.free_space <= 130 
                && this.topnav_mainmenu.hasClass('expanded')) { //collapse
                this.topnav_mainmenu_titles.css('display', 'none'); 
                this.topnav_mainmenu.addClass('collapsed');
                this.topnav_mainmenu.removeClass('expanded');
                this.topnav_mainmenu.css('display', 'inline-block');
                // console.log('collapsed');
            } 
            else if (this.free_space > this.menu_width){ //expand
                this.topnav_mainmenu.css('display', 'inline-block');
                this.topnav_mainmenu_titles.css('display', 'inline-block');
                this.topnav_mainmenu.removeClass('collapsed');
                this.topnav_mainmenu.addClass('expanded');
                // console.log('enough space expand');
            }
            else if (this.free_space <= 0 
                && this.topnav_mainmenu.hasClass('collapsed') 
                && $('#topnav-searchbar').css('display') == "none" ) { //mobile - adjust
                this.topnav_mainmenu.hide();
            }
           
        }
    }

    //searchbar
    cone.Searchbar = class {

        constructor(context, threshold_1, threshold_2) {
            cone.searchbar_handler = this;
            this.threshold_1 = threshold_1;
            this.threshold_2 = threshold_2;

            this.searchbar_btn = $('#searchbar-button');
            this.topnav_searchbar_text = $('#topnav-searchbar').find('.twitter-typeahead');
            // this.toolbar_top = $('#toolbar-top');
            this.topnav_searchbar = $('#topnav-searchbar');
            this.mobile_searchbar = $('#mobile-searchbar');
            this.topnav = $('#topnav-container');
            this.topnav_children = this.topnav.children('div').not(this.topnav_searchbar);

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

        resize_handle(evt) { // adjust searchbar

            switch(true) {
                case this.free_space <= 130: // mobile
                    console.log('mobile searchbar');
                    this.topnav_searchbar.hide();
                    $('#mobile-menu').addClass('active');
                    break;

                case this.free_space <= 250: // collapsed
                    $('#mobile-menu').removeClass('active');
                    this.topnav_searchbar.css('display', 'inline-block');
                    this.topnav_searchbar.find('.twitter-typeahead').css('width', '0');

                    if(this.topnav_searchbar.hasClass('expanded')) {
                        this.topnav_searchbar.removeClass('expanded');
                    }
                    this.topnav_searchbar.addClass('collapsed');

                    this.searchbar_btn.on('click', event => {
                        if(this.topnav_searchbar.hasClass('expanded')) {
                            this.topnav_searchbar_text.animate({width:0}, 'fast');
                            this.topnav_searchbar.removeClass('expanded');
                            this.topnav_searchbar.addClass('collapsed');
                            console.log('close');
                        } else {
                            this.topnav_searchbar.removeClass('collapsed');
                            this.topnav_searchbar.addClass('expanded');
                            this.topnav_searchbar_text.animate({width:this.free_space}, 'fast');
                            console.log('open');
                        }
                    });
                    break;

                default: //free space over 250px
                $('.twitter-typeahead').css('width', '200px');
                    if(this.topnav_searchbar.hasClass('collapsed')){
                        this.topnav_searchbar.removeClass('collapsed');
                    }
                    this.topnav_searchbar.addClass('expanded');
                    break;
            }
        }
    }

    //sidebar menu
    cone.SidebarMenu = class {

        constructor(context, threshold) {
            this.menu_toggle = $('#hamburger-menu-toggle');
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

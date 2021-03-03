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
    navtree: null,
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

    // navtree
    cone.Navtree = class {
        constructor(context) {
            cone.navtree = this;

            this.navtree_wrap = $('#navtree');
        }
    }
    
    // mobile menu
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


    // main menu
    cone.MainMenu = class {
        constructor(context) {

            if (cone.main_menu !== null) {
                cone.main_menu.unload();
            }

            cone.main_menu = this;
            this.topnav_children = $('#topnav-container').children('div');

            this.mobile_mainmenu = $('#mobile-mainmenu');
            this.topnav_mainmenu = $('#topnav-mainmenu');
            this.mainmenu_list = this.topnav_mainmenu.children('ul');
            this.topnav_menu_icons = $('#topnav-mainmenu').children('li').find('i');

            this.topnav_mainmenu_titles = this.topnav_mainmenu.find('.mainmenu-title');

            this.free_space = 0;
            this.menu_width = parseFloat($('#topnav-mainmenu').outerWidth(true), 10);
            this.menu_width_collapsed = 0;

            this._calc_space = this.calc_space.bind(this);
            $(this._calc_space);
            $(window).on('resize', this._calc_space);

            this._handle_visibility = this.handle_visibility.bind(this);
            $(this._handle_visibility);
            $(window).on('resize', this._handle_visibility);

            this.mobile_mainmenu.find('.dropdown-arrow').on('click', function(event){ 
                $(this).parent('li').find('.dropdown-content').toggle();
                event.stopPropagation(); //disable default scrolldown
                event.preventDefault();
            });

        }

        calc_space() {
            let total_width = 0;
            this.topnav_children.not(this.topnav_mainmenu).each(function(index) {
                total_width += parseInt($(this).outerWidth(true), 10);
            })
            this.free_space = $(window).width() - total_width ;
            //console.log('free space: ' + this.free_space);
            //console.log('total width: ' + total_width);
            //console.log('mainmenu width:' + this.menu_width);

            let span_width = 0;
            this.mainmenu_list.children('li').find('span').each(function(index ){
                span_width += parseInt($(this).outerWidth(true), 10);
            })

            this.menu_width_collapsed = this.menu_width - span_width ;
            //console.log('mainmenu collapsed' + this.menu_width_collapsed);
        }

        handle_visibility(evt) {
            if (this.free_space <= this.menu_width
                && this.topnav_mainmenu.hasClass('expanded')) { // collapse
                this.topnav_mainmenu_titles.css('display', 'none'); 
                this.topnav_mainmenu.addClass('collapsed');
                this.topnav_mainmenu.removeClass('expanded');
                this.topnav_mainmenu.css('display', 'inline-block');
                // console.log('collapsed');
            } 
            else if (this.free_space > this.menu_width){ // expand
                this.topnav_mainmenu.css('display', 'inline-block');
                this.topnav_mainmenu_titles.css('display', 'inline-block');
                this.topnav_mainmenu.removeClass('collapsed');
                this.topnav_mainmenu.addClass('expanded');
                // console.log('enough space expand');
            }
            else if (this.free_space <= this.menu_width_collapsed
                && this.topnav_mainmenu.hasClass('collapsed') 
                && $('#topnav-searchbar').css('display') == "none" ) { // mobile
                this.topnav_mainmenu.hide();
               /*  this.mobile_mainmenu.find('.list-true').find('a').each(
                    $(this).on('click', function(){
                    console.log('click');
                    $(this).find('dropdown-content').toggle();
                })); */
            }

        }

    }


    // searchbar
    cone.Searchbar = class {

        constructor(context, threshold_1, threshold_2) {
            cone.searchbar_handler = this;
            this.threshold_1 = threshold_1;
            this.threshold_2 = threshold_2;

            this.topnav_searchbar = $('#topnav-searchbar');
            this.mobile_searchbar = $('#mobile-searchbar');

            this.topnav_searchbar_btn = this.topnav_searchbar.find('#searchbar-button');
            this.topnav_searchbar_text = this.topnav_searchbar.find('.twitter-typeahead');
            // this.toolbar_top = $('#toolbar-top');

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
                case this.free_space <= 0: // mobile
                    console.log('mobile searchbar');
                    this.topnav_searchbar.hide();
                    $('#mobile-menu').addClass('active');
                    break;

                case this.free_space <= 200: // collapsed
                    if($('#mobile-menu').hasClass('active')){
                        $('#mobile-menu').removeClass('active');
                    }
                    
                    this.topnav_searchbar.css('display', 'inline-block');
                    this.topnav_searchbar.addClass('collapsed');
                    if(this.topnav_searchbar.hasClass('expanded')){
                        this.topnav_searchbar.removeClass('expanded');
                    }
                    if(this.topnav_searchbar.hasClass('toggle-collapse')){
                        this.topnav_searchbar.removeClass('toggle-collapse')
                    }
                    if(this.topnav_searchbar.hasClass('toggle-expand')){
                        this.topnav_searchbar.removeClass('toggle-expand')
                    }

                    this.topnav_searchbar_btn.on('click', event => {
                        if(this.topnav_searchbar.hasClass('expanded')) {
                            if(this.topnav_searchbar.hasClass('toggle-expand')){
                                this.topnav_searchbar.removeClass('toggle-expand')
                            }
                            this.topnav_searchbar.removeClass('expanded');
                            this.topnav_searchbar.addClass('collapsed');
                            this.topnav_searchbar.addClass('toggle-collapse');
                            $('#topnav-container').children('div').last().show();
                            console.log('close');
                        } else {
                            if(this.topnav_searchbar.hasClass('toggle-collapse')){
                                this.topnav_searchbar.removeClass('toggle-collapse')
                            }
                            this.topnav_searchbar.removeClass('collapsed');
                            this.topnav_searchbar.addClass('expanded');
                            this.topnav_searchbar.addClass('toggle-expand');
                            $('#topnav-container').children('div').last().hide();
                            console.log('open');
                        }
                    });
                    break;

                default: //free space over 250px
                $('#mobile-menu').removeClass('active');
                $('#topnav-mainmenu').css('display', 'inline-block');
                $('.twitter-typeahead').css('width', '200px');
                this.topnav_searchbar.css('display', 'inline-block');

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
                } else {
                    this.sidebar.addClass('expanded');
                }
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

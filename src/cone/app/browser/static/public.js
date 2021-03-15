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
        '/static/light.css',
        '/static/dark.css'
    ]
};

// class removal
function class_remove(element, elemclass){
    if(element.hasClass(elemclass)){
        element.removeClass(elemclass);
    }
}


// additional livesearch options
var livesearch_options = new Object();

(function($) {

    $(function() {
        bdajax.register(cone.bind_dropdowns, true);
        bdajax.register(function(context) {
            new cone.ThemeSwitcher(context, cone.default_themes);
            new cone.SidebarMenu(context, 575.9);
            new cone.Searchbar(context, 200, 130);
            new cone.MainMenu(context);
            new cone.MobileMenu(context);
        }, true);
        bdajax.register(livesearch.binder.bind(livesearch), true);
    });

    cone.bind_dropdowns = function(context) {
        $('.cone-dropdown-menu', context).each(function() {
            let dm = $(this);
            if (dm.hasClass('hover')) {
                return;
            }
            let handle = cone.toggle_dropdown;
            dm.parent().off('click', handle).on('click', handle);
        });
    };

    cone.toggle_dropdown = function() {
        $('> .cone-dropdown-menu', this).toggle();
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

    // mobile menu
    cone.MobileMenu = class {
        constructor(context) {
            cone.mobile_menu = this;
    
            this.logo = $('#cone-logo');
            this.mobile_btn = $('#mobile-menu-toggle');
            this.mobile_menu = $('#mobile-menu');
            this.mobile_content = $('#mobile-menu-content');
            this.mobile_items = $('#mobile-menu-content').children('div');
            this.topnav_items = $('#cone-topnav').children('div');
    
            this._mobile_handler = this.mobile_handler.bind(this);
            $(this._mobile_handler);
            $(window).on('resize', this._mobile_handler);

            this._mobile_toggle = this.toggle_mobile_menu.bind(this);
            this.mobile_btn.on('click', this._mobile_toggle);
        }

        mobile_handler(evt) {
            if(this.mobile_menu.hasClass('active')){
                this.logo.hide();
                this.mobile_menu.show();
            } else {
                this.mobile_menu.hide();
                this.logo.show();
            }
        }

        toggle_mobile_menu() {
            this.mobile_content.toggle();
        }

    }


    // main menu
    cone.MainMenu = class {
        constructor(context) {

            //if (cone.main_menu !== null) {
            //    cone.main_menu.unload();
            //}

            cone.main_menu = this;

            this.mobile_mainmenu = $('#mobile-mainmenu');
            this.topnav_mainmenu = $('#topnav-mainmenu');
            
            this.topnav_mainmenu_titles = this.topnav_mainmenu.find('.mainmenu-title');
            this.mainmenu_items = $('.mainmenu-item');

            this.free_space = 0;
            this.menu_width = 0;
            this.menu_width_collapsed = 0;

            $(window).load(function(){
                $('#topnav-mainmenu').addClass('expanded');
                $('#topnav-mainmenu').css('position', 'absolute');
                this.menu_width = $('#topnav-mainmenu').outerWidth();
                console.log(this.menu_width);
                $('#topnav-mainmenu').css('position', 'relative');
            })

            this._calc_space = this.calc_space.bind(this);
            // $(window).on('resize', this._calc_space);

            this._handle_visibility = this.handle_visibility.bind(this);
            // $(window).on('resize', this._handle_visibility);

            // toggle content
            this.mobile_mainmenu.find('.dropdown-arrow').on('click', function(event){ 
                $(this).parent('li').find('.cone-dropdown-menu').toggle();
                event.stopPropagation(); //disable default scrolldown
                event.preventDefault();
            });


        }

        calc_space() {
            let total_width = 0;
            $('#cone-topnav').children('div').not('#topnav-mainmenu').not('#mobile-menu').each(function(index){
                total_width += parseInt($(this).outerWidth(true));
            });

            this.free_space = $(window).width() - total_width;
            console.log(this.menu_width)
            console.log('..............................')
            console.log('window: ' + $(window).outerWidth(true));
            console.log('total: ' + total_width);
            console.log('logo: ' + $('#cone-logo').outerWidth(true));
            console.log('free space: ' + this.free_space);
            console.log('mainmenu: ' + this.topnav_mainmenu.outerWidth(true));
            console.log('searchbar: ' + $('#topnav-searchbar').outerWidth(true));
            console.log('tools width: ' + $('#tools').outerWidth(true))
        }

        handle_visibility(evt) {

            if (this.free_space > this.menu_width){ // expand
                this.topnav_mainmenu.css('display', 'inline-block');
                class_remove(this.topnav_mainmenu , 'collapsed');
                this.topnav_mainmenu.addClass('expanded');
                // console.log('enough space expand');
            }
            else if (this.menu_width_collapsed < this.free_space < this.menu_width) { // collapse
                this.topnav_mainmenu.removeClass('expanded');
                this.topnav_mainmenu.addClass('collapsed');
                // console.log('collapsed');
            } 
            else if (this.free_space < this.menu_width
                && this.topnav_mainmenu.hasClass('collapsed')) { // mobile
                $('#mobile-menu').addClass('active');
                this.topnav_mainmenu.hide();
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

            this.topnav = $('#cone-topnav');
            this.topnav_children = this.topnav.children('li').not(this.topnav_searchbar);

            this.free_space = 0;

            this._get_total_width = this.get_total_width.bind(this);
            // $(window).on('resize', this._get_total_width);

            this._resize_handle = this.resize_handle.bind(this);
            // $(window).on('resize', this._resize_handle);
        }

        get_total_width() { // calculate width of children in topnav
            let total_width = 0;
            $('.tile').each(function(index) {
                total_width += parseInt($(this).outerWidth(true), 10);
            });

            this.free_space = $(window).width() - total_width;
            // console.log('searchbar free space: ' + this.free_space);
        }

        resize_handle(evt) { // adjust searchbar

            switch(true) {
                case this.free_space <= 0: // mobile
/*                     console.log('mobile searchbar');
                    this.topnav_searchbar.hide(); */
                    break; 

                case this.free_space <= 200: // collapsed
                    class_remove(this.topnav_searchbar, 'expanded');
                    
                    this.topnav_searchbar.css('display', 'inline-flex');
                    this.topnav_searchbar.addClass('collapsed');

                    this.topnav_searchbar_btn.on('click', evt => {
                        this.topnav_searchbar.addClass('toggle-expand expanded');
                        this.topnav_searchbar.removeClass('collapsed');
                    })

                    this.topnav_searchbar_btn.on('click', event => {
                        if(this.topnav_searchbar.hasClass('toggle-expand')) {
                            this.topnav_searchbar.removeClass('toggle-expand');
                            class_remove(this.topnav_searchbar, 'expanded');
                            this.topnav_searchbar.addClass('collapsed');
                            this.topnav_searchbar.addClass('toggle-collapse');
                            //$('#cone-topnav').children('li').last().show();
                            console.log('close');
                        } else {
                            class_remove(this.topnav_searchbar, 'toggle-collapse');
                            class_remove(this.topnav_searchbar, 'collapsed');
                            this.topnav_searchbar.addClass('expanded');
                            this.topnav_searchbar.addClass('toggle-expand');
                            //$('#cone-topnav').children('li').last().hide();
                            console.log('open');
                        }
                    });
                    break;

                default: //free space over 250px
                $('.twitter-typeahead').css('width', '200px');
                this.topnav_searchbar.css('display', 'inline-flex');

                class_remove(this.topnav_searchbar, 'collapsed');
                this.topnav_searchbar.addClass('expanded');

                break;
            }
        }
    }

    //sidebar menu
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
                    class_remove(this.sidebar, 'expanded');
                } else {
                    this.sidebar.addClass('expanded');
                    class_remove(this.sidebar, 'collapsed');
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

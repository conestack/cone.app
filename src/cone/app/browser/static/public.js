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
    // main_menu: null,
    theme_switcher: null,
    searchbar_handler: null,
    // mobile_menu: null,
    // navtree: null,
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
        bdajax.register(cone.bind_dropdowns, true);
        bdajax.register(function(context) {
            new cone.ThemeSwitcher(context, cone.default_themes);
            new cone.SidebarMenu(context, 575.9);
            new cone.Topnav(context);
            //new cone.Searchbar(context, 200, 130);
            // new cone.MainMenu(context);
            //new cone.MobileMenu(context);
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

    //theme switch
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

    //topnav
    cone.Topnav = class {

        constructor(context) {
            let elem = $('#topnav');
            if (!elem.length) {
                return;
            }
            cone.topnav = this;
            this.elem = elem;
            this.toggle_button = $('#mobile-menu-toggle');
            this.toggle_button.on('click', this.toggle_menu.bind(this));

            $(this.handle_visibility.bind(this));
            $(window).on('resize', this.handle_visibility.bind(this));
        }

        toggle_menu(evt) {
            $('#topnav-content').toggle();
        }

        handle_visibility(evt) {
            if (window.matchMedia(`(max-width: 560px)`).matches) {
                this.elem.addClass('mobile');

                $('#mainmenu').find('.dropdown-arrow').off().on('click', function(evt) {
                    $(this).parent('li').find('.cone-dropdown-menu').slideToggle('fast');
                    // evt.stopPropagation(); //disable default scrolldown
                    // evt.preventDefault();
                })
            } else {
                this.elem.removeClass('mobile');
            }
        }
    }


    // searchbar
    cone.Searchbar = class {

        constructor(context, threshold_1, threshold_2) {
            cone.searchbar_handler = this;

            this.topnav_searchbar_btn = this.topnav_searchbar.find('#searchbar-button');
            this.topnav_searchbar_text = this.topnav_searchbar.find('.twitter-typeahead');
            this.topnav = $('#topnav');

            // this._resize_handle = this.resize_handle.bind(this);
            // $(window).on('resize', this._resize_handle);
        }

/*         resize_handle(evt) { // adjust searchbar

                // collapsed
                this.topnav_searchbar.removeClass('expanded');
                
                this.topnav_searchbar.css('display', 'inline-flex');
                this.topnav_searchbar.addClass('collapsed');
                this.topnav_searchbar_btn.on('click', evt => {
                    this.topnav_searchbar.addClass('toggle-expand expanded');
                    this.topnav_searchbar.removeClass('collapsed');
                })
                this.topnav_searchbar_btn.on('click', event => {
                    if(this.topnav_searchbar.hasClass('toggle-expand')) {
                        this.topnav_searchbar.removeClass('toggle-expand');
                        this.topnav_searchbar.removeClass('expanded');
                        this.topnav_searchbar.addClass('collapsed');
                        this.topnav_searchbar.addClass('toggle-collapse');
                        $('#topnav').children('li').last().show();
                        console.log('close');
                    } else {
                        this.topnav_searchbar.removeClass('toggle-collapse');
                        this.topnav_searchbar.removeClass('collapsed');
                        this.topnav_searchbar.addClass('expanded');
                        this.topnav_searchbar.addClass('toggle-expand');
                        $('#topnav').children('li').last().hide();
                        console.log('open');
                    }
                });

                // expanded
                $('.twitter-typeahead').css('width', '200px');
                this.topnav_searchbar.css('display', 'inline-flex');

                this.topnav_searchbar.removeClass('collapsed');
                this.topnav_searchbar.addClass('expanded');

        } */
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

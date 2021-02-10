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
            new cone.SearchbarHandler(context, 200, 130);
        }, true);
        bdajax.register(livesearch.binder.bind(livesearch), true);
    });

    //searchbar handler
    cone.SearchbarHandler = class {

        constructor(context, threshold_1, threshold_2) {
            cone.searchbar_handler = this;
            this.threshold_1 = threshold_1;
            this.threshold_2 = threshold_2;

            this._getTotalWidth = this.getTotalWidth.bind(this);
            $(window).on('resize', this._getTotalWidth);

            this.inputBtn = $('#searchbar-button', context);
            this.inputText = $('#search-text', context);
            this.toolbarTop = $('#toolbar-top', context);
            this.searchbar = $('#topnav-searchbar', context);
            this.topnavChildren = $('#topnav-container').children('div');

            this._resizeHandle = this.resizeHandle.bind(this);
            this.inputBtn.on('click', this._resizeHandle);
        }

        getTotalWidth() {
            console.log("test");
            console.log(this.topnavChildren);

            let totalWidth = 0;
            $(this.topnavChildren).each(function(index) {
                totalWidth += parseInt($(this).outerWidth(true), 10);
            });

            let freeSpace = $(window).width() - totalWidth;

            console.log('total width:' + totalWidth);
            console.log('window width:' + $(window).width());
            console.log('free space:' + freeSpace) ;

            return freeSpace;
        }

        resizeHandle() { // calculate width of children in containerfluid and adjust searchbar
            let freeSpace = this.getTotalWidth();
            switch(true) {
                case freeSpace <= 130:
                    console.log("free space under 130");
                    break;
                default: //free space over 200px
                    console.log("enough space");
                    //animate
                    this.inputText.animate({width: 'toggle'}, 200);
                    this.inputBtn.toggleClass('clicked');
                    break;
            }
        }

        
       /*  if($(window).width() <= 380) {
            $('#topnav-searchbar', context).detach().prependTo('#sidebar_left', context);
        }
        else if($(window).width() <= 1035.9) {
            
            $('#searchbar-button', context).on('click', function() {

                //animate
                $('#search-text', context).animate({width: 'toggle'}, 200);
                $('#searchbar-button', context).toggleClass('clicked');
                
                //toggle toolbar (new layout)
                if($(window).width() <= 575.9) {
                    $('#toolbar-top', context).fadeToggle('fast');
                }
                
                //collision - old layout
                let sbpos = $('#search-text', context).offset().left + $('#search-text', context).width();
                let ptpos = $('#user-account-old', context).offset().left;

                if(sbpos <= ptpos){
                    console.log('collide!')
                    console.log(sbpos, ptpos)
                    $('#user-account-old', context).fadeOut('fast')
                }
                else {
                    console.log('no collide!')
                    $('#user-account-old', context).fadeIn('fast')
                }
            });
        } else {
            $('#search-text', context).show();
        }  */

        
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

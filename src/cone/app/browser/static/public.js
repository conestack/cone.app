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
});

// dropdown arrows ----------------------------------------
function dd_click(arrow) {
    let currentMode = $(arrow).attr('class');
    let mode = 'dropdown-arrow bi bi-chevron-';
    let newMode = mode + ((currentMode == mode + 'down') ? 'up':'down');
    $(arrow).attr('class', newMode);
}
function dd_reset(arrow, dropdown) {
    arrow.attr('class', 'dropdown-arrow bi bi-chevron-down');
    dropdown.hide();
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
            this.arrow = $('i.dropdown-arrow', this.elem);
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
            let menu = this.menu;
            let elem = this.elem;
            menu.off().detach().appendTo(elem).css('left', '0');
            elem.off();
            this.arrow.off().on('click', function(){
                menu.slideToggle('fast');
                dd_click(this);
            });
        }

        mv_to_top() {
            let menu = this.menu;
            let elem = this.elem;
            menu.detach().appendTo('#layout');
            this.arrow.off();
            elem.off().on('mouseenter mouseleave', function() {
                menu.toggle().offset({left: elem.offset().left});
            });
            menu.off().on('mouseenter mouseleave', function() {
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
            this.main_menu_items = [];
            let that = this;
            
            $('li', mm_top).each(function() {
                let main_menu_item = new cone.MainMenuItem($(this));
                that.main_menu_items.push(main_menu_item);
            });

            this.mm_sb = mm_sb;
            this.sb_items = $('li.sb-menu', this.mm_sb);
            this.sb_arrows = $('i.dropdown-arrow', this.sb_items);
            this.sb_dropdowns = $('ul', this.sb_items);
            this.sb_dd_sel = 'ul.cone-mainmenu-dropdown-sb';

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
    
        handle_visibility() {
            if(!cone.vp_flag) {
                return;
            }

            dd_reset(this.sb_arrows, this.sb_dropdowns);

            this.mm_top.scrollLeft(this.mm_top.outerWidth());

            if(cone.view_mobile) {
                if(this.mm_sb.length) {
                    $(this._bind);
                    this.mm_top.hide();
                    this.mm_sb.detach().appendTo(cone.topnav.content).addClass('mobile');
                } else {
                    for(let i in this.main_menu_items) {
                        let item = this.main_menu_items[i];
                        if(!item.menu) {
                            return;
                        }
                        item.mv_to_mobile();
                    }
                }
            }
            else {
                if(this.mm_sb.length) {
                    this.mm_sb.detach().prependTo(cone.sidebar_menu.elem).removeClass('mobile');
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
            let target = $(evt.currentTarget);
            $(this.sb_dd_sel, target).show();
            if(target.outerWidth() > $('ul', target).outerWidth()) {
                $('ul', target).css('width', target.outerWidth());
            } else {
                target.css('width', $('ul', target).outerWidth());
            }
        }
    
        mouseout_sidebar(evt) {
            $(this.sb_dd_sel).hide();
            $(evt.currentTarget).css('width', 'auto');
        }
    
        toggle_dropdown(evt) {
            let target = $(evt.currentTarget);
            let item = target.parent().parent();
            $(this.sb_dd_sel, item).slideToggle('fast');
            dd_click(target);
        }
    
        bind_events_sidebar() {
            console.log('sidebar state: ' + cone.sidebar_menu.state);
            if(cone.sidebar_menu.state){
                this.sb_dropdowns.hide();
                this.sb_arrows.off('click');
                this.sb_items.off().on('mouseenter', this._mousein_sb);
                this.sb_items.on('mouseleave', this._mouseout_sb);
            } else {
                this.sb_items.off('mouseenter mouseleave');
                this.sb_arrows.off().on('click', this._toggle);
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
            this.content = $('#topnav-content', this.elem);
            this.toggle_button = $('#mobile-menu-toggle', this.elem);
            this.logo = $('#cone-logo', this.elem);
            this.tb_dropdowns = $('#toolbar-top>li.dropdown', this.elem);
            
            this._toggle = this.toggle_menu.bind(this);
            this.toggle_button.on('click', this._toggle);

            this._handle = this.handle_visibility.bind(this);
            $(this._handle);
            $(window).on('resize', this._handle);

            this.pt = $('#personaltools', this.elem);
            this.user =  $('#user', this.pt);
            this._pt_handle = this.pt_handle.bind(this);
            $(this._pt_handle);
            $(window).on('resize', this._pt_handle);

            cone.topnav = this;
        }

        unload() {
            $(window).off('resize', this._handle);
            this.toggle_button.off('click', this.toggle_menu.bind(this));
        }

        toggle_menu() {
            this.content.slideToggle('fast');
            if(this.content.css('display') == 'block') {
                this.content.css('display', 'flex');
            }
        }

        handle_visibility() {
            if(!cone.vp_flag) {
                return;
            }
            if(!cone.main_menu.mm_top.length) {
                this.logo.css('margin-right', 'auto');
            }
            if (cone.view_mobile) {
                this.content.hide();
                this.elem.addClass('mobile');
                // hide menu on toolbar click
                this.tb_dropdowns.off().on('show.bs.dropdown', function() {
                    cone.topnav.content.hide();
                });
            } else {
                this.content.show();
                this.elem.removeClass('mobile');
                this.tb_dropdowns.off();
            }
        }

        pt_handle() {
            if(!cone.vp_flag) {
                return;
            }
            let user = this.user;

            if(cone.view_mobile) {
                this.pt.off('show.bs.dropdown').on('show.bs.dropdown', function() {
                    user.stop(true, true).slideDown('fast');
                    dd_click($('i.dropdown-arrow', '#personaltools'));
                });
                this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', function() {
                    user.stop(true, true).slideUp('fast');
                    dd_click($('i.dropdown-arrow', '#personaltools'));
                });
            } else {
                this.pt.off('show.bs.dropdown').on('show.bs.dropdown', function() {
                    user.show();
                });
                this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', function() {
                    user.hide();
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
            this.elem = $('#sidebar_left');
            this.state = null;
            this.flag = true;
            this.toggle_btn = $('#sidebar-toggle-btn', this.elem);
            this.toggle_arrow = $('i', this.toggle_btn);
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

            this._handle_c = this.handle_collapse.bind(this);
        }

        unload() {
            $(window).off('resize', this._resize_handle);
        }

        handle_state() {
            if(cone.view_mobile && cone.vp_flag){
                this.state = false;
            }

            if(this.toggled) {
                return;
            }

            let state = null;

            if(!cone.view_mobile && window.matchMedia(`(max-width: 990px)`).matches) {
                state = true;
            } else {
                state = false;
            }

            let flag = state !== this.state;
            this.state = state;

            if(flag) {
                $(cone.main_menu._bind);
                $(this._handle_c);
            }
        }

        toggle_menu() {
            let state = (this.state) ? false:true;
            this.state = state;
            this.flag = true;
            this.toggled = true;

            dd_reset(cone.main_menu.sb_arrows, cone.main_menu.sb_dropdowns);
            $(cone.main_menu._bind);
            $(this._handle_c);
        }

        handle_collapse() {
            let elem_class = (this.state) ? 'collapsed':'expanded';
            let button_class = 'bi bi-arrow-' + ((this.state) ? 'right':'left') + '-circle';
            this.elem.attr('class', elem_class);
            this.toggle_arrow.attr('class', button_class);
        }

        handle_menu_visibility() {
            if(!cone.vp_flag) {
                return;
            }

            if (cone.view_mobile) {
                this.elem.hide();
            } else {
                this.elem.show();
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
            this.content = $('#navtree-content', this.navtree);
            this.heading = $('#navtree-heading', this.navtree);
            this.toggle_elems = $('li.navtreelevel_1', navtree);

            this._resize_handle = this.toggle_visibility.bind(this);
            $(this._resize_handle);
            $(window).on('resize', this._resize_handle);
            this._mouseenter_handle = this.align_width.bind(this);
            this.toggle_elems.on('mouseenter', this._mouseenter_handle);
            this._restore = this.restore_width.bind(this);
            this.toggle_elems.on('mouseleave', this._restore); //restore original size
            cone.navtree = this;
        }

        unload() {
            $(window).off('resize', this._resize_handle);
            this.toggle_elems.off();
        }

        toggle_visibility() {
            if(!cone.vp_flag) {
                return;
            }
            if (cone.view_mobile) {
                this.navtree.detach().appendTo(cone.topnav.content).addClass('mobile');
                let content = this.content;
                this.heading.off('click').on('click', function() {
                    content.slideToggle('fast');
                    dd_click($('i.dropdown-arrow', this));
                })
                this.content.hide();
            } else {
                this.navtree.detach().appendTo(cone.sidebar_menu.elem).removeClass('mobile');
                this.heading.off('click');
                this.content.show();
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
            this.search_text = $('#livesearch-input', this.elem);
            this.search_group = $('#livesearch-group', this.elem);
            this.dd = $('#cone-livesearch-dropdown', this.elem);

            this._handle = this.handle_visibility.bind(this);
            $(this._handle);
            $(window).on('resize', this._handle);

            cone.searchbar_handler = this;
        }

        unload() {
            $(window).off('resize', this._handle);
        }

        handle_visibility(evt){
            if(window.matchMedia(`(min-width:560px) and (max-width: 1200px)`).matches) {
                this.dd.addClass('dropdown-menu-end');
                this.search_text.detach().prependTo(this.dd);
            } else {
                this.search_text.detach().prependTo(this.search_group);
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

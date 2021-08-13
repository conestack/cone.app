import $ from 'jquery';
import ts from 'treibstoff';
import {toggle_arrow} from './utils.js';
import {layout} from './layout.js';
import {ScrollBarX} from './scrollbar.js';

export class MainMenuSidebar {

    static initialize(context) {
        let elem = $('#mainmenu_sidebar', context);
        if(!elem.length) {
            return;
        } else {
            if( layout.mainmenu_sidebar !== null) {
                layout.mainmenu_sidebar.unload();
            }
            layout.mainmenu_sidebar = new MainMenuSidebar(elem);
        }
        return layout.mainmenu_sidebar;
    }

    constructor(elem) {
        this.elem = elem;
        this.items = $('>li:not(".sidebar-heading")', this.elem);
        this.arrows = $('i.dropdown-arrow', this.items);
        this.menus = $('.sb-menu', this.elem);

        this.initial_cookie();

        this._collapse = this.collapse.bind(this);
        this._expand = this.expand.bind(this);

        if (layout.sidebar.collapsed) {
            this.collapse();
        } else {
            this.expand();
        }

        $(window).on('sidebar_collapsed', this._collapse);
        $(window).on('sidebar_expanded', this._expand);
    }

    unload() {
        this.items.off();
        this.arrows.off();
    }

    initial_cookie() {
        let cookie = ts.read_cookie('sidebar menus');
        if(cookie) {
            this.display_data = cookie.split(',');
        } else {
            this.display_data = [];
            for(let elem of this.menus) {
                this.display_data.push('none');
            }
        }
    }

    collapse() {
        $('ul', this.items).hide();
        this.arrows.off('click');

        for(let item of this.items) {
            let elem = $(item);
            let menu = $('ul', elem);

            elem.off().on('mouseenter', mouse_in);

            function mouse_in() {
                elem.addClass('hover');
                let elem_w = elem.outerWidth(),
                    menu_w = menu.outerWidth();
                if(elem_w > menu_w) {
                    menu.css('width', elem_w);
                } else {
                    elem.css('width', menu_w);
                }
                menu.show();
            }

            elem.on('mouseleave', () => {
                menu.hide();
                elem.removeClass('hover')
                    .css('width', 'auto');
            })

            // stop event on scrollbar drag
            $(window)
            .on('dragstart', () => {
                elem.off('mouseenter', mouse_in);
            })
            .on('dragend', () => {
                elem.on('mouseenter', mouse_in);
            })
        }
    }

    expand() {
        this.items.off('mouseenter mouseleave');

        for(let i = 0; i < this.menus.length; i++) {
            let elem = this.menus[i],
                arrow = $('i.dropdown-arrow', elem),
                menu = $('ul.cone-mainmenu-dropdown-sb', elem)
            ;

            menu.css('display', this.display_data[i]);

            if(menu.css('display') === 'block') {
                arrow.removeClass('bi-chevron-down')
                     .addClass('bi-chevron-up');
            } else {
                arrow.removeClass('bi-chevron-up')
                     .addClass('bi-chevron-down');
            }

            arrow.off().on('click', () => {
                let display = menu.css('display') === 'block' ? 'none' : 'block' ;
                menu.slideToggle('fast');
                toggle_arrow(arrow);
                this.display_data[i] = display; 
                ts.create_cookie('sidebar menus', this.display_data, null);
            });
        }
    }
}

export class MainMenuTop {

    static initialize(context) {
        let elem = $('#main-menu', context);
        if(!elem.length) {
            return;
        } else {
            layout.mainmenu_top = new MainMenuTop(elem);
        }
        return layout.mainmenu_top;
    }

    constructor(elem) {
        this.elem = elem;
        new ScrollBarX(elem);
        this.main_menu_items = [];
        let that = this;

        this.content = $('ul#mainmenu');
        $('li', this.content).each(function() {
            let main_menu_item = new MainMenuItem($(this));
            that.main_menu_items.push(main_menu_item);
        });
        layout.topnav.logo.addClass('m_right');

        this.handle_scrollbar();
    }

    handle_scrollbar() {
        for(let item of this.main_menu_items) {
            $(window)
            .on('dragstart', () => {
                item.elem.off('mouseenter mouseleave', item._toggle);
            })
            .on('dragend', () => {
                item.elem.on('mouseenter mouseleave', item._toggle);
            });
        }
    }
}

export class MainMenuItem {

    constructor(elem) {
        this.elem = elem;
        this.children = elem.data('menu-items');
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
        this.render_dd();

        this._toggle = this.mouseenter_toggle.bind(this);
        this.elem.off().on('mouseenter mouseleave', this._toggle);
        this.menu.off().on('mouseenter mouseleave', () => {
            this.menu.toggle();
        });
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

    mouseenter_toggle(e) {
        this.menu.offset({left: this.elem.offset().left});
        if(e.type === 'mouseenter') {
            this.menu.css('display', 'block');
        } else {
            this.menu.css('display', 'none');
        }
    }
}

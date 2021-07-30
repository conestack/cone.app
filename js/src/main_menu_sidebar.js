import $ from 'jquery';
import {toggle_arrow} from './toggle_arrow.js';
import {readCookie, createCookie} from './cookie_functions.js';
import {layout} from './layout.js';

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
        let cookie = readCookie('sidebar menus');
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
                createCookie('sidebar menus', this.display_data, null);
            });
        }
    }
}

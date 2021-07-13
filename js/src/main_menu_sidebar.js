import $ from 'jquery'

export class MainMenuSidebar extends cone.ViewPortAware {

    static initialize(context) {
        let elem = $('#mainmenu_sidebar', context);
        if(!elem.length) {
            return;
        }
        if(cone.main_menu_sidebar !== null) {
            cone.main_menu_sidebar.unload();
        }
        cone.main_menu_sidebar = new cone.MainMenuSidebar(elem);
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.items = $('>li:not(".sidebar-heading")', this.elem);
        this.arrows = $('i.dropdown-arrow', this.items);
        this.menus = $('.sb-menu', this.elem);

        this.initial_cookie();

        if (this.vp_state === cone.VP_MOBILE) {
            this.mv_to_mobile();
        }

        this._collapse = this.collapse.bind(this);
        this._expand = this.expand.bind(this);
    }

    unload() {
        super.unload();
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

    viewport_changed(e) {
        super.viewport_changed(e);
        if (this.vp_state === cone.VP_MOBILE) {
            this.mv_to_mobile();
        } 
        else {
            this.mv_to_sidebar();
        }
    }

    mv_to_mobile() {
        this.elem.detach()
        .appendTo(cone.topnav.content)
        .addClass('mobile');
    }

    mv_to_sidebar() {
        this.elem.detach()
        .prependTo(cone.sidebar_menu.content)
        .removeClass('mobile');
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
                cone.toggle_arrow(arrow);
                this.display_data[i] = display; 
                createCookie('sidebar menus', this.display_data, null);
            });
        }
    }

}
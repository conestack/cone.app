import $ from 'jquery'

export class MainMenuTop extends cone.ViewPortAware {

    static initialize(context) {
        let elem = $('#main-menu', context);
        if(!elem.length) {
            return;
        }
        if(cone.main_menu_top !== null) {
            cone.main_menu_top.unload();
        }
        cone.main_menu_top = new cone.MainMenuTop(elem);
    }

    constructor(elem) {
        super();
        this.elem = elem;
        new cone.ScrollBarX(elem);
        this.main_menu_items = [];
        let that = this;
        $('li', elem).each(function() {
            let main_menu_item = new cone.MainMenuItem($(this));
            that.main_menu_items.push(main_menu_item);
        });

        if(this.vp_state !== cone.VP_MOBILE) {
            cone.topnav.logo.css('margin-right', '2rem');
        } else {
            cone.topnav.logo.css('margin-right', 'auto');
            if (cone.main_menu_sidebar) {
                this.elem.css('display', 'none');
            }
        }

        this.handle_scrollbar();
    }

    unload() {
        super.unload();
    }

    handle_scrollbar() {
        for(let item of this.main_menu_items) {
            $(window)
            .on('dragstart', () => {
                item.elem.off('mouseenter mouseleave', item._toggle);
            })
            .on('dragend', () => {
                item.elem.on('mouseenter mouseleave', item._toggle);
            })   
        }
    }

    viewport_changed(e) {
        super.viewport_changed(e);
        if(this.vp_state === cone.VP_MOBILE) {
            cone.topnav.logo.css('margin-right', 'auto');
        } else {
            cone.topnav.logo.css('margin-right', '2rem');
        }
        if(cone.main_menu_sidebar) {
            if(this.vp_state === cone.VP_MOBILE) {
                this.elem.css('display', 'none');
            } else {
                this.elem.css('display', 'flex');
            }
            return;
        }

        for (let i in this.main_menu_items) {
            let item = this.main_menu_items[i];
            if (item.menu) {
                if (this.vp_state === cone.VP_MOBILE) {
                    item.mv_to_mobile();
                } else {
                    item.mv_to_top();
                }
            }
        }
    }
}
import $ from 'jquery'
import {ScrollBarX} from '../src/scrollbar.js';
import {MainMenuItem} from '../src/main_menu_item.js';
import {layout} from './layout.js';

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

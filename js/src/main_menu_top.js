import $ from 'jquery'
import {ScrollBarX} from '../src/scrollbar.js';
import {MainMenuItem} from '../src/main_menu_item.js';
import {vp_states} from '../src/viewport.js';

let main_menu_top = null;

export class MainMenuTop {

    static initialize(context) {
        let elem = $('#main-menu', context);
        if(!elem.length) {
            main_menu_top = null;
        } else {
            main_menu_top = new MainMenuTop(elem);
        }

        return main_menu_top;
    }

    constructor(elem) {
        this.elem = elem;
        new ScrollBarX(elem);
        this.main_menu_items = [];
        let that = this;
        $('li', elem).each(function() {
            let main_menu_item = new MainMenuItem($(this));
            that.main_menu_items.push(main_menu_item);
        });

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
            })   
        }
    }

    viewport_changed(state) {
        for (let i in this.main_menu_items) {
            let item = this.main_menu_items[i];
            if (item.menu) {
                if (state === vp_states.MOBILE) {
                    item.mv_to_mobile();
                } else {
                    item.mv_to_top();
                }
            }
        }
    }
}
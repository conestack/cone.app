import $ from 'jquery'
import {toggle_arrow} from './toggle_arrow.js';

/* cone Main Menu Item */

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

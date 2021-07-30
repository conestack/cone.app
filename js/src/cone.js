import $ from 'jquery';
import {Sidebar} from './sidebar.js';
import {MainMenuSidebar} from './main_menu_sidebar.js';
import {MainMenuTop} from './main_menu_top.js';
import {Searchbar} from './searchbar.js';
import {layout} from './layout.js';
import {Content} from './content.js';
import {Topnav} from './topnav.js';
import {Navtree} from './navtree.js';
import {ScrollBar, ScrollBarX, ScrollBarY} from './scrollbar.js';
import {ThemeSwitcher} from './theme_switcher.js';
import {MobileNav }from './mobile_nav.js';

export * from './viewport.js';

export * from './layout.js';
export * from './content.js';
export * from './main_menu_item.js';
export * from './main_menu_sidebar.js';
export * from './main_menu_top.js';
export * from './navtree.js';
export * from './searchbar.js';
export * from './sidebar.js';
export * from './theme_switcher.js';
export * from './topnav.js';
export * from './mobile_nav.js';

export * from './cookie_functions.js';
export * from './toggle_arrow.js';

export * from './scrollbar.js';

$(function() {
    bdajax.register(Topnav.initialize, true);
    bdajax.register(MainMenuTop.initialize, true);
    bdajax.register(Searchbar.initialize, true);
    bdajax.register(ThemeSwitcher.initialize, true);
    bdajax.register(Sidebar.initialize, true);
    bdajax.register(MainMenuSidebar.initialize, true);
    bdajax.register(Navtree.initialize, true);
    bdajax.register(Content.initialize, true);
    bdajax.register(MobileNav.initialize, true);
});
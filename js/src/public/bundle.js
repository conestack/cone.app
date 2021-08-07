import $ from 'jquery';
import ts from 'treibstoff';
import {Sidebar} from './sidebar.js';
import {
    MainMenuSidebar,
    MainMenuTop
} from './mainmenu.js';
import {Searchbar} from './searchbar.js';
import {Content} from './content.js';
import {Topnav} from './topnav.js';
import {Navtree} from './navtree.js';
import {ThemeSwitcher} from './theme.js';
import {MobileNav} from './mobilenav.js';
import {Toolbar} from './toolbar.js';
import {Personaltools} from './personaltools.js';

export * from './content.js';
export * from './layout.js';
export * from './mainmenu.js';
export * from './mobilenav.js';
export * from './navtree.js';
export * from './personaltools.js';
export * from './scrollbar.js';
export * from './searchbar.js';
export * from './sidebar.js';
export * from './theme.js';
export * from './toolbar.js';
export * from './topnav.js';
export * from './utils.js';
export * from './viewport.js';

$(function() {
    ts.ajax.register(Topnav.initialize, true);
    ts.ajax.register(MainMenuTop.initialize, true);
    ts.ajax.register(Searchbar.initialize, true);
    ts.ajax.register(Toolbar.initialize, true);
    ts.ajax.register(Personaltools.initialize, true);
    ts.ajax.register(ThemeSwitcher.initialize, true);
    ts.ajax.register(Sidebar.initialize, true);
    ts.ajax.register(MainMenuSidebar.initialize, true);
    ts.ajax.register(Navtree.initialize, true);
    ts.ajax.register(Content.initialize, true);
    ts.ajax.register(MobileNav.initialize, true);
});

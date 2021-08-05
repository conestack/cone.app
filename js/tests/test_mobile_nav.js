import $ from 'jquery';
import * as helpers from './helpers.js';

import {MobileNav} from '../src/public/mobilenav.js';
import {Sidebar} from '../src/public/sidebar.js';
import {Topnav} from '../src/public/topnav.js';
import {MainMenuSidebar, MainMenuTop} from '../src/public/mainmenu.js';
import {Navtree} from '../src/public/navtree.js';
import {layout} from '../src/public/layout.js';


///////////////////////////////////////////////////////////////////////////////
// MobileNav tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('MobileNav', () => {
    QUnit.module('constructor', hooks => {

        hooks.after(() => {
            $('#layout').remove();

            layout.mainmenu_sidebar = null;
            layout.navtree = null;
            layout.sidebar = null;
            layout.topnav = null;
            layout.mainmenu_top = null;
        });

        QUnit.test('sidebar and topnav null', assert => {
            // initialize
            Topnav.initialize();
            Sidebar.initialize();
            MainMenuSidebar.initialize();
            MainMenuTop.initialize();
            Navtree.initialize();

            // create new mobile nav
            MobileNav.initialize();

            // TODO: mobile nav should be null
            assert.ok(true);
        });
    });

    QUnit.module('viewport_changed', hooks => {
        hooks.beforeEach(() => {
            helpers.create_layout_elem();
            // set viewport to dekstop for consistency
            helpers.set_vp('large');
        });
        hooks.afterEach(() => {
            // remove DOM elements
            $('#layout').remove();

            layout.mainmenu_sidebar = null;
            layout.navtree = null;
            layout.sidebar = null;
            layout.topnav = null;
            layout.mainmenu_top = null;
        });

        QUnit.test('viewport_changed: mainmenu sidebar', assert => {
            // create DOM elements
            helpers.create_topnav_elem();
            helpers.create_sidebar_elem();
            helpers.create_mm_sidebar_elem();

            // initialize
            Topnav.initialize();
            Sidebar.initialize();
            MainMenuSidebar.initialize();
            MainMenuTop.initialize();
            Navtree.initialize();

            // create mobile Nav
            MobileNav.initialize();

            // sidebar is visible
            assert.strictEqual($('#sidebar_left').css('display'), 'block');
            assert.strictEqual($('#topnav-content > #mainmenu_sidebar').length, 0);

            // set viewport to mobile
            helpers.set_vp('mobile');

            assert.strictEqual($('#sidebar_left').css('display'), 'none');
            assert.strictEqual($('#topnav-content > #mainmenu_sidebar').length, 1);

            // set viewport to desktop
            helpers.set_vp('large');

            assert.strictEqual($('#sidebar_left').css('display'), 'block');
            assert.strictEqual($('#topnav-content > #mainmenu_sidebar').length, 0);
            assert.strictEqual($('#mainmenu_sidebar', layout.sidebar.content).length, 1);
        });

        QUnit.test('viewport_changed: navtree', assert => {
            // create DOM elements
            helpers.create_sidebar_elem();
            helpers.create_topnav_elem();
            helpers.create_navtree_elem();

            // initialize
            Topnav.initialize();
            Sidebar.initialize();
            MainMenuSidebar.initialize();
            Navtree.initialize();

            // create mobile Nav
            MobileNav.initialize();

            // sidebar is visible
            assert.strictEqual($('#sidebar_left').css('display'), 'block');
            assert.strictEqual($('#topnav-content > #navtree').length, 0);

            // set viewport to mobile
            helpers.set_vp('mobile');

            assert.strictEqual($('#sidebar_left').css('display'), 'none');
            assert.strictEqual($('#topnav-content > #navtree').length, 1);

            assert.strictEqual(layout.navtree.content.css('display'), 'none');
            layout.navtree.heading.trigger('click');
            assert.strictEqual(layout.navtree.content.css('display'), 'block');

            // set viewport to desktop
            helpers.set_vp('large');

            assert.strictEqual($('#sidebar_left').css('display'), 'block');
            assert.strictEqual($('#topnav-content > #navtree').length, 0);
            assert.strictEqual($('#navtree', layout.sidebar.content).length, 1);
        });

        QUnit.test('viewport_changed: layout.mainmenu_top', assert => {
            // create DOM elements
            helpers.create_topnav_elem();
            helpers.create_mm_top_elem();
            helpers.create_mm_items(3);

            // initialize
            Topnav.initialize();
            MainMenuTop.initialize();
            Navtree.initialize();

            // create mobile Nav
            MobileNav.initialize();

            let items = layout.mainmenu_top.main_menu_items;

            // set viewport to mobile
            helpers.set_vp('mobile');
            assert.strictEqual($('#topnav-content').css('display'), 'none');
            // trigger mobile menu toggle
            $('#mobile-menu-toggle').trigger('click');
            assert.strictEqual($('#topnav-content').css('display'), 'flex');
            // mainmenu dropdowns not in layout
            assert.strictEqual($(`#layout > .cone-mainmenu-dropdown`).length, 0);

            for(let i in items) {
                // mainmenu items are moved to topnav content
                let item = items[i];
                assert.strictEqual($(item.menu, item.elem).length, 1);

                assert.strictEqual($(item.menu).css('display'), 'none');
                $(item.arrow).trigger('click');
                assert.strictEqual($(item.menu).css('display'), 'block');
                $(item.arrow).trigger('click');
                assert.strictEqual($(item.menu).css('display'), 'none');
            }

            // trigger closing toggle of mobile menu
            $('#mobile-menu-toggle').trigger('click');
            assert.strictEqual($('#topnav-content').css('display'), 'none');

            // set viewport to desktop
            helpers.set_vp('large');
            for(let i in items) {
                // mainmenu item menus are moved to layout
                let item = items[i];
                assert.strictEqual($(item.menu).css('display'), 'none');
                $(item.elem).trigger('mouseenter');
                assert.strictEqual($(item.menu).css('display'), 'block');
                $(item.elem).trigger('mouseleave');
                assert.strictEqual($(item.menu).css('display'), 'none');

                $(item.elem).trigger('mouseenter');
                $(item.menu).trigger('mouseleave');
                assert.strictEqual($(item.menu).css('display'), 'none');
            }
            assert.strictEqual($(`#layout > .cone-mainmenu-dropdown`).length, 3);

            helpers.set_vp('large');
            // initalize mm sidebar
            helpers.create_sidebar_elem();
            helpers.create_mm_sidebar_elem();
            Sidebar.initialize();
            MainMenuSidebar.initialize();

            helpers.set_vp('mobile');
            assert.strictEqual(layout.mainmenu_top.elem.css('display'), 'none');

            helpers.set_vp('large');
            assert.strictEqual(layout.mainmenu_top.elem.css('display'), 'flex');
        });
    });
});

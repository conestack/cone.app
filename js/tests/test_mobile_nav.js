import $ from 'jquery';
import {MobileNav} from '../src/mobile_nav.js';
import {SidebarMenu} from '../src/sidebar_menu.js';
import * as helpers from './helpers.js';
import {Topnav} from '../src/topnav.js';
import {MainMenuSidebar, mainmenu_sidebar} from '../src/main_menu_sidebar.js';
import { Navtree, navtree } from '../src/navtree.js';

import {topnav} from '../src/topnav.js';
import {sidebar_menu} from '../src/sidebar_menu.js';
import {MainMenuTop, mainmenu_top} from '../src/main_menu_top.js';


///////////////////////////////////////////////////////////////////////////////
// MobileNav tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('MobileNav', () => {
    QUnit.module('constructor', hooks => {
        let nav;

        hooks.before(() => {
            console.log('Set up constructor tests');
        });

        hooks.afterEach(() => {
            nav = null;
            $('#layout').remove();
        });

        hooks.after(() => {
            console.log('Tear down constructor tests');
        });

        QUnit.test('sidebar and topnav null', assert => {
            // initialize
            Topnav.initialize();
            SidebarMenu.initialize();
            MainMenuSidebar.initialize();
            MainMenuTop.initialize();
            Navtree.initialize();

            // create new mobile nav
            nav = new MobileNav();

            // TODO:
            assert.ok(true);
            console.log(nav)
        });

        QUnit.test('constructor', assert => {
            // create sidebar DOM element and initialize
            helpers.create_sidebar_elem();
            SidebarMenu.initialize();

            // create mobile Nav
            nav = new MobileNav();

            // sidebar is hidden if empty
            assert.strictEqual($('#sidebar_left').css('display'), 'none');

            // set viewport to desktop size
            helpers.set_vp('large');

            // viewport_changed unbound
            assert.strictEqual($('#sidebar_left').css('display'), 'none');
        });

        QUnit.test('no children', assert => {
            // create DOM elements
            helpers.create_topnav_elem();
            helpers.create_sidebar_elem();

            // initialize
            Topnav.initialize();
            SidebarMenu.initialize();
            MainMenuSidebar.initialize();
            MainMenuTop.initialize();
            Navtree.initialize();

            // create mobile Nav
            nav = new MobileNav();

            // sidebar is hidden
            assert.strictEqual(sidebar_menu.elem.css('display'), 'none');

            // trigger viewport_changed
            helpers.set_vp('large');

            // sidebar is hidden
            assert.strictEqual(sidebar_menu.elem.css('display'), 'none');
        });
    });

    QUnit.module('viewport_changed', hooks => {
        let nav;

        hooks.beforeEach(() => {
            console.log('Set up viewport_changed tests');

            // set viewport to dekstop for consistency
            helpers.set_vp('large');
        });
        hooks.afterEach(() => {
            console.log('Tear down viewport_changed tests');
            nav = null;
            // remove DOM elements
            $('#layout').remove();
        });

        QUnit.test('viewport_changed: mainmenu sidebar', assert => {
            // create DOM elements
            helpers.create_topnav_elem();
            helpers.create_sidebar_elem();
            helpers.create_mm_sidebar_elem();

            // initialize
            SidebarMenu.initialize();
            Topnav.initialize();
            MainMenuSidebar.initialize();
            Navtree.initialize();

            // create mobile Nav
            nav = new MobileNav();

            // sidebar is visible
            assert.strictEqual($('#sidebar_left').css('display'), 'block');
            assert.strictEqual($('#mainmenu_sidebar', topnav.content).length, 0);

            // set viewport to mobile
            helpers.set_vp('mobile');

            assert.strictEqual($('#sidebar_left').css('display'), 'none');
            assert.strictEqual($('#mainmenu_sidebar', topnav.content).length, 1);

            // set viewport to desktop
            helpers.set_vp('large');

            assert.strictEqual($('#sidebar_left').css('display'), 'block');
            assert.strictEqual($('#mainmenu_sidebar', topnav.content).length, 0);
            assert.strictEqual($('#mainmenu_sidebar', sidebar_menu.content).length, 1);
        });

        QUnit.test('viewport_changed: navtree', assert => {
            // create DOM elements
            helpers.create_sidebar_elem();
            helpers.create_topnav_elem();
            helpers.create_navtree_elem();

            // initialize
            Topnav.initialize();
            SidebarMenu.initialize();
            MainMenuSidebar.initialize();
            Navtree.initialize();

            // create mobile Nav
            nav = new MobileNav();

            // sidebar is visible
            assert.strictEqual($('#sidebar_left').css('display'), 'block');
            assert.strictEqual($('#navtree', topnav.content).length, 0);

            // set viewport to mobile
            helpers.set_vp('mobile');

            assert.strictEqual($('#sidebar_left').css('display'), 'none');
            assert.strictEqual($('#navtree', topnav.content).length, 1);

            // set viewport to desktop
            helpers.set_vp('large');

            assert.strictEqual($('#sidebar_left').css('display'), 'block');
            assert.strictEqual($('#navtree', topnav.content).length, 0);
            assert.strictEqual($('#navtree', sidebar_menu.content).length, 1);
        });

        QUnit.test('viewport_changed: mainmenu_top', assert => {
            // create DOM elements
            helpers.create_topnav_elem();
            helpers.create_mm_top_elem();
            helpers.create_mm_items(3);

            // initialize
            Topnav.initialize();
            MainMenuSidebar.initialize();
            MainMenuTop.initialize();
            Navtree.initialize();

            // create mobile Nav
            nav = new MobileNav();

            let items = mainmenu_top.main_menu_items;

            // overwrite slideToggle for performance
            $.fn._slideToggle = $.fn.slideToggle;
            $.fn.slideToggle = function(){
                if(this.css('display') !== 'none') {
                    $.fn.hide.apply(this);
                } else {
                    $.fn.show.apply(this);
                }
            };

            // set viewport to mobile
            helpers.set_vp('mobile');
            assert.strictEqual(topnav.content.css('display'), 'none');
            // trigger mobile menu toggle
            topnav.toggle_button.trigger('click');
            assert.strictEqual(topnav.content.css('display'), 'flex');
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
            topnav.toggle_button.trigger('click');
            assert.strictEqual(topnav.content.css('display'), 'none');

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
            }
            assert.strictEqual($(`#layout > .cone-mainmenu-dropdown`).length, 3);
        });
    });
});

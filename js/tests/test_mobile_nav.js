import $ from 'jquery';
import {MobileNav} from '../src/mobile_nav.js';
import {SidebarMenu} from '../src/sidebar_menu.js';
import * as helpers from './helpers.js';
import {Topnav} from '../src/topnav.js';
import {MainMenuSidebar, mainmenu_sidebar} from '../src/main_menu_sidebar.js';
import { Navtree } from '../src/navtree.js';

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
        hooks.after(() => {
            console.log('Tear down constructor tests');
            nav = null;
        });

        QUnit.test('constructor', assert => {
            // create sidebar DOM element
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
    });

    QUnit.module('viewport_changed', hooks => {
        let nav;

        hooks.beforeEach(() => {
            console.log('Set up viewport_changed tests');

            // create sidebar DOM element
            helpers.create_sidebar_elem();

            // set viewport to dekstop for consistency
            helpers.set_vp('large');

            // initialize
            SidebarMenu.initialize();
        });
        hooks.afterEach(() => {
            console.log('Tear down viewport_changed tests');
            nav = null;
            $('#sidebar_left').remove();
            $('#topnav').remove();
        });

        QUnit.test.only('viewport_changed: mainmenu sidebar', assert => {
            helpers.create_topnav_elem();
            helpers.create_mm_sidebar_elem();
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

        QUnit.test.only('viewport_changed: navtree', assert => {
            helpers.create_topnav_elem();
            helpers.create_navtree_elem();
            Topnav.initialize();
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

        QUnit.test.only('viewport_changed: mainmenu_top', assert => {
            helpers.create_topnav_elem();
            helpers.create_mm_top_elem();
            helpers.create_mm_items(2);
            Topnav.initialize();
            MainMenuSidebar.initialize();
            MainMenuTop.initialize();
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

    });

});

QUnit.test.skip('test mob nav', assert => {
    helpers.create_sidebar_elem();
    helpers.create_topnav_elem();
    helpers.create_mm_sidebar_elem();

    // set viewport to desktop
    helpers.set_vp('large');

    // initialize elements first
    SidebarMenu.initialize();
    Topnav.initialize();
    MainMenuSidebar.initialize();

    // initialize nav with references last
    let nav = new MobileNav();

    assert.strictEqual($('#topnav-content > #mainmenu_sidebar').length, 0);

    helpers.set_vp('mobile');
    console.log('nav.vp state: ' + nav.vp_state);

    assert.strictEqual($('#topnav-content > #mainmenu_sidebar').length, 1);

    helpers.set_vp('large')
    console.log('nav.vp state: ' + nav.vp_state);
    assert.strictEqual($('#topnav-content > #mainmenu_sidebar').length, 0);
});
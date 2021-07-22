import $ from 'jquery';
import {MobileNav} from '../src/mobile_nav.js';
import { SidebarMenu, sidebar_menu } from '../src/sidebar_menu.js';
import * as helpers from './helpers.js';
import {Topnav} from '../src/topnav.js';
import { MainMenuSidebar } from '../src/main_menu_sidebar.js';

QUnit.test('blah', assert => {
    assert.ok(true);
    
    $('body').append($('<div id="test_1"></div>'));
    
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
 
  


    // viewport.set('medium');

    // console.log(sidebar_menu.vp_state);
    // console.log(sidebar_menu)
    // console.log(sidebar_menu.elem);


});
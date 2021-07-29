import * as helpers from './test-helpers.js';

import {layout} from '../src/layout.js';
import {Content} from '../src/content.js';
import {MainMenuItem} from '../src/main_menu_item.js';
import {MainMenuSidebar} from '../src/main_menu_sidebar.js';
import {MainMenuTop} from '../src/main_menu_top.js';
import {Navtree} from '../src/navtree.js';
import {Searchbar} from '../src/searchbar.js';
import {Sidebar} from '../src/sidebar.js';
import {ThemeSwitcher, default_themes} from '../src/theme_switcher.js';
import {Topnav} from '../src/topnav.js';
import {MobileNav} from '../src/mobile_nav.js';

import {ScrollBarX, ScrollBarY} from '../src/scrollbar.js';


function create_test_sb() {
        // create dummy searchber element
        let searchbar_html = `
        <div id="cone-searchbar">
          <div id="cone-searchbar-wrapper"
               class="dropdown-toggle"
               role="button"
               data-bs-toggle="dropdown">
            <div class="input-group" id="livesearch-group">
              <div id="livesearch-input">
                <input type="text"
                       class="form-control">
                </input>
              </div>
              <div class="input-group-append">
                <button type="submit" id="searchbar-button">
                  <i class="bi-search"></i>
                </button>
              </div>
            </div>
          </div>
          <ul class="dropdown-menu" id="cone-livesearch-dropdown">
            <li class="dropdown-title">
              Search Results
            </li>
            <div id="cone-livesearch-results">
              <li>
                <span>Example Livesearch Result</span>
              </li>
            </div>
          </ul>
        </div>
    `;
    // append dummy element to DOM
    $('#topnav-content').append(searchbar_html);
}

QUnit.module('layout', hooks => {

    hooks.before(()=> {
        helpers.create_layout_elem();
        helpers.create_topnav_elem();
        helpers.create_mm_top_elem();
        helpers.create_mm_items(5);
        helpers.create_empty_item(2);
        create_test_sb();
        helpers.create_toolbar_elem();
        helpers.create_pt_elem();
        helpers.create_theme_switcher_elem();
        helpers.create_sidebar_elem();
        helpers.create_mm_sidebar_elem();
        helpers.create_navtree_elem();
    });

    QUnit.test('test layout', assert => {
   
        $('#layout').css('overflow', 'hidden');
        Topnav.initialize();
        MainMenuTop.initialize();
        Searchbar.initialize();
        Sidebar.initialize();
        Navtree.initialize();
        MainMenuSidebar.initialize();
        ThemeSwitcher.initialize($('#layout'), default_themes);
        let sb = Searchbar.initialize();
        let nav = MobileNav.initialize();

        assert.ok(true);
    });
})
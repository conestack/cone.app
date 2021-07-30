import {layout} from '../src/layout.js';
import {MainMenuTop} from '../src/main_menu_top.js';
import {MobileNav} from '../src/mobile_nav.js';
import {Topnav} from '../src/topnav.js';
import * as helpers from './test-helpers.js';

///////////////////////////////////////////////////////////////////////////////
// MainMenuItem tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('MainMenuItem', () => {

    QUnit.module('constructor', hooks => {

            hooks.before(() => {
                helpers.create_layout_elem();
                // create dummy topnav DOM element
                helpers.create_topnav_elem();
                // create dummy mainmenu top DOM element
                helpers.create_mm_top_elem();
                // create dummy mainmenu item DOM elements
                helpers.create_mm_items(1);
            });

            hooks.after(() => {
                // remove dummy DOM elements
                $('#layout').remove();
            });

            QUnit.test('properties', assert => {
                // create instance
                Topnav.initialize();
                MainMenuTop.initialize();

                assert.strictEqual(layout.mainmenu_top.main_menu_items.length, 1);
                let mm_item = layout.mainmenu_top.main_menu_items[0];

                // containing element
                assert.ok(mm_item.elem.is('li'));
                assert.ok(mm_item.elem.hasClass('node-child_1'));

                // dummy item has children
                assert.ok(mm_item.children);

                // menu
                assert.ok(mm_item.menu.is('div.cone-mainmenu-dropdown'));
                assert.strictEqual($('ul', mm_item.menu).length, 1);

                // dropdown
                assert.ok(mm_item.dd.is('ul.mainmenu-dropdown'));

                // arrow
                assert.ok(mm_item.arrow.is('i.dropdown-arrow'));

                // private methods
                assert.ok(mm_item._toggle);

                // trigger on menu
                mm_item.menu.show();
                mm_item.menu.trigger('mouseleave');
                assert.strictEqual(mm_item.menu.css('display'), 'none');
            });
    });

    QUnit.module('methods', hooks => {

        hooks.afterEach(() => {
            // remove dummy DOM elements
            $('#layout').remove();
        });

        QUnit.module('render_dd()', hooks => {

            hooks.before(() => {
                // create dummy layout element, append to DOM
                helpers.create_layout_elem();

                // create dummy DOM elements
                helpers.create_topnav_elem();
                helpers.create_mm_top_elem();
                helpers.create_mm_items(1);
            });

            hooks.after(() => {
                $('#layout').remove();
            });

            QUnit.test('render_dd()', assert => {
                // create instance
                Topnav.initialize();
                MainMenuTop.initialize();

                assert.strictEqual(layout.mainmenu_top.main_menu_items.length, 1);
                let mm_item = layout.mainmenu_top.main_menu_items[0];
                // 3 default children appended
                assert.strictEqual(mm_item.children.length, 3);
                // menu appended to layout
                assert.strictEqual(
                    $('#layout > .cone-mainmenu-dropdown').length,
                    1
                );
                // items appended to menu
                assert.strictEqual($('.mainmenu-dropdown > li').length, 3);
            });
        });

        QUnit.module('toggle', hooks => {
            hooks.before(() => {
                helpers.create_layout_elem();
                helpers.create_topnav_elem();
                helpers.create_mm_top_elem();
                helpers.create_mm_items(1);
            });

            hooks.after(() => {
                $('#layout').remove();
            });

            QUnit.test('mouseenter_toggle()', assert => {
                Topnav.initialize();
                MainMenuTop.initialize();

                let mm_item = layout.mainmenu_top.main_menu_items[0];

                // trigger mouseenter
                mm_item.elem.trigger('mouseenter');
                assert.strictEqual(
                    mm_item.menu.offset().left,
                    mm_item.elem.offset().left
                );
                assert.strictEqual(mm_item.menu.css('display'), 'block');

                // trigger mouseleave
                mm_item.elem.trigger('mouseleave');
                assert.strictEqual(mm_item.menu.css('display'), 'none');
            });
        });
    });
});

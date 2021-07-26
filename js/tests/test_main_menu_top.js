import {MainMenuTop, mainmenu_top} from '../src/main_menu_top.js';
import { Topnav, topnav } from '../src/topnav.js';
import * as helpers from './test-helpers.js';

///////////////////////////////////////////////////////////////////////////////
// MainMenuTop tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('MainMenuTop', hooks => {
    hooks.before(() => {
        console.log('Set up MainMenuTop tests');
    });

    hooks.after(() => {
        console.log('Tear down MainMenuTop tests');
    });

    QUnit.module('constructor', hooks => {
        hooks.before(() => {
            console.log('Set up MainMenuTop.constructor tests');
        });

        hooks.beforeEach(() => {
            helpers.create_topnav_elem();
            helpers.create_mm_top_elem();
        });

        hooks.afterEach(() => {
            $('#topnav').remove();
        });

        QUnit.test('properties', assert => {
            // initialize MainMenuTop
            MainMenuTop.initialize();

            // element is div
            assert.ok(mainmenu_top.elem.is('div'));
            // mm items is empty array if no mm items in DOM
            assert.deepEqual(mainmenu_top.main_menu_items, []);
        });

        QUnit.module('mm_items', hooks => {
            let elem_count;

            hooks.before(() => {
                // number of dummy items
                elem_count = 2;

                // create DOM elements
                helpers.create_topnav_elem();
                helpers.create_mm_top_elem();
                // create dummy items
                helpers.create_mm_items(elem_count);
            });

            hooks.after(() => {
                // remove mainmenu items
                $('.mainmenu-item').remove();

                // remove topnav from DOM
                $('#topnav').remove();
            });

            QUnit.test('MainMenuTop - MainMenuItems', assert => {
                // initialize MainMenuTop
                MainMenuTop.initialize();

                // all mainmenu items get pushed into array
                assert.strictEqual(
                    mainmenu_top.main_menu_items.length,
                    elem_count
                );
            });
        });
    });

    QUnit.module('methods', hooks => {

        hooks.beforeEach(() => {
            helpers.set_vp('large');

            // create DOM elements
            helpers.create_topnav_elem();
            helpers.create_mm_top_elem();
            // create dummy main menu DOM items
            helpers.create_mm_items(1);
            helpers.create_empty_item();
        });

        hooks.afterEach(() => {
            // remove elements from DOM
            $('#layout').remove();
        });

        QUnit.test('handle_scrollbar()', assert => {
            Topnav.initialize();
            MainMenuTop.initialize();

            let items = mainmenu_top.main_menu_items;

            // trigger dragstart
            $(window).trigger('dragstart');

            for(let i in items) {
                let item = items[i];
                if(item.menu) {
                    assert.strictEqual(item.menu.css('display'), 'none');
                    item.elem.trigger('mouseenter');
                    assert.strictEqual(item.menu.css('display'), 'none');
                }
            }

            $(window).trigger('dragend');
            for(let i in items) {
                let item = items[i];
                if(item.menu) {
                    assert.strictEqual(item.menu.css('display'), 'none');
                    item.elem.trigger('mouseenter');
                    assert.strictEqual(item.menu.css('display'), 'block');
                    item.elem.trigger('mouseleave');
                    assert.strictEqual(item.menu.css('display'), 'none');
                }
            }
        });

        QUnit.test('mv_to_mobile', assert => {
            Topnav.initialize();
            MainMenuTop.initialize();

            let items = mainmenu_top.main_menu_items;

            // mobile viewport
            helpers.set_vp('mobile');
            mainmenu_top.mv_to_mobile();

            for(let i in items) {
                let item = items[i];
                if(item.menu) {
                    assert.strictEqual($('.cone-mainmenu-dropdown', item.elem).length, 1);
                    assert.strictEqual(item.menu.css('left'), '0px');
                }
            }
        });

        QUnit.test('mv_to_top', assert => {
            Topnav.initialize();
            MainMenuTop.initialize();

            let items = mainmenu_top.main_menu_items;

            // mobile viewport
            helpers.set_vp('large');
            mainmenu_top.mv_to_top();

            for(let i in items) {
                let item = items[i];
                if(item.menu) {
                    assert.strictEqual($('.cone-mainmenu-dropdown', item.elem).length, 0);
                    assert.strictEqual($('#layout > .cone-mainmenu-dropdown').length, 1)
                }
            }
        });
    });
});
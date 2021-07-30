import {MainMenuTop} from '../src/main_menu_top.js';
import {Topnav} from '../src/topnav.js';
import * as helpers from './test-helpers.js';
import {layout} from '../src/layout.js';

///////////////////////////////////////////////////////////////////////////////
// MainMenuTop tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('MainMenuTop', () => {
    QUnit.module('constructor', hooks => {
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
            assert.ok(layout.mainmenu_top.elem.is('div'));
            // mm items is empty array if no mm items in DOM
            assert.deepEqual(layout.mainmenu_top.main_menu_items, []);
        });

        QUnit.module('mm_items', hooks => {
            let elem_count;

            hooks.before(() => {
                // number of dummy items
                elem_count = 2;

                // create DOM elements
                helpers.create_layout_elem();
                helpers.create_topnav_elem();
                helpers.create_mm_top_elem();
                // create dummy items
                helpers.create_mm_items(elem_count);
            });

            hooks.after(() => {
                // remove topnav from DOM
                $('#layout').remove();
            });

            QUnit.test('MainMenuTop - MainMenuItems', assert => {
                // initialize MainMenuTop
                Topnav.initialize();
                MainMenuTop.initialize();

                // all mainmenu items get pushed into array
                assert.strictEqual(
                    layout.mainmenu_top.main_menu_items.length,
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

            let items = layout.mainmenu_top.main_menu_items;

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
    });
});

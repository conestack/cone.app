import {MainMenuTop} from '../src/main_menu_top.js';
import * as helpers from './helpers.js';

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
        let mm_top;

        hooks.before(() => {
            console.log('Set up MainMenuTop.constructor tests');
        });

        hooks.beforeEach(() => {
            helpers.create_topnav_elem();
            helpers.create_mm_top_elem();
        });

        hooks.afterEach(() => {
            mm_top = null;
            $('#topnav').remove();
        });

        QUnit.test('properties', assert => {
            // initialize MainMenuTop
            mm_top = MainMenuTop.initialize();

            // element is div
            assert.ok(mm_top.elem.is('div'));
            // mm items is empty array if no mm items in DOM
            assert.deepEqual(mm_top.main_menu_items, []);
        });

        QUnit.module('mm_items', hooks => {
            let elem_count,
                mm_top;

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
                // unset elements
                mm_top = null;
                // remove topnav from DOM
                $('#topnav').remove();
            });

            QUnit.test('MainMenuTop - MainMenuItems', assert => {
                // initialize MainMenuTop
                let mm_top = MainMenuTop.initialize();

                // all mainmenu items get pushed into array
                assert.strictEqual(
                    mm_top.main_menu_items.length,
                    elem_count
                );
            });
        });
    });

    QUnit.module('methods', () => {

        QUnit.test.skip('handle_scrollbar()', assert => {
            // WIP
        });

        QUnit.module('MainMenuItems', hooks => {
            let mm_top;

            hooks.before(() => {
                // create layout element
                $('body').append($('<div id="layout"></div>'));
                // create DOM elements
                helpers.create_topnav_elem();
                helpers.create_mm_top_elem();
                // create dummy main menu DOM items
                helpers.create_mm_items(1);
                helpers.create_empty_item();
            });

            hooks.after(() => {
                // unset instances
                mm_top = null;
                // remove elements from DOM
                $('#topnav').remove();
                $('.cone-mainmenu-dropdown').remove();
            });

            QUnit.test('viewport_changed mainmenu items', assert => {
                mm_top = MainMenuTop.initialize();

                // mobile viewport
                helpers.set_vp('mobile');
                // invoke change that usually happens in topnav
                mm_top.viewport_changed(0);

                assert.strictEqual(
                    $('li > .cone-mainmenu-dropdown', mm_top.elem).length,
                    1
                );

                // mobile viewport
                helpers.set_vp('large');
                 // invoke change that usually happens in topnav
                 mm_top.viewport_changed(3);

                 assert.strictEqual(
                    $('li > .cone-mainmenu-dropdown', mm_top.elem).length,
                    0
                );
                assert.strictEqual( $('#layout > .cone-mainmenu-dropdown').length,
                1);
            });
        });
    });
});
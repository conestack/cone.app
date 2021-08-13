import {MainMenuTop} from '../src/mainmenu.js';
import {Topnav} from '../src/topnav.js';
import {
    create_empty_item,
    create_layout_elem,
    create_mm_items,
    create_mm_top_elem,
    create_topnav_elem,
    set_vp
} from './helpers.js';
import {layout} from '../src/layout.js';

QUnit.module('MainMenuTop', () => {

    QUnit.module('constructor', hooks => {
        hooks.beforeEach(() => {
            create_topnav_elem();
            create_mm_top_elem();
        });

        hooks.afterEach(() => {
            $('#topnav').remove();
        });

        QUnit.test('properties', assert => {
            Topnav.initialize();
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
                create_layout_elem();
                create_topnav_elem();
                create_mm_top_elem();
                // create dummy items
                create_mm_items(elem_count);
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
            set_vp('large');

            // create DOM elements
            create_topnav_elem();
            create_mm_top_elem();
            // create dummy main menu DOM items
            create_mm_items(1);
            create_empty_item();
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

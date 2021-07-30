import {MainMenuSidebar} from '../src/main_menu_sidebar.js';
import {Sidebar} from '../src/sidebar.js';
import {Topnav} from '../src/topnav.js';
import * as helpers from './test-helpers.js';
import {createCookie, readCookie} from '../src/cookie_functions.js';
import {layout} from '../src/layout.js';
import {MobileNav} from '../src/mobile_nav.js';

///////////////////////////////////////////////////////////////////////////////
// MainMenuSidebar tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('MainMenuSidebar', () => {

    QUnit.module('constructor', hooks => {

        hooks.beforeEach(() => {
            // create DOM elements
            helpers.create_sidebar_elem();
            helpers.create_mm_sidebar_elem();
        });

        hooks.afterEach(() => {
            // remove element from DOM
            $('#layout').remove();
        });

        QUnit.test('properties', assert => {
            // initialize instances
            Sidebar.initialize();
            MainMenuSidebar.initialize();

            // containing element
            assert.ok(layout.mainmenu_sidebar.elem.is('ul#mainmenu_sidebar'));

            // items
            assert.ok(layout.mainmenu_sidebar.items);
            // expected number of items in mainmenu
            assert.strictEqual(layout.mainmenu_sidebar.items.length, 3);

            // items are direct children of elem
            assert.ok(
                layout.mainmenu_sidebar.items
                .is('#mainmenu_sidebar > li:not("sidebar-heading")')
            );

            // arrows
            assert.ok(layout.mainmenu_sidebar.arrows);
            assert.ok(layout.mainmenu_sidebar.arrows.is('i.dropdown-arrow'));

            // menus
            assert.ok(layout.mainmenu_sidebar.menus.is('li.sb-menu'));
        });

        QUnit.test('collapsed sidebar', assert => {
            helpers.set_vp('small');

            // initialize instances
            Sidebar.initialize();
            MainMenuSidebar.initialize();

            assert.strictEqual(layout.sidebar.collapsed, true);
            assert.strictEqual(
                $('ul', layout.mainmenu_sidebar.items[1]).css('display'),
                'none'
            );
        });
    });

    QUnit.module('methods', () => {

        QUnit.module('unload()', hooks => {
            hooks.before(() => {
                // create DOM elements
                helpers.create_sidebar_elem();
                helpers.create_mm_sidebar_elem();
            });

            hooks.after(() => {
                $('#layout').remove();
            });

            QUnit.test('unload()', assert => {
                // initialize instances
                Sidebar.initialize();
                MainMenuSidebar.initialize();

                layout.mainmenu_sidebar.items.on('mouseenter mouseleave', () => {
                    assert.step('mouseenter/mouseleave');
                });
                layout.mainmenu_sidebar.arrows.on('click', () => {
                    assert.step('click');
                });

                // second instance invokes unload function
                MainMenuSidebar.initialize();

                // trigger events to check if evt listeners are unbound
                layout.mainmenu_sidebar.items.trigger('mouseenter');
                layout.mainmenu_sidebar.items.trigger('mouseleave');
                layout.mainmenu_sidebar.arrows.trigger('click');

                assert.verifySteps([]);
            });
        });

        QUnit.module('initial_cookie()', hooks => {
            hooks.beforeEach(() => {
                // create DOM elements
                helpers.create_sidebar_elem();
                helpers.create_mm_sidebar_elem();

                // delete any cookies --- make sure to tear down properly!
                createCookie('sidebar menus', '', -1);
            });

            hooks.afterEach(() => {
                // remove elements from DOM
                $('#layout').remove();

                // remove dummy cookie
                createCookie('sidebar menus', '', -1);
            });

            QUnit.test('initial_cookie()', assert => {
                // initialize instances
                Sidebar.initialize();
                MainMenuSidebar.initialize();

                // cookie does not exist
                assert.notOk(readCookie('sidebar menus'));

                // create empty array, push display none for hidden menus
                let test_display_data = [];
                for (let elem of layout.mainmenu_sidebar.menus) {
                    test_display_data.push('none');
                }
                // display_data shows all menus hidden
                assert.deepEqual(layout.mainmenu_sidebar.display_data, test_display_data);
            });

            QUnit.test('initial_cookie() with cookie', assert => {
                // initialize instances
                Sidebar.initialize();
                MainMenuSidebar.initialize();

                // fill array with display block for visible menus
                let test_display_data = [];
                for (let elem of layout.mainmenu_sidebar.menus) {
                    test_display_data.push('block');
                }
                // create cookie
                createCookie('sidebar menus', test_display_data, null);
                assert.ok(readCookie('sidebar menus'));

                // invoke inital_cookie method
                layout.mainmenu_sidebar.initial_cookie();
                assert.deepEqual(layout.mainmenu_sidebar.display_data, test_display_data);
            });
        });

        QUnit.module('collapse', hooks => {
            hooks.before(() => {
                // create DOM elements
                helpers.create_sidebar_elem();
                helpers.create_mm_sidebar_elem();
            });

            hooks.after(() => {
                // remove DOM elements
                $('#layout').remove();
            });

            QUnit.test('collapse()', assert => {
                // initialize instances
                Sidebar.initialize();
                MainMenuSidebar.initialize();

                // test if evt listener removed
                layout.mainmenu_sidebar.arrows.on('click', () => {
                    throw new Error('click');
                });

                // invoke collapse
                layout.mainmenu_sidebar.collapse();

                // menus are hidden
                assert.ok($('ul', layout.mainmenu_sidebar.items).is(':hidden'));
                // trigger click on arrows
                layout.mainmenu_sidebar.arrows.trigger('click');

                for (let item of layout.mainmenu_sidebar.items) {
                    let elem = $(item);
                    let menu = $('ul', elem);

                    // if menu exists
                    if (menu.length > 0){
                        // helper function to test element width
                        function test_width(elem_width, menu_width) {
                            elem.css('width', elem_width);
                            menu.css('width', menu_width);

                            // trigger mouseenter
                            elem.trigger('mouseenter');
                            assert.ok(elem.hasClass('hover'));
                            assert.ok(menu.css('display'), 'block');

                            // trigger mouseleave
                            elem.trigger('mouseleave');
                            assert.ok(menu.css('display'), 'none');
                            assert.notOk(elem.hasClass('hover'));
                        }

                        // test with different dimensions
                        test_width(300, 400);
                        test_width(400, 300);

                        // test for disabled hover on scrollbar dragstart
                        $(window).trigger('dragstart');
                        // trigger mouseenter
                        elem.trigger('mouseenter');
                        // menu is hidden
                        assert.notOk(menu.is(':visible'));

                        $(window).trigger('dragend');
                        // trigger mouseenter
                        elem.trigger('mouseenter');
                        // menu is visible
                        assert.ok(menu.css('display'), 'block');

                        // reset menu visibility
                        menu.hide();
                    }
                }
            });
        });

        QUnit.module('expand', hooks => {
            hooks.before(() => {
                // create DOM elements
                helpers.create_sidebar_elem();
                helpers.create_mm_sidebar_elem();
            });

            hooks.after(() => {
                // remove DOM elements
                $('#layout').remove();
            });

            QUnit.test('expand()', assert => {
                // initialize instances
                Sidebar.initialize();
                MainMenuSidebar.initialize();

                // invoke collapse method
                layout.mainmenu_sidebar.collapse();

                // mock expanded menu
                $('.node-child_3').trigger('mouseenter');
                $('.node-child_3').removeClass('hover');

                // display data cookie tests
                // empty array
                layout.mainmenu_sidebar.display_data = [];

                // add display state for every item
                for (let i = 0; i < layout.mainmenu_sidebar.menus.length; i++) {
                    let data = $('ul', layout.mainmenu_sidebar.menus[i]).css('display');
                    layout.mainmenu_sidebar.display_data.push(data);
                }

                // throw error on mouseenter/leave to test if unbound
                layout.mainmenu_sidebar.items.on('mouseenter mouseleave', () => {
                    throw new Error('mouseenter/mouseleave');
                })

                // invoke expand method
                layout.mainmenu_sidebar.expand();

                // trigger mouse events on items
                layout.mainmenu_sidebar.items.trigger('mouseenter').trigger('mouseleave');

                for (let i = 0; i < layout.mainmenu_sidebar.menus.length; i++) {
                    let elem = layout.mainmenu_sidebar.menus[i],
                        arrow = $('i.dropdown-arrow', elem),
                        menu = $('ul.cone-mainmenu-dropdown-sb', elem)
                    ;
                    // menu is correct value of display_data
                    assert.strictEqual(
                        menu.css('display'),
                        layout.mainmenu_sidebar.display_data[i]
                    );

                    if (menu.css('display') === 'none'){
                        // menu is hidden
                        assert.notOk(arrow.hasClass('bi-chevron-up'));
                        assert.ok(arrow.hasClass('bi-chevron-down'));
                        arrow.trigger('click');
                        assert.strictEqual(menu.css('display'), 'block');
                        assert.strictEqual(layout.mainmenu_sidebar.display_data[i], 'block');
                        assert.notOk(arrow.hasClass('bi-chevron-down'));
                        assert.ok(arrow.hasClass('bi-chevron-up'));
                    } else if (menu.css('display') === 'block'){
                        // menu is visible
                        assert.ok(arrow.hasClass('bi-chevron-up'));
                        assert.notOk(arrow.hasClass('bi-chevron-down'));

                        // trigger click on arrow
                        arrow.trigger('click');

                        assert.strictEqual(menu.css('display'), 'none');
                        assert.notOk(arrow.hasClass('bi-chevron-up'));
                        assert.ok(arrow.hasClass('bi-chevron-down'));

                        // display data of element after click is none
                        assert.strictEqual(layout.mainmenu_sidebar.display_data[i], 'none');
                    }

                    // cookie has been created
                    assert.ok(readCookie('sidebar menus'));
                }
            });
        });
    });
});

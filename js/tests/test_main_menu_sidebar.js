import {MainMenuSidebar, mainmenu_sidebar} from '../src/main_menu_sidebar.js';
import {SidebarMenu, sidebar_menu} from '../src/sidebar_menu.js';
import {Topnav, topnav} from '../src/topnav.js';
import * as helpers from './test-helpers.js';
import {createCookie, readCookie} from '../src/cookie_functions.js';

///////////////////////////////////////////////////////////////////////////////
// MainMenuSidebar tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('MainMenuSidebar', () => {

    QUnit.module('constructor', hooks => {

        hooks.after(() => {
            // remove element from DOM
            $('#layout').remove();
        });

        QUnit.test('properties', assert => {
            // create DOM elements
            helpers.create_sidebar_elem();
            helpers.create_mm_sidebar_elem();

            // initialize instances
            SidebarMenu.initialize();
            MainMenuSidebar.initialize();

            // containing element
            assert.ok(mainmenu_sidebar.elem.is('ul#mainmenu_sidebar'));

            // items
            assert.ok(mainmenu_sidebar.items);
            // expected number of items in mainmenu
            assert.strictEqual(mainmenu_sidebar.items.length, 3);

            // items are direct children of elem
            assert.ok(
                mainmenu_sidebar.items
                .is('#mainmenu_sidebar > li:not("sidebar-heading")')
            );

            // arrows
            assert.ok(mainmenu_sidebar.arrows);
            assert.ok(mainmenu_sidebar.arrows.is('i.dropdown-arrow'));

            // menus
            assert.ok(mainmenu_sidebar.menus.is('li.sb-menu'));
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
                SidebarMenu.initialize();
                MainMenuSidebar.initialize();

                mainmenu_sidebar.items.on('mouseenter mouseleave', () => {
                    assert.step('mouseenter/mouseleave');
                });
                mainmenu_sidebar.arrows.on('click', () => {
                    assert.step('click');
                });

                // second instance invokes unload function
                MainMenuSidebar.initialize();

                // trigger events to check if evt listeners are unbound
                mainmenu_sidebar.items.trigger('mouseenter');
                mainmenu_sidebar.items.trigger('mouseleave');
                mainmenu_sidebar.arrows.trigger('click');

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
                SidebarMenu.initialize();
                MainMenuSidebar.initialize();

                // cookie does not exist
                assert.notOk(readCookie('sidebar menus'));

                // create empty array, push display none for hidden menus
                let test_display_data = [];
                for (let elem of mainmenu_sidebar.menus) {
                    test_display_data.push('none');
                }
                // display_data shows all menus hidden
                assert.deepEqual(mainmenu_sidebar.display_data, test_display_data);
            });

            QUnit.test('initial_cookie() with cookie', assert => {
                // initialize instances
                SidebarMenu.initialize();
                MainMenuSidebar.initialize();

                // fill array with display block for visible menus
                let test_display_data = [];
                for (let elem of mainmenu_sidebar.menus) {
                    test_display_data.push('block');
                }
                // create cookie
                createCookie('sidebar menus', test_display_data, null);
                assert.ok(readCookie('sidebar menus'));

                // invoke inital_cookie method
                mainmenu_sidebar.initial_cookie();
                assert.deepEqual(mainmenu_sidebar.display_data, test_display_data);
            });
        });

        QUnit.module('mv_to_mobile()', hooks => {

            hooks.before(() => {
                // create DOM elements
                helpers.create_topnav_elem();
                helpers.create_sidebar_elem();
                helpers.create_mm_sidebar_elem();

                helpers.set_vp('large');
            });

            hooks.after(() => {
                // remove DOM elements
                $('#layout').remove();
            });

            QUnit.test('mv_to_mobile()', assert => {
                assert.ok(true);
                
                // initialize instances
                Topnav.initialize();
                SidebarMenu.initialize();
                
                // initialize MainMenuSidebar
                MainMenuSidebar.initialize();

                mainmenu_sidebar.mv_to_mobile();
                
                // mainmenu sidebar is not in sidebar content
                assert.strictEqual(
                    $('#sidebar_content > #mainmenu_sidebar').length,
                    0
                );
                // mainmenu sidebar is in topnav content
                assert.strictEqual(
                    $('#topnav-content > #mainmenu_sidebar').length,
                    1
                );
                assert.ok(mainmenu_sidebar.elem.hasClass('mobile'));
            });
        });

        QUnit.module('mv_to_sidebar()', hooks => {
            hooks.before(() => {
                // create DOM elements
                helpers.create_topnav_elem();
                helpers.create_sidebar_elem();
                helpers.create_mm_sidebar_elem();

                helpers.set_vp('large');
            });

            hooks.after(() => {
                // remove DOM elements
                $('#layout').remove();
            });

            QUnit.test('mv_to_sidebar()', assert => {
                // initialize instances
                Topnav.initialize();
                SidebarMenu.initialize(),
                MainMenuSidebar.initialize();

                // mainmenu sidebar is in sidebar content
                assert.strictEqual(
                    $('#sidebar_content > #mainmenu_sidebar').length,
                    1
                );

                // invoke mv_to_mobile
                mainmenu_sidebar.mv_to_mobile();
                assert.strictEqual(
                    $('#sidebar_content > #mainmenu_sidebar').length,
                    0
                );

                // invoke mv_to_sidebar
                mainmenu_sidebar.mv_to_sidebar();

                // mainmenu sidebar is in sidebar content
                assert.strictEqual(
                    $('#sidebar_content > #mainmenu_sidebar').length,
                    1
                );
                // mainmenu sidebar is in topnav content
                assert.strictEqual(
                    $('#topnav-content > #mainmenu_sidebar').length,
                    0
                );
                assert.notOk(mainmenu_sidebar.elem.hasClass('mobile'));
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
                SidebarMenu.initialize();
                MainMenuSidebar.initialize();

                // test if evt listener removed
                mainmenu_sidebar.arrows.on('click', () => {
                    throw new Error('click');
                });

                // invoke collapse
                mainmenu_sidebar.collapse();

                // menus are hidden
                assert.ok($('ul', mainmenu_sidebar.items).is(':hidden'));
                // trigger click on arrows
                mainmenu_sidebar.arrows.trigger('click');

                for (let item of mainmenu_sidebar.items) {
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
                SidebarMenu.initialize();
                MainMenuSidebar.initialize();

                // invoke collapse method
                mainmenu_sidebar.collapse();

                // mock expanded menu
                $('.node-child_3').trigger('mouseenter');
                $('.node-child_3').removeClass('hover');

                // display data cookie tests
                // empty array
                mainmenu_sidebar.display_data = [];

                // add display state for every item
                for (let i = 0; i < mainmenu_sidebar.menus.length; i++) {
                    let data = $('ul', mainmenu_sidebar.menus[i]).css('display');
                    mainmenu_sidebar.display_data.push(data);
                }

                // throw error on mouseenter/leave to test if unbound
                mainmenu_sidebar.items.on('mouseenter mouseleave', () => {
                    throw new Error('mouseenter/mouseleave');
                })

                // invoke expand method
                mainmenu_sidebar.expand();

                // trigger mouse events on items
                mainmenu_sidebar.items.trigger('mouseenter').trigger('mouseleave');

                for (let i = 0; i < mainmenu_sidebar.menus.length; i++) {
                    let elem = mainmenu_sidebar.menus[i],
                        arrow = $('i.dropdown-arrow', elem),
                        menu = $('ul.cone-mainmenu-dropdown-sb', elem)
                    ;
                    // menu is correct value of display_data
                    assert.strictEqual(
                        menu.css('display'),
                        mainmenu_sidebar.display_data[i]
                    );

                    if (menu.css('display') === 'none'){
                        // menu is hidden
                        assert.notOk(arrow.hasClass('bi-chevron-up'));
                        assert.ok(arrow.hasClass('bi-chevron-down'));
                        arrow.trigger('click');
                        assert.strictEqual(menu.css('display'), 'block');
                        assert.strictEqual(mainmenu_sidebar.display_data[i], 'block');
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
                        assert.strictEqual(mainmenu_sidebar.display_data[i], 'none');
                    }

                    // cookie has been created
                    assert.ok(readCookie('sidebar menus'));
                }
            });
        });
    });
});
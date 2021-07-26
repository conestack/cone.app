import {MainMenuItem} from '../src/main_menu_item.js';
import {MainMenuTop} from '../src/main_menu_top.js';
import * as helpers from './test-helpers.js';

///////////////////////////////////////////////////////////////////////////////
// MainMenuItem tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('MainMenuItem', hooks => {
    hooks.before(() => {
        console.log('Set up MainMenuItem tests');
    });

    hooks.after(() => {
        console.log('Tear down MainMenuItem tests');
    });

    QUnit.module('constructor', () => {
        QUnit.module('properties', hooks => {
            let mm_item;

            hooks.before(() => {
                console.log('Set up MainMenuItem.constructor prop tests');

                // create dummy topnav DOM element
                helpers.create_topnav_elem();
                // create dummy mainmenu top DOM element
                helpers.create_mm_top_elem();
                // create dummy mainmenu item DOM elements
                helpers.create_mm_items(1);
            });

            hooks.after(() => {
                console.log('Tear down MainMenuItem.constructor prop tests');

                // remove dummy DOM elements
                $('#topnav').remove();
                $('#main-menu').remove();

                // remove mainmenu item elements
                mm_item.menu.remove();
                mm_item.elem.remove();

                // delete dummy item
                mm_item = null;
            });

            QUnit.test('properties', assert => {
                // create instance
                mm_item = new MainMenuItem($('.node-child_1'));

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
            });
        });
    });

    QUnit.module('methods', hooks => {
        hooks.before(() => {
            console.log('- now running: methods');
        })

        hooks.beforeEach(() => {
            // create dummy layout element, append to DOM
            let layout = $('<div id="layout"></div>');
            $('body').append(layout);

            // create dummy DOM elements
            helpers.create_topnav_elem();
            helpers.create_mm_top_elem();
            helpers.create_mm_items(2);
        });

        hooks.afterEach(() => {
            // remove dummy DOM elements
            $('#topnav').remove();
            $('#main-menu').remove();
            $('.cone-mainmenu-dropdown').remove();
        });

        hooks.after(() => {
            // remove dummy layout element from DOM
            $('#layout').remove();
        });

        QUnit.module('render_dd()', hooks => {
            let mm_item;

            hooks.before(() => {
                console.log('Set up MainMenuItem.render_dd tests');
            });

            hooks.after(() => {
                console.log('Tear down MainMenuItem.render_dd tests');

                // delete instance
                mm_item = null;
            });

            QUnit.test('render_dd()', assert => {
                // create instance
                mm_item = new MainMenuItem($('.node-child_1'));

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

        QUnit.module('mv_to_mobile()', hooks => {
            let TestMainMenuItem,
                mm_item;

            hooks.before(() => {
                console.log('Set up MainMenuItem.mv_to_mobile tests');

                // dummy class
                TestMainMenuItem = class extends MainMenuItem {
                    mouseenter_toggle() {
                        assert.step('mouseenter_toggle()');
                    }
                }
            });
            hooks.after(() => {
                console.log('Tear down MainMenuItem.mv_to_mobile tests');

                // delete instance
                mm_item = null;
            });

            QUnit.test('without sidebar', assert => {
                // create instance
                mm_item = new TestMainMenuItem($('.node-child_1'));

                // add mouseenter/leave event listener
                mm_item.menu.on('mouseenter mouseleave', () => {
                    assert.step('mouseenter/leave');
                });

                // trigger move to mobile
                mm_item.mv_to_mobile();
                // menu is appended to elem
                assert.strictEqual($(mm_item.menu, mm_item.elem).length
                                    , 1);

                // trigger mouseenter/leave events
                mm_item.elem.trigger('mouseenter');
                mm_item.menu.trigger('mouseleave');
                assert.strictEqual(mm_item.menu.css('left'), '0px');

                // trigger click on dropdown arrow
                mm_item.arrow.trigger('click');
                // menu visible after click
                assert.strictEqual(mm_item.menu.css('display'), 'block');
                assert.ok(mm_item.arrow.hasClass('bi bi-chevron-up'));
            });
        });

        QUnit.module('mv_to_top()', hooks => {
            let TestMainMenuItem,
                mm_item;

            hooks.before(assert => {
                console.log('Set up MainMenuItem.mv_to_top tests');

                // dummy class
                TestMainMenuItem = class extends MainMenuItem {
                    mouseenter_toggle() {
                        assert.step('mouseenter_toggle()');
                    }
                }
            });

            hooks.after(() => {
                console.log('Tear down MainMenuItem.mv_to_top tests');

                // delete instance
                mm_item = null;
            });

            QUnit.test('mv_to_top()', assert => {
                // create instance
                mm_item = new TestMainMenuItem($('.node-child_1'));

                helpers.set_vp('mobile');
                mm_item.mv_to_mobile();

                // menu is in element - mobile viewport
                assert.strictEqual($(mm_item.menu, mm_item.elem).length, 1);
                assert.strictEqual(
                    $('#layout > .cone-mainmenu-dropdown').length,
                    0
                );

                // add event listener on arrow to check unbind
                mm_item.arrow.on('click', () => {
                    assert.step('click');
                });

                helpers.set_vp('large');
                // invoke move to top
                mm_item.mv_to_top();
                // menu appended to #layout
                assert.strictEqual($('#layout > .cone-mainmenu-dropdown').length
                                   , 1);

                // trigger events to check for unbind
                mm_item.arrow.trigger('click');
                mm_item.elem.trigger('mouseenter');
                mm_item.elem.trigger('mouseleave');

                // verify method calls
                assert.verifySteps([
                    'mouseenter_toggle()',
                    'mouseenter_toggle()'
                ]);

                // show menu
                mm_item.menu.css('display', 'block');
                // trigger mouseleave
                mm_item.menu.trigger('mouseleave');
                assert.strictEqual(mm_item.menu.css('display'), 'none');
            });
        });

        QUnit.test.skip('mouseenter_toggle()', assert => {
            // TODO

            $('body').append($('<div id="layout"></div>'));
            // mock wrapper
            $('#layout').css({
                'width': '100vw',
                'height': '100vh'
            });
            // detach from wrapper to layout for offset tests
            $('#topnav').detach().appendTo('#layout');
            // create dummy item instance
            let mm_item = new MainMenuItem($('.node-child_1'));
            mm_item.menu.css('display', 'none');

            // set dropdown position absolute
            $('.cone-mainmenu-dropdown').css('position', 'absolute');

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

            // mm_item = null;
        });
    });
});
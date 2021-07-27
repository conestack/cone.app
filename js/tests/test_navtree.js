import {Navtree, navtree} from '../src/navtree.js';
import { SidebarMenu, sidebar_menu} from '../src/sidebar_menu.js';
import { Topnav, topnav } from '../src/topnav.js';
import * as helpers from './test-helpers.js';

///////////////////////////////////////////////////////////////////////////////
// Navtree tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('Navtree', () => {

    QUnit.module('constructor', hooks => {
            hooks.before(() => {
                // create dummy html elements
                helpers.create_sidebar_elem();
                helpers.create_navtree_elem();
            });

            hooks.after(() => {
                // remove dummy elements from DOM
                $('#layout').remove();
            });

            QUnit.test('properties', assert => {
                // initialize instances
                SidebarMenu.initialize();
                Navtree.initialize();

                // containing element
                assert.ok(navtree.elem.is('#sidebar_content > #navtree'));

                // content
                assert.ok(navtree.content.is('#navtree > #navtree-content'));

                // heading
                assert.ok(navtree.heading.is('#navtree > #navtree-heading'));

                // toggle elements
                assert.ok(navtree.toggle_elems.is('li.navtreelevel_1'));

                // private methods
                assert.ok(navtree._mouseenter_handle);
                assert.ok(navtree._restore);
            });
    });

    QUnit.module('methods', () => {

        QUnit.module('mv_to_mobile()', hooks => {
            hooks.before(() => {
                // create dummy DOM elements
                helpers.create_topnav_elem();
                helpers.create_sidebar_elem();
                helpers.create_navtree_elem();
            });

            hooks.after(() => {
                // delete dummy DOM elements
                $('#layout').remove();
            });

            QUnit.test('mv_to_mobile', assert => {
                // initialize topnav instance
                Topnav.initialize();

                // initialize sidebar and navtree instances
                SidebarMenu.initialize();
                Navtree.initialize();

                // invoke mv_to_mobile() method
                navtree.mv_to_mobile();

                assert.ok(navtree.elem.hasClass('mobile'));
                // navtree element appended to topnav content
                assert.ok(navtree.elem.is('#topnav-content > #navtree'));
                // navtree content is hidden
                assert.ok(navtree.content.is(':hidden'));

                // trigger click on heading
                navtree.heading.trigger('click');
                // navtree content dropdown
                assert.ok(navtree.content.is(':visible'));
            });
        });

        QUnit.module('mv_to_sidebar()', hooks => {
            hooks.before(() => {
                // create dummy DOM elements
                helpers.create_topnav_elem();
                helpers.create_sidebar_elem();
                helpers.create_navtree_elem();
            });

            hooks.after(() => {
                // delete dummy DOM elements
                $('#layout').remove();
            });

            QUnit.test('mv_to_mobile', assert => {
                // initialize topnav instance
                Topnav.initialize();

                // initialize sidebar and navtree instances
                SidebarMenu.initialize();
                Navtree.initialize();

                // invoke mv_to_mobile() method
                navtree.mv_to_mobile();
                // invoke mv_to_sidebar() method
                navtree.mv_to_sidebar();

                assert.notOk(navtree.elem.hasClass('mobile'));
                // navtree element removed from topnav content
                assert.notOk(navtree.elem.is('#topnav-content > #navtree'));
                // navtree content is hidden
                assert.strictEqual(navtree.content.css('display'), 'block');
            });
        });

        QUnit.module('align_width', hooks => {
            hooks.before(() => {
                // create dummy DOM elements
                helpers.create_topnav_elem();
                helpers.create_sidebar_elem();
                helpers.create_navtree_elem();
            });

            hooks.after(() => {
                // delete dummy DOM elements
                $('#layout').remove();
            });

            QUnit.test('align_width()', assert => {
                assert.ok(true);
                // initialize instances
                SidebarMenu.initialize();
                Navtree.initialize();

                let elem1 = $(navtree.toggle_elems[0]),
                    elem2 = $(navtree.toggle_elems[1]),
                    menu1 = $('ul', elem1),
                    menu2 = $('ul', elem2);

                // set element dimensions
                elem1.css('width', '300px');
                menu1.css('width', '500px');
                elem2.css('width', '500px');
                menu2.css('width', '300px');

                for (let elem of navtree.toggle_elems) {
                    let item = $(elem);
                    let menu = $('ul', item);
                    let elem_origin = item.outerWidth();
                    let menu_origin = menu.outerWidth();

                    // trigger mouseenter on element
                    item.trigger('mouseenter');
                    assert.ok(item.hasClass('hover'));

                    // variables for testing
                    let elem_width = item.outerWidth() + 'px',
                        menu_width = menu.outerWidth() + 'px';

                    if (elem_origin > menu_origin) {
                        assert.strictEqual(menu.css('width'), elem_width);
                    } else {
                        assert.strictEqual(item.css('width'), menu_width);
                    }
                }
            });
        });

        QUnit.module('restore_width', hooks => {
            hooks.before(() => {
                // create dummy DOM elements
                helpers.create_topnav_elem();
                helpers.create_sidebar_elem();
                helpers.create_navtree_elem();
            });

            hooks.after(() => {
                // delete dummy DOM elements
                $('#layout').remove();
            });

            QUnit.test('restore_width()', assert => {
                helpers.set_vp('large');

                // initialize instances
                SidebarMenu.initialize();
                Navtree.initialize();

                // trigger toggle_menu() method
                sidebar_menu.toggle_menu();

                // set element dimensions
                sidebar_menu.elem.css('width', '64px');
                navtree.toggle_elems.css('width', 'auto');

                for (let item of navtree.toggle_elems) {
                    let elem = $(item);

                    // trigger mouse events
                    elem.trigger('mouseenter');
                    elem.trigger('mouseleave');

                    assert.notOk(elem.hasClass('hover'));
                    // equals width:auto on vp large
                    assert.strictEqual(elem.css('width'), '32px');
                }
            });
        });

        QUnit.module('unload', hooks => {
            let align_width_origin = Navtree.prototype.align_width,
                restore_width_origin = Navtree.prototype.restore_width;

            hooks.before(assert => {
                // create dummy DOM elements
                helpers.create_sidebar_elem();
                helpers.create_navtree_elem();

                // overwrite methods to check for calls
                Navtree.prototype.align_width = function() {
                    assert.step('align_width()');
                }
                Navtree.prototype.restore_width = function() {
                    assert.step('restore_width()');
                }
            });

            hooks.after(() => {
                // delete dummy DOM elements
                $('#layout').remove();

                // reset methods
                Navtree.prototype.align_width = align_width_origin;
                Navtree.prototype.restore_width = restore_width_origin;
            });

            QUnit.test('unload()', assert => {
                // initialize sidebar instance
                SidebarMenu.initialize();
                // initialize navtree instance
                Navtree.initialize();

                // manually trigger unload
                navtree.unload();
                // trigger mouse events to check if unbound
                navtree.toggle_elems.trigger('mouseenter');
                // navtree.toggle_elems.trigger('mouseleave');
                navtree.heading.trigger('click');

                // evt listeners unbound
                assert.verifySteps([]);
            });
        });

        QUnit.module('scrollbar_handle', hooks => {
            let TestNavtree,
                test_navtree;

            hooks.before(assert => {
                // create dummy DOM elements
                helpers.create_sidebar_elem();
                helpers.create_navtree_elem();

                // dummy class
                TestNavtree = class extends Navtree {
                    align_width() {
                        assert.step('align_width()');
                    }
                }
            });

            hooks.after(() => {
                // delete dummy DOM elements
                $('#layout').remove();
            });

            QUnit.test('scrollbar_handle()', assert => {
                // initialize sidebar menu
                SidebarMenu.initialize();

                // initialize navtree
                test_navtree = new TestNavtree();

                // trigger scrollbar dragstart event
                $(window).trigger('dragstart');

                // trigger mouseenter on toggle elements
                test_navtree.toggle_elems.trigger('mouseenter');
                // event listener unbound
                assert.verifySteps([]);

                // trigger scrollbar dragend event
                $(window).trigger('dragend');

                // trigger mouseenter on toggle elements
                $(test_navtree.toggle_elems[0]).trigger('mouseenter');
                assert.verifySteps(['align_width()']);
            });
        });
    });
});
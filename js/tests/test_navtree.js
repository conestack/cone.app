import {Navtree} from '../src/navtree.js';
import {Sidebar} from '../src/sidebar.js';
import {Topnav} from '../src/topnav.js';
import * as helpers from './test-helpers.js';
import {layout} from '../src/layout.js';
import {MobileNav} from '../src/mobile_nav.js';

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
            Sidebar.initialize();
            Navtree.initialize();

            // containing element
            assert.ok(layout.navtree.elem.is('#sidebar_content > #navtree'));

            // content
            assert.ok(layout.navtree.content.is('#navtree > #navtree-content'));

            // heading
            assert.ok(layout.navtree.heading.is('#navtree > #navtree-heading'));

            // toggle elements
            assert.ok(layout.navtree.toggle_elems.is('li.navtreelevel_1'));

            // private methods
            assert.ok(layout.navtree._mouseenter_handle);
            assert.ok(layout.navtree._restore);
        });
    });

    QUnit.module('methods', () => {
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
                Sidebar.initialize();
                Navtree.initialize();

                let elem1 = $(layout.navtree.toggle_elems[0]),
                    elem2 = $(layout.navtree.toggle_elems[1]),
                    menu1 = $('ul', elem1),
                    menu2 = $('ul', elem2);

                // set element dimensions
                elem1.css('width', '300px');
                menu1.css('width', '500px');
                elem2.css('width', '500px');
                menu2.css('width', '300px');

                for (let elem of layout.navtree.toggle_elems) {
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
                Sidebar.initialize();
                Navtree.initialize();

                // trigger toggle_menu() method
                layout.sidebar.toggle_menu();

                // set element dimensions
                layout.sidebar.elem.css('width', '64px');
                layout.navtree.toggle_elems.css('width', 'auto');

                for (let item of layout.navtree.toggle_elems) {
                    let elem = $(item);

                    // trigger mouse events
                    elem.trigger('mouseenter');
                    elem.trigger('mouseleave');

                    assert.notOk(elem.hasClass('hover'));
                    // equals width:auto on vp large
                    assert.strictEqual(elem.css('width'), '63px');
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
                Sidebar.initialize();
                // initialize navtree instance
                Navtree.initialize();

                // manually trigger unload
                layout.navtree.unload();
                // trigger mouse events to check if unbound
                layout.navtree.toggle_elems.trigger('mouseenter');
                // navtree.toggle_elems.trigger('mouseleave');
                layout.navtree.heading.trigger('click');

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
                Sidebar.initialize();

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

import {Navtree} from '../src/navtree.js';

///////////////////////////////////////////////////////////////////////////////
// cone.Navtree helpers
///////////////////////////////////////////////////////////////////////////////

function create_navtree_elem() {
    let navtree_html = `
    <ul id="navtree">
      <li class="sidebar-heading" id="navtree-heading">
        <span>
          Navigation
        </span>
        <i class="dropdown-arrow bi bi-chevron-down"></i>
      </li>

      <div id="navtree-content">

        <li class="active navtreelevel_1">
          <a href="#">
            <i class="bi bi-heart"></i>
            <span>Title</span>
          </a>
          <ul>
            <li class="navtreelevel_2">
              <a href="#">
                <i class="bi bi-heart"></i>
                <span>Title</span>
              </a>
            </li>
          </ul>
        </li>

        <li class="active navtreelevel_1">
          <a href="#">
            <i class="bi bi-heart"></i>
            <span>Title</span>
          </a>
          <ul>
            <li class="navtreelevel_2">
              <a href="#">
                <i class="bi bi-heart"></i>
                <span>Title</span>
              </a>
            </li>
          </ul>
        </li>
      </div>
    </ul>
    `;

    $('#sidebar_content').append(navtree_html);
}

///////////////////////////////////////////////////////////////////////////////
// cone.Navtree tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module.skip('cone.Navtree', hooks => {
    hooks.before(() => {
        console.log('Set up cone.Navtree tests');
        cone.viewport = new cone.ViewPort();
    });

    hooks.after(() => {
        console.log('Tear down cone.Navtree tests');
        cone.viewport = null;
    });

    QUnit.module('constructor', hooks => {
        hooks.before(() => {
            console.log('Set up cone.Navtree constructor tests');
        });

        hooks.after(() => {
            console.log('Tear down cone.Navtree constructor tests');
        });

        QUnit.module('properties', hooks => {
            hooks.before(() => {
                console.log('Set up cone.Navtree properties tests');

                // create dummy html elements
                create_sidebar_elem();
                create_navtree_elem();
            });

            hooks.after(() => {
                console.log('Tear down cone.Navtree properties tests');

                // unload and unset instances
                cone.sidebar_menu.unload();
                cone.sidebar_menu = null;
                cone.navtree.unload();
                cone.navtree = null;
                // remove dummy elements from DOM
                $('#sidebar_left').remove();
            });

            QUnit.test('properties', assert => {
                // initialize instances
                cone.SidebarMenu.initialize();
                cone.Navtree.initialize();

                assert.ok(cone.navtree instanceof cone.ViewPortAware);

                // containing element
                assert.ok(cone.navtree.elem.is('#sidebar_content > #navtree'));

                // content
                assert.ok(cone.navtree.content.is('#navtree > #navtree-content'));

                // heading
                assert.ok(cone.navtree.heading.is('#navtree > #navtree-heading'));

                // toggle elements
                assert.ok(cone.navtree.toggle_elems.is('li.navtreelevel_1'));

                // private methods
                assert.ok(cone.navtree._mouseenter_handle);
                assert.ok(cone.navtree._restore);
            });
        });

        QUnit.module('constructor calls', hooks => {
            let TestNavtree,
                test_navtree;

            hooks.before(assert => {
                console.log('Set up cone.Navtree constructor calls tests');

                // create dummy html elements
                create_sidebar_elem();
                create_navtree_elem();

                // dummy class
                TestNavtree = class extends cone.Navtree {
                    scrollbar_handle() {
                        assert.step('scrollbar_handle()');
                    }
                    mv_to_mobile() {
                        assert.step('mv_to_mobile()');
                    }
                }
            });

            hooks.after(() => {
                console.log('Tear down cone.Navtree constructor calls tests');

                // unload and unset instances
                cone.sidebar_menu.unload();
                cone.sidebar_menu = null;
                test_navtree.unload();
                test_navtree = null;

                // remove dummy elements from DOM
                $('#sidebar_left').remove();
            });

            QUnit.test('mv_to_mobile() and scrollbar_handle() call', assert => {
                // set viewport to mobile
                cone.viewport.state = 0;

                // initialize instance of cone.SidebarMenu
                cone.SidebarMenu.initialize();
                // initialize instance of Navtree
                test_navtree = new TestNavtree();
                $(window).off('viewport_changed');

                assert.verifySteps([
                    'mv_to_mobile()',
                    'scrollbar_handle()'
                ]);
            });
        });
    });

    QUnit.module('methods', hooks => {
        hooks.before(() => {
            console.log('Set up cone.Navtree methods tests');
        });

        hooks.after(() => {
            console.log('Tear down cone.Navtree methods tests');
        });

        QUnit.module('mv_to_mobile()', hooks => {
            hooks.before(() => {
                console.log('Set up cone.Navtree.mv_to_mobile tests');

                // create dummy DOM elements
                create_topnav_elem();
                create_sidebar_elem();
                create_navtree_elem();

                // set viewport
                cone.viewport.state = 3;
            });

            hooks.after(() => {
                console.log('Tear down cone.Navtree.mv_to_mobile tests');

                // unload and unset instances
                cone.topnav.unload();
                cone.topnav = null;
                cone.sidebar_menu.unload();
                cone.sidebar_menu = null;
                cone.navtree.unload();
                cone.navtree = null;

                // delete dummy DOM elements
                $('#topnav').remove();
                $('#sidebar_left').remove();
            });

            QUnit.test('mv_to_mobile', assert => {
                // initialize topnav instance
                cone.Topnav.initialize();

                // initialize sidebar and navtree instances
                cone.SidebarMenu.initialize();
                cone.Navtree.initialize();

                // invoke mv_to_mobile() method
                cone.navtree.mv_to_mobile();

                assert.ok(cone.navtree.elem.hasClass('mobile'));
                // navtree element appended to topnav content
                assert.ok(cone.navtree.elem.is('#topnav-content > #navtree'));
                // navtree content is hidden
                assert.ok(cone.navtree.content.is(':hidden'));

                // trigger click on heading
                cone.navtree.heading.trigger('click');
                // navtree content dropdown
                assert.ok(cone.navtree.content.is(':visible'));
            });
        });

        QUnit.module('viewport_changed()', hooks => {
            let VPA = cone.ViewPortAware,
                super_vp_changed_origin = VPA.prototype.viewport_changed,
                TestNavtree,
                test_navtree;

            hooks.before(assert => {
                console.log('Set up cone.Navtree.viewport_changed tests');

                // create dummy DOM elements
                create_topnav_elem();
                create_sidebar_elem();
                create_navtree_elem();

                // set viewport
                cone.viewport.state = 3;

                // overwrite super.viewport_changed method
                VPA.prototype.viewport_changed = function(e) {
                    this.vp_state = e.state;
                    assert.step(`super.viewport_changed(${e.state})`);
                }

                // dummy class
                TestNavtree = class extends cone.Navtree {
                    mv_to_mobile() {
                        assert.step('mv_to_mobile()');
                    }
                }
            });

            hooks.after(() => {
                console.log('Tear down cone.Navtree.viewport_changed tests');

                // unload and unset instances
                cone.topnav.unload();
                cone.topnav = null;
                cone.sidebar_menu.unload();
                cone.sidebar_menu = null;
                test_navtree.unload();
                test_navtree = null;

                // delete dummy DOM elements
                $('#topnav').remove();
                $('#sidebar_left').remove();

                // reset super.viewport_changed
                VPA.prototype.viewport_changed = super_vp_changed_origin;
            });

            QUnit.test('viewport_changed()', assert => {
                // mock resize event
                let resize_evt = $.Event('viewport_changed');

                // initialize instances
                cone.Topnav.initialize();
                cone.SidebarMenu.initialize();

                // initialize navtree
                test_navtree = new TestNavtree($('#navtree'));

                // add event listener to check if unbound
                test_navtree.heading.on('click', () => {
                    assert.step('click');
                });

                for (let i=0; i<vp_states.length; i++) {
                    // set mock resize event state
                    resize_evt.state = i;

                    // invoke viewport_changed method
                    test_navtree.viewport_changed(resize_evt);
                    assert.strictEqual(test_navtree.vp_state, resize_evt.state);

                    if (i === 0) {
                        assert.strictEqual(
                            test_navtree.content.css('display'),
                            'block'
                        );

                        assert.verifySteps([
                            `super.viewport_changed(${i})`,
                            'mv_to_mobile()'
                        ]);
                    } else {
                        assert.notOk(test_navtree.elem.hasClass('mobile'));
                        assert.ok(
                            test_navtree.elem
                            .is('#sidebar_content > #navtree')
                        );

                        // trigger click on heading
                        test_navtree.heading.trigger('click');
                        // click event is unbound
                        assert.verifySteps([`super.viewport_changed(${i})`]);
                    }
                }
            });
        });

        QUnit.module('align_width', hooks => {
            hooks.before(() => {
                console.log('Set up cone.Navtree.align_width tests');

                // create dummy DOM elements
                create_topnav_elem();
                create_sidebar_elem();
                create_navtree_elem();

                // set viewport
                cone.viewport.state = 3;
            });

            hooks.after(() => {
                console.log('Tear down cone.Navtree.align_width tests');

                // unload and unset instances
                cone.sidebar_menu.unload();
                cone.sidebar_menu = null;
                cone.navtree.unload();
                cone.navtree = null;

                // delete dummy DOM elements
                $('#sidebar_left').remove();
            });

            QUnit.test('align_width()', assert => {
                // initialize instances
                cone.SidebarMenu.initialize();
                cone.Navtree.initialize();

                let elem1 = $(cone.navtree.toggle_elems[0]),
                    elem2 = $(cone.navtree.toggle_elems[1]),
                    menu1 = $('ul', elem1),
                    menu2 = $('ul', elem2);

                // set element dimensions
                elem1.css('width', '300px');
                menu1.css('width', '500px');
                elem2.css('width', '500px');
                menu2.css('width', '300px');

                for (let item of cone.navtree.toggle_elems) {
                    let elem = $(item);
                    let menu = $('ul', elem);
                    let elem_origin = elem.outerWidth();
                    let menu_origin = menu.outerWidth();

                    // trigger mouseenter on element
                    elem.trigger('mouseenter');
                    assert.ok(elem.hasClass('hover'));

                    // variables for testing
                    let elem_width = elem.outerWidth() + 'px';
                        menu_width = menu.outerWidth() + 'px';

                    if (elem_origin > menu_origin) {
                        assert.strictEqual(menu.css('width'), elem_width);
                    } else {
                        assert.strictEqual(elem.css('width'), menu_width);
                    }
                }
            });
        });

        QUnit.module('restore_width', hooks => {
            hooks.before(() => {
                console.log('Set up cone.Navtree.restore_width tests');

                // create dummy DOM elements
                create_topnav_elem();
                create_sidebar_elem();
                create_navtree_elem();

                // set viewport
                cone.viewport.state = 3;
            });

            hooks.after(() => {
                console.log('Tear down cone.Navtree.restore_width tests');

                // unload and unset instances
                cone.sidebar_menu.unload();
                cone.sidebar_menu = null;
                cone.navtree.unload();
                cone.navtree = null;

                // delete dummy DOM elements
                $('#sidebar_left').remove();
            });

            QUnit.test('restore_width()', assert => {
                // initialize instances
                cone.SidebarMenu.initialize();
                cone.Navtree.initialize();

                // trigger toggle_menu() method
                cone.sidebar_menu.toggle_menu();

                // set element dimensions
                cone.sidebar_menu.elem.css('width', '64px');
                cone.navtree.toggle_elems.css('width', 'auto');

                for (let item of cone.navtree.toggle_elems) {
                    let elem = $(item);

                    // trigger mouse events
                    elem.trigger('mouseenter');
                    elem.trigger('mouseleave');

                    assert.notOk(elem.hasClass('hover'));
                    assert.strictEqual(elem.css('width'), '24px'); // width auto
                }
            });
        });

        QUnit.module('unload', hooks => {
            let super_unload_origin = cone.ViewPortAware.prototype.unload,
                align_width_origin = cone.Navtree.prototype.align_width,
                restore_width_origin = cone.Navtree.prototype.restore_width;

            hooks.before(assert => {
                console.log('Set up cone.Navtree.restore_width tests');

                // create dummy DOM elements
                create_sidebar_elem();
                create_navtree_elem();

                // set viewport
                cone.viewport.state = 3;

                // overwrite methods to check for calls
                cone.Navtree.prototype.align_width = function() {
                    assert.step('align_width()');
                }
                cone.Navtree.prototype.restore_width = function() {
                    assert.step('restore_width()');
                }

                // overwrite super.unload()
                cone.ViewPortAware.prototype.unload = function() {
                    assert.step('super.unload()');
                }
            });

            hooks.after(() => {
                console.log('Tear down cone.Navtree.restore_width tests');

                // unset instances
                cone.sidebar_menu = null;
                cone.navtree = null;

                // delete dummy DOM elements
                $('#sidebar_left').remove();

                // reset super.unload()
                cone.ViewPortAware.prototype.unload = super_unload_origin;

                // reset methods
                cone.Navtree.prototype.align_width = align_width_origin;
                cone.Navtree.prototype.restore_width = restore_width_origin;
            });

            QUnit.test('unload()', assert => {
                // initialize sidebar instance
                cone.SidebarMenu.initialize();
                // initialize navtree instance
                cone.Navtree.initialize();
                // second instance invokes unload() method
                cone.Navtree.initialize();

                assert.verifySteps(['super.unload()']);

                // manually trigger unload
                cone.navtree.unload();
                // trigger mouse events to check if unbound
                cone.navtree.toggle_elems.trigger('mouseenter');
                // cone.navtree.toggle_elems.trigger('mouseleave');
                cone.navtree.heading.trigger('click');

                // event listeners unbound
                assert.verifySteps(['super.unload()']);
            });
        });

        QUnit.module('scrollbar_handle', hooks => {
            let TestNavtree,
                test_navtree;

            hooks.before(assert => {
                console.log('Set up cone.Navtree.scrollbar_handle tests');

                // create dummy DOM elements
                create_sidebar_elem();
                create_navtree_elem();

                // set viewport
                cone.viewport.state = 3;

                // dummy class
                TestNavtree = class extends cone.Navtree {
                    align_width() {
                        assert.step('align_width()');
                    }
                }
            });

            hooks.after(() => {
                console.log('Tear down cone.Navtree.scrollbar_handle tests');

                // unset instances
                cone.sidebar_menu = null;
                test_navtree.unload();
                test_navtree = null;

                // delete dummy DOM elements
                $('#sidebar_left').remove();
            });

            QUnit.test('scrollbar_handle()', assert => {
                // initialize sidebar menu
                cone.SidebarMenu.initialize();

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
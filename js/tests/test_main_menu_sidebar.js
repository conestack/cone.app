import {MainMenuSidebar} from '../src/main_menu_sidebar.js';

///////////////////////////////////////////////////////////////////////////////
// cone.MainMenuSidebar test helpers
///////////////////////////////////////////////////////////////////////////////

function create_mm_sidebar_elem() {
    let mm_sidebar_html = `
        <ul id="mainmenu_sidebar">
          <li class="sidebar-heading" id="mainmenu-sb-heading">
            <span>
              Main Menu
            </span>
          </li>

          <li class="active node-child_1">
            <a href="#">
              <i class="bi bi-heart"></i>
                <span">Title</span>
            </a>
          </li>

          <li class="node-child_2 sb-menu">
            <a href="#">
              <i class="bi bi-heart"></i>
                <span">Title</span>
            </a>
            <a href="#" class="sidebar-arrow">
              <i class="dropdown-arrow bi bi-chevron-down"></i>
            </a>

            <ul class="cone-mainmenu-dropdown-sb">
              <li>
                <a href="#">
                  <i class="bi bi-heart"></i>
                <span>Title</span>
                </a>
              </li>
            </ul>
          </li>

          <li class="node-child_3 sb-menu">
            <a href="#">
              <i class="bi bi-heart"></i>
                <span">Title</span>
            </a>
            <a href="#" class="sidebar-arrow">
              <i class="dropdown-arrow bi bi-chevron-down"></i>
            </a>

            <ul class="cone-mainmenu-dropdown-sb">
              <li>
                <a href="#">
                  <i class="bi bi-heart"></i>
                  <span>Title</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
    `;

    $('#sidebar_content').append(mm_sidebar_html);
}

///////////////////////////////////////////////////////////////////////////////
// cone.MainMenuSidebar tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module.skip('cone.MainMenuSidebar', hooks => {
    hooks.before(() => {
        console.log('Set up cone.MainMenuSidebar tests');
        cone.viewport = new cone.ViewPort();
    });

    hooks.after(() => {
        cone.viewport = null;
        console.log('Tear down cone.MainMenuSidebar tests');
    });

    QUnit.module('constructor', () => {
        QUnit.module('properties', hooks => {
            hooks.before(() => {
                console.log('Set up cone.MainMenuSidebar properties tests');

                // create DOM elements
                create_sidebar_elem();
                create_mm_sidebar_elem();
            });

            hooks.after(() => {
                console.log('Tear down cone.MainMenuSidebar properties test');

                // delete instances
                cone.sidebar_menu = null;
                cone.main_menu_sidebar = null;

                // remove element from DOM
                $('#sidebar_left').remove();
            });

            QUnit.test('properties', assert => {
                // initialize instances
                cone.SidebarMenu.initialize();
                cone.MainMenuSidebar.initialize();
                let mm_sb = cone.main_menu_sidebar;

                assert.ok(mm_sb instanceof cone.ViewPortAware);

                // containing element
                assert.ok(mm_sb.elem.is('ul#mainmenu_sidebar'));

                // items
                assert.ok(mm_sb.items);
                // expected number of items in mainmenu
                assert.strictEqual(mm_sb.items.length, 3);

                // items are direct children of elem
                assert.ok(
                    mm_sb.items
                    .is('#mainmenu_sidebar > li:not("sidebar-heading")')
                );

                // arrows
                assert.ok(mm_sb.arrows);
                assert.ok(mm_sb.arrows.is('i.dropdown-arrow'));

                // menus
                assert.ok(mm_sb.menus.is('li.sb-menu'));
            });
        });
    });

    QUnit.module('methods', () => {

        QUnit.module('unload()', hooks => {
            let super_unload_origin = cone.ViewPortAware.prototype.unload;

            hooks.before(assert => {
                console.log('Set up cone.MainMenuSidebar.unload tests');

                // create DOM elements
                create_sidebar_elem();
                create_mm_sidebar_elem();

                // overwrite original function
                cone.ViewPortAware.prototype.unload = function() {
                    assert.step('super.unload()');
                }
            });

            hooks.after(() => {
                console.log('Tear down cone.MainMenuSidebar.unload tests');

                // reset original unload method
                cone.ViewPortAware.prototype.unload = super_unload_origin;

                // delete instance
                cone.sidebar_menu = null;
                cone.main_menu_sidebar = null;

                $('#sidebar_left').remove();
            });

            QUnit.test('unload()', assert => {
                // initialize instances
                cone.SidebarMenu.initialize();
                cone.MainMenuSidebar.initialize();

                cone.main_menu_sidebar.items.on('mouseenter mouseleave', () => {
                    throw new Error('mouseenter/mouseleave');
                });
                cone.main_menu_sidebar.arrows.on('click', () => {
                    throw new Error('click');
                });

                // second instance invokes unload function
                cone.MainMenuSidebar.initialize();

                // trigger events to check if evt listeners are unbound
                cone.main_menu_sidebar.items.trigger('mouseenter');
                cone.main_menu_sidebar.items.trigger('mouseleave');
                cone.main_menu_sidebar.arrows.trigger('click');

                // cone.ViewPortAware has been called
                assert.verifySteps(['super.unload()']);
            });
        });

        QUnit.module('initial_cookie()', hooks => {
            hooks.beforeEach(() => {
                console.log('Set up cone.MainMenuSidebar.initial_cookie tests');

                // create DOM elements
                create_sidebar_elem();
                create_mm_sidebar_elem();

                // delete any cookies --- make sure to tear down properly!
                createCookie('sidebar menus', '', -1);
            });

            hooks.afterEach(() => {
                console.log('Tear down cone.MainMenuSidebar.initial_cookie tests');

                // remove elements from DOM
                cone.main_menu_sidebar = null;
                cone.sidebar_menu = null;
                $('#sidebar_left').remove();

                // remove dummy cookie
                createCookie('sidebar menus', '', -1);
            });

            QUnit.test('initial_cookie()', assert => {
                // initialize instances
                cone.SidebarMenu.initialize();
                cone.MainMenuSidebar.initialize();
                let mm_sb = cone.main_menu_sidebar;

                // cookie does not exist
                assert.notOk(readCookie('sidebar menus'));

                // create empty array, push display none for hidden menus
                let test_display_data = [];
                for (let elem of mm_sb.menus) {
                    test_display_data.push('none');
                }
                // display_data shows all menus hidden
                assert.deepEqual(mm_sb.display_data, test_display_data);
            });

            QUnit.test('initial_cookie() with cookie', assert => {
                // initialize instances
                cone.SidebarMenu.initialize();
                cone.MainMenuSidebar.initialize();
                let mm_sb = cone.main_menu_sidebar;

                // fill array with display block for visible menus
                let test_display_data = [];
                for (let elem of mm_sb.menus) {
                    test_display_data.push('block');
                }
                // create cookie
                createCookie('sidebar menus', test_display_data, null);
                assert.ok(readCookie('sidebar menus'));

                // invoke inital_cookie method
                mm_sb.initial_cookie();
                assert.deepEqual(mm_sb.display_data, test_display_data);
            });
        });

        QUnit.module('viewport_changed()', hooks => {
            let TestMmSb,
                test_mm_sb,
                VPA = cone.ViewPortAware,
                super_vp_changed_origin = VPA.prototype.viewport_changed;

            hooks.before(assert => {
                console.log('Set up cone.MainMenuSidebar.viewport_changed tests');

                cone.viewport.state = 3;

                // create DOM elements
                create_sidebar_elem();
                create_mm_sidebar_elem();

                // overwrite Viewport_changed
                VPA.prototype.viewport_changed = function(e){
                    this.vp_state = e.state;
                    assert.step('super.viewport_changed()');
                }

                // dummy class
                TestMmSb = class extends cone.MainMenuSidebar {
                    static initialize(context) {
                        let elem = $('#mainmenu_sidebar', context);
                        test_mm_sb = new TestMmSb(elem);
                    }
                    mv_to_mobile() {
                        assert.step('mv_to_mobile()');
                    }
                    mv_to_sidebar() {
                        assert.step('mv_to_sidebar()');
                    }
                }
            });

            hooks.after(() => {
                console.log('Tear down cone.MainMenuSidebar.viewport_changed tests');

                $(window).off('resize');
                viewport.set('large');

                // reset viewport_changed
                VPA.prototype.viewport_changed = super_vp_changed_origin;

                // unload and delete instances
                cone.sidebar_menu = null;
                test_mm_sb = null;

                $('#sidebar_left').remove();
            });

            QUnit.test('viewport_changed()', assert => {
                // create mock viewport change event
                let resize_evt = $.Event('viewport_changed');

                // initialize instances
                cone.SidebarMenu.initialize();
                TestMmSb.initialize();

                for (let i=0; i<vp_states.length; i++) {
                    // set viewport state
                    resize_evt.state = i;
                    // invoke viewport_changed function
                    test_mm_sb.viewport_changed(resize_evt);

                    assert.strictEqual(test_mm_sb.vp_state, resize_evt.state);

                    if (i === 0) {
                        // mobile
                        assert.verifySteps([
                            'super.viewport_changed()',
                            'mv_to_mobile()'
                        ]);
                    } else {
                        // desktop
                        assert.verifySteps([
                            'super.viewport_changed()',
                            'mv_to_sidebar()'
                        ]);
                    }
                }
            });
        });

        QUnit.module('mv_to_mobile()', hooks => {

            hooks.before(() => {
                console.log('Set up cone.MainMenuSidebar.mv_to_mobile tests');

                // create DOM elements
                create_topnav_elem();
                create_sidebar_elem();
                create_mm_sidebar_elem();

                // change viewport to mobile
                cone.viewport.state = 0;
            });

            hooks.after(() => {
                console.log('Tear down cone.MainMenuSidebar.mv_to_mobile tests');

                $(window).off('resize');

                // delete instances
                cone.topnav = null;
                cone.sidebar_menu = null;
                cone.main_menu_sidebar = null;

                // remove DOM elements
                $('#topnav').remove();
                $('#sidebar_left').remove();

                // reset viewport
                cone.viewport.state = 3;
            });

            QUnit.test('mv_to_mobile()', assert => {
                // initialize instances
                cone.Topnav.initialize();
                cone.SidebarMenu.initialize();

                // initialize MainMenuSidebar
                cone.MainMenuSidebar.initialize();
                let mm_sb = cone.main_menu_sidebar;

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
                assert.ok(mm_sb.elem.hasClass('mobile'));
            });
        });

        QUnit.module('mv_to_sidebar()', hooks => {
            hooks.before(() => {
                console.log('Set up cone.MainMenuSidebar.mv_to_sidebar tests');

                // create DOM elements
                create_topnav_elem();
                create_sidebar_elem();
                create_mm_sidebar_elem();

                // set viewport to large
                cone.viewport.state = 3;
            });

            hooks.after(() => {
                console.log('Tear down cone.MainMenuSidebar.mv_to_sidebar tests');

                // delete instances
                cone.topnav = null;
                cone.sidebar_menu = null;
                cone.main_menu_sidebar = null;

                // remove DOM elements
                $('#topnav').remove();
                $('#sidebar_left').remove();
            });

            QUnit.test('mv_to_sidebar()', assert => {
                // initialize instances
                cone.Topnav.initialize();
                cone.SidebarMenu.initialize(),
                cone.MainMenuSidebar.initialize();
                let mm_sb = cone.main_menu_sidebar;

                // mainmenu sidebar is in sidebar content
                assert.strictEqual(
                    $('#sidebar_content > #mainmenu_sidebar').length,
                    1
                );

                // invoke mv_to_mobile
                mm_sb.mv_to_mobile();
                assert.strictEqual(
                    $('#sidebar_content > #mainmenu_sidebar').length,
                    0
                );

                // invoke mv_to_sidebar
                mm_sb.mv_to_sidebar();

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
                assert.notOk(mm_sb.elem.hasClass('mobile'));
            });
        });

        QUnit.module('collapse', hooks => {
            hooks.before(() => {
                console.log('Set up cone.MainMenuSidebar.collapse tests');

                // create DOM elements
                create_sidebar_elem();
                create_mm_sidebar_elem();
            });

            hooks.after(() => {
                console.log('Tear down cone.MainMenuSidebar.collapse tests');

                // delete instances
                cone.sidebar_menu = null;
                cone.main_menu_sidebar = null;

                // remove DOM elements
                $('#sidebar_left').remove();
            });

            QUnit.test('collapse()', assert => {
                // initialize instances
                cone.SidebarMenu.initialize();
                cone.MainMenuSidebar.initialize();
                let mm_sb = cone.main_menu_sidebar;

                // test if evt listener removed
                mm_sb.arrows.on('click', () => {
                    throw new Error('click');
                });

                // invoke collapse
                mm_sb.collapse();

                // menus are hidden
                assert.ok($('ul', mm_sb.items).is(':hidden'));
                // trigger click on arrows
                mm_sb.arrows.trigger('click');

                for (let item of mm_sb.items) {
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
                            assert.ok(menu.is(':visible'));

                            // trigger mouseleave
                            elem.trigger('mouseleave');
                            assert.ok(menu.is(':hidden'));
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
                        assert.ok(menu.is(':visible'));

                        // reset menu visibility
                        menu.hide();
                    }
                }
            });
        });

        QUnit.module('expand', hooks => {
            hooks.before(() => {
                console.log('Set up cone.MainMenuSidebar.expand tests');

                // create DOM elements
                create_sidebar_elem();
                create_mm_sidebar_elem();
            });

            hooks.after(() => {
                console.log('Tear down cone.MainMenuSidebar.expand tests');

                // delete instances
                cone.sidebar_menu = null;
                cone.main_menu_sidebar = null;

                // remove DOM elements
                $('#sidebar_left').remove();
            });

            QUnit.test('expand()', assert => {
                // initialize instances
                cone.SidebarMenu.initialize();
                cone.MainMenuSidebar.initialize();
                let mm_sb = cone.main_menu_sidebar;

                // invoke collapse method
                mm_sb.collapse();

                // mock expanded menu
                $('.node-child_3').trigger('mouseenter');
                $('.node-child_3').removeClass('hover');

                // display data cookie tests
                // empty array
                mm_sb.display_data = [];

                // add display state for every item
                for (let i = 0; i < mm_sb.menus.length; i++) {
                    let data = $('ul', mm_sb.menus[i]).css('display');
                    mm_sb.display_data.push(data);
                }

                // throw error on mouseenter/leave to test if unbound
                mm_sb.items.on('mouseenter mouseleave', () => {
                    throw new Error('mouseenter/mouseleave');
                })

                // invoke expand method
                mm_sb.expand();

                // trigger mouse events on items
                mm_sb.items.trigger('mouseenter').trigger('mouseleave');

                for (let i = 0; i < mm_sb.menus.length; i++) {
                    let elem = mm_sb.menus[i],
                        arrow = $('i.dropdown-arrow', elem),
                        menu = $('ul.cone-mainmenu-dropdown-sb', elem)
                    ;
                    // menu is correct value of display_data
                    assert.strictEqual(
                        menu.css('display'),
                        mm_sb.display_data[i]
                    );

                    if (menu.css('display') === 'none'){
                        // menu is hidden
                        assert.notOk(arrow.hasClass('bi-chevron-up'));
                        assert.ok(arrow.hasClass('bi-chevron-down'));
                        arrow.trigger('click');
                        assert.strictEqual(menu.css('display'), 'block');
                        assert.strictEqual(mm_sb.display_data[i], 'block');
                        assert.notOk(arrow.hasClass('bi-chevron-down'));
                        assert.ok(arrow.hasClass('bi-chevron-up'));
                    } else if (menu.css('display') === 'block'){
                        // menu is visible
                        assert.ok(arrow.hasClass('bi-chevron-up'));
                        assert.notOk(arrow.hasClass('bi-chevron-down'));

                        // save jQuery slideToggle origin
                        let slide_toggle_origin = $.fn.slideToggle;

                        // overwrite jQuery slideToggle for performance
                        $.fn._slideToggle = $.fn.slideToggle;
                        $.fn.slideToggle = function(){
                            assert.step('slideToggle called');
                            $.fn.hide.apply(this);
                        };

                        // trigger click on arrow
                        arrow.trigger('click');

                        assert.strictEqual(menu.css('display'), 'none');
                        assert.notOk(arrow.hasClass('bi-chevron-up'));
                        assert.ok(arrow.hasClass('bi-chevron-down'));

                        // display data of element after click is none
                        assert.strictEqual(mm_sb.display_data[i], 'none');

                        // jQuery slideToggle has been called
                        assert.verifySteps(['slideToggle called']);

                        // reset jQuery slideToggle
                        $.fn.slideToggle = slide_toggle_origin;
                        $.fn._slideToggle = $.fn.slideToggle;
                    }

                    // cookie has been created
                    assert.ok(readCookie('sidebar menus'));
                }
            });
        });
    });
});
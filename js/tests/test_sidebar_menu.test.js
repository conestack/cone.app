import $ from 'jquery';

import {ViewPortAware, vp_states} from '../src/viewport.js';
import {karma_vp_states} from './karma_viewport_states.js';

import {SidebarMenu} from '../src/sidebar_menu.js';
import {MainMenuSidebar}from '../src/main_menu_sidebar.js';
import {Navtree} from '../src/navtree.js';
import {Topnav} from '../src/topnav.js';

import * as helpers from './helpers.js';
import {createCookie, readCookie} from '../src/cookie_functions.js';

// tmp
QUnit.test('temp', assert => {
    assert.ok(true);

    helpers.set_vp('large');
    $(window).on('sidebar_collapsed', () => {
        console.log('sidebar collapsed event!')
    });
    $(window).on('sidebar_expanded', () => {
        console.log('sidebar expanded event!')
    });
    helpers.create_sidebar_elem();
    helpers.create_mm_sidebar_elem();

    let sidebar = SidebarMenu.initialize();
    let mm_sb = MainMenuSidebar.initialize();
    
    helpers.set_vp('small');
    console.log(sidebar.vp_state)
    console.log(sidebar.collapsed)
});
// end tmp

///////////////////////////////////////////////////////////////////////////////
// SidebarMenu tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module.skip('SidebarMenu', hooks => {
    hooks.before(() => {
        console.log('Set up SidebarMenu tests');
    });

    hooks.after(() => {
        console.log('Tear down SidebarMenu tests');
    });

    QUnit.module('constructor', () => {

        QUnit.module('properties', hooks => {
            let sidebar;

            hooks.before(() => {
                console.log('Set up SidebarMenu properties tests');

                // set viewport to desktop size
                helpers.set_vp('large');

                // create dummy sidebar
                helpers.create_sidebar_elem();
            });

            hooks.after(() =>{
                console.log('Tear down SidebarMenu properties tests');

                // unset and remove sidebar
                sidebar = null;
                // remove dummy sidebar from DOM
                $('#sidebar_left').remove();
            });

            QUnit.test('elems', assert => {
                assert.ok(true);
                // initialize new SidebarMenu instance
                sidebar = SidebarMenu.initialize($('body'), null);

                // Sidebar is child of ViewPortAware class
                assert.ok(sidebar instanceof ViewPortAware);

                // containing element
                assert.ok(sidebar.elem.is('div#sidebar_left'));

                // content
                assert.ok(sidebar.content.is('div#sidebar_content'));

                // sidebar is expanded on desktop load
                assert.false(sidebar.collapsed);

                // footer
                assert.ok(
                    sidebar.toggle_btn
                    .is('#sidebar_footer > #sidebar-toggle-btn')
                );
                assert.ok(
                    sidebar.toggle_arrow_elem
                    .is('#sidebar-toggle-btn > i')
                );
                assert.ok(
                    sidebar.lock_switch
                    .is('#sidebar_footer > #toggle-fluid')
                );
                assert.strictEqual(sidebar.cookie, null);

                // private methods exist
                assert.ok(sidebar._toggle_menu_handle);
                assert.ok(sidebar._toggle_lock);
            });
        });
    });

    QUnit.module('methods', hooks =>{
        hooks.before(() => {
            console.log('Set up SidebarMenu method tests');
        });

        hooks.after(() => {
            console.log('Tear down SidebarMenu method tests');
        });

        QUnit.module('initial_load()', hooks => {
            let sidebar;

            hooks.beforeEach(assert => {
                console.log('Set up SidebarMenu.initial_load tests');
                // create dummy sidebar html elem
                helpers.create_sidebar_elem();
            });

            hooks.afterEach(() => {
                console.log('Tear down SidebarMenu.initial_load tests');

                sidebar = null;
                // remove dummy element from DOM
                $('#sidebar_left').remove();
            });

            for (let i=0; i<karma_vp_states.length; i++) {
                QUnit.test(`Viewport ${i}`, assert => {
                    // set viewport
                    helpers.set_vp(karma_vp_states[i]);

                    // initialize Test Sidebar
                    sidebar = new SidebarMenu($('#sidebar_left'));

                    assert.strictEqual(
                        sidebar.vp_state,
                        i
                    );

                    // sidebar cookie is null
                    assert.strictEqual(readCookie('sidebar'), null);

                    if (i === 0) {
                        // containing element is hidden on mobile viewport
                        assert.strictEqual(
                            sidebar.elem.css('display'),
                            'none'
                        );
                    } else if (i === 2) {
                        // sidebar is collapsed on medium viewport
                        assert.strictEqual(sidebar.collapsed, true);
                    } else if (i === 3) {
                        // sidebar is expanded on large viewport
                        assert.strictEqual(sidebar.collapsed, false);
                    }
                });

                QUnit.test(`Viewport ${i} with cookie`, assert => {
                    // set viewport
                    helpers.set_vp(karma_vp_states[i]);

                    // create dummy cookie
                    createCookie('sidebar', true, null);

                    // initialize Test Sidebar
                    sidebar = new SidebarMenu($('#sidebar_left'));

                    assert.strictEqual(
                        sidebar.vp_state,
                        i
                    );

                    assert.strictEqual(readCookie('sidebar'), 'true');

                    if (i !== 0) {
                        // cookie state === collapsed if viewport is not mobile
                        assert.strictEqual(sidebar.collapsed, true);

                        // lock switch is active if cookie exists
                        assert.ok(
                            sidebar.lock_switch
                            .hasClass('active')
                        );

                        // trigger click on toggle button
                        sidebar.toggle_btn.trigger('click');
                    }

                    // remove dummy cookie
                    createCookie('sidebar', '', -1);
                });
            }
        });

        QUnit.module('toggle_lock()', hooks => {
            let sidebar;

            hooks.beforeEach(() => {
                console.log('Set up SidebarMenu.toggle_lock tests');

                // set viewport
                helpers.set_vp('large');

                // create dummy sidebar element
                helpers.create_sidebar_elem();
            });

            hooks.afterEach(() => {
                console.log('Tear down SidebarMenu.toggle_lock tests');

                // unset sidebar
                sidebar = null;
                // remove dummy element from DOM
                $('#sidebar_left').remove();

                // delete dummy cookie
                createCookie('sidebar', '', -1);
            });

            QUnit.test('toggle_lock()', assert => {
                // create new SidebarMenu instance
                sidebar = new SidebarMenu($('#sidebar_left'));

                // sidebar is collapsed on load
                assert.strictEqual(sidebar.collapsed, false);

                // cookie is null
                assert.strictEqual(readCookie('sidebar'), null);

                // trigger click on lock switch (lock state)
                sidebar.lock_switch.trigger('click');
                // lock switch is active
                assert.ok(sidebar.lock_switch.hasClass('active'));
                // collapsed state has not changed
                assert.strictEqual(sidebar.collapsed, false);
                // no cookie created after click
                assert.strictEqual(sidebar.cookie, false);

                // trigger click on toggle button
                sidebar.toggle_btn.trigger('click');
            });

            QUnit.test('toggle_lock() with cookie', assert => {
                // create dummy cookie
                createCookie('sidebar', true, null);
                assert.strictEqual(readCookie('sidebar'), 'true');

                // create new SidebarMenu instance
                sidebar = new SidebarMenu($('#sidebar_left'));

                // lock switch is active
                assert.ok(sidebar.lock_switch.hasClass('active'));

                // trigger unclick on lock switch
                sidebar.lock_switch.trigger('click');
                // cookie is deleted
                assert.strictEqual(readCookie('sidebar'), null);

                // lock switch is not active after click
                assert.notOk(sidebar.lock_switch.hasClass('active'));

                // trigger click on toggle button
                sidebar.toggle_btn.trigger('click');
                assert.strictEqual(sidebar.cookie, null);
            });
        });

        QUnit.module('viewport_changed()', hooks => {
            let TestSidebarMenu,
                sidebar,
                VPA = ViewPortAware,
                super_vp_changed_origin = VPA.prototype.viewport_changed;

            hooks.beforeEach(assert => {
                console.log('Set up SidebarMenu.toggle_lock tests');

                // create dummy sidebar element
                helpers.create_sidebar_elem();

                // dummy class
                TestSidebarMenu = class extends SidebarMenu {
                    assign_state() {
                        assert.step(`assign_state(${this.collapsed})`);
                    }
                }

                // overwrite vp changed method to assert call
                VPA.prototype.viewport_changed = function(e) {
                    this.vp_state = e.state;
                    assert.step(`super.viewport_changed(${e.state})`);
                }
            });

            hooks.afterEach(() => {
                console.log('Tear down SidebarMenu.toggle_lock tests');

                // unset sidebar
                sidebar.unload();
                sidebar = null;
                // remove dummy element from DOM
                $('#sidebar_left').remove();

                // reset vp changed method
                VPA.prototype.viewport_changed = super_vp_changed_origin;

                // delete dummy cookie
                createCookie('sidebar', '', -1);
            });

            QUnit.test('viewport_changed()', assert => {
                // create new SidebarMenu instance
                sidebar = new TestSidebarMenu($('#sidebar_left'));

                // initial assign_state call on load
                assert.verifySteps([
                    'assign_state(false)'
                ]);

                // create dummy viewport changed event
                let resize_evt = $.Event('viewport_changed');

                for (let i=0; i<karma_vp_states.length; i++) {
                    // set dummy viewport changed event
                    resize_evt.state = i;
                    // invoke viewport_changed method
                    sidebar.viewport_changed(resize_evt);

                    let state;

                    assert.strictEqual(
                        sidebar.vp_state,
                        resize_evt.state
                    );

                    if (i === 0) {
                        // sidebar is expanded on mobile viewport
                        assert.strictEqual(sidebar.collapsed, false);
                        // element is hidden in mobile dropdown
                        assert.strictEqual(
                            sidebar.elem.css('display'),
                            'none'
                        );
                        state = false;
                    } else if (i === 1) {
                        // sidebar is collapsed on small viewport
                        assert.strictEqual(sidebar.collapsed, true);
                        // element is visible
                        assert.strictEqual(
                            sidebar.elem.css('display'),
                            'block'
                        );
                        state = true;
                    } else if (i === 2) {
                        state = false;
                    } else if (i === 3) {
                        // sidebar is expanded on large viewport
                        assert.strictEqual(sidebar.collapsed, false);
                        // element is visible
                        assert.strictEqual(
                            sidebar.elem.css('display'),
                            'block'
                        );
                        state = false;
                    }

                    // methods have been called
                    assert.verifySteps([
                        `super.viewport_changed(${i})`,
                        `assign_state(${state})`
                    ]);
                }
            });

            QUnit.test('viewport small', assert => {
                // create new SidebarMenu instance
                sidebar = new TestSidebarMenu($('#sidebar_left'));

                // initial assign_state call on load
                assert.verifySteps(['assign_state(false)']);

                // create dummy viewport changed event
                let resize_evt = $.Event('viewport_changed');
                // resize event state does not equal sidebar viewport state
                resize_evt.state = 1;
                sidebar.vp_state = 2;

                // invoke viewport_changed method
                sidebar.viewport_changed(resize_evt);
                // sidebar is collapsed
                assert.strictEqual(sidebar.collapsed, true);
                // elem is visible
                assert.strictEqual(
                    sidebar.elem.css('display'),
                    'block'
                );

                assert.verifySteps([
                    'super.viewport_changed(1)',
                    'assign_state(true)'
                ]);
            });

            QUnit.test('with cookie', assert => {
                let state;

                // create dummy viewport changed event
                let resize_evt = $.Event('viewport_changed');

                // create new SidebarMenu instance
                sidebar = new TestSidebarMenu($('#sidebar_left'));

                // initial assign_state call on load
                assert.verifySteps(['assign_state(false)']);

                for (let i=0; i<karma_vp_states.length; i++) {
                    if (i === 1) {
                        state = false;
                    } else {
                        state = true;
                    }

                    // create dummy cookie
                    sidebar.cookie = state;

                    // set dummy viewport changed event state
                    resize_evt.state = i;

                    // invoke viewport_changed method
                    sidebar.viewport_changed(resize_evt);

                    if (i === 0) {
                        // collapsed state can't change on mobile
                        assert.verifySteps([
                            `super.viewport_changed(${i})`,
                            `assign_state(false)`
                        ]);
                        assert.strictEqual(sidebar.collapsed, false);
                    } else {
                        // collapsed cookie state gets applied
                        assert.verifySteps([
                            `super.viewport_changed(${i})`,
                            `assign_state(${state})`
                        ]);
                        assert.strictEqual(sidebar.collapsed, state);
                    }
                }
            });
        });

        QUnit.module('assign_state()', hooks => {
            let TestMainMenuSidebar,
                main_menu_sidebar,
                sidebar;

            hooks.beforeEach(assert => {
                console.log('Set up SidebarMenu.toggle_lock tests');

                // create dummy sidebar element
                helpers.create_sidebar_elem();

                // create dummy mainmenu sidebar element
                helpers.create_mm_sidebar_elem();

                // dummy class
                TestMainMenuSidebar = class extends MainMenuSidebar {
                    static initialize(context) {
                        let elem = $('#mainmenu_sidebar');
                        main_menu_sidebar = new TestMainMenuSidebar(elem);
                    }
                    collapse() {
                        assert.step('collapse()');
                    }
                    expand() {
                        assert.step('expand()');
                    }
                }
            });

            hooks.afterEach(() => {
                console.log('Tear down SidebarMenu.toggle_lock tests');

                // unset sidebar
                sidebar = null;
                // remove dummy element from DOM
                $('#sidebar_left').remove();

                // unset main menu sidebar
                if (main_menu_sidebar) {
                    main_menu_sidebar.unload();
                    main_menu_sidebar = null;
                }
            });

            QUnit.test('assign_state()', assert => {
                sidebar = SidebarMenu.initialize();

                // sidebar is expanded on load
                assert.strictEqual(sidebar.collapsed, false);
                assert.ok(sidebar.elem.hasClass('expanded'));
                assert.ok(
                    sidebar.toggle_arrow_elem
                    .hasClass('bi bi-arrow-left-circle')
                );

                // sidebar is collapsed
                sidebar.collapsed = true;
                // invoke assign_state() method
                sidebar.assign_state();
                assert.ok(sidebar.elem.hasClass('collapsed'));
                assert.ok(
                    sidebar.toggle_arrow_elem
                    .hasClass('bi bi-arrow-right-circle')
                );
            });

            QUnit.test.skip('with mainmenu sidebar', assert => {
                // TODO

                assert.ok(true);
                // initialize SidebarMenu instance
                sidebar = SidebarMenu.initialize();
                // initialize mainmenu sidebar instance
                main_menu_sidebar = TestMainMenuSidebar.initialize();

                // expand
                sidebar.assign_state();

                //collapse
                sidebar.collapsed = true;
                sidebar.assign_state();

                // assert.verifySteps([
                //     'expand()',
                //     'collapse()'
                // ]);
            });
        });

        QUnit.module('toggle_menu()', hooks => {
            let TestSidebarMenu,
                sidebar;

            hooks.before(assert => {
                console.log('Set up SidebarMenu.toggle_menu tests');

                // create dummy sidebar element
                helpers.create_sidebar_elem();

                // dummy class
                TestSidebarMenu = class extends SidebarMenu {
                    assign_state() {
                        assert.step('assign_state()');
                    }
                }
            });

            hooks.after(() => {
                console.log('Tear down SidebarMenu.toggle_menu tests');

                // unset sidebar
                sidebar = null;
                // remove dummy element from DOM
                $('#sidebar_left').remove();
            });

            QUnit.test('toggle_menu()', assert => {
                // initialize new SidebarMenu instance
                sidebar = new TestSidebarMenu();

                // initial assign_state call
                assert.verifySteps(['assign_state()']);

                // sidebar is expanded on load
                assert.strictEqual(sidebar.collapsed, false);

                // trigger click on toggle button
                sidebar.toggle_btn.trigger('click');
                // sidebar is collapsed after click
                assert.strictEqual(sidebar.collapsed, true);
                assert.verifySteps(['assign_state()']);

                // trigger click on toggle button
                sidebar.toggle_btn.trigger('click');
                // sidebar is expanded after click
                assert.strictEqual(sidebar.collapsed, false);
                assert.verifySteps(['assign_state()']);
            });
        });
    });
});
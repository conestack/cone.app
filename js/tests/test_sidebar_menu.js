import $ from 'jquery';

import {ViewPortAware, vp_states} from '../src/viewport.js';
import {karma_vp_states} from './karma_viewport_states.js';

import {SidebarMenu, sidebar_menu} from '../src/sidebar_menu.js';
import {MainMenuSidebar, mainmenu_sidebar} from '../src/main_menu_sidebar.js';
import {Navtree, navtree} from '../src/navtree.js';
import {Topnav, topnav} from '../src/topnav.js';

import * as helpers from './test-helpers.js';
import {createCookie, readCookie} from '../src/cookie_functions.js';

///////////////////////////////////////////////////////////////////////////////
// SidebarMenu tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('SidebarMenu', () => {

    QUnit.module('constructor', () => {

        QUnit.module('properties', hooks => {

            hooks.before(() => {
                // set viewport to desktop size
                helpers.set_vp('large');

                // create dummy sidebar
                helpers.create_sidebar_elem();
            });

            hooks.after(() =>{
                // remove dummy sidebar from DOM
                $('#layout').remove();
            });

            QUnit.test('elems', assert => {
                assert.ok(true);
                // initialize new SidebarMenu instance
                SidebarMenu.initialize();

                // Sidebar is child of ViewPortAware class
                assert.ok(sidebar_menu instanceof ViewPortAware);

                // containing element
                assert.ok(sidebar_menu.elem.is('div#sidebar_left'));

                // content
                assert.ok(sidebar_menu.content.is('div#sidebar_content'));

                // sidebar is expanded on desktop load
                assert.false(sidebar_menu.collapsed);

                // footer
                assert.ok(
                    sidebar_menu.toggle_btn
                    .is('#sidebar_footer > #sidebar-toggle-btn')
                );
                assert.ok(
                    sidebar_menu.toggle_arrow_elem
                    .is('#sidebar-toggle-btn > i')
                );
                assert.ok(
                    sidebar_menu.lock_switch
                    .is('#sidebar_footer > #toggle-fluid')
                );
                assert.strictEqual(sidebar_menu.cookie, null);

                // private methods exist
                assert.ok(sidebar_menu._toggle_menu_handle);
                assert.ok(sidebar_menu._toggle_lock);
            });
        });
    });

    QUnit.module('methods', () =>{

        QUnit.module('initial_load()', hooks => {

            hooks.beforeEach(() => {
                // create dummy sidebar html elem
                helpers.create_sidebar_elem();
            });

            hooks.afterEach(() => {
                // remove dummy element from DOM
                $('#layout').remove();
            });

            for (let i=0; i<karma_vp_states.length; i++) {
                QUnit.test(`Viewport ${i}`, assert => {
                    // set viewport
                    helpers.set_vp(karma_vp_states[i]);

                    // initialize Test Sidebar
                    SidebarMenu.initialize();

                    assert.strictEqual(
                        sidebar_menu.vp_state,
                        i
                    );

                    // sidebar cookie is null
                    assert.strictEqual(readCookie('sidebar'), null);

                    if (i === 0) {
                        // containing element is hidden on mobile viewport
                        assert.strictEqual(
                            sidebar_menu.elem.css('display'),
                            'none'
                        );
                    } else if (i === 2) {
                        // sidebar is collapsed on medium viewport
                        assert.strictEqual(sidebar_menu.collapsed, true);
                    } else if (i === 3) {
                        // sidebar is expanded on large viewport
                        assert.strictEqual(sidebar_menu.collapsed, false);
                    }
                });

                QUnit.test(`Viewport ${i} with cookie`, assert => {
                    // set viewport
                    helpers.set_vp(karma_vp_states[i]);

                    // create dummy cookie
                    createCookie('sidebar', true, null);

                    // initialize Test Sidebar
                    SidebarMenu.initialize();

                    assert.strictEqual(
                        sidebar_menu.vp_state,
                        i
                    );

                    assert.strictEqual(readCookie('sidebar'), 'true');

                    if (i !== 0) {
                        // cookie state === collapsed if viewport is not mobile
                        assert.strictEqual(sidebar_menu.collapsed, true);

                        // lock switch is active if cookie exists
                        assert.ok(
                            sidebar_menu.lock_switch
                            .hasClass('active')
                        );

                        // trigger click on toggle button
                        sidebar_menu.toggle_btn.trigger('click');
                    }

                    // remove dummy cookie
                    createCookie('sidebar', '', -1);
                });
            }
        });

        QUnit.module('toggle_lock()', hooks => {

            hooks.beforeEach(() => {
                // set viewport
                helpers.set_vp('large');

                // create dummy sidebar element
                helpers.create_sidebar_elem();
            });

            hooks.afterEach(() => {
                // remove dummy element from DOM
                $('#sidebar_left').remove();

                // delete dummy cookie
                createCookie('sidebar', '', -1);
            });

            QUnit.test('toggle_lock()', assert => {
                // create new SidebarMenu instance
                SidebarMenu.initialize();

                // sidebar is collapsed on load
                assert.strictEqual(sidebar_menu.collapsed, false);

                // cookie is null
                assert.strictEqual(readCookie('sidebar'), null);

                // trigger click on lock switch (lock state)
                sidebar_menu.lock_switch.trigger('click');
                // lock switch is active
                assert.ok(sidebar_menu.lock_switch.hasClass('active'));
                // collapsed state has not changed
                assert.strictEqual(sidebar_menu.collapsed, false);
                // no cookie created after click
                assert.strictEqual(sidebar_menu.cookie, false);

                // trigger click on toggle button
                sidebar_menu.toggle_btn.trigger('click');
            });

            QUnit.test('toggle_lock() with cookie', assert => {
                // create dummy cookie
                createCookie('sidebar', true, null);
                assert.strictEqual(readCookie('sidebar'), 'true');

                // create new SidebarMenu instance
                SidebarMenu.initialize();

                // lock switch is active
                assert.ok(sidebar_menu.lock_switch.hasClass('active'));

                // trigger unclick on lock switch
                sidebar_menu.lock_switch.trigger('click');
                // cookie is deleted
                assert.strictEqual(readCookie('sidebar'), null);

                // lock switch is not active after click
                assert.notOk(sidebar_menu.lock_switch.hasClass('active'));

                // trigger click on toggle button
                sidebar_menu.toggle_btn.trigger('click');
                assert.strictEqual(sidebar_menu.cookie, null);
            });
        });

        QUnit.module('viewport_changed()', hooks => {

            hooks.afterEach(() => {
                // remove dummy element from DOM
                $('#layout').remove();

                // delete dummy cookie
                createCookie('sidebar', '', -1);
            });

            QUnit.test('viewport_changed()', assert => {
                // create new SidebarMenu instance
                helpers.create_sidebar_elem();
                SidebarMenu.initialize();

                for (let i=0; i<karma_vp_states.length; i++) {
                    helpers.set_vp(karma_vp_states[i]);

                    if (i === 0) {
                        // sidebar is expanded on mobile viewport
                        assert.strictEqual(sidebar_menu.collapsed, false);
                        // element is hidden in mobile dropdown
                        assert.strictEqual(
                            sidebar_menu.elem.css('display'),
                            'none'
                        );
                    } else if (i === 1) {
                        // sidebar is collapsed on small viewport
                        assert.strictEqual(sidebar_menu.collapsed, true);
                        // element is visible
                        assert.strictEqual(
                            sidebar_menu.elem.css('display'),
                            'block'
                        );
                    } else if (i === 2) {
                    } else if (i === 3) {
                        // sidebar is expanded on large viewport
                        assert.strictEqual(sidebar_menu.collapsed, false);
                        // element is visible
                        assert.strictEqual(
                            sidebar_menu.elem.css('display'),
                            'block'
                        );
                    }
                }
            });

            QUnit.test('viewport small', assert => {
                // create new SidebarMenu instance
                helpers.create_sidebar_elem();
                SidebarMenu.initialize();

                helpers.set_vp('small');
                // sidebar is collapsed
                assert.strictEqual(sidebar_menu.collapsed, true);
                // elem is visible
                assert.strictEqual(
                    sidebar_menu.elem.css('display'),
                    'block'
                );
            });

            QUnit.test('with cookie', assert => {
                // create new SidebarMenu instance
                helpers.create_sidebar_elem();
                SidebarMenu.initialize();

                let state;
                for (let i=0; i<karma_vp_states.length; i++) {
                    if (i === 1) {
                        state = false;
                    } else {
                        state = true;
                    }

                    // create dummy cookie
                    sidebar_menu.cookie = state;

                    helpers.set_vp(karma_vp_states[i]);

                    if (i === 0) {
                        // collapsed state can't change on mobile
                        assert.strictEqual(sidebar_menu.collapsed, false);
                    } else {
                        // collapsed cookie state gets applied
                        assert.strictEqual(sidebar_menu.collapsed, state);
                    }
                }
            });
        });

        QUnit.module('assign_state()', hooks => {

            hooks.beforeEach(() => {
                // create dummy sidebar element
                helpers.create_sidebar_elem();

                // create dummy mainmenu sidebar element
                helpers.create_mm_sidebar_elem();
            });

            hooks.afterEach(() => {
                // remove dummy element from DOM
                $('#layout').remove();

                // unset main menu sidebar
                if (mainmenu_sidebar) {
                    mainmenu_sidebar.unload();
                    mainmenu_sidebar = null;
                }
            });

            QUnit.test('assign_state()', assert => {
                SidebarMenu.initialize();

                // sidebar is expanded on load
                assert.strictEqual(sidebar_menu.collapsed, false);
                assert.ok(sidebar_menu.elem.hasClass('expanded'));
                assert.ok(
                    sidebar_menu.toggle_arrow_elem
                    .hasClass('bi bi-arrow-left-circle')
                );

                // sidebar is collapsed
                sidebar_menu.collapsed = true;
                // invoke assign_state() method
                sidebar_menu.assign_state();
                assert.ok(sidebar_menu.elem.hasClass('collapsed'));
                assert.ok(
                    sidebar_menu.toggle_arrow_elem
                    .hasClass('bi bi-arrow-right-circle')
                );
            });
        });

        QUnit.module('toggle_menu()', hooks => {

            hooks.before(() => {
                // create dummy sidebar element
                helpers.create_sidebar_elem();
            });

            hooks.after(() => {
                // remove dummy element from DOM
                $('#layout').remove();
            });

            QUnit.test('toggle_menu()', assert => {
                // initialize new SidebarMenu instance
                SidebarMenu.initialize();

                // sidebar is expanded on load
                assert.strictEqual(sidebar_menu.collapsed, false);

                // trigger click on toggle button
                sidebar_menu.toggle_btn.trigger('click');
                // sidebar is collapsed after click
                assert.strictEqual(sidebar_menu.collapsed, true);

                // trigger click on toggle button
                sidebar_menu.toggle_btn.trigger('click');
                // sidebar is expanded after click
                assert.strictEqual(sidebar_menu.collapsed, false);
            });
        });
    });
});
import $ from 'jquery';
import * as helpers from './helpers.js';
import {karma_vp_states} from './karma_viewport_states.js';
import {
    create_cookie,
    read_cookie
} from '../src/public/utils.js';
import {layout} from '../src/public/layout.js';
import {ViewPortAware} from '../src/public/viewport.js';
import {Sidebar} from '../src/public/sidebar.js';

///////////////////////////////////////////////////////////////////////////////
// Sidebar tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('Sidebar', () => {

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
                // initialize new Sidebar instance
                Sidebar.initialize();

                // Sidebar is child of ViewPortAware class
                assert.ok(layout.sidebar instanceof ViewPortAware);

                // containing element
                assert.ok(layout.sidebar.elem.is('div#sidebar_left'));

                // content
                assert.ok(layout.sidebar.content.is('div#sidebar_content'));

                // sidebar is expanded on desktop load
                assert.false(layout.sidebar.collapsed);

                // footer
                assert.ok(
                    layout.sidebar.toggle_btn
                    .is('#sidebar_footer > #sidebar-toggle-btn')
                );
                assert.ok(
                    layout.sidebar.toggle_arrow_elem
                    .is('#sidebar-toggle-btn > i')
                );
                assert.ok(
                    layout.sidebar.lock_switch
                    .is('#sidebar_footer > #toggle-fluid')
                );
                assert.strictEqual(layout.sidebar.cookie, null);

                // private methods exist
                assert.ok(layout.sidebar._toggle_menu_handle);
                assert.ok(layout.sidebar._toggle_lock);
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
                    Sidebar.initialize();

                    assert.strictEqual(
                        layout.sidebar.vp_state,
                        i
                    );

                    // sidebar cookie is null
                    assert.strictEqual(read_cookie('sidebar'), null);

                    if (i === 0) {
                        // containing element is hidden on mobile viewport
                        assert.strictEqual(
                            layout.sidebar.elem.css('display'),
                            'none'
                        );
                    } else if (i === 1) {
                        // sidebar is collapsed on medium viewport
                        assert.strictEqual(layout.sidebar.collapsed, true);
                    } else if (i === 3) {
                        // sidebar is expanded on large viewport
                        assert.strictEqual(layout.sidebar.collapsed, false);
                    }
                });

                QUnit.test(`Viewport ${i} with cookie`, assert => {
                    // set viewport
                    helpers.set_vp(karma_vp_states[i]);

                    // create dummy cookie
                    create_cookie('sidebar', true, null);

                    // initialize Test Sidebar
                    Sidebar.initialize();

                    assert.strictEqual(
                        layout.sidebar.vp_state,
                        i
                    );

                    assert.strictEqual(read_cookie('sidebar'), 'true');

                    if (i !== 0) {
                        // cookie state === collapsed if viewport is not mobile
                        assert.strictEqual(layout.sidebar.collapsed, true);

                        // lock switch is active if cookie exists
                        assert.ok(
                            layout.sidebar.lock_switch
                            .hasClass('active')
                        );

                        // trigger click on toggle button
                        layout.sidebar.toggle_btn.trigger('click');
                    }

                    // remove dummy cookie
                    create_cookie('sidebar', '', -1);
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
                create_cookie('sidebar', '', -1);
            });

            QUnit.test('toggle_lock()', assert => {
                // create new Sidebar instance
                Sidebar.initialize();

                // sidebar is collapsed on load
                assert.strictEqual(layout.sidebar.collapsed, false);

                // cookie is null
                assert.strictEqual(read_cookie('sidebar'), null);

                // trigger click on lock switch (lock state)
                layout.sidebar.lock_switch.trigger('click');
                // lock switch is active
                assert.ok(layout.sidebar.lock_switch.hasClass('active'));
                // collapsed state has not changed
                assert.strictEqual(layout.sidebar.collapsed, false);
                // no cookie created after click
                assert.strictEqual(layout.sidebar.cookie, false);

                // trigger click on toggle button
                layout.sidebar.toggle_btn.trigger('click');
            });

            QUnit.test('toggle_lock() with cookie', assert => {
                // create dummy cookie
                create_cookie('sidebar', true, null);
                assert.strictEqual(read_cookie('sidebar'), 'true');

                // create new Sidebar instance
                Sidebar.initialize();

                // lock switch is active
                assert.ok(layout.sidebar.lock_switch.hasClass('active'));

                // trigger unclick on lock switch
                layout.sidebar.lock_switch.trigger('click');
                // cookie is deleted
                assert.strictEqual(read_cookie('sidebar'), null);

                // lock switch is not active after click
                assert.notOk(layout.sidebar.lock_switch.hasClass('active'));

                // trigger click on toggle button
                layout.sidebar.toggle_btn.trigger('click');
                assert.strictEqual(layout.sidebar.cookie, null);
            });
        });

        QUnit.module('viewport_changed()', hooks => {

            hooks.afterEach(() => {
                // remove dummy element from DOM
                $('#layout').remove();

                // delete dummy cookie
                create_cookie('sidebar', '', -1);
            });

            QUnit.test('viewport_changed()', assert => {
                // create new Sidebar instance
                helpers.create_sidebar_elem();
                Sidebar.initialize();

                for (let i=0; i<karma_vp_states.length; i++) {
                    helpers.set_vp(karma_vp_states[i]);

                    if (i === 0) {
                        // sidebar is expanded on mobile viewport
                        assert.strictEqual(layout.sidebar.collapsed, false);
                        // element is hidden in mobile dropdown
                        assert.strictEqual(
                            layout.sidebar.elem.css('display'),
                            'none'
                        );
                    } else if (i === 1) {
                        // sidebar is collapsed on small viewport
                        assert.strictEqual(layout.sidebar.collapsed, true);
                        // element is visible
                        assert.strictEqual(
                            layout.sidebar.elem.css('display'),
                            'block'
                        );
                    } else if (i === 2) {
                    } else if (i === 3) {
                        // sidebar is expanded on large viewport
                        assert.strictEqual(layout.sidebar.collapsed, false);
                        // element is visible
                        assert.strictEqual(
                            layout.sidebar.elem.css('display'),
                            'block'
                        );
                    }
                }
            });

            QUnit.test('viewport small', assert => {
                // create new Sidebar instance
                helpers.create_sidebar_elem();
                Sidebar.initialize();

                helpers.set_vp('small');
                // sidebar is collapsed
                assert.strictEqual(layout.sidebar.collapsed, true);
                // elem is visible
                assert.strictEqual(
                    layout.sidebar.elem.css('display'),
                    'block'
                );
            });

            QUnit.test('with cookie', assert => {
                // create new Sidebar instance
                helpers.create_sidebar_elem();
                Sidebar.initialize();

                let state;
                for (let i=0; i<karma_vp_states.length; i++) {
                    if (i === 1) {
                        state = false;
                    } else {
                        state = true;
                    }

                    // create dummy cookie
                    layout.sidebar.cookie = state;

                    helpers.set_vp(karma_vp_states[i]);

                    if (i === 0) {
                        // collapsed state can't change on mobile
                        assert.strictEqual(layout.sidebar.collapsed, false);
                    } else {
                        // collapsed cookie state gets applied
                        assert.strictEqual(layout.sidebar.collapsed, state);
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
                if (layout.mainmenu_sidebar) {
                    layout.mainmenu_sidebar.unload();
                    layout.mainmenu_sidebar = null;
                }
            });

            QUnit.test('assign_state()', assert => {
                Sidebar.initialize();

                // sidebar is expanded on load
                assert.strictEqual(layout.sidebar.collapsed, false);
                assert.ok(layout.sidebar.elem.hasClass('expanded'));
                assert.ok(
                    layout.sidebar.toggle_arrow_elem
                    .hasClass('bi bi-arrow-left-circle')
                );

                // sidebar is collapsed
                layout.sidebar.collapsed = true;
                // invoke assign_state() method
                layout.sidebar.assign_state();
                assert.ok(layout.sidebar.elem.hasClass('collapsed'));
                assert.ok(
                    layout.sidebar.toggle_arrow_elem
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
                // initialize new Sidebar instance
                Sidebar.initialize();

                // sidebar is expanded on load
                assert.strictEqual(layout.sidebar.collapsed, false);

                // trigger click on toggle button
                layout.sidebar.toggle_btn.trigger('click');
                // sidebar is collapsed after click
                assert.strictEqual(layout.sidebar.collapsed, true);

                // trigger click on toggle button
                layout.sidebar.toggle_btn.trigger('click');
                // sidebar is expanded after click
                assert.strictEqual(layout.sidebar.collapsed, false);
            });
        });
    });
});

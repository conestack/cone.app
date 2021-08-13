import $ from 'jquery';
import {Topnav} from '../src/public/topnav.js';
import {
    create_topnav_elem,
    jQuery_slideToggle,
    karma_vp_states,
    set_vp
} from './helpers.js';

///////////////////////////////////////////////////////////////////////////////
// Topnav tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('Topnav', () => {

    QUnit.module('constructor', () => {
        QUnit.module('properties', hooks => {
            let test_topnav;

            hooks.beforeEach(() => {
                // set vp to ensure consistency
                set_vp('large');

                // create topnav DOM element
                create_topnav_elem();

                // append toolbar dropdowns dummy element to DOM
                let tb_dropdown_elem = $(`
                    <div id="toolbar-top">
                      <li class="dropdown">
                      </li>
                    </div>
                `);
                $('#topnav-content').append(tb_dropdown_elem);
            });

            hooks.afterEach(() => {
                // unload and remove instance
                test_topnav = null;
                $('#layout').remove();
            });

            QUnit.test('vp mobile', assert => {
                set_vp('mobile');

                // initialize Topnav instance
                test_topnav = Topnav.initialize();

                // content to dropdown is hidden
                assert.strictEqual(test_topnav.content.css('display'), 'none');
                assert.ok(test_topnav.elem.hasClass('mobile'));
            });

            QUnit.test('vp desktop', assert => {
                // set viewport to desktop
                set_vp('large');

                // initialize Topnav instance
                test_topnav = Topnav.initialize();

                // content to dropdown is visible
                assert.strictEqual(test_topnav.content.css('display'), 'contents');
                assert.notOk(test_topnav.elem.hasClass('mobile'));

                // containing element
                assert.ok(test_topnav.elem.is('#topnav'));

                // content
                assert.ok(test_topnav.content.is('#topnav-content'));

                // toggle button
                assert.ok(test_topnav.toggle_button.is('div#mobile-menu-toggle'));

                // logo
                assert.ok(test_topnav.logo.is('div#cone-logo'));

                // private method toggle_menu_handle exists
                assert.ok(test_topnav._toggle_menu_handle);
            });
        });
    });

    QUnit.module('methods', () => {

        QUnit.module('toggle_menu', hooks => {
            let test_topnav;

            hooks.before(() => {
                // create topnav DOM element
                create_topnav_elem();

                // override jQuery
                jQuery_slideToggle.override();
            });

            hooks.after(() => {
                test_topnav = null;
                // remove topnav element from DOM
                $('#layout').remove();

                // reset jQuery
                jQuery_slideToggle.reset();
            });

            QUnit.test('toggle_menu()', assert => {
                // set viewport state to mobile
                set_vp('mobile');

                // initialize Topnav instance
                test_topnav = Topnav.initialize();

                // TODO:

                assert.ok(test_topnav.elem.hasClass('mobile'));
                // content is hidden
                assert.strictEqual(test_topnav.content.css('display'), 'none');

                // trigger click on toggle button
                test_topnav.toggle_button.trigger('click');

                assert.strictEqual(test_topnav.content.css('display'), 'flex');

                // trigger second click on toggle button
                test_topnav.toggle_button.trigger('click');

                // content is hidden
                assert.strictEqual(test_topnav.content.css('display'), 'none');
            });
        });

        QUnit.module('viewport_changed', hooks => {
            let test_topnav;

            hooks.before(() => {
                // create topnav DOM element
                create_topnav_elem();

                // append dummy toolbar dropdowns to DOM
                let tb_dropdown_elem = $(`
                    <div id="toolbar-top">
                        <li class="dropdown">
                        </li>
                    </div>
                `);
                $('#topnav-content').append(tb_dropdown_elem);
            });

            hooks.after(() => {
                // remove topnav element from DOM
                $('#layout').remove();
                test_topnav = null;
            });

            QUnit.test('viewport_changed()', assert => {
                // initialize instance of Topnav
                test_topnav = Topnav.initialize();

                for (let i=0; i<3; i++) {
                    // set viewport
                    set_vp(karma_vp_states[i]);

                    assert.strictEqual(test_topnav.vp_state, i);

                    if (i === 0) {
                        assert.strictEqual(
                            test_topnav.content.css('display'),
                            'none'
                        );
                        assert.ok(test_topnav.elem.hasClass('mobile'));
                    } else {
                        assert.strictEqual(
                            test_topnav.content.css('display'),
                            'contents'
                        );
                        assert.notOk(test_topnav.elem.hasClass('mobile'));
                    }
                }
            });
        });
    });
});

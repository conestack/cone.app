import $ from 'jquery';
import {Topnav} from '../src/topnav.js';
import * as helpers from './test-helpers.js';
import {karma_vp_states} from './karma_viewport_states.js';

///////////////////////////////////////////////////////////////////////////////
// Topnav tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('Topnav', () => {

    QUnit.module('constructor', () => {
        QUnit.module('properties', hooks => {
            let test_topnav;

            hooks.beforeEach(() => {
                // set vp to ensure consistency
                helpers.set_vp('large');

                // create topnav DOM element
                helpers.create_topnav_elem();

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
                helpers.set_vp('mobile');

                // initialize Topnav instance
                test_topnav = Topnav.initialize();

                // content to dropdown is hidden
                assert.strictEqual(test_topnav.content.css('display'), 'none');
                assert.ok(test_topnav.elem.hasClass('mobile'));

                // show topnav content
                test_topnav.content.show();
                // trigger bootstap dropdown on toolbar dropdown show
                test_topnav.tb_dropdowns.trigger('show.bs.dropdown');
                // topnav content is hidden

                // dropdown is hidden
                assert.strictEqual(test_topnav.content.css('display'), 'none');
            });

            QUnit.test('vp desktop', assert => {
                // set viewport to desktop
                helpers.set_vp('large');

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

                // toolbar dropdowns
                assert.ok(test_topnav.tb_dropdowns.is('#toolbar-top>li.dropdown'));

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
                helpers.create_topnav_elem();
            });

            hooks.after(() => {
                test_topnav = null;
                // remove topnav element from DOM
                $('#layout').remove();
            });

            QUnit.test('toggle_menu()', assert => {
                // set viewport state to mobile
                helpers.set_vp('mobile');

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
                helpers.create_topnav_elem();

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
                    helpers.set_vp(karma_vp_states[i]);

                    // assert click on dropdowns
                    test_topnav.tb_dropdowns.on('click', () => {
                        assert.step('click');
                    });

                    assert.strictEqual(test_topnav.vp_state, i);

                    if (i === 0) {
                        assert.strictEqual(
                            test_topnav.content.css('display'),
                            'none'
                        );
                        assert.ok(test_topnav.elem.hasClass('mobile'));

                        // show content
                        test_topnav.content.show();

                        // trigger dropdown on toolbar dropdowns
                        test_topnav.tb_dropdowns.trigger('show.bs.dropdown');

                        assert.strictEqual(
                            test_topnav.content.css('display'),
                            'none'
                        );
                    } else {
                        assert.strictEqual(
                            test_topnav.content.css('display'),
                            'contents'
                        );
                        assert.notOk(test_topnav.elem.hasClass('mobile'));

                        // trigger dropdown on toolbar dropdowns
                        test_topnav.tb_dropdowns.trigger('show.bs.dropdown');

                        assert.notStrictEqual(
                            test_topnav.content.css('display'),
                            'none'
                        );
                    }
                }
            });
        });

        QUnit.module('pt_handle', hooks =>{
            let test_topnav;

            hooks.before(() => {
                // create dummy topnav
                helpers.create_topnav_elem();

                // create dummy toolbar dropdowns element
                let tb_dropdown_elem = $(`
                    <div id="toolbar-top">
                      <li class="dropdown">
                      </li>
                    </div>
                `);
                // create dummy personaltools element
                let personaltools = $(`
                    <div id="personaltools">
                      <div id="user">
                      </div>
                    </div>
                `);
                // append dummy elements to DOM
                $('#topnav-content').append(tb_dropdown_elem);
                $('#topnav-content').append(personaltools);

                // set viewport to mobile
                helpers.set_vp('mobile');
            });

            hooks.after(() => {
                // unset instance
                test_topnav = null;
                $('#layout').remove();
            });

            QUnit.test('pt_handle()', assert => {
                // initialize Topnav instance
                test_topnav = Topnav.initialize();

                // trigger bootstrap dropdown on personaltools
                test_topnav.pt.trigger('show.bs.dropdown');
                assert.strictEqual(test_topnav.user.css('display'), 'block');

                // trigger bootstrap hide.bs.dropdown
                test_topnav.pt.trigger('hide.bs.dropdown');
                assert.strictEqual(test_topnav.user.css('display'), 'none');

                test_topnav = null;
                
                helpers.set_vp('large');
                // initalize
                test_topnav = Topnav.initialize();

                // trigger bootstrap show.bs.dropdown
                test_topnav.pt.trigger('show.bs.dropdown');
                assert.strictEqual(test_topnav.user.css('display'), 'block');

                // trigger bootstrap hide.bs.dropdown
                test_topnav.pt.trigger('hide.bs.dropdown');
                assert.strictEqual(test_topnav.user.css('display'), 'none');
            });
        });
    });
});

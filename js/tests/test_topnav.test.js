import $ from 'jquery';
import {Topnav} from '../src/topnav.js';
import {ViewPortAware, vp} from '../src/viewport.js';
import * as helpers from './helpers.js';
import { karma_vp_states } from './karma_viewport_states.js';

///////////////////////////////////////////////////////////////////////////////
// Topnav tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('Topnav', hooks => {

    hooks.before(() => {
        console.log('Set up Topnav tests');
    });

    hooks.after(() => {
        console.log('Tear down Topnav tests');
    });

    QUnit.module('constructor', () => {
        QUnit.module('properties', hooks => {
            let test_topnav;

            hooks.beforeEach(() => {
                console.log('Set up Topnav properties tests');

                // set vp to ensure consistency
                viewport.set('large');

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
                console.log('Tear down Topnav properties tests');

                // unload and remove instance
                test_topnav = null;
                $('#topnav').remove();
            });

            QUnit.test.skip('vp mobile', assert => {
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

            QUnit.test.skip('vp desktop', assert => {
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
        let test_topnav;

        QUnit.module('unload', hooks => {
            let toggle_menu_origin = Topnav.prototype.toggle_menu,
                super_unload_origin = ViewPortAware.prototype.unload;

            hooks.before(assert => {
                console.log('Set up Topnav.unload test');

                // set vp to ensure consistency
                viewport.set('large');

                // create topnav DOM element
                helpers.create_topnav_elem();

                // since unload happens in static method, overwrite isntead
                // of creating dummy class
                Topnav.prototype.toggle_menu_origin = function() {
                    assert.step('click');
                }

                // overwrite super.unload()
                ViewPortAware.prototype.unload = function() {
                    assert.step('super.unload()');
                }
            });

            hooks.after(() => {
                console.log('Tear down Topnav.unload test');

                // remove topnav element from DOM
                $('#topnav').remove();

                // reset super.unload()
                ViewPortAware.prototype.unload = super_unload_origin;

                // reset Topnav.toggle_menu
                Topnav.prototype.toggle_menu = toggle_menu_origin;
            });

            QUnit.test.skip('unload()', assert => {
                // initialize instance
                test_topnav = Topnav.initialize();
                
                // unload
                test_topnav.unload();

                // trigger click on button
                test_topnav.toggle_button.trigger('click');

                // super.unload has been called
                assert.verifySteps(['super.unload()']);
            });
        });

        QUnit.module('toggle_menu', hooks => {
            let slide_toggle_origin,
                test_topnav;

            hooks.before(assert => {
                console.log('Set up Topnav.toggle_menu tests');

                // create topnav DOM element
                helpers.create_topnav_elem();

                // save jQuery slideToggle origin
                slide_toggle_origin = $.fn.slideToggle;

                // overwrite jQuery slideToggle function for performance
                $.fn._slideToggle = $.fn.slideToggle;
                $.fn.slideToggle = function(){
                    if (this.css('display') === 'none') {
                        $.fn.show.apply(this);
                    } else {
                        $.fn.hide.apply(this);
                    }
                };
            });

            hooks.after(() => {
                console.log('Tear down Topnav.toggle_menu tests');

                test_topnav = null;
                // remove topnav element from DOM
                $('#topnav').remove();

                // reset jQuery slideToggle function
                $.fn.slideToggle = slide_toggle_origin;
                $.fn._slideToggle = $.fn.slideToggle;
            });

            QUnit.test.only('toggle_menu()', assert => {
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
                console.log('Set up Topnav.viewport_changed tests');

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
                console.log('Tear down Topnav.viewport_changed tests');

                // remove topnav element from DOM
                $('#topnav').remove();
                test_topnav = null;
            });

            QUnit.test.only('viewport_changed()', assert => {
                // initialize instance of Topnav
                test_topnav = Topnav.initialize();

                for (let i=0; i<3; i++) {
                    // set viewport
                    helpers.set_vp(karma_vp_states[i]);

                    // assert click on dropdowns
                    test_topnav.tb_dropdowns.on('click', () => {
                        assert.step('click');
                    });

                    assert.strictEqual(test_topnav.vp_state, vp.state);

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
            let slide_up_origin = $.fn.slideUp,
                test_topnav;

            hooks.before(assert => {
                console.log('Set up Topnav.pt_handle tests');

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

                // overwrite jQuery slideUp function
                $.fn._slideUp = $.fn.slideUp;
                $.fn.slideUp = function(){
                    assert.step('slideUp called');
                    $.fn.hide.apply(this);
                };
            });

            hooks.after(() => {
                console.log('Tear down Topnav.pt_handle tests');

                // reset jQuery slideUp function
                $.fn.slideUp = slide_up_origin;
                $.fn._slideUp = $.fn.slideUp;

                // unset instance
                test_topnav = null;
                $('#topnav').remove();
            });

            QUnit.test.only('pt_handle()', assert => {
                // initialize Topnav instance
                test_topnav = Topnav.initialize();

                // trigger bootstrap dropdown on personaltools
                test_topnav.pt.trigger('show.bs.dropdown');
                assert.strictEqual(test_topnav.user.css('display'), 'block');

                // trigger bootstrap hide.bs.dropdown
                test_topnav.pt.trigger('hide.bs.dropdown');
                assert.strictEqual(test_topnav.user.css('display'), 'none');
                assert.verifySteps(['slideUp called']);

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
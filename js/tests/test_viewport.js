import {
    ViewPort,
    ViewPortAware,
    VP_MOBILE,
    VP_SMALL,
    VP_MEDIUM,
    VP_LARGE
} from '../src/viewport.js';
import {vp_states} from '../src/viewport_states.js';
import {cone} from '../src/globals.wip.js';

///////////////////////////////////////////////////////////////////////////////
// ViewPort tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('ViewPort', hooks => {

    hooks.before(() => {
        console.log('Set up ViewPort tests');

        // set browser viewport
        viewport.set('large');
    });

    hooks.after(() => {
        console.log('Tear down ViewPort tests');
    });

    QUnit.module('constructor', hooks => {
        let TestViewPort,
            test_viewport;

        hooks.before(assert => {
            console.log('Set up ViewPort.constructor tests');

            // dummy class
            TestViewPort = class extends ViewPort {
                update_viewport() {
                    assert.step('update_viewport()');
                }
                resize_handle() {
                    assert.step('resize_handle()');
                }
            }
        });

        hooks.after(() => {
            console.log('Tear down ViewPort.constructor tests');

            // unset viewport
            $(window).off('resize');
            test_viewport = null;
        });

        QUnit.test('properties', assert => {
            // create new instance of viewport
            test_viewport = new TestViewPort();

            // state not set on load
            assert.strictEqual(test_viewport.state, null);

            // queries are set correctly
            assert.strictEqual(
                test_viewport._mobile_query,
                `(max-width:559.9px)`);
            assert.strictEqual(
                test_viewport._small_query,
                `(min-width:560px) and (max-width: 989.9px)`);
            assert.strictEqual(
                test_viewport._medium_query,
                `(min-width:560px) and (max-width: 1200px)`);

            // update_viewport called
            assert.verifySteps(['update_viewport()']);

            // trigger resize evt
            $(window).trigger('resize');

            // resize_handle called
            assert.verifySteps(['resize_handle()']);
        });
    });

    QUnit.module('methods', () => {
        QUnit.module('update_viewport()', hooks => {
            let test_viewport;

            hooks.before(() => {
                console.log('Set up ViewPort methods tests');
                test_viewport = new ViewPort();
            });

            hooks.after(() => {
                $(window).off('resize');
                test_viewport = null;
                console.log('Tear down ViewPort methods tests');
            });

            // run through vp_states array
            for	(let i = 0; i < vp_states.length; i++) {
                QUnit.test(`Viewport ${i}`, assert => {
                    /* set actual viewport (viewport breakpoints are set
                       in karma.conf.js) */
                    viewport.set(vp_states[i]);

                    // trigger resize event
                    $(window).trigger('resize');

                    // assert viewport state
                    assert.strictEqual(test_viewport.state, i);
                });
            }
        });

        QUnit.module('resize_handle()', hooks => {
            let TestViewPort,
                test_viewport;

            hooks.before(assert => {
                console.log('Set up ViewPort.resize_handle tests');

                // dummy class
                TestViewPort = class extends ViewPort {
                    update_viewport() {
                        assert.step('update_viewport()');
                        if (window.matchMedia(this._mobile_query).matches) {
                            this.state = VP_MOBILE;
                        } else if (window.matchMedia(this._small_query).matches) {
                            this.state = VP_SMALL;
                        } else if (window.matchMedia(this._medium_query).matches) {
                            this.state = VP_MEDIUM;
                        } else {
                            this.state = VP_LARGE;
                        }
                    }
                }
                // create instance of ViewPort
                test_viewport = new TestViewPort();

                $(window).on('viewport_changed', () => {
                    assert.step(`viewport_changed`);
                });
            });

            hooks.after(() => {
                console.log('Tear down ViewPort.resize_handle tests');
                $(window).off('viewport_changed')
                $(window).off('resize');
                test_viewport = null;
            });

            QUnit.test('resize_handle', assert => {
                /* NOTE: (viewport breakpoints are set in karma.conf.js) */

                // initial call
                assert.verifySteps(['update_viewport()']);

                for (let i=0; i<vp_states.length; i++) {
                    // set browser viewport
                    viewport.set(vp_states[i]);
                    // trigger resize event
                    $(window).trigger('resize');
                    // assert viewport state
                    assert.strictEqual(test_viewport.state, i);
                    // verify calls
                    assert.verifySteps([
                        'update_viewport()',
                        'viewport_changed'
                    ]);
                }
            });
        });
    });
});

///////////////////////////////////////////////////////////////////////////////
// ViewPortAware tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('ViewPortAware', hooks => {
    let cone_viewport;

    hooks.before(() => {
        // set viewport
        viewport.set('large');
        // create cone viewport object
        cone_viewport = new ViewPort();
        console.log('Set up ViewPortAware tests');
    });

    hooks.after(() => {
        // unset cone viewport object
        cone_viewport = null;
        console.log('Tear down ViewPortAware tests');
    });

    QUnit.module('constructor', hooks => {
        let test_vp_aware;

        hooks.before(() => {
            console.log('Set up ViewPortAware.constructor tests');
        });

        hooks.after(() => {
            // delete instance
            test_vp_aware = null;
            console.log('Tear down ViewPortAware.constructor tests');
        });

        QUnit.test('constructor', assert => {
            // initial construct
            for (let i = 0; i <= 3; i++) {
                // set cone viewport state
                cone.viewportState = i;

                // create instance
                test_vp_aware = new ViewPortAware();

                // assert viewport states
                assert.strictEqual(cone.viewportState, i);
                assert.strictEqual(test_vp_aware.vp_state, cone.viewportState);
            }
        });
    });

    QUnit.module('methods', () => {
        let TestViewPortAware,
            test_vp_aware;

        QUnit.module('unload()', hooks => {
            hooks.before(assert => {
                console.log('Set up ViewPortAware.unload tests');
                // set browser viewport
                viewport.set('large');
                cone.viewportState = 3;

                // dummy class
                TestViewPortAware = class extends ViewPortAware {
                    viewport_changed(e) {
                        this.vp_state = e.state;
                        assert.step('viewport_changed()');
                    }
                }
            });

            hooks.after(() => {
                // delete instance
                test_vp_aware = null;
                console.log('Tear down ViewPortAware.unload tests');
            });

            QUnit.test('unload()', assert => {
                // create instance
                test_vp_aware = new TestViewPortAware();

                // test object viewport state is cone viewport state
                assert.strictEqual(test_vp_aware.vp_state, cone.viewportState);

                // unload test object
                test_vp_aware.unload();

                // change viewport state
                cone.viewportState = 1;
                // fire evt
                $(window).trigger('viewport_changed');

                // test if event listener is unbound
                assert.strictEqual(cone.viewportState, 1);
                assert.notStrictEqual(
                    test_vp_aware.vp_state,
                    cone.viewportState
                );

                // // no steps called if unbound
                assert.verifySteps([]);
            });
        });

        QUnit.test('viewport_changed', assert => {
            // create instance
            test_vp_aware = new ViewPortAware();

            // mock event
            let evt = new $.Event('viewport_changed', {
                'state': 2
            });
            $(window).trigger(evt);

            // assert viewport state of object is the same as event
            assert.strictEqual(test_vp_aware.vp_state, evt.state);

            // unload and delete instance
            test_vp_aware.unload();
            test_vp_aware = null;
        });
    });
});

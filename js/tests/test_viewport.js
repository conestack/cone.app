import {ViewPortAware, vp} from '../src/viewport.js';
import {karma_vp_states} from './karma_viewport_states.js';

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

        hooks.before(() => {
            console.log('Set up ViewPort.constructor tests');
        });

        hooks.after(() => {
            console.log('Tear down ViewPort.constructor tests');
        });

        QUnit.test('properties', assert => {
            // queries are set correctly
            assert.strictEqual(
                vp._mobile_query,
                `(max-width:559.9px)`);
            assert.strictEqual(
                vp._small_query,
                `(min-width:560px) and (max-width: 989.9px)`);
            assert.strictEqual(
                vp._medium_query,
                `(min-width:560px) and (max-width: 1200px)`);
        });
    });

    QUnit.module('methods', () => {
        QUnit.module('update_viewport()', hooks => {
            hooks.before(() => {
                console.log('Set up ViewPort methods tests');
            });

            hooks.after(() => {
                console.log('Tear down ViewPort methods tests');
            });

            // run through karma_vp_states array
            for	(let i = 0; i < karma_vp_states.length; i++) {
                QUnit.test(`Viewport ${i}`, assert => {
                    /* set actual viewport (viewport breakpoints are set
                       in karma.conf.js) */
                    viewport.set(karma_vp_states[i]);

                    // trigger resize event (required)
                    $(window).trigger('resize');

                    // assert viewport state
                    assert.strictEqual(vp.state, i);
                });
            }
        });

        QUnit.module('resize_handle()', hooks => {
            hooks.before(() => {
                console.log('Set up ViewPort.resize_handle tests');
            });

            hooks.after(() => {
                console.log('Tear down ViewPort.resize_handle tests');
            });

            QUnit.test('resize_handle', assert => {
                /* NOTE: (viewport breakpoints are set in karma.conf.js) */

                for (let i=0; i<karma_vp_states.length; i++) {
                    // set browser viewport
                    viewport.set(karma_vp_states[i]);
                    // trigger resize event
                    $(window).trigger('resize');
                    // assert viewport state
                    assert.strictEqual(vp.state, i);
                }
            });
        });
    });
});

///////////////////////////////////////////////////////////////////////////////
// ViewPortAware tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('ViewPortAware', hooks => {

    hooks.before(() => {
        console.log('Set up ViewPortAware tests');
        // set viewport
        viewport.set('large');
    });

    hooks.after(() => {
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
                vp.state = i;

                // create instance
                test_vp_aware = new ViewPortAware();

                // assert viewport states
                assert.strictEqual(vp.state, i);
                assert.strictEqual(test_vp_aware.vp_state, vp.state);
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
                assert.strictEqual(test_vp_aware.vp_state, vp.state);

                // unload test object
                test_vp_aware.unload();

                // change viewport state
                vp.state = 1;
                // fire evt
                $(window).trigger('viewport_changed');

                // test if event listener is unbound
                assert.strictEqual(vp.state, 1);
                assert.notStrictEqual(
                    test_vp_aware.vp_state,
                    vp.state
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

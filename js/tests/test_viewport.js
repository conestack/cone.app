import {
    ViewPortAware,
    vp
} from '../src/viewport.js';
import {
    karma_vp_states,
    set_vp
} from './helpers.js';

QUnit.module('ViewPort', hooks => {

    hooks.before(() => {
        // set browser viewport
        set_vp('large');
    });

    QUnit.module('constructor', () => {

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
        QUnit.module('update_viewport()', () => {

            // run through karma_vp_states array
            for	(let i = 0; i < karma_vp_states.length; i++) {
                QUnit.test(`Viewport ${i}`, assert => {
                    /* set actual viewport (viewport breakpoints are set
                       in karma.conf.js) */
                    set_vp(karma_vp_states[i]);

                    // assert viewport state
                    assert.strictEqual(vp.state, i);
                });
            }
        });

        QUnit.module('resize_handle()', () => {

            QUnit.test('resize_handle', assert => {
                /* NOTE: (viewport breakpoints are set in karma.conf.js) */

                for (let i=0; i<karma_vp_states.length; i++) {
                    // set browser viewport
                    set_vp(karma_vp_states[i]);
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
        // set viewport
        viewport.set('large');
    });

    QUnit.module('constructor', hooks => {
        let test_vp_aware;

        hooks.after(() => {
            // delete instance
            test_vp_aware = null;
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

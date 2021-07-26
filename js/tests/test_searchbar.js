import {Searchbar} from '../src/searchbar.js';
import {ViewPortAware} from '../src/viewport.js';
import {karma_vp_states} from './karma_viewport_states.js';
import * as helpers from './test-helpers.js';

///////////////////////////////////////////////////////////////////////////////
// Searchbar tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('Searchbar', hooks => {

    hooks.before(() => {
        console.log('Set up Searchbar tests');
    });

    hooks.after(() => {
        console.log('Tear down Searchbar tests');
    });

    QUnit.module('constructor', hooks => {
        let sb;

        hooks.beforeEach(() =>{
            // create dummy searchbar element
            helpers.create_searchbar_elem();
            helpers.set_vp('large');
        });

        hooks.afterEach(() => {
            // unset searchbar
            sb = null;
            // remove dummy searchbar from DOM
            $('#layout').remove();
            helpers.set_vp('large');
        });

        for (let i=0; i<karma_vp_states.length; i++) {
            QUnit.test('constructor', assert => {
                // set viewport state
                helpers.set_vp(karma_vp_states[i]);

                // initialize instance
                sb = Searchbar.initialize();

                assert.ok(sb instanceof ViewPortAware);
                assert.strictEqual(sb.vp_state, i);

                switch(i) {
                    case 0:
                        assert.notOk(
                            sb.dd
                            .hasClass('dropdown-menu-end')
                        );
                        assert.ok(
                            sb.search_text
                            .is('#livesearch-group > #livesearch-input')
                        );
                      break;
                    case 1:
                        assert.ok(sb.dd.hasClass('dropdown-menu-end'));
                        assert.ok(
                            sb.search_text
                            .is('#cone-livesearch-dropdown > #livesearch-input')
                        );
                      break;
                    case 2:
                        assert.ok(sb.dd.hasClass('dropdown-menu-end'));
                        assert.ok(
                            sb.search_text
                            .is('#cone-livesearch-dropdown > #livesearch-input')
                        );
                      break;
                    case 3:
                        assert.ok(
                            sb.search_text
                            .is('#livesearch-group > #livesearch-input')
                        );
                        assert.notOk(
                            sb.dd
                            .hasClass('dropdown-menu-end')
                        );
                        assert.strictEqual(
                            $('#cone-livesearch-dropdown > #livesearch-input').length,
                            0
                        );
                      break;
                    default:
                      throw new Error('i is not defined correctly');
                }
            });
        }
    });

    QUnit.module('methods', hooks => {
        hooks.before(() => {
            console.log('Set up Searchbar method tests');
        });

        hooks.after(() => {
            console.log('Tear down Searchbar method tests');
        });

        QUnit.module('vp_changed', hooks => {
            let VPA = ViewPortAware,
                super_vp_changed_origin = VPA.prototype.viewport_changed,
                sb;

            hooks.before(assert => {
                // create dummy searchbar element
                helpers.create_searchbar_elem();

                // overwrite super class method to test for call
                VPA.prototype.viewport_changed = function(e) {
                    this.vp_state = e.state;
                    assert.step('super.viewport_changed()');
                }
            });

            hooks.after(() => {
                // unset searchbar
                sb = null;
                // remove dummy searchbar element from DOM
                $('#cone-searchbar').remove();

                // reset super class method
                VPA.prototype.viewport_changed = super_vp_changed_origin;
            });

            QUnit.test('vp_changed()', assert => {
                // create dummy resize event
                let resize_evt = $.Event('viewport_changed');

                // initialize Searchbar
                sb = Searchbar.initialize();

                for (let i=0; i<karma_vp_states.length; i++) {
                    // set dummy resize event
                    resize_evt.state = i;

                    // invoke viewport_changed method
                    sb.viewport_changed(resize_evt);

                    if (i === 1 || i === 2){
                        assert.ok(
                            sb.dd
                            .hasClass('dropdown-menu-end')
                        );
                        assert.strictEqual(
                            $('#cone-livesearch-dropdown > #livesearch-input').length,
                            1);
                    } else {
                        assert.notOk(
                            sb.dd
                            .hasClass('dropdown-menu-end')
                        );
                        assert.strictEqual(
                            $('#cone-livesearch-dropdown > #livesearch-input').length,
                            0
                        );
                        assert.strictEqual(
                            $('#livesearch-group > #livesearch-input').length,
                            1
                        );
                    }
                    assert.verifySteps(['super.viewport_changed()']);
                }
            });
        });
    });
});

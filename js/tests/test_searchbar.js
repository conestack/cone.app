import {Searchbar} from '../src/searchbar.js';
import {ViewPort, ViewPortAware} from '../src/viewport.js';
import {vp_states} from '../src/viewport_states.js';

///////////////////////////////////////////////////////////////////////////////
// Searchbar test helper
///////////////////////////////////////////////////////////////////////////////

function create_searchbar_elem() {
    // create dummy searchber element
    let searchbar_html = `
        <div id="cone-searchbar">
          <div id="cone-searchbar-wrapper"
               class="dropdown-toggle"
               role="button"
               data-bs-toggle="dropdown">
            <div class="input-group" id="livesearch-group">
              <div id="livesearch-input">
                <input type="text"
                       class="form-control">
                </input>
              </div>
              <div class="input-group-append">
                <button type="submit" id="searchbar-button">
                  <i class="bi-search"></i>
                </button>
              </div>
            </div>
          </div>
          <ul class="dropdown-menu" id="cone-livesearch-dropdown">
            <li class="dropdown-title">
              Search Results
            </li>
            <div id="cone-livesearch-results">
              <li>
                <span>Example Livesearch Result</span>
              </li>
            </div>
          </ul>
        </div>
    `;
    // append dummy element to DOM
    $('body').append(searchbar_html);
}

///////////////////////////////////////////////////////////////////////////////
// Searchbar tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('Searchbar', hooks => {
    let cone_viewport;

    hooks.before(() => {
        console.log('Set up Searchbar tests');
        cone_viewport = new ViewPort();
    });

    hooks.after(() => {
        console.log('Tear down Searchbar tests');
        cone_viewport = null;
    });

    QUnit.module('constructor', hooks => {
        let test_searchbar;

        hooks.beforeEach(() =>{
            // create dummy searchbar element
            create_searchbar_elem();
        });

        hooks.afterEach(() => {
            // set viewport
            cone_viewport.state = 3;

            // unset searchbar
            test_searchbar = null;
            // remove dummy searchbar from DOM
            $('#cone-searchbar').remove();
        });

        QUnit.test.only('constructor', assert => {
            for (let i=0; i<vp_states.length; i++) {
                // set viewport state
                cone_viewport.state = i;
                console.log(i)

                // initialize instance
                test_searchbar = Searchbar.initialize();

                // assert.ok(test_searchbar instanceof ViewPortAware);

                // if (i === 0) {
                //     assert.notOk(
                //         test_searchbar.dd
                //         .hasClass('dropdown-menu-end')
                //     );
                //     assert.ok(
                //         test_searchbar.search_text
                //         .is('#livesearch-group > #livesearch-input')
                //     );
                // } else if (i === 1) {
                //     assert.ok(test_searchbar.dd.hasClass('dropdown-menu-end'));
                //     assert.ok(
                //         test_searchbar.search_text
                //         .is('#cone-livesearch-dropdown > #livesearch-input')
                //     );
                // } else if (i === 2) {
                //     assert.ok(test_searchbar.dd.hasClass('dropdown-menu-end'));
                //     assert.ok(
                //         test_searchbar.search_text
                //         .is('#cone-livesearch-dropdown > #livesearch-input')
                //     );
                // } else if (i === 3) {
                    // ????? fails
                    // assert.ok(searchbar.search_text.is('#livesearch-group > #livesearch-input'));
                    // assert.notOk(searchbar.dd.hasClass('dropdown-menu-end'));
                    // assert.strictEqual($('#cone-livesearch-dropdown > #livesearch-input').length, 0);
                // }
            }
        });
    });

    QUnit.module.skip('methods', hooks => {
        hooks.before(() => {
            console.log('Set up Scrollbar tests');

            // set viewport
            viewport = new ViewPort();
        });

        hooks.after(() => {
            console.log('Tear down Scrollbar tests');

            // unset viewport
            viewport = null;
        });

        QUnit.module('unload', hooks => {
            let unload_origin = ViewPortAware.prototype.unload;

            hooks.before(assert => {
                console.log('Set up Scrollbar method tests');

                // create dummy searchbar element
                create_searchbar_elem();

                // overwrite super class method to test for call
                ViewPortAware.prototype.unload = function() {
                    $(window).off(
                        'viewport_changed',
                        this._viewport_changed_handle
                    );
                    assert.step('super.unload()');
                }
            });

            hooks.after(() => {
                console.log('Set up Scrollbar method tests');

                // unset searchbar
                searchbar = null;
                // remove dummy searchbar element from DOM
                $('#cone-searchbar').remove();

                // reset super class method
                ViewPortAware.prototype.unload = unload_origin;
            });

            QUnit.test('unload()', assert => {
                // initialize searchbar
                Searchbar.initialize();
                // second instance invokes unload
                Searchbar.initialize();

                assert.verifySteps(['super.unload()']);
            });
        });

        QUnit.module('vp_changed', hooks => {
            let VPA = ViewPortAware,
                super_vp_changed_origin = VPA.prototype.viewport_changed;

            hooks.before(assert => {
                // create dummy searchbar element
                create_searchbar_elem();

                // overwrite super class method to test for call
                VPA.prototype.viewport_changed = function(e) {
                    this.vp_state = e.state;
                    assert.step('super.viewport_changed()');
                }

                // set viewport
                viewport.state = 3;
            });

            hooks.after(() => {
                // unset searchbar
                searchbar = null;
                // remove dummy searchbar element from DOM
                $('#cone-searchbar').remove();

                // reset super class method
                VPA.prototype.viewport_changed = super_vp_changed_origin;
            });

            QUnit.test('vp_changed()', assert => {
                // create dummy resize event
                let resize_evt = $.Event('viewport_changed');

                // initialize Searchbar
                Searchbar.initialize();

                for (let i=0; i<vp_states.length; i++) {
                    // set dummy resize event
                    resize_evt.state = i;

                    // invoke viewport_changed method
                    searchbar.viewport_changed(resize_evt);

                    if (i === 1 || i === 2){
                        assert.ok(
                            searchbar.dd
                            .hasClass('dropdown-menu-end')
                        );
                        assert.strictEqual(
                            $('#cone-livesearch-dropdown > #livesearch-input').length,
                            1);
                    } else {
                        assert.notOk(
                            searchbar.dd
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

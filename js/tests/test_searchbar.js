import {Searchbar} from '../src/searchbar.js';
import {ViewPortAware} from '../src/viewport.js';
import {vp_states} from '../src/viewport_states.js';
import {cone} from '../src/globals.wip.js';

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
    // let cone_viewport;

    hooks.before(() => {
        console.log('Set up Searchbar tests');
        // cone_viewport = new ViewPort();
    });

    hooks.after(() => {
        console.log('Tear down Searchbar tests');
        // cone_viewport = null;
    });

    QUnit.module('constructor', hooks => {
        let test_searchbar;

        hooks.beforeEach(() =>{
            // create dummy searchbar element
            create_searchbar_elem();
        });

        hooks.afterEach(() => {
            // set viewport state
            cone.viewportState = 3;

            // unset searchbar
            test_searchbar = null;
            // remove dummy searchbar from DOM
            $('#cone-searchbar').remove();
        });

        for (let i=0; i<vp_states.length; i++) {
            QUnit.test.only('constructor', assert => {
                // set viewport state
                cone.viewportState = i;

                // initialize instance
                test_searchbar = Searchbar.initialize();
                // console.log(test_searchbar.vp_state);

                assert.ok(test_searchbar instanceof ViewPortAware);
                assert.strictEqual(test_searchbar.vp_state, cone.viewportState);

                switch(i) {
                    case 0:
                        assert.notOk(
                            test_searchbar.dd
                            .hasClass('dropdown-menu-end')
                        );
                        assert.ok(
                            test_searchbar.search_text
                            .is('#livesearch-group > #livesearch-input')
                        );
                      break;
                    case 1:
                        assert.ok(test_searchbar.dd.hasClass('dropdown-menu-end'));
                        assert.ok(
                            test_searchbar.search_text
                            .is('#cone-livesearch-dropdown > #livesearch-input')
                        );
                      break;
                    case 2:
                        assert.ok(test_searchbar.dd.hasClass('dropdown-menu-end'));
                        assert.ok(
                            test_searchbar.search_text
                            .is('#cone-livesearch-dropdown > #livesearch-input')
                        );
                      break;
                    case 3:
                        assert.ok(
                            test_searchbar.search_text
                            .is('#livesearch-group > #livesearch-input')
                        );
                        assert.notOk(
                            test_searchbar.dd
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

            // set viewport state
            cone.viewportState = 3;
        });

        hooks.after(() => {
            console.log('Tear down Searchbar method tests');

            // unset viewport state
            cone.viewportState = null;
        });

        QUnit.module('vp_changed', hooks => {
            let VPA = ViewPortAware,
                super_vp_changed_origin = VPA.prototype.viewport_changed,
                test_searchbar;

            hooks.before(assert => {
                // create dummy searchbar element
                create_searchbar_elem();

                // overwrite super class method to test for call
                VPA.prototype.viewport_changed = function(e) {
                    this.vp_state = e.state;
                    assert.step('super.viewport_changed()');
                }

                // set viewport state
                cone.viewportState = 3;
            });

            hooks.after(() => {
                // unset searchbar
                test_searchbar = null;
                // remove dummy searchbar element from DOM
                $('#cone-searchbar').remove();

                // reset super class method
                VPA.prototype.viewport_changed = super_vp_changed_origin;
            });

            QUnit.test.only('vp_changed()', assert => {
                // create dummy resize event
                let resize_evt = $.Event('viewport_changed');

                // initialize Searchbar
                test_searchbar = Searchbar.initialize();

                for (let i=0; i<vp_states.length; i++) {
                    // set dummy resize event
                    resize_evt.state = i;

                    // invoke viewport_changed method
                    test_searchbar.viewport_changed(resize_evt);

                    if (i === 1 || i === 2){
                        assert.ok(
                            test_searchbar.dd
                            .hasClass('dropdown-menu-end')
                        );
                        assert.strictEqual(
                            $('#cone-livesearch-dropdown > #livesearch-input').length,
                            1);
                    } else {
                        assert.notOk(
                            test_searchbar.dd
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

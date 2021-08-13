import {Searchbar} from '../src/searchbar.js';
import {ViewPortAware} from '../src/viewport.js';
import {
    create_layout_elem,
    create_pt_elem,
    create_searchbar_elem,
    create_topnav_elem,
    karma_vp_states,
    set_vp
} from './helpers.js';

QUnit.module('server request', hooks => {
    let ajax_orgin = $.ajax;

    hooks.after(() => {
        // Reset $.ajax patch if any
        $.ajax = ajax_orgin;

        $('#topnav').remove();
    });

    QUnit.test('Test Ajax', assert => {
        // create dummy element
        create_topnav_elem();
        let elem = create_searchbar_elem($('#topnav'));

        // patch ajax
        let response_data;
        $.ajax = function(opts) {
            opts.success(response_data, '200', {});
        };

        // create mock json
        response_data = [{
            "icon":"bi bi-circle",
            "value":"Example result 1",
            "target":"example-link1"
        }, {
            "icon":"bi bi-asterisk",
            "value":"Example result 2",
            "target":"example-link2"
        }];

        // create Searchbar obj
        let sb = new Searchbar($('body'));

        // trigger click to open dropdown
        sb.search_text.trigger('click');
        sb.dd.trigger('click');
        sb.search_text.trigger('keydown');

        sb.search_text.attr('value', '');

        // keypress helper
        function pressKey(code, key) {
            let e = $.Event('keypress');
            let e2 = $.Event('keyup');
            let e3 = $.Event('keydown');

            e3.key, e2.key, e.key = code;
            sb.search_text.trigger(e3).trigger(e).trigger(e2);
            let val = sb.search_text.attr('value');

            if(code === 'Backspace') {
                let res = '';
                for (let i = 0; i < val.length - 1; i++) {
                    res += val.charAt(i);
                }
                sb.search_text.attr('value', res);
            } else {
                sb.search_text.attr('value', `${val}${key}`);
            }
        }

        // input helper
        function addInput(str) {
            for (let i = 0; i < str.length; i++) {
                let letter = str.charAt(i);

                let e = $.Event('keypress');
                let e2 = $.Event('keyup');
                let e3 = $.Event('keydown');

                e3.key, e2.key, e.key = letter;
                sb.search_text.trigger(e3).trigger(e).trigger(e2);

                let val = sb.search_text.attr('value');
                sb.search_text.attr('value', `${val}${letter}`);
            }
        }

        // can change to any string
        // 3+ letters send ajax request
        addInput('Foo');

        // timeout after last input - code executed after 800ms
        let done = assert.async();
        setTimeout(() => {
            // loading animation not visible
            assert.strictEqual($('.loading-dots').css('display'), 'none');

            // two result elements have been created
            assert.strictEqual($('li.search-result').length, 2);

            let res1 = $('li.search-result')[0],
            res2 = $('li.search-result')[1];

            assert.strictEqual($('a > span', res1).attr('class'), 'bi bi-circle');
            assert.strictEqual($('a > span', res1).html(), 'Example result 1');
            assert.strictEqual($('a', res1).attr('href'), 'example-link1');

            assert.strictEqual($('a > span', res2).attr('class'), 'bi bi-asterisk');
            assert.strictEqual($('a > span', res2).html(), 'Example result 2');
            assert.strictEqual($('a', res2).attr('href'), 'example-link2');

            done();
        }, 1000);

        // trigger backspace to delete 1 character
        pressKey('Backspace');
        // no ajax request if under 3 characters
        assert.strictEqual(sb.search_text.attr('value'), 'Fo');

        // loading animation showing
        assert.strictEqual($('.loading-dots').css('display'), 'block');
        // results removed
        assert.strictEqual( $('li.search-result').length, 0);
    });
});

QUnit.test.skip('test sb visual', assert => {
    // TEMP:
    // to develop livesearch functions

    assert.ok(true);

    create_layout_elem();
    create_topnav_elem();
    create_pt_elem();
    create_searchbar_elem('#topnav');

    let sb = Searchbar.initialize();
});


QUnit.module('Searchbar', () => {

    QUnit.module('constructor', hooks => {
        let sb;

        hooks.beforeEach(() =>{
            // create dummy searchbar element
            create_searchbar_elem($('body'));
            set_vp('large');
        });

        hooks.afterEach(() => {
            // unset searchbar
            sb = null;
            // remove dummy searchbar from DOM
            $('#cone-searchbar').remove();
            set_vp('large');
        });

        for (let i=0; i<karma_vp_states.length; i++) {
            QUnit.test('constructor', assert => {

                // set viewport state
                set_vp(karma_vp_states[i]);

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

    QUnit.module('methods', () => {

        QUnit.module('vp_changed', hooks => {
            let VPA = ViewPortAware,
                super_vp_changed_origin = VPA.prototype.viewport_changed,
                sb;

            hooks.before(assert => {
                // create dummy searchbar element
                create_searchbar_elem($('body'));

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
                assert.ok(true)
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

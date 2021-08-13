import $ from 'jquery';
import {toggle_arrow} from '../src/utils.js'

QUnit.test('toggle_arrow', assert => {
    // set variables
    let up = 'bi-chevron-up',
        down = 'bi-chevron-down',
        arrow_up = $(`<i class="dropdown-arrow ${up}" />`),
        arrow_down = $(`<i class="dropdown-arrow ${down}" />`);

    // toggle arrow from up to down
    toggle_arrow(arrow_up);
    assert.strictEqual(arrow_up.attr('class'), `dropdown-arrow ${down}`);
    // toggle arrow from down to up
    toggle_arrow(arrow_down);
    assert.strictEqual(arrow_down.attr('class'), `dropdown-arrow ${up}`);
});

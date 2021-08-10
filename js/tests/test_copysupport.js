import $ from 'jquery';
import {CopySupport} from '../src/protected/copysupport.js';

QUnit.test('test', assert => {
    assert.ok(true);

    let cs = new CopySupport();
    cs.on_firstclick();
})
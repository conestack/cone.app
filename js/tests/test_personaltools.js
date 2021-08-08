import $ from 'jquery';
import {layout} from '../src/public/layout.js';
import {Personaltools} from '../src/public/personaltools.js';
import {Topnav} from '../src/public/topnav.js';
import * as helpers from './helpers.js';

QUnit.module('personaltools', hooks => {

    hooks.before(() => {
        helpers.create_layout_elem();
        helpers.create_topnav_elem();
        helpers.create_pt_elem();
    });

    hooks.after(() => {
        $('#layout').remove();
    });

    QUnit.test('viewport_changed()', assert => {
        // initialize Topnav instance
        Topnav.initialize();
        Personaltools.initialize();

        helpers.set_vp('mobile');

        // trigger bootstrap dropdown on personaltools
        layout.personaltools.elem.trigger('show.bs.dropdown');
        assert.strictEqual(layout.personaltools.user_menu.css('display'), 'block');

        // trigger bootstrap hide.bs.dropdown
        layout.personaltools.elem.trigger('hide.bs.dropdown');
        assert.strictEqual(layout.personaltools.user_menu.css('display'), 'none');

        helpers.set_vp('large');

        // trigger bootstrap show.bs.dropdown
        layout.personaltools.elem.trigger('show.bs.dropdown');
        assert.strictEqual(layout.personaltools.user_menu.css('display'), 'block');

        // trigger bootstrap hide.bs.dropdown
        layout.personaltools.elem.trigger('hide.bs.dropdown');
        assert.strictEqual(layout.personaltools.user_menu.css('display'), 'none');
    });
});

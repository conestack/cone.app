import $ from 'jquery';
import {layout} from '../src/layout.js';
import {Personaltools} from '../src/personaltools.js';
import {Topnav} from '../src/topnav.js';
import {
    create_layout_elem,
    create_pt_elem,
    create_topnav_elem,
    jQuery_slideUp,
    set_vp
} from './helpers.js';

QUnit.module('personaltools', hooks => {

    hooks.before(() => {
        create_layout_elem();
        create_topnav_elem();
        create_pt_elem();
        jQuery_slideUp.override();
    });

    hooks.after(() => {
        jQuery_slideUp.reset();
        $('#layout').remove();
    });

    QUnit.test('viewport_changed()', assert => {
        // initialize Topnav instance
        Topnav.initialize();
        Personaltools.initialize();

        set_vp('mobile');

        // trigger bootstrap dropdown on personaltools
        layout.personaltools.elem.trigger('show.bs.dropdown');
        assert.strictEqual(layout.personaltools.user_menu.css('display'), 'block');

        // trigger bootstrap hide.bs.dropdown
        layout.personaltools.elem.trigger('hide.bs.dropdown');
        assert.strictEqual(layout.personaltools.user_menu.css('display'), 'none');

        set_vp('large');

        // trigger bootstrap show.bs.dropdown
        layout.personaltools.elem.trigger('show.bs.dropdown');
        assert.strictEqual(layout.personaltools.user_menu.css('display'), 'block');

        // trigger bootstrap hide.bs.dropdown
        layout.personaltools.elem.trigger('hide.bs.dropdown');
        assert.strictEqual(layout.personaltools.user_menu.css('display'), 'none');
    });
});

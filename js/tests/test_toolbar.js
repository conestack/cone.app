import $ from 'jquery';
import {layout} from '../src/public/layout.js';
import {Toolbar} from '../src/public/toolbar.js';
import {Topnav} from '../src/public/topnav.js';
import * as helpers from './helpers.js';

QUnit.module('toolbar', hooks => {
    hooks.beforeEach(() => {
        helpers.create_layout_elem();
        helpers.create_topnav_elem();
        helpers.create_toolbar_elem();
    });
    hooks.afterEach(() => {
        $('#layout').remove();
    });

    QUnit.test('viewport_changed()', assert => {
        // initialize
        Topnav.initialize();
        Toolbar.initialize();

        // set viewport mobile
        helpers.set_vp('mobile');

        // toggle mobile menu
        layout.topnav.toggle_button.trigger('click');
        assert.strictEqual(layout.topnav.content.css('display'), 'flex');
        // trigger bootstrap dropdown
        layout.toolbar.dropdowns.trigger('show.bs.dropdown');
        assert.strictEqual(layout.topnav.content.css('display'), 'none');

        // set viewport desktop
        helpers.set_vp('large');

        assert.strictEqual(layout.topnav.content.css('display'), 'contents');
        // trigger bootstrap dropdown
        layout.toolbar.dropdowns.trigger('show.bs.dropdown');
        assert.strictEqual(layout.topnav.content.css('display'), 'contents');
    });

    QUnit.test('mark_as_read', assert => {
        // initialize
        Topnav.initialize();
        Toolbar.initialize();

        assert.ok($('li.notification.unread').length > 0);
        $('#noti_mark_read').trigger('click');
        assert.strictEqual($('li.notification.unread').length, 0);
    });

    QUnit.test('handle_dropdown', assert => {
        // initialize
        Topnav.initialize();
        Toolbar.initialize();

        $('#notifications > i').trigger('click');
        assert.strictEqual($('#notifications > ul').css('display'), 'flex');

        $('#notifications > i').trigger('click');
        assert.strictEqual($('#notifications > ul').css('display'), 'none');
    });
});

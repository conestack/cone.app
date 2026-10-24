import $ from 'jquery';
import ts from 'treibstoff';
import {CopySupport} from '../src/copysupport.js';
import {keys} from '../src/keybinder.js';
// Import selectable to register $.fn.selectable jQuery plugin
import '../src/selectable.js';

QUnit.module('cone.app.copysupport', hooks => {

    let container,
        create_cookie_origin,
        read_cookie_origin,
        ajax_action_origin,
        ajax_parse_target_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        create_cookie_origin = ts.create_cookie;
        read_cookie_origin = ts.read_cookie;
        ajax_action_origin = ts.ajax.action;
        ajax_parse_target_origin = ts.ajax.parse_target;

        // Reset key state
        keys.shift_down = false;
        keys.ctrl_down = false;
    });

    hooks.afterEach(() => {
        container.remove();
        ts.create_cookie = create_cookie_origin;
        ts.read_cookie = read_cookie_origin;
        ts.ajax.action = ajax_action_origin;
        ts.ajax.parse_target = ajax_parse_target_origin;
        keys.shift_down = false;
        keys.ctrl_down = false;
    });

    function create_copysupport_fixture() {
        return $(`
            <div>
                <a id="toolbaraction-cut" href="#">Cut</a>
                <a id="toolbaraction-copy" href="#">Copy</a>
                <a id="toolbaraction-paste" href="#" class="disabled"
                   ajax:target="/api/paste">Paste</a>
                <table>
                    <tr class="selectable copysupportitem" ajax:target="/item1">
                        <td>Item 1</td>
                    </tr>
                    <tr class="selectable copysupportitem" ajax:target="/item2">
                        <td>Item 2</td>
                    </tr>
                    <tr class="selectable copysupportitem" ajax:target="/item3">
                        <td>Item 3</td>
                    </tr>
                </table>
            </div>
        `).appendTo(container);
    }

    QUnit.test('CopySupport.initialize creates instance', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };

        CopySupport.initialize(container);

        let paste_btn = container.find('#toolbaraction-paste');
        let events = $._data(paste_btn.get(0), 'events');
        assert.ok(events && events.click, 'paste click handler bound');
    });

    QUnit.test('CopySupport constructor sets up cookie names', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };

        let copysupport = new CopySupport(container);

        assert.strictEqual(copysupport.cut_cookie, 'cone.app.copysupport.cut',
            'cut cookie name set');
        assert.strictEqual(copysupport.copy_cookie, 'cone.app.copysupport.copy',
            'copy cookie name set');
    });

    QUnit.test('CopySupport binds selectable to copyable rows', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };

        let copysupport = new CopySupport(container);

        assert.ok(copysupport.selectable, 'selectable instance created');
        assert.strictEqual(copysupport.copyable.length, 3, 'three copyable items');
    });

    QUnit.test('CopySupport reads cut selection from cookie', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function(name) {
            if (name === 'cone.app.copysupport.cut') {
                return '/item1::/item2';
            }
            return null;
        };

        let copysupport = new CopySupport(container);

        let selected = container.find('.selected');
        assert.strictEqual(selected.length, 2, 'two items selected from cookie');
        assert.true(selected.eq(0).hasClass('copysupport_cut'),
            'cut class applied');
    });

    QUnit.test('CopySupport reads copy selection from cookie', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function(name) {
            if (name === 'cone.app.copysupport.copy') {
                return '/item3';
            }
            return null;
        };

        let copysupport = new CopySupport(container);

        let selected = container.find('.selected');
        assert.strictEqual(selected.length, 1, 'one item selected from cookie');
        assert.false(selected.hasClass('copysupport_cut'),
            'cut class not applied for copy');
    });

    QUnit.test('CopySupport write_selected_to_cookie creates cookie', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };

        let cookie_value = null;
        ts.create_cookie = function(name, value) {
            if (name === 'test_cookie') {
                cookie_value = value;
            }
        };

        let copysupport = new CopySupport(container);
        copysupport.selectable.add(container.find('tr').get(0));
        copysupport.selectable.add(container.find('tr').get(1));
        copysupport.write_selected_to_cookie('test_cookie');

        assert.strictEqual(cookie_value, '/item1::/item2',
            'cookie contains selected targets');
    });

    QUnit.test('CopySupport write_selected_to_cookie enables paste', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };
        ts.create_cookie = function() {};

        let copysupport = new CopySupport(container);
        copysupport.selectable.add(container.find('tr').get(0));
        copysupport.write_selected_to_cookie('test');

        assert.false(copysupport.paste_action.hasClass('disabled'),
            'paste enabled when items selected');
    });

    QUnit.test('CopySupport write_selected_to_cookie disables paste when empty',
        assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };
        ts.create_cookie = function() {};

        let copysupport = new CopySupport(container);
        copysupport.paste_action.removeClass('disabled');
        copysupport.write_selected_to_cookie('test');

        assert.true(copysupport.paste_action.hasClass('disabled'),
            'paste disabled when no items selected');
    });

    QUnit.test('CopySupport handle_cut writes to cut cookie', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };

        let cookies = {};
        ts.create_cookie = function(name, value) {
            cookies[name] = value;
        };

        let copysupport = new CopySupport(container);
        container.find('tr').eq(0).addClass('selected');
        copysupport.selectable.add(container.find('tr').get(0));

        let evt = new $.Event('click');
        copysupport.handle_cut(evt);

        assert.ok(cookies['cone.app.copysupport.cut'], 'cut cookie written');
        assert.strictEqual(cookies['cone.app.copysupport.copy'], '',
            'copy cookie cleared');
        assert.true(container.find('tr').eq(0).hasClass('copysupport_cut'),
            'cut class added to selected');
    });

    QUnit.test('CopySupport handle_copy writes to copy cookie', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };

        let cookies = {};
        ts.create_cookie = function(name, value) {
            cookies[name] = value;
        };

        let copysupport = new CopySupport(container);
        container.find('tr').eq(1).addClass('selected');
        copysupport.selectable.add(container.find('tr').get(1));

        let evt = new $.Event('click');
        copysupport.handle_copy(evt);

        assert.ok(cookies['cone.app.copysupport.copy'], 'copy cookie written');
        assert.strictEqual(cookies['cone.app.copysupport.cut'], '',
            'cut cookie cleared');
    });

    QUnit.test('CopySupport handle_copy removes cut class', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };
        ts.create_cookie = function() {};

        let copysupport = new CopySupport(container);
        container.find('tr').addClass('copysupport_cut');

        let evt = new $.Event('click');
        copysupport.handle_copy(evt);

        assert.false(container.find('tr').hasClass('copysupport_cut'),
            'cut class removed');
    });

    QUnit.test('CopySupport handle_paste triggers ajax action', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };

        ts.ajax.parse_target = function(target) {
            return {url: '/api/paste', params: {}};
        };

        let action_opts = null;
        ts.ajax.action = function(opts) {
            action_opts = opts;
        };

        let copysupport = new CopySupport(container);
        copysupport.paste_action.removeClass('disabled');

        let evt = new $.Event('click');
        evt.currentTarget = copysupport.paste_action.get(0);
        copysupport.handle_paste(evt);

        assert.strictEqual(action_opts.name, 'paste', 'paste action triggered');
        assert.strictEqual(action_opts.mode, 'NONE', 'mode is NONE');
        assert.strictEqual(action_opts.url, '/api/paste', 'correct url');
    });

    QUnit.test('CopySupport handle_paste ignores when disabled', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };

        let action_called = false;
        ts.ajax.action = function() {
            action_called = true;
        };

        let copysupport = new CopySupport(container);

        let evt = new $.Event('click');
        evt.currentTarget = copysupport.paste_action.get(0);
        copysupport.handle_paste(evt);

        assert.false(action_called, 'action not called when disabled');
    });

    QUnit.test('CopySupport handle_paste prevents default', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };
        ts.ajax.action = function() {};
        ts.ajax.parse_target = function() { return {url: '', params: {}}; };

        let copysupport = new CopySupport(container);

        let evt = new $.Event('click');
        evt.currentTarget = copysupport.paste_action.get(0);
        copysupport.handle_paste(evt);

        assert.true(evt.isDefaultPrevented(), 'default prevented');
    });

    QUnit.test('CopySupport without copyable items still handles paste', assert => {
        $(`
            <div>
                <a id="toolbaraction-paste" href="#" ajax:target="/api/paste">
                    Paste
                </a>
            </div>
        `).appendTo(container);

        ts.read_cookie = function() { return null; };

        let copysupport = new CopySupport(container);

        assert.ok(copysupport.paste_action.length, 'paste action found');
        assert.notOk(copysupport.selectable, 'no selectable without copyable');
    });

    QUnit.test('CopySupport click event bindings use off/on pattern', assert => {
        create_copysupport_fixture();
        ts.read_cookie = function() { return null; };

        let action_count = 0;
        ts.ajax.action = function() { action_count++; };
        ts.ajax.parse_target = function() { return {url: '', params: {}}; };

        // Initialize twice
        new CopySupport(container);
        new CopySupport(container);

        let paste_btn = container.find('#toolbaraction-paste');
        paste_btn.removeClass('disabled');

        let evt = new $.Event('click');
        evt.currentTarget = paste_btn.get(0);
        paste_btn.trigger(evt);

        assert.strictEqual(action_count, 1, 'handler fires only once');
    });
});

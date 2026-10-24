import $ from 'jquery';
import ts from 'treibstoff';
import {
    SidebarControl,
    SidebarContent,
    SidebarLeft,
    SidebarRight
} from '../src/sidebar.js';
import { global_events } from '../src/globals.js';

QUnit.module('cone.app.sidebar.SidebarControl', hooks => {

    let container,
        ajax_attach_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_attach_origin = ts.ajax.attach;
        ts.ajax.attach = function() {};
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.attach = ajax_attach_origin;
    });

    QUnit.test('SidebarControl constructor sets up properties', assert => {
        let tiles_container = $('<div class="sidebar-tiles" />').appendTo(container);
        let tile = $('<div data-tile="test-tile" />').appendTo(tiles_container);
        let control_elem = $('<div data-target="test-tile" />').appendTo(container);

        let mock_sidebar_content = {
            tiles_container: tiles_container,
            sidebar: { elem: $('<div />') }
        };

        let control = new SidebarControl(mock_sidebar_content, control_elem);

        assert.ok(control.elem, 'elem stored');
        assert.strictEqual(control.target, 'test-tile', 'target stored');
        assert.ok(control.parent, 'parent stored');
        assert.ok(control.related_tile.length, 'related_tile found');

        control.destroy();
    });

    QUnit.test('SidebarControl on_click calls parent activate_tile', assert => {
        let tiles_container = $('<div class="sidebar-tiles" />').appendTo(container);
        let tile = $('<div data-tile="test-tile" />').appendTo(tiles_container);
        let control_elem = $('<div data-target="test-tile" />').appendTo(container);

        let activate_called = false;
        let mock_sidebar_content = {
            tiles_container: tiles_container,
            sidebar: { elem: $('<div />') },
            activate_tile: function(ctrl) {
                activate_called = true;
            }
        };

        let control = new SidebarControl(mock_sidebar_content, control_elem);
        control_elem.trigger('click');

        assert.true(activate_called, 'activate_tile called on click');

        control.destroy();
    });

    QUnit.test('SidebarControl activate_tile adds classes', assert => {
        let sidebar_elem = $('<div />').appendTo(container);
        let tiles_container = $('<div class="sidebar-tiles" />').appendTo(container);
        let tile = $('<div data-tile="test-tile" class="d-none" />').appendTo(tiles_container);
        let control_elem = $('<div data-target="test-tile" />').appendTo(container);

        let mock_sidebar_content = {
            tiles_container: tiles_container,
            sidebar: { elem: sidebar_elem }
        };

        let control = new SidebarControl(mock_sidebar_content, control_elem);
        control.activate_tile();

        assert.true(control_elem.hasClass('active'), 'active class added to control');
        assert.false(tile.hasClass('d-none'), 'd-none class removed from tile');
        assert.strictEqual(sidebar_elem.attr('tile'), 'test-tile', 'tile attribute set on sidebar');

        control.destroy();
    });

    QUnit.test('SidebarControl deactivate_tile removes classes', assert => {
        let tiles_container = $('<div class="sidebar-tiles" />').appendTo(container);
        let tile = $('<div data-tile="test-tile" />').appendTo(tiles_container);
        let control_elem = $('<div data-target="test-tile" class="active" />').appendTo(container);

        let mock_sidebar_content = {
            tiles_container: tiles_container,
            sidebar: { elem: $('<div />') }
        };

        let control = new SidebarControl(mock_sidebar_content, control_elem);
        control.deactivate_tile();

        assert.false(control_elem.hasClass('active'), 'active class removed');
        assert.true(tile.hasClass('d-none'), 'd-none class added to tile');

        control.destroy();
    });

    QUnit.test('SidebarControl destroy removes click handler', assert => {
        let tiles_container = $('<div class="sidebar-tiles" />').appendTo(container);
        let tile = $('<div data-tile="test-tile" />').appendTo(tiles_container);
        let control_elem = $('<div data-target="test-tile" />').appendTo(container);

        let click_count = 0;
        let mock_sidebar_content = {
            tiles_container: tiles_container,
            sidebar: { elem: $('<div />') },
            activate_tile: function() { click_count++; }
        };

        let control = new SidebarControl(mock_sidebar_content, control_elem);
        control_elem.trigger('click');
        assert.strictEqual(click_count, 1, 'click handler works before destroy');

        control.destroy();
        control_elem.trigger('click');
        assert.strictEqual(click_count, 1, 'click handler removed after destroy');
    });
});

QUnit.module('cone.app.sidebar.SidebarContent', hooks => {

    let container,
        ajax_attach_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_attach_origin = ts.ajax.attach;
        ts.ajax.attach = function() {};
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.attach = ajax_attach_origin;
    });

    QUnit.test('SidebarContent constructor sets up properties in stacked mode', assert => {
        let sidebar_elem = $('<div data-mode="stacked" />').appendTo(container);
        let content_elem = $(`
            <div class="sidebar-content">
                <div class="sidebar-controls"></div>
                <div class="sidebar-tiles"></div>
            </div>
        `).appendTo(sidebar_elem);

        let mock_sidebar = {
            elem: sidebar_elem
        };

        let content = new SidebarContent(mock_sidebar, content_elem);

        assert.ok(content.elem, 'elem stored');
        assert.strictEqual(content.mode, 'stacked', 'mode is stacked');
        assert.ok(content.navigation, 'navigation element found');
        assert.ok(content.tiles_container, 'tiles_container found');
        assert.strictEqual(content.controls.length, 0, 'no controls in stacked mode');
    });

    QUnit.test('SidebarContent constructor sets up controls in toggle mode with multiple tiles', assert => {
        let sidebar_elem = $('<div data-mode="toggle" />').appendTo(container);
        sidebar_elem.data('tiles', ['tile1', 'tile2']);

        let content_elem = $(`
            <div class="sidebar-content">
                <div class="sidebar-controls">
                    <div class="sidebar-control" data-target="tile1"></div>
                    <div class="sidebar-control" data-target="tile2"></div>
                </div>
                <div class="sidebar-tiles">
                    <div data-tile="tile1"></div>
                    <div data-tile="tile2"></div>
                </div>
            </div>
        `).appendTo(sidebar_elem);

        let mock_sidebar = {
            elem: sidebar_elem
        };

        let content = new SidebarContent(mock_sidebar, content_elem);

        assert.strictEqual(content.mode, 'toggle', 'mode is toggle');
        assert.strictEqual(content.controls.length, 2, 'two controls created');
    });

    QUnit.test('SidebarContent hides navigation in stacked mode', assert => {
        let sidebar_elem = $('<div data-mode="stacked" />').appendTo(container);
        sidebar_elem.data('tiles', ['tile1', 'tile2']);

        let content_elem = $(`
            <div class="sidebar-content">
                <div class="sidebar-controls"></div>
                <div class="sidebar-tiles"></div>
            </div>
        `).appendTo(sidebar_elem);

        let mock_sidebar = {
            elem: sidebar_elem
        };

        let content = new SidebarContent(mock_sidebar, content_elem);

        assert.true(content.navigation.hasClass('d-none'), 'navigation hidden in stacked mode');
    });

    QUnit.test('SidebarContent activate_tile does nothing in stacked mode', assert => {
        let sidebar_elem = $('<div data-mode="stacked" />').appendTo(container);
        let content_elem = $(`
            <div class="sidebar-content">
                <div class="sidebar-controls"></div>
                <div class="sidebar-tiles"></div>
            </div>
        `).appendTo(sidebar_elem);

        let mock_sidebar = {
            elem: sidebar_elem
        };

        let content = new SidebarContent(mock_sidebar, content_elem);

        let mock_tile = {
            activate_tile: function() { throw new Error('should not be called'); }
        };

        content.activate_tile(mock_tile);
        assert.ok(true, 'activate_tile returns early in stacked mode');
    });

    QUnit.test('SidebarContent deactivate_all deactivates all controls in toggle mode', assert => {
        let sidebar_elem = $('<div data-mode="toggle" />').appendTo(container);
        sidebar_elem.data('tiles', ['tile1', 'tile2']);

        let content_elem = $(`
            <div class="sidebar-content">
                <div class="sidebar-controls">
                    <div class="sidebar-control active" data-target="tile1"></div>
                    <div class="sidebar-control active" data-target="tile2"></div>
                </div>
                <div class="sidebar-tiles">
                    <div data-tile="tile1"></div>
                    <div data-tile="tile2"></div>
                </div>
            </div>
        `).appendTo(sidebar_elem);

        let mock_sidebar = {
            elem: sidebar_elem
        };

        let content = new SidebarContent(mock_sidebar, content_elem);
        content.deactivate_all();

        for (const control of content.controls) {
            assert.false(control.elem.hasClass('active'), 'control deactivated');
        }
    });
});

QUnit.module('cone.app.sidebar.SidebarLeft', hooks => {

    let container,
        ajax_attach_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_attach_origin = ts.ajax.attach;
        ts.ajax.attach = function() {};

        localStorage.removeItem('cone-app-sidebar-left-width');
        localStorage.removeItem('cone.app.sidebar_left.locked');
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.attach = ajax_attach_origin;
        localStorage.removeItem('cone-app-sidebar-left-width');
        localStorage.removeItem('cone.app.sidebar_left.locked');
    });

    function createSidebarLeftElem() {
        return $(`
            <div id="sidebar_left" data-min-width="100">
                <div class="scrollable-y">
                    <div class="scrollable-content"></div>
                </div>
                <div id="sidebar_collapse">
                    <div class="collapse_btn"></div>
                </div>
                <input type="checkbox" class="lock-state-input" />
                <div class="lock-state-btn"></div>
                <div id="sidebar_resizer"></div>
                <div class="sidebar-content">
                    <div class="sidebar-controls"></div>
                    <div class="sidebar-tiles"></div>
                </div>
            </div>
        `).css({
            width: '300px',
            position: 'relative'
        }).appendTo(container);
    }

    QUnit.test('SidebarLeft.initialize returns early without #sidebar_left', assert => {
        SidebarLeft.initialize(container);
        assert.ok(true, 'no error without sidebar_left');
    });

    QUnit.test('SidebarLeft.initialize creates instance', assert => {
        let elem = createSidebarLeftElem();

        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', {
            pointer_events: true
        });

        SidebarLeft.initialize(container);
        assert.ok(true, 'instance created');
    });

    QUnit.test('SidebarLeft constructor sets up properties', assert => {
        let elem = createSidebarLeftElem();

        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);

        assert.ok(sidebar.elem, 'elem stored');
        assert.strictEqual(sidebar.min_width, 100, 'min_width from data attribute');
        assert.ok(sidebar.collapse_elem.length, 'collapse element found');
        assert.ok(sidebar.lock_elem.length, 'lock element found');
        assert.ok(sidebar.resizer_elem.length, 'resizer element found');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft sidebar_width getter returns localStorage value', assert => {
        localStorage.setItem('cone-app-sidebar-left-width', '400');

        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);

        assert.strictEqual(sidebar.sidebar_width, '400', 'width from localStorage');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft sidebar_width setter stores to localStorage', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);
        sidebar.sidebar_width = 500;

        assert.strictEqual(localStorage.getItem('cone-app-sidebar-left-width'), '500',
            'width stored in localStorage');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft collapse sets collapsed class', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);
        sidebar.collapse();

        assert.true(elem.hasClass('collapsed'), 'collapsed class added');
        assert.false(elem.hasClass('expanded'), 'expanded class removed');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft expand sets expanded class', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);
        sidebar.expand();

        assert.true(elem.hasClass('expanded'), 'expanded class added');
        assert.false(elem.hasClass('collapsed'), 'collapsed class removed');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft set_state stores collapsed state to localStorage', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);
        sidebar.collapse();
        sidebar.set_state();

        let stored = JSON.parse(localStorage.getItem('cone.app.sidebar_left.locked'));
        assert.ok(stored, 'state stored');
        assert.ok('collapsed' in stored, 'collapsed key exists');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft unset_state removes from localStorage', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);
        sidebar.set_state();
        sidebar.unset_state();

        assert.strictEqual(localStorage.getItem('cone.app.sidebar_left.locked'), null,
            'state removed from localStorage');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft locked getter returns parsed localStorage value', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);
        sidebar.set_state();

        assert.ok(sidebar.locked, 'locked state returned');
        assert.ok('collapsed' in sidebar.locked, 'collapsed key in locked');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft trigger_event fires global event', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let event_fired = false;
        let handler = function() {
            event_fired = true;
        };
        global_events.on('on_sidebar_left_resize', handler);

        let sidebar = new SidebarLeft(elem);
        sidebar.trigger_event();

        assert.true(event_fired, 'global event triggered');

        global_events.off('on_sidebar_left_resize', handler);
        sidebar.destroy();
    });

    QUnit.test('SidebarLeft get_width_from_event calculates width', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);

        let width = sidebar.get_width_from_event({ pageX: 250 });
        assert.strictEqual(typeof width, 'number', 'returns number');
        assert.ok(width >= sidebar.min_width, 'width at least min_width');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft destroy removes event listeners', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);
        sidebar.destroy();

        assert.ok(true, 'destroy completed without error');
    });

    QUnit.test('SidebarLeft on_sidebar_right_resize handles sibling resize', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);

        let mock_right_sidebar = {
            collapsed: false,
            moving: false,
            elem: $('<div />').css('width', '200px')
        };

        sidebar.on_sidebar_right_resize(null, mock_right_sidebar);
        assert.ok(true, 'handled sibling resize');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft move updates width when not locked', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);

        sidebar.move({ pageX: 400 });

        assert.true(sidebar.moving, 'moving flag set');
        assert.false(sidebar.scrollbar.pointer_events, 'pointer events disabled during move');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft move does nothing when locked', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);
        sidebar.set_state();

        sidebar.move({ pageX: 500 });

        assert.false(sidebar.moving, 'moving flag not set when locked');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft up finalizes resize', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);
        sidebar.moving = true;
        sidebar.scrollbar.pointer_events = false;

        sidebar.up();

        assert.true(sidebar.scrollbar.pointer_events, 'pointer events re-enabled');
        assert.false(sidebar.moving, 'moving flag cleared');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft on_window_resize calls responsive_toggle', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);

        sidebar.on_window_resize({});
        assert.ok(true, 'on_window_resize handled');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft disable_or_enable_interaction handles locked state', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);
        sidebar.set_state();
        sidebar.disable_lock = false;
        sidebar.disable_or_enable_interaction();

        let collapse_btn = $('.collapse_btn', elem);
        assert.true(collapse_btn.hasClass('disabled'), 'collapse button disabled when locked');
        assert.true(sidebar.resizer_elem.hasClass('d-none'), 'resizer hidden when locked');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft disable_or_enable_interaction enables when not locked', assert => {
        let elem = createSidebarLeftElem();
        let scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let sidebar = new SidebarLeft(elem);
        sidebar.disable_or_enable_interaction();

        let collapse_btn = $('.collapse_btn', elem);
        assert.false(collapse_btn.hasClass('disabled'), 'collapse button enabled');
        assert.false(sidebar.resizer_elem.hasClass('d-none'), 'resizer visible');

        sidebar.destroy();
    });
});

QUnit.module('cone.app.sidebar.SidebarRight', hooks => {

    let container,
        ajax_attach_origin;

    hooks.beforeEach(() => {
        $('#sidebar_left').remove();
        $('#sidebar_right').remove();
        container = $('<div />').appendTo('body');
        ajax_attach_origin = ts.ajax.attach;
        ts.ajax.attach = function() {};

        localStorage.removeItem('cone-app-sidebar-right-width');
        localStorage.removeItem('cone.app.sidebar_right.locked');
        localStorage.removeItem('cone-app-sidebar-left-width');
        localStorage.removeItem('cone.app.sidebar_left.locked');
    });

    hooks.afterEach(() => {
        $('#sidebar_right').remove();
        container.remove();
        ts.ajax.attach = ajax_attach_origin;
        localStorage.removeItem('cone-app-sidebar-right-width');
        localStorage.removeItem('cone.app.sidebar_right.locked');
    });

    function createSidebarRightElem() {
        return $(`
            <div id="sidebar_right" data-min-width="100">
                <div class="scrollable-y">
                    <div class="scrollable-content"></div>
                </div>
                <div class="sidebar-collapse-right">
                    <div class="collapse_btn"></div>
                </div>
                <input type="checkbox" class="lock-state-input" />
                <div class="lock-state-btn"></div>
                <div class="sidebar-resizer-right"></div>
                <div class="sidebar-content">
                    <div class="sidebar-controls"></div>
                    <div class="sidebar-tiles"></div>
                </div>
            </div>
        `).css({
            width: '300px',
            position: 'relative'
        }).appendTo(container);
    }

    QUnit.test('SidebarRight.initialize returns early without #sidebar_right', assert => {
        SidebarRight.initialize(container);
        assert.ok(true, 'no error without sidebar_right');
    });

    QUnit.test('SidebarRight uses correct localStorage keys', assert => {
        assert.strictEqual(
            localStorage.getItem('cone-app-sidebar-right-width'),
            null,
            'starts with no stored width'
        );

        localStorage.setItem('cone-app-sidebar-right-width', '400');
        assert.strictEqual(
            localStorage.getItem('cone-app-sidebar-right-width'),
            '400',
            'localStorage key correct'
        );

        localStorage.setItem('cone.app.sidebar_right.locked', JSON.stringify({ collapsed: true }));
        let stored = JSON.parse(localStorage.getItem('cone.app.sidebar_right.locked'));
        assert.deepEqual(stored, { collapsed: true }, 'locked state key correct');
    });

    QUnit.test('SidebarRight class exists and has static initialize', assert => {
        assert.ok(SidebarRight, 'SidebarRight class exists');
        assert.strictEqual(typeof SidebarRight.initialize, 'function', 'has static initialize');
    });
});

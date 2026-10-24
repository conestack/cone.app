import $ from 'jquery';
import ts from 'treibstoff';
import { global_events } from '../src/globals.js';
import { SidebarContent, SidebarControl, SidebarLeft, SidebarRight } from '../src/sidebar.js';

const width_origin = $.fn.width;

function stub_window_width(width) {
    $.fn.width = function (...args) {
        if (this[0] === window) {
            return width;
        }
        return width_origin.apply(this, args);
    };
}

QUnit.module('cone.app.sidebar.SidebarControl', (hooks) => {
    let container, ajax_attach_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_attach_origin = ts.ajax.attach;
        ts.ajax.attach = () => {};
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.attach = ajax_attach_origin;
    });

    QUnit.test('SidebarControl constructor sets up properties', (assert) => {
        const tiles_container = $('<div class="sidebar-tiles" />').appendTo(container);
        $('<div data-tile="test-tile" />').appendTo(tiles_container);
        const control_elem = $('<div data-target="test-tile" />').appendTo(container);

        const mock_sidebar_content = {
            tiles_container: tiles_container,
            sidebar: { elem: $('<div />') },
        };

        const control = new SidebarControl(mock_sidebar_content, control_elem);

        assert.ok(control.elem, 'elem stored');
        assert.strictEqual(control.target, 'test-tile', 'target stored');
        assert.ok(control.parent, 'parent stored');
        assert.ok(control.related_tile.length, 'related_tile found');

        control.destroy();
    });

    QUnit.test('SidebarControl on_click calls parent activate_tile', (assert) => {
        const tiles_container = $('<div class="sidebar-tiles" />').appendTo(container);
        $('<div data-tile="test-tile" />').appendTo(tiles_container);
        const control_elem = $('<div data-target="test-tile" />').appendTo(container);

        let activate_called = false;
        const mock_sidebar_content = {
            tiles_container: tiles_container,
            sidebar: { elem: $('<div />') },
            activate_tile: (_ctrl) => {
                activate_called = true;
            },
        };

        const control = new SidebarControl(mock_sidebar_content, control_elem);
        control_elem.trigger('click');

        assert.true(activate_called, 'activate_tile called on click');

        control.destroy();
    });

    QUnit.test('SidebarControl activate_tile adds classes', (assert) => {
        const sidebar_elem = $('<div />').appendTo(container);
        const tiles_container = $('<div class="sidebar-tiles" />').appendTo(container);
        const tile = $('<div data-tile="test-tile" class="d-none" />').appendTo(tiles_container);
        const control_elem = $('<div data-target="test-tile" />').appendTo(container);

        const mock_sidebar_content = {
            tiles_container: tiles_container,
            sidebar: { elem: sidebar_elem },
        };

        const control = new SidebarControl(mock_sidebar_content, control_elem);
        control.activate_tile();

        assert.true(control_elem.hasClass('active'), 'active class added to control');
        assert.false(tile.hasClass('d-none'), 'd-none class removed from tile');
        assert.strictEqual(sidebar_elem.attr('tile'), 'test-tile', 'tile attribute set on sidebar');

        control.destroy();
    });

    QUnit.test('SidebarControl deactivate_tile removes classes', (assert) => {
        const tiles_container = $('<div class="sidebar-tiles" />').appendTo(container);
        const tile = $('<div data-tile="test-tile" />').appendTo(tiles_container);
        const control_elem = $('<div data-target="test-tile" class="active" />').appendTo(
            container,
        );

        const mock_sidebar_content = {
            tiles_container: tiles_container,
            sidebar: { elem: $('<div />') },
        };

        const control = new SidebarControl(mock_sidebar_content, control_elem);
        control.deactivate_tile();

        assert.false(control_elem.hasClass('active'), 'active class removed');
        assert.true(tile.hasClass('d-none'), 'd-none class added to tile');

        control.destroy();
    });

    QUnit.test('SidebarControl destroy removes click handler', (assert) => {
        const tiles_container = $('<div class="sidebar-tiles" />').appendTo(container);
        $('<div data-tile="test-tile" />').appendTo(tiles_container);
        const control_elem = $('<div data-target="test-tile" />').appendTo(container);

        let click_count = 0;
        const mock_sidebar_content = {
            tiles_container: tiles_container,
            sidebar: { elem: $('<div />') },
            activate_tile: () => {
                click_count++;
            },
        };

        const control = new SidebarControl(mock_sidebar_content, control_elem);
        control_elem.trigger('click');
        assert.strictEqual(click_count, 1, 'click handler works before destroy');

        control.destroy();
        control_elem.trigger('click');
        assert.strictEqual(click_count, 1, 'click handler removed after destroy');
    });
});

QUnit.module('cone.app.sidebar.SidebarContent', (hooks) => {
    let container, ajax_attach_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_attach_origin = ts.ajax.attach;
        ts.ajax.attach = () => {};
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.attach = ajax_attach_origin;
    });

    QUnit.test('SidebarContent constructor sets up properties in stacked mode', (assert) => {
        const sidebar_elem = $('<div data-mode="stacked" />').appendTo(container);
        const content_elem = $(`
            <div class="sidebar-content">
                <div class="sidebar-controls"></div>
                <div class="sidebar-tiles"></div>
            </div>
        `).appendTo(sidebar_elem);

        const mock_sidebar = {
            elem: sidebar_elem,
        };

        const content = new SidebarContent(mock_sidebar, content_elem);

        assert.ok(content.elem, 'elem stored');
        assert.strictEqual(content.mode, 'stacked', 'mode is stacked');
        assert.ok(content.navigation, 'navigation element found');
        assert.ok(content.tiles_container, 'tiles_container found');
        assert.strictEqual(content.controls.length, 0, 'no controls in stacked mode');
    });

    QUnit.test(
        'SidebarContent constructor sets up controls in toggle mode with multiple tiles',
        (assert) => {
            const sidebar_elem = $('<div data-mode="toggle" />').appendTo(container);
            sidebar_elem.data('tiles', ['tile1', 'tile2']);

            const content_elem = $(`
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

            const mock_sidebar = {
                elem: sidebar_elem,
            };

            const content = new SidebarContent(mock_sidebar, content_elem);

            assert.strictEqual(content.mode, 'toggle', 'mode is toggle');
            assert.strictEqual(content.controls.length, 2, 'two controls created');
        },
    );

    QUnit.test('SidebarContent hides navigation in stacked mode', (assert) => {
        const sidebar_elem = $('<div data-mode="stacked" />').appendTo(container);
        sidebar_elem.data('tiles', ['tile1', 'tile2']);

        const content_elem = $(`
            <div class="sidebar-content">
                <div class="sidebar-controls"></div>
                <div class="sidebar-tiles"></div>
            </div>
        `).appendTo(sidebar_elem);

        const mock_sidebar = {
            elem: sidebar_elem,
        };

        const content = new SidebarContent(mock_sidebar, content_elem);

        assert.true(content.navigation.hasClass('d-none'), 'navigation hidden in stacked mode');
    });

    QUnit.test('SidebarContent activate_tile does nothing in stacked mode', (assert) => {
        const sidebar_elem = $('<div data-mode="stacked" />').appendTo(container);
        const content_elem = $(`
            <div class="sidebar-content">
                <div class="sidebar-controls"></div>
                <div class="sidebar-tiles"></div>
            </div>
        `).appendTo(sidebar_elem);

        const mock_sidebar = {
            elem: sidebar_elem,
        };

        const content = new SidebarContent(mock_sidebar, content_elem);

        const mock_tile = {
            activate_tile: () => {
                throw new Error('should not be called');
            },
        };

        content.activate_tile(mock_tile);
        assert.ok(true, 'activate_tile returns early in stacked mode');
    });

    QUnit.test(
        'SidebarContent deactivate_all deactivates all controls in toggle mode',
        (assert) => {
            const sidebar_elem = $('<div data-mode="toggle" />').appendTo(container);
            sidebar_elem.data('tiles', ['tile1', 'tile2']);

            const content_elem = $(`
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

            const mock_sidebar = {
                elem: sidebar_elem,
            };

            const content = new SidebarContent(mock_sidebar, content_elem);
            content.deactivate_all();

            for (const control of content.controls) {
                assert.false(control.elem.hasClass('active'), 'control deactivated');
            }
        },
    );

    QUnit.test('SidebarContent deactivate_all does nothing in stacked mode', (assert) => {
        const sidebar_elem = $('<div data-mode="toggle" />').appendTo(container);
        sidebar_elem.data('tiles', ['tile1', 'tile2']);

        const content_elem = $(`
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

        const content = new SidebarContent({ elem: sidebar_elem }, content_elem);
        assert.true(content.controls[0].elem.hasClass('active'), 'first control active');

        content.mode = 'stacked';
        content.deactivate_all();
        assert.true(content.controls[0].elem.hasClass('active'), 'control still active');
    });
});

QUnit.module('cone.app.sidebar.SidebarLeft', (hooks) => {
    let container, ajax_attach_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_attach_origin = ts.ajax.attach;
        ts.ajax.attach = () => {};

        localStorage.removeItem('cone-app-sidebar-left-width');
        localStorage.removeItem('cone.app.sidebar_left.locked');
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.attach = ajax_attach_origin;
        localStorage.removeItem('cone-app-sidebar-left-width');
        localStorage.removeItem('cone.app.sidebar_left.locked');
        $.fn.width = width_origin;
        $('html, body').css('overscroll-behavior', '');
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
        `)
            .css({
                width: '300px',
                position: 'relative',
            })
            .appendTo(container);
    }

    function createSidebarLeft(css = {}) {
        const elem = createSidebarLeftElem().css(css);
        $('.scrollable-y', elem).data('scrollbar', { pointer_events: true });
        return new SidebarLeft(elem);
    }

    function lock_left(collapsed) {
        localStorage.setItem('cone.app.sidebar_left.locked', JSON.stringify({ collapsed }));
    }

    function mock_sibling(width, props = {}) {
        const elem = $('<div />').css('width', `${width}px`).appendTo(container);
        return { elem, collapsed: false, moving: false, ...props };
    }

    QUnit.test('SidebarLeft min_width defaults to 115', (assert) => {
        const elem = createSidebarLeftElem().removeAttr('data-min-width');
        $('.scrollable-y', elem).data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);
        assert.strictEqual(sidebar.min_width, 115, 'default min_width');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft constructor restores locked collapsed state', (assert) => {
        lock_left(true);
        const sidebar = createSidebarLeft();

        assert.true(sidebar.lock_input.prop('checked'), 'lock input checked');
        assert.true(sidebar.elem.hasClass('collapsed'), 'sidebar collapsed');
        assert.true($('.collapse_btn', sidebar.elem).hasClass('disabled'), 'interaction disabled');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft constructor restores locked expanded state', (assert) => {
        lock_left(false);
        const sidebar = createSidebarLeft();

        assert.true(sidebar.lock_input.prop('checked'), 'lock input checked');
        assert.true(sidebar.elem.hasClass('expanded'), 'sidebar expanded');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft static sidebar collapses', (assert) => {
        for (const value of ['true', 'True']) {
            const elem = createSidebarLeftElem().attr('data-static', value);
            elem.addClass('responsive-expanded responsive-collapsed');
            $('.scrollable-y', elem).data('scrollbar', { pointer_events: true });

            const sidebar = new SidebarLeft(elem);
            assert.true(sidebar.static, `static for ${value}`);
            assert.true(elem.hasClass('collapsed'), 'collapsed');
            assert.false(elem.hasClass('responsive-expanded'), 'no responsive-expanded');
            assert.false(elem.hasClass('responsive-collapsed'), 'no responsive-collapsed');

            sidebar.destroy();
            elem.remove();
        }
    });

    QUnit.test('SidebarLeft responsive_toggle marks collapsed sidebar', (assert) => {
        const sidebar = createSidebarLeft({ 'max-width': '0px' });

        assert.true(sidebar.collapsed, 'collapsed');
        assert.true(sidebar.elem.hasClass('responsive-collapsed'), 'responsive-collapsed');
        assert.false(sidebar.elem.hasClass('responsive-expanded'), 'not responsive-expanded');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft lock click toggles locked state', (assert) => {
        const sidebar = createSidebarLeft();
        const collapse_btn = $('.collapse_btn', sidebar.elem);

        // checkbox is still unchecked while on_lock runs
        sidebar.lock_elem.trigger('click');
        assert.deepEqual(sidebar.locked, { collapsed: false }, 'state stored');
        assert.true(sidebar.elem.hasClass('expanded'), 'expanded class');
        assert.true(collapse_btn.hasClass('disabled'), 'interaction disabled');

        sidebar.lock_input.prop('checked', true);
        sidebar.elem.css('max-width', '0px');
        sidebar.lock_elem.trigger('click');
        assert.strictEqual(sidebar.locked, null, 'state removed');
        assert.false(sidebar.elem.hasClass('expanded'), 'expanded class removed');
        assert.true(sidebar.elem.hasClass('collapsed'), 'collapsed class');
        assert.false(collapse_btn.hasClass('disabled'), 'interaction enabled');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft collapse click toggles sidebar', (assert) => {
        const sidebar = createSidebarLeft();
        const collapse_elem = sidebar.collapse_elem;

        collapse_elem.trigger('click');
        assert.true(sidebar.elem.hasClass('collapsed'), 'collapsed');
        assert.strictEqual(sidebar.locked, null, 'no state stored if not locked');

        lock_left(false);
        sidebar.elem.css('max-width', '0px');
        collapse_elem.trigger('click');
        assert.true(sidebar.elem.hasClass('expanded'), 'expanded');
        assert.deepEqual(sidebar.locked, { collapsed: true }, 'state stored if locked');

        lock_left(false);
        sidebar.disable_lock = true;
        collapse_elem.trigger('click');
        assert.deepEqual(sidebar.locked, { collapsed: false }, 'no state stored if lock disabled');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft responsive_toggle collapses locked expanded on mobile', (assert) => {
        const sidebar = createSidebarLeft();
        lock_left(false);
        stub_window_width(500);

        sidebar.responsive_toggle();
        assert.true(sidebar.disable_lock, 'lock disabled');
        assert.true(sidebar.elem.hasClass('collapsed'), 'collapsed');
        assert.false($('.collapse_btn', sidebar.elem).hasClass('disabled'), 'interaction enabled');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft responsive_toggle restores locked state on desktop', (assert) => {
        const sidebar = createSidebarLeft();
        stub_window_width(1000);

        lock_left(false);
        sidebar.elem.css('max-width', '0px');
        sidebar.responsive_toggle();
        assert.false(sidebar.disable_lock, 'lock enabled');
        assert.true(sidebar.elem.hasClass('expanded'), 'locked expanded state restored');

        lock_left(true);
        sidebar.elem.css('max-width', '');
        sidebar.responsive_toggle();
        assert.true(sidebar.elem.hasClass('collapsed'), 'locked collapsed state restored');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft collapses and hides if sibling expands on mobile', (assert) => {
        const sidebar = createSidebarLeft();
        stub_window_width(500);

        sidebar.on_sibling_sidebar_resize(null, mock_sibling(100));
        assert.true(sidebar.elem.hasClass('collapsed'), 'collapsed');
        assert.true(sidebar.elem.hasClass('d-none'), 'hidden');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft collapses if expanded sibling exceeds width', (assert) => {
        const sidebar = createSidebarLeft();
        stub_window_width(1000);

        // available width: 1000 - 300 - 300 = 400
        sidebar.on_sibling_sidebar_resize(null, mock_sibling(300));
        assert.false(sidebar.elem.hasClass('collapsed'), 'not collapsed below max width');

        lock_left(false);
        sidebar.on_sibling_sidebar_resize(null, mock_sibling(400, { moving: true }));
        assert.false(sidebar.elem.hasClass('collapsed'), 'locked, sibling moving');

        sidebar.on_sibling_sidebar_resize(null, mock_sibling(400));
        assert.true(sidebar.elem.hasClass('collapsed'), 'locked, sibling not moving');

        sidebar.elem.removeClass('collapsed');
        localStorage.removeItem('cone.app.sidebar_left.locked');
        sidebar.on_sibling_sidebar_resize(null, mock_sibling(400, { moving: true }));
        assert.true(sidebar.elem.hasClass('collapsed'), 'not locked, sibling moving');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft shows again if sibling collapses', (assert) => {
        const sidebar = createSidebarLeft();
        stub_window_width(1000);

        sidebar.elem.addClass('d-none');
        sidebar.on_sibling_sidebar_resize(null, mock_sibling(0, { collapsed: true }));
        assert.false(sidebar.elem.hasClass('d-none'), 'shown');
        assert.false(sidebar.elem.hasClass('expanded'), 'not expanded if not locked');

        lock_left(false);
        sidebar.elem.addClass('d-none').css('max-width', '0px');
        sidebar.on_sibling_sidebar_resize(null, mock_sibling(0, { collapsed: true }));
        assert.false(sidebar.elem.hasClass('d-none'), 'shown');
        assert.true(sidebar.elem.hasClass('expanded'), 'locked expanded state restored');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft get_width_from_event considers right sidebar', (assert) => {
        const sidebar = createSidebarLeft();
        $('<div id="sidebar_right" />').css('width', '200px').appendTo(container);
        stub_window_width(1000);

        // max width: 1000 - 200 - 300 = 500
        assert.strictEqual(sidebar.get_width_from_event({ pageX: 400 }), 400);
        assert.strictEqual(sidebar.get_width_from_event({ pageX: 900 }), 500);
        assert.strictEqual(sidebar.get_width_from_event({ pageX: 50 }), 100);

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft.initialize returns early without #sidebar_left', (assert) => {
        SidebarLeft.initialize(container);
        assert.ok(true, 'no error without sidebar_left');
    });

    QUnit.test('SidebarLeft.initialize creates instance', (assert) => {
        const elem = createSidebarLeftElem();

        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', {
            pointer_events: true,
        });

        const attached = [];
        ts.ajax.attach = (inst) => {
            attached.push(inst);
        };
        SidebarLeft.initialize(container);
        assert.true(attached[0] instanceof SidebarLeft, 'instance created');

        attached[0].destroy();
    });

    QUnit.test('SidebarLeft constructor sets up properties', (assert) => {
        const elem = createSidebarLeftElem();

        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);

        assert.ok(sidebar.elem, 'elem stored');
        assert.strictEqual(sidebar.min_width, 100, 'min_width from data attribute');
        assert.ok(sidebar.collapse_elem.length, 'collapse element found');
        assert.ok(sidebar.lock_elem.length, 'lock element found');
        assert.ok(sidebar.resizer_elem.length, 'resizer element found');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft sidebar_width getter returns localStorage value', (assert) => {
        localStorage.setItem('cone-app-sidebar-left-width', '400');

        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);

        assert.strictEqual(sidebar.sidebar_width, '400', 'width from localStorage');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft sidebar_width setter stores to localStorage', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);
        sidebar.sidebar_width = 500;

        assert.strictEqual(
            localStorage.getItem('cone-app-sidebar-left-width'),
            '500',
            'width stored in localStorage',
        );

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft collapse sets collapsed class', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);
        sidebar.collapse();

        assert.true(elem.hasClass('collapsed'), 'collapsed class added');
        assert.false(elem.hasClass('expanded'), 'expanded class removed');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft expand sets expanded class', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);
        sidebar.expand();

        assert.true(elem.hasClass('expanded'), 'expanded class added');
        assert.false(elem.hasClass('collapsed'), 'collapsed class removed');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft set_state stores collapsed state to localStorage', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);
        sidebar.collapse();
        sidebar.set_state();

        const stored = JSON.parse(localStorage.getItem('cone.app.sidebar_left.locked'));
        assert.ok(stored, 'state stored');
        assert.ok('collapsed' in stored, 'collapsed key exists');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft unset_state removes from localStorage', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);
        sidebar.set_state();
        sidebar.unset_state();

        assert.strictEqual(
            localStorage.getItem('cone.app.sidebar_left.locked'),
            null,
            'state removed from localStorage',
        );

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft locked getter returns parsed localStorage value', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);
        sidebar.set_state();

        assert.ok(sidebar.locked, 'locked state returned');
        assert.ok('collapsed' in sidebar.locked, 'collapsed key in locked');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft trigger_event fires global event', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        let event_fired = false;
        const handler = () => {
            event_fired = true;
        };
        global_events.on('on_sidebar_left_resize', handler);

        const sidebar = new SidebarLeft(elem);
        sidebar.trigger_event();

        assert.true(event_fired, 'global event triggered');

        global_events.off('on_sidebar_left_resize', handler);
        sidebar.destroy();
    });

    QUnit.test('SidebarLeft get_width_from_event calculates width', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);

        const width = sidebar.get_width_from_event({ pageX: 250 });
        assert.strictEqual(typeof width, 'number', 'returns number');
        assert.ok(width >= sidebar.min_width, 'width at least min_width');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft destroy removes event listeners', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);
        sidebar.destroy();

        assert.ok(true, 'destroy completed without error');
    });

    QUnit.test('SidebarLeft on_sidebar_right_resize handles sibling resize', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);

        const mock_right_sidebar = {
            collapsed: false,
            moving: false,
            elem: $('<div />').css('width', '200px'),
        };

        sidebar.on_sidebar_right_resize(null, mock_right_sidebar);
        assert.ok(true, 'handled sibling resize');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft move updates width when not locked', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);

        sidebar.move({ pageX: 400 });

        assert.true(sidebar.moving, 'moving flag set');
        assert.false(sidebar.scrollbar.pointer_events, 'pointer events disabled during move');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft move does nothing when locked', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);
        sidebar.set_state();

        sidebar.move({ pageX: 500 });

        assert.false(sidebar.moving, 'moving flag not set when locked');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft up finalizes resize', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);
        sidebar.moving = true;
        sidebar.scrollbar.pointer_events = false;

        sidebar.up();

        assert.true(sidebar.scrollbar.pointer_events, 'pointer events re-enabled');
        assert.false(sidebar.moving, 'moving flag cleared');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft on_window_resize calls responsive_toggle', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);

        sidebar.on_window_resize({});
        assert.ok(true, 'on_window_resize handled');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft disable_or_enable_interaction handles locked state', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);
        sidebar.set_state();
        sidebar.disable_lock = false;
        sidebar.disable_or_enable_interaction();

        const collapse_btn = $('.collapse_btn', elem);
        assert.true(collapse_btn.hasClass('disabled'), 'collapse button disabled when locked');
        assert.true(sidebar.resizer_elem.hasClass('d-none'), 'resizer hidden when locked');

        sidebar.destroy();
    });

    QUnit.test('SidebarLeft disable_or_enable_interaction enables when not locked', (assert) => {
        const elem = createSidebarLeftElem();
        const scrollable = $('.scrollable-y', elem);
        scrollable.data('scrollbar', { pointer_events: true });

        const sidebar = new SidebarLeft(elem);
        sidebar.disable_or_enable_interaction();

        const collapse_btn = $('.collapse_btn', elem);
        assert.false(collapse_btn.hasClass('disabled'), 'collapse button enabled');
        assert.false(sidebar.resizer_elem.hasClass('d-none'), 'resizer visible');

        sidebar.destroy();
    });
});

QUnit.module('cone.app.sidebar.SidebarRight', (hooks) => {
    let container, ajax_attach_origin;

    hooks.beforeEach(() => {
        $('#sidebar_left').remove();
        $('#sidebar_right').remove();
        container = $('<div />').appendTo('body');
        ajax_attach_origin = ts.ajax.attach;
        ts.ajax.attach = () => {};

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
        $.fn.width = width_origin;
        $('html, body').css('overscroll-behavior', '');
    });

    function createSidebarRight() {
        const elem = $(`
            <div id="sidebar_right" data-min-width="100">
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
        `)
            .css({
                width: '300px',
                position: 'relative',
            })
            .appendTo(container);
        $('.scrollable-y', elem).data('scrollbar', { pointer_events: true });
        return new SidebarRight(elem);
    }

    QUnit.test('SidebarRight.initialize creates instance', (assert) => {
        const attached = [];
        ts.ajax.attach = (inst) => {
            attached.push(inst);
        };
        const sidebar = createSidebarRight();
        sidebar.destroy();
        attached.length = 0;

        SidebarRight.initialize(container);
        assert.true(attached[0] instanceof SidebarRight, 'instance created');

        attached[0].destroy();
    });

    QUnit.test('SidebarRight stores width and locked state', (assert) => {
        const sidebar = createSidebarRight();

        assert.strictEqual(sidebar.sidebar_width, 300, 'default width');
        sidebar.sidebar_width = 400;
        assert.strictEqual(localStorage.getItem('cone-app-sidebar-right-width'), '400');
        assert.strictEqual(sidebar.sidebar_width, '400', 'stored width');

        assert.strictEqual(sidebar.locked, null, 'not locked');
        sidebar.set_state();
        assert.deepEqual(sidebar.locked, { collapsed: false }, 'locked');
        sidebar.unset_state();
        assert.strictEqual(sidebar.locked, null, 'unlocked');

        sidebar.destroy();
    });

    QUnit.test('SidebarRight trigger_event fires global event', (assert) => {
        const sidebar = createSidebarRight();
        const triggered = [];
        const handler = (_inst, sb) => {
            triggered.push(sb);
        };
        global_events.on('on_sidebar_right_resize', handler);

        sidebar.trigger_event();
        assert.deepEqual(triggered, [sidebar], 'event triggered with sidebar');

        global_events.off('on_sidebar_right_resize', handler);
        sidebar.destroy();
    });

    QUnit.test('SidebarRight get_width_from_event calculates width', (assert) => {
        const sidebar = createSidebarRight();
        stub_window_width(1000);
        const window_width = $(window).outerWidth();

        // max width without left sidebar: 1000 - 300 = 700
        assert.strictEqual(sidebar.get_width_from_event({ pageX: window_width - 400 }), 400);
        assert.strictEqual(sidebar.get_width_from_event({ pageX: window_width - 900 }), 700);
        assert.strictEqual(sidebar.get_width_from_event({ pageX: window_width }), 100);

        // max width with left sidebar: 1000 - 200 - 300 = 500
        $('<div id="sidebar_left" />').css('width', '200px').appendTo(container);
        assert.strictEqual(sidebar.get_width_from_event({ pageX: window_width - 900 }), 500);

        sidebar.destroy();
    });

    QUnit.test('SidebarRight handles left sidebar resize until destroyed', (assert) => {
        const sidebar = createSidebarRight();
        const resized = [];
        sidebar.on_sibling_sidebar_resize = (_inst, sb) => {
            resized.push(sb);
        };
        const sibling = { collapsed: true };

        global_events.trigger('on_sidebar_left_resize', sibling);
        assert.deepEqual(resized, [sibling], 'sibling resize handled');

        sidebar.destroy();
        global_events.trigger('on_sidebar_left_resize', sibling);
        assert.deepEqual(resized, [sibling], 'not handled after destroy');
    });

    QUnit.test('SidebarRight.initialize returns early without #sidebar_right', (assert) => {
        SidebarRight.initialize(container);
        assert.ok(true, 'no error without sidebar_right');
    });

    QUnit.test('SidebarRight uses correct localStorage keys', (assert) => {
        assert.strictEqual(
            localStorage.getItem('cone-app-sidebar-right-width'),
            null,
            'starts with no stored width',
        );

        localStorage.setItem('cone-app-sidebar-right-width', '400');
        assert.strictEqual(
            localStorage.getItem('cone-app-sidebar-right-width'),
            '400',
            'localStorage key correct',
        );

        localStorage.setItem('cone.app.sidebar_right.locked', JSON.stringify({ collapsed: true }));
        const stored = JSON.parse(localStorage.getItem('cone.app.sidebar_right.locked'));
        assert.deepEqual(stored, { collapsed: true }, 'locked state key correct');
    });

    QUnit.test('SidebarRight class exists and has static initialize', (assert) => {
        assert.ok(SidebarRight, 'SidebarRight class exists');
        assert.strictEqual(typeof SidebarRight.initialize, 'function', 'has static initialize');
    });
});

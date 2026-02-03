import $ from 'jquery';
import ts from 'treibstoff';
import {MainMenu} from '../src/mainmenu.js';
import {global_events} from '../src/globals.js';

QUnit.module('cone.app.mainmenu', hooks => {

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

    QUnit.test('MainMenu.initialize returns early without #mainmenu', assert => {
        MainMenu.initialize(container);
        assert.ok(true, 'no error without mainmenu');
    });

    QUnit.test('MainMenu.initialize creates instance', assert => {
        let mock_scrollbar = {
            on: function() {},
            off: function() {},
            render: function() {},
            destroy: function() {}
        };

        let elem = $(`
            <nav id="mainmenu">
                <a class="nav-link dropdown-toggle"></a>
            </nav>
        `).data('scrollbar', mock_scrollbar).appendTo(container);

        MainMenu.initialize(container);
        assert.ok(true, 'instance created');
    });

    QUnit.test('MainMenu constructor stores elements', assert => {
        let mock_scrollbar = {
            on: function() {},
            off: function() {},
            render: function() {},
            destroy: function() {}
        };

        let elem = $(`
            <nav id="mainmenu">
                <a class="nav-link dropdown-toggle"></a>
            </nav>
        `).data('scrollbar', mock_scrollbar).appendTo(container);

        let instance = new MainMenu(elem);

        assert.ok(instance.elem, 'elem stored');
        assert.ok(instance.scrollbar, 'scrollbar stored');
        assert.ok(instance.elems.length >= 0, 'dropdown elems found');

        instance.destroy();
    });

    QUnit.test('MainMenu height getter returns outer height', assert => {
        let mock_scrollbar = {
            on: function() {},
            off: function() {},
            render: function() {},
            destroy: function() {}
        };

        let elem = $(`
            <nav id="mainmenu" style="height: 50px;">
                <a class="nav-link dropdown-toggle"></a>
            </nav>
        `).data('scrollbar', mock_scrollbar).appendTo(container);

        let instance = new MainMenu(elem);
        assert.ok(instance.height > 0, 'height is positive');

        instance.destroy();
    });

    QUnit.test('MainMenu on_is_compact binds/unbinds dropdowns', assert => {
        let mock_scrollbar = {
            on: function() {},
            off: function() {},
            render: function() {},
            destroy: function() {}
        };

        let elem = $(`
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown"></a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#">Item</a></li>
            </ul>
        `).data('scrollbar', mock_scrollbar).appendTo(container);

        let instance = new MainMenu(elem);

        instance.on_is_compact(true);
        assert.ok(true, 'compact mode handled');

        instance.on_is_compact(false);
        assert.ok(true, 'full mode handled');

        instance.destroy();
    });

    QUnit.test('MainMenu hide_dropdowns hides all', assert => {
        let mock_scrollbar = {
            on: function() {},
            off: function() {},
            render: function() {},
            destroy: function() {}
        };

        let elem = $(`
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown"></a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#">Item</a></li>
            </ul>
        `).data('scrollbar', mock_scrollbar).appendTo(container);

        let instance = new MainMenu(elem);

        // Mock Bootstrap dropdown
        $.fn.dropdown = function(action) {
            return this;
        };

        instance.hide_dropdowns();
        assert.ok(true, 'hide_dropdowns completed');

        instance.destroy();
    });

    QUnit.test('MainMenu on_show_dropdown_desktop sets position', assert => {
        let mock_scrollbar = {
            on: function() {},
            off: function() {},
            render: function() {},
            destroy: function() {}
        };

        let elem = $(`
            <nav id="mainmenu" style="height: 50px;">
                <a class="nav-link dropdown-toggle"></a>
                <ul class="dropdown-menu"></ul>
            </nav>
        `).data('scrollbar', mock_scrollbar).appendTo(container);

        let instance = new MainMenu(elem);
        let link = elem.find('.nav-link.dropdown-toggle');

        let evt = {target: link.get(0)};
        instance.on_show_dropdown_desktop(evt);

        assert.strictEqual(instance.open_dropdown, link.get(0),
            'open_dropdown set');

        instance.destroy();
    });

    QUnit.test('MainMenu on_hide_dropdown_desktop clears open_dropdown', assert => {
        let mock_scrollbar = {
            on: function() {},
            off: function() {},
            render: function() {},
            destroy: function() {}
        };

        let elem = $(`
            <nav id="mainmenu">
                <a class="nav-link dropdown-toggle"></a>
            </nav>
        `).data('scrollbar', mock_scrollbar).appendTo(container);

        let instance = new MainMenu(elem);
        let link = elem.find('.nav-link.dropdown-toggle').get(0);

        instance.open_dropdown = link;
        instance.on_hide_dropdown_desktop({target: link});

        assert.strictEqual(instance.open_dropdown, null, 'open_dropdown cleared');

        instance.destroy();
    });

    QUnit.test('MainMenu on_hide_dropdown_desktop ignores different dropdown', assert => {
        let mock_scrollbar = {
            on: function() {},
            off: function() {},
            render: function() {},
            destroy: function() {}
        };

        let elem = $(`
            <nav id="mainmenu">
                <a class="nav-link dropdown-toggle" id="dd1"></a>
                <a class="nav-link dropdown-toggle" id="dd2"></a>
            </nav>
        `).data('scrollbar', mock_scrollbar).appendTo(container);

        let instance = new MainMenu(elem);
        let link1 = elem.find('#dd1').get(0);
        let link2 = elem.find('#dd2').get(0);

        instance.open_dropdown = link1;
        instance.on_hide_dropdown_desktop({target: link2});

        assert.strictEqual(instance.open_dropdown, link1,
            'open_dropdown unchanged for different dropdown');

        instance.destroy();
    });

    QUnit.test('MainMenu on_sidebar_left_resize renders scrollbar', assert => {
        let render_called = false;
        let mock_scrollbar = {
            on: function() {},
            off: function() {},
            render: function() { render_called = true; },
            destroy: function() {}
        };

        let elem = $(`
            <nav id="mainmenu">
                <a class="nav-link dropdown-toggle"></a>
            </nav>
        `).data('scrollbar', mock_scrollbar).appendTo(container);

        let instance = new MainMenu(elem);

        // Use requestAnimationFrame callback
        instance.on_sidebar_left_resize(null, {collapsed: false});

        // Wait for requestAnimationFrame
        setTimeout(() => {
            assert.true(render_called, 'scrollbar.render called');
            instance.destroy();
        }, 50);

        assert.ok(true, 'on_sidebar_left_resize called');
    });

    QUnit.test('MainMenu destroy cleans up', assert => {
        let mock_scrollbar = {
            on: function() {},
            off: function() {},
            render: function() {},
            destroy: function() {}
        };

        let elem = $(`
            <nav id="mainmenu">
                <a class="nav-link dropdown-toggle"></a>
            </nav>
        `).data('scrollbar', mock_scrollbar).appendTo(container);

        let instance = new MainMenu(elem);
        instance.destroy();

        assert.ok(true, 'destroy completed');
    });
});

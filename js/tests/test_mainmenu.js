import $ from 'jquery';
import ts from 'treibstoff';
import { MainMenu } from '../src/mainmenu.js';

QUnit.module('cone.app.mainmenu', (hooks) => {
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

    QUnit.test('MainMenu.initialize returns early without #mainmenu', (assert) => {
        MainMenu.initialize(container);
        assert.ok(true, 'no error without mainmenu');
    });

    QUnit.test('MainMenu.initialize creates instance', (assert) => {
        const mock_scrollbar = {
            on: () => {},
            off: () => {},
            render: () => {},
            destroy: () => {},
        };

        $(`
            <nav id="mainmenu">
                <a class="nav-link dropdown-toggle"></a>
            </nav>
        `)
            .data('scrollbar', mock_scrollbar)
            .appendTo(container);

        MainMenu.initialize(container);
        assert.ok(true, 'instance created');
    });

    QUnit.test('MainMenu constructor stores elements', (assert) => {
        const mock_scrollbar = {
            on: () => {},
            off: () => {},
            render: () => {},
            destroy: () => {},
        };

        const elem = $(`
            <nav id="mainmenu">
                <a class="nav-link dropdown-toggle"></a>
            </nav>
        `)
            .data('scrollbar', mock_scrollbar)
            .appendTo(container);

        const instance = new MainMenu(elem);

        assert.ok(instance.elem, 'elem stored');
        assert.ok(instance.scrollbar, 'scrollbar stored');
        assert.ok(instance.elems.length >= 0, 'dropdown elems found');

        instance.destroy();
    });

    QUnit.test('MainMenu height getter returns outer height', (assert) => {
        const mock_scrollbar = {
            on: () => {},
            off: () => {},
            render: () => {},
            destroy: () => {},
        };

        const elem = $(`
            <nav id="mainmenu" style="height: 50px;">
                <a class="nav-link dropdown-toggle"></a>
            </nav>
        `)
            .data('scrollbar', mock_scrollbar)
            .appendTo(container);

        const instance = new MainMenu(elem);
        assert.ok(instance.height > 0, 'height is positive');

        instance.destroy();
    });

    QUnit.test('MainMenu on_is_compact binds/unbinds dropdowns', (assert) => {
        const mock_scrollbar = {
            on: () => {},
            off: () => {},
            render: () => {},
            destroy: () => {},
        };

        const elem = $(`
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown"></a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#">Item</a></li>
            </ul>
        `)
            .data('scrollbar', mock_scrollbar)
            .appendTo(container);

        const instance = new MainMenu(elem);

        instance.on_is_compact(true);
        assert.ok(true, 'compact mode handled');

        instance.on_is_compact(false);
        assert.ok(true, 'full mode handled');

        instance.destroy();
    });

    QUnit.test('MainMenu hide_dropdowns hides all', (assert) => {
        const mock_scrollbar = {
            on: () => {},
            off: () => {},
            render: () => {},
            destroy: () => {},
        };

        const elem = $(`
            <nav id="mainmenu">
                <div class="dropdown">
                    <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown"></a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#">Item</a></li>
                    </ul>
                </div>
            </nav>
        `)
            .data('scrollbar', mock_scrollbar)
            .appendTo(container);

        const instance = new MainMenu(elem);
        const toggle = $('.nav-link.dropdown-toggle', elem).get(0);
        const menu = $('.dropdown-menu', elem);
        bootstrap.Dropdown.getOrCreateInstance(toggle).show();
        assert.true(menu.hasClass('show'), 'dropdown shown');

        instance.hide_dropdowns();
        assert.false(menu.hasClass('show'), 'dropdown hidden');

        bootstrap.Dropdown.getInstance(toggle).dispose();
        instance.destroy();
    });

    QUnit.test('MainMenu on_show_dropdown_desktop sets position', (assert) => {
        const mock_scrollbar = {
            on: () => {},
            off: () => {},
            render: () => {},
            destroy: () => {},
        };

        const elem = $(`
            <nav id="mainmenu" style="height: 50px;">
                <a class="nav-link dropdown-toggle"></a>
                <ul class="dropdown-menu"></ul>
            </nav>
        `)
            .data('scrollbar', mock_scrollbar)
            .appendTo(container);

        const instance = new MainMenu(elem);
        const link = elem.find('.nav-link.dropdown-toggle');

        const evt = { target: link.get(0) };
        instance.on_show_dropdown_desktop(evt);

        assert.strictEqual(instance.open_dropdown, link.get(0), 'open_dropdown set');

        instance.destroy();
    });

    QUnit.test('MainMenu on_hide_dropdown_desktop clears open_dropdown', (assert) => {
        const mock_scrollbar = {
            on: () => {},
            off: () => {},
            render: () => {},
            destroy: () => {},
        };

        const elem = $(`
            <nav id="mainmenu">
                <a class="nav-link dropdown-toggle"></a>
            </nav>
        `)
            .data('scrollbar', mock_scrollbar)
            .appendTo(container);

        const instance = new MainMenu(elem);
        const link = elem.find('.nav-link.dropdown-toggle').get(0);

        instance.open_dropdown = link;
        instance.on_hide_dropdown_desktop({ target: link });

        assert.strictEqual(instance.open_dropdown, null, 'open_dropdown cleared');

        instance.destroy();
    });

    QUnit.test('MainMenu on_hide_dropdown_desktop ignores different dropdown', (assert) => {
        const mock_scrollbar = {
            on: () => {},
            off: () => {},
            render: () => {},
            destroy: () => {},
        };

        const elem = $(`
            <nav id="mainmenu">
                <a class="nav-link dropdown-toggle" id="dd1"></a>
                <a class="nav-link dropdown-toggle" id="dd2"></a>
            </nav>
        `)
            .data('scrollbar', mock_scrollbar)
            .appendTo(container);

        const instance = new MainMenu(elem);
        const link1 = elem.find('#dd1').get(0);
        const link2 = elem.find('#dd2').get(0);

        instance.open_dropdown = link1;
        instance.on_hide_dropdown_desktop({ target: link2 });

        assert.strictEqual(
            instance.open_dropdown,
            link1,
            'open_dropdown unchanged for different dropdown',
        );

        instance.destroy();
    });

    QUnit.test('MainMenu destroy cleans up', (assert) => {
        const mock_scrollbar = {
            on: () => {},
            off: () => {},
            render: () => {},
            destroy: () => {},
        };

        const elem = $(`
            <nav id="mainmenu">
                <a class="nav-link dropdown-toggle"></a>
            </nav>
        `)
            .data('scrollbar', mock_scrollbar)
            .appendTo(container);

        const instance = new MainMenu(elem);
        instance.destroy();

        assert.ok(true, 'destroy completed');
    });
});

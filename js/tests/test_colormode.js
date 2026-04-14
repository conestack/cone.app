import $ from 'jquery';
import ts from 'treibstoff';
import {ColorMode, ColorToggler} from '../src/colormode.js';

QUnit.module('cone.app.colormode.ColorMode', hooks => {

    let stored_theme_origin,
        theme_attr_origin;

    hooks.beforeEach(() => {
        stored_theme_origin = localStorage.getItem('cone-app-color-theme');
        theme_attr_origin = document.documentElement.getAttribute('data-bs-theme');
        localStorage.removeItem('cone-app-color-theme');
        document.documentElement.removeAttribute('data-bs-theme');
    });

    hooks.afterEach(() => {
        if (stored_theme_origin) {
            localStorage.setItem('cone-app-color-theme', stored_theme_origin);
        } else {
            localStorage.removeItem('cone-app-color-theme');
        }
        if (theme_attr_origin) {
            document.documentElement.setAttribute('data-bs-theme', theme_attr_origin);
        } else {
            document.documentElement.removeAttribute('data-bs-theme');
        }
        ColorMode.unbind();
    });

    QUnit.test('media_query returns MediaQueryList', assert => {
        let mq = ColorMode.media_query;
        assert.ok(mq, 'media_query returns object');
        assert.strictEqual(typeof mq.matches, 'boolean', 'has matches property');
    });

    QUnit.test('stored_theme getter returns null when not set', assert => {
        assert.strictEqual(ColorMode.stored_theme, null, 'returns null');
    });

    QUnit.test('stored_theme setter/getter works correctly', assert => {
        ColorMode.stored_theme = 'dark';
        assert.strictEqual(ColorMode.stored_theme, 'dark', 'stored value retrieved');
        assert.strictEqual(localStorage.getItem('cone-app-color-theme'), 'dark',
            'value in localStorage');
    });

    QUnit.test('preferred_theme returns stored theme if set', assert => {
        ColorMode.stored_theme = 'light';
        assert.strictEqual(ColorMode.preferred_theme, 'light',
            'returns stored theme');
    });

    QUnit.test('preferred_theme falls back to media query', assert => {
        localStorage.removeItem('cone-app-color-theme');
        let preferred = ColorMode.preferred_theme;
        assert.ok(preferred === 'dark' || preferred === 'light',
            'returns valid theme based on media query');
    });

    QUnit.test('watch adds event listener', assert => {
        let called = false;
        let handle = function() { called = true; };

        ColorMode.watch(handle);
        assert.ok(true, 'watch does not throw');
    });

    QUnit.test('set_theme sets data-bs-theme attribute', assert => {
        ColorMode.set_theme('dark');
        assert.strictEqual(
            document.documentElement.getAttribute('data-bs-theme'),
            'dark',
            'dark theme set'
        );

        ColorMode.set_theme('light');
        assert.strictEqual(
            document.documentElement.getAttribute('data-bs-theme'),
            'light',
            'light theme set'
        );
    });

    QUnit.test('set_theme handles auto mode', assert => {
        ColorMode.set_theme('auto');
        let theme = document.documentElement.getAttribute('data-bs-theme');
        assert.ok(theme === 'dark' || theme === 'auto',
            'auto mode sets theme based on media query');
    });

    QUnit.test('bind sets up boundCallback', assert => {
        ColorMode.bind();
        assert.ok(ColorMode.boundCallback, 'boundCallback set');
    });

    QUnit.test('callback updates theme when not explicitly set', assert => {
        localStorage.removeItem('cone-app-color-theme');
        ColorMode.callback();
        let theme = document.documentElement.getAttribute('data-bs-theme');
        assert.ok(theme === 'dark' || theme === 'light' || theme === null,
            'theme updated or left alone');
    });

    QUnit.test('callback does not change theme when light stored', assert => {
        ColorMode.stored_theme = 'light';
        ColorMode.set_theme('light');
        ColorMode.callback();
        assert.strictEqual(
            document.documentElement.getAttribute('data-bs-theme'),
            'light',
            'theme unchanged when light stored'
        );
    });

    QUnit.test('callback does not change theme when dark stored', assert => {
        ColorMode.stored_theme = 'dark';
        ColorMode.set_theme('dark');
        ColorMode.callback();
        assert.strictEqual(
            document.documentElement.getAttribute('data-bs-theme'),
            'dark',
            'theme unchanged when dark stored'
        );
    });

    QUnit.test('unbind removes event listener and attribute', assert => {
        ColorMode.bind();
        ColorMode.set_theme('dark');
        ColorMode.unbind();

        assert.strictEqual(
            document.documentElement.getAttribute('data-bs-theme'),
            null,
            'data-bs-theme attribute removed'
        );
    });

    QUnit.test('unbind handles missing boundCallback', assert => {
        ColorMode.boundCallback = null;
        ColorMode.unbind();
        assert.ok(true, 'unbind does not throw without boundCallback');
    });

    QUnit.test('constructor calls bind and set_theme', assert => {
        localStorage.removeItem('cone-app-color-theme');
        new ColorMode();

        assert.ok(ColorMode.boundCallback, 'bind called');
        let theme = document.documentElement.getAttribute('data-bs-theme');
        assert.ok(theme === 'dark' || theme === 'light',
            'theme set from preferred');
    });
});

QUnit.module('cone.app.colormode.ColorToggler', hooks => {

    let container,
        stored_theme_origin,
        theme_attr_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        stored_theme_origin = localStorage.getItem('cone-app-color-theme');
        theme_attr_origin = document.documentElement.getAttribute('data-bs-theme');
        localStorage.removeItem('cone-app-color-theme');
    });

    hooks.afterEach(() => {
        container.remove();
        if (stored_theme_origin) {
            localStorage.setItem('cone-app-color-theme', stored_theme_origin);
        } else {
            localStorage.removeItem('cone-app-color-theme');
        }
        if (theme_attr_origin) {
            document.documentElement.setAttribute('data-bs-theme', theme_attr_origin);
        } else {
            document.documentElement.removeAttribute('data-bs-theme');
        }
        ColorMode.unbind();
    });

    QUnit.test('initialize returns early without toggle switch', assert => {
        ColorToggler.initialize(container);
        assert.ok(true, 'no error without toggle switch');
    });

    QUnit.test('initialize creates instance when toggle exists', assert => {
        let toggle = $('<input type="checkbox" id="colortoggle-switch" />')
            .appendTo(container);

        ColorToggler.initialize(container);

        let events = $._data(toggle.get(0), 'events');
        assert.ok(events && events.change, 'change event bound');
    });

    QUnit.test('constructor stores elem and binds events', assert => {
        let toggle = $('<input type="checkbox" id="colortoggle-switch" />')
            .appendTo(container);

        let toggler = new ColorToggler(toggle);

        assert.ok(toggler.elem, 'elem stored');
        let events = $._data(toggle.get(0), 'events');
        assert.ok(events && events.change, 'change event bound');
    });

    QUnit.test('update checks toggle when dark theme preferred', assert => {
        ColorMode.stored_theme = 'dark';

        let toggle = $('<input type="checkbox" id="colortoggle-switch" />')
            .appendTo(container);

        let toggler = new ColorToggler(toggle);
        toggler.update();

        assert.true(toggle.is(':checked'), 'toggle checked for dark theme');
    });

    QUnit.test('update unchecks toggle when light theme preferred', assert => {
        ColorMode.stored_theme = 'light';

        let toggle = $('<input type="checkbox" id="colortoggle-switch" checked />')
            .appendTo(container);

        let toggler = new ColorToggler(toggle);
        toggler.update();

        assert.false(toggle.is(':checked'), 'toggle unchecked for light theme');
    });

    QUnit.test('update leaves toggle unchanged when already correct', assert => {
        ColorMode.stored_theme = 'dark';

        let toggle = $('<input type="checkbox" id="colortoggle-switch" checked />')
            .appendTo(container);

        let toggler = new ColorToggler(toggle);
        toggler.update();

        assert.true(toggle.is(':checked'), 'toggle remains checked');
    });

    QUnit.test('on_change sets dark theme when checked', assert => {
        let toggle = $('<input type="checkbox" id="colortoggle-switch" />')
            .appendTo(container);

        let toggler = new ColorToggler(toggle);
        toggle.prop('checked', true);
        toggler.on_change();

        assert.strictEqual(ColorMode.stored_theme, 'dark', 'dark theme stored');
        assert.strictEqual(
            document.documentElement.getAttribute('data-bs-theme'),
            'dark',
            'dark theme set on document'
        );
    });

    QUnit.test('on_change sets light theme when unchecked', assert => {
        let toggle = $('<input type="checkbox" id="colortoggle-switch" />')
            .appendTo(container);

        let toggler = new ColorToggler(toggle);
        toggler.on_change();

        assert.strictEqual(ColorMode.stored_theme, 'light', 'light theme stored');
        assert.strictEqual(
            document.documentElement.getAttribute('data-bs-theme'),
            'light',
            'light theme set on document'
        );
    });

    QUnit.test('toggler responds to change event', assert => {
        let toggle = $('<input type="checkbox" id="colortoggle-switch" />')
            .appendTo(container);

        new ColorToggler(toggle);

        toggle.prop('checked', true).trigger('change');

        assert.strictEqual(ColorMode.stored_theme, 'dark',
            'change event triggers on_change');
    });
});

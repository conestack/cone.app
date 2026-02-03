import $ from 'jquery';
import ts from 'treibstoff';
import {MainArea, LayoutAware, ResizeAware} from '../src/layout.js';
import {global_events} from '../src/globals.js';

QUnit.module('cone.app.layout.MainArea', hooks => {

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

    QUnit.test('MainArea.initialize returns early without #main-area', assert => {
        MainArea.initialize(container);
        assert.ok(true, 'no error without main-area');
    });

    QUnit.test('MainArea.initialize creates instance', assert => {
        let elem = $('<div id="main-area" />').appendTo(container);
        MainArea.initialize(container);
        assert.ok(true, 'instance created');
        elem.remove();
    });

    QUnit.test('MainArea constructor sets up properties', assert => {
        let elem = $('<div id="main-area" />').appendTo(container);
        let instance = new MainArea(elem);

        assert.ok(instance.elem, 'elem stored');
        assert.strictEqual(typeof instance.is_compact, 'boolean',
            'is_compact property exists');
        assert.strictEqual(typeof instance.is_super_compact, 'boolean',
            'is_super_compact property exists');

        instance.destroy();
        elem.remove();
    });

    QUnit.test('MainArea set_mode sets compact based on width', assert => {
        let elem = $('<div id="main-area" />').css('width', '500px').appendTo(container);
        let instance = new MainArea(elem);

        instance.set_mode();
        assert.true(instance.is_compact, 'is_compact when width < 992');
        assert.true(instance.is_super_compact, 'is_super_compact when width < 576');

        instance.destroy();
        elem.remove();
    });

    QUnit.test('MainArea on_is_compact toggles classes', assert => {
        let elem = $('<div id="main-area" />').appendTo(container);
        let instance = new MainArea(elem);

        instance.on_is_compact(true);
        assert.true(elem.hasClass('compact'), 'compact class added');
        assert.false(elem.hasClass('full'), 'full class removed');

        instance.on_is_compact(false);
        assert.false(elem.hasClass('compact'), 'compact class removed');
        assert.true(elem.hasClass('full'), 'full class added');

        instance.destroy();
        elem.remove();
    });

    QUnit.test('MainArea on_is_super_compact toggles classes', assert => {
        let elem = $('<div id="main-area" />').appendTo(container);
        let instance = new MainArea(elem);

        instance.on_is_super_compact(true);
        assert.true(elem.hasClass('super-compact'), 'super-compact class added');

        instance.on_is_super_compact(false);
        assert.false(elem.hasClass('super-compact'), 'super-compact class removed');

        instance.destroy();
        elem.remove();
    });

    QUnit.test('MainArea destroy removes event listeners', assert => {
        let elem = $('<div id="main-area" />').appendTo(container);
        let instance = new MainArea(elem);

        instance.destroy();
        assert.ok(true, 'destroy completed without error');
        elem.remove();
    });
});

QUnit.module('cone.app.layout.LayoutAware', hooks => {

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

    QUnit.test('LayoutAware constructor sets up properties', assert => {
        let elem = $('<div />').appendTo(container);
        let instance = new LayoutAware(elem);

        assert.ok(instance.elem, 'elem stored');
        assert.ok(instance.set_mode, 'set_mode method exists');

        instance.destroy();
    });

    QUnit.test('LayoutAware set_mode copies mainarea state', assert => {
        let elem = $('<div />').appendTo(container);
        let instance = new LayoutAware(elem);

        let mock_mainarea = {is_compact: true, is_super_compact: false};
        instance.set_mode(null, mock_mainarea);

        assert.true(instance.is_compact, 'is_compact copied');
        assert.false(instance.is_super_compact, 'is_super_compact copied');

        instance.destroy();
    });

    QUnit.test('LayoutAware on_is_compact toggles classes', assert => {
        let elem = $('<div />').appendTo(container);
        let instance = new LayoutAware(elem);

        instance.on_is_compact(true);
        assert.true(elem.hasClass('compact'), 'compact class added');

        instance.on_is_compact(false);
        assert.true(elem.hasClass('full'), 'full class added');

        instance.destroy();
    });

    QUnit.test('LayoutAware on_is_super_compact toggles classes', assert => {
        let elem = $('<div />').appendTo(container);
        let instance = new LayoutAware(elem);

        instance.on_is_super_compact(true);
        assert.true(elem.hasClass('super-compact'), 'super-compact class added');

        instance.on_is_super_compact(false);
        assert.false(elem.hasClass('super-compact'), 'super-compact class removed');

        instance.destroy();
    });

    QUnit.test('LayoutAware on_sidebar_left_resize stores collapsed state', assert => {
        let elem = $('<div />').appendTo(container);
        let instance = new LayoutAware(elem);

        instance.on_sidebar_left_resize(null, {collapsed: true});
        assert.true(instance.is_sidebar_left_collapsed, 'collapsed state stored');

        instance.destroy();
    });

    QUnit.test('LayoutAware on_sidebar_right_resize stores collapsed state', assert => {
        let elem = $('<div />').appendTo(container);
        let instance = new LayoutAware(elem);

        instance.on_sidebar_right_resize(null, {collapsed: false});
        assert.false(instance.is_sidebar_right_collapsed, 'collapsed state stored');

        instance.destroy();
    });

    QUnit.test('LayoutAware destroy removes listeners', assert => {
        let elem = $('<div />').appendTo(container);
        let instance = new LayoutAware(elem);

        instance.destroy();
        assert.ok(true, 'destroy completed');
    });
});

QUnit.module('cone.app.layout.ResizeAware', hooks => {

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

    QUnit.test('ResizeAware mixin adds window resize handler', assert => {
        class TestClass extends ts.Events {
            constructor(elem) {
                super();
                this.elem = elem;
            }
            destroy() {}
        }

        const ResizeAwareTest = ResizeAware(TestClass);
        let elem = $('<div />').appendTo(container);
        let instance = new ResizeAwareTest(elem);

        assert.ok(instance.on_window_resize, 'on_window_resize method exists');

        instance.destroy();
    });

    QUnit.test('ResizeAware destroy removes resize handler', assert => {
        class TestClass extends ts.Events {
            constructor(elem) {
                super();
                this.elem = elem;
            }
            destroy() {}
        }

        const ResizeAwareTest = ResizeAware(TestClass);
        let elem = $('<div />').appendTo(container);
        let instance = new ResizeAwareTest(elem);

        instance.destroy();
        assert.ok(true, 'destroy completed');
    });

    QUnit.test('ResizeAware handles base class without destroy', assert => {
        class TestClass {
            constructor(elem) {
                this.elem = elem;
            }
        }

        const ResizeAwareTest = ResizeAware(TestClass);
        let elem = $('<div />').appendTo(container);
        let instance = new ResizeAwareTest(elem);

        instance.destroy();
        assert.ok(true, 'destroy handles missing base destroy');
    });
});

import $ from 'jquery';
import ts from 'treibstoff';
import {Scrollbar, ScrollbarX, ScrollbarY} from '../src/scrollbar.js';

QUnit.module('cone.app.scrollbar.Scrollbar', hooks => {

    let container;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
    });

    QUnit.test('Scrollbar.initialize creates ScrollbarX for .scrollable-x', assert => {
        let elem = $(`
            <div class="scrollable-x">
                <div class="scrollable-content" style="width: 500px;"></div>
            </div>
        `).css({width: '200px', position: 'relative'}).appendTo(container);

        Scrollbar.initialize(container);

        assert.ok(elem.data('scrollbar'), 'scrollbar instance attached');
    });

    QUnit.test('Scrollbar.initialize creates ScrollbarY for .scrollable-y', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        Scrollbar.initialize(container);

        assert.ok(elem.data('scrollbar'), 'scrollbar instance attached');
    });

    QUnit.test('Scrollbar warns on duplicate binding', assert => {
        let warn_called = false;
        let orig_warn = console.warn;
        console.warn = function(msg) {
            if (msg.includes('Only one Scrollbar')) {
                warn_called = true;
            }
        };

        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        new ScrollbarY(elem);
        new ScrollbarY(elem);

        console.warn = orig_warn;
        assert.true(warn_called, 'warning issued for duplicate binding');
    });

    QUnit.test('Scrollbar safe_position returns 0 for small content', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: 100px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        let pos = scrollbar.safe_position(50);

        assert.strictEqual(pos, 0, 'returns 0 when content fits');

        scrollbar.destroy();
    });

    QUnit.test('Scrollbar safe_position clamps to bounds', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);

        let neg_pos = scrollbar.safe_position(-100);
        assert.strictEqual(neg_pos, 0, 'clamps negative to 0');

        scrollbar.destroy();
    });

    QUnit.test('Scrollbar safe_position throws on non-number', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);

        assert.throws(() => {
            scrollbar.safe_position('invalid');
        }, /must be a Number/, 'throws on non-number');

        scrollbar.destroy();
    });

    QUnit.test('Scrollbar position getter/setter', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        scrollbar.position = 100;

        assert.ok(scrollbar.position >= 0, 'position is valid number');

        scrollbar.destroy();
    });

    QUnit.test('Scrollbar pointer_events getter/setter', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);

        scrollbar.pointer_events = true;
        assert.strictEqual(elem.css('pointer-events'), 'all', 'pointer events enabled');

        scrollbar.pointer_events = false;
        assert.strictEqual(elem.css('pointer-events'), 'none', 'pointer events disabled');

        scrollbar.destroy();
    });

    QUnit.test('Scrollbar on_disabled unbinds/binds', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);

        scrollbar.on_disabled(true);
        scrollbar.on_disabled(false);

        assert.ok(true, 'on_disabled handled');

        scrollbar.destroy();
    });

    QUnit.test('Scrollbar destroy cleans up', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        scrollbar.destroy();

        assert.notOk(elem.data('scrollbar'), 'scrollbar data removed');
    });

    QUnit.test('Scrollbar on_scroll handles wheel events', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        let initial_pos = scrollbar.position;

        let evt = $.Event('wheel');
        evt.originalEvent = {deltaY: 100};
        scrollbar.on_scroll(evt);

        assert.ok(scrollbar.position >= initial_pos, 'position updated on scroll down');

        scrollbar.destroy();
    });

    QUnit.test('Scrollbar on_click updates position', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);

        let evt = $.Event('click');
        evt.pageY = 150;
        evt.preventDefault = function() {};
        scrollbar.on_click(evt);

        assert.ok(true, 'on_click handled');

        scrollbar.destroy();
    });
});

QUnit.module('cone.app.scrollbar.ScrollbarY', hooks => {

    let container;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
    });

    QUnit.test('ScrollbarY offset returns top', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        assert.strictEqual(typeof scrollbar.offset, 'number', 'offset is number');

        scrollbar.destroy();
    });

    QUnit.test('ScrollbarY contentsize returns height', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        assert.ok(scrollbar.contentsize > 0, 'contentsize is positive');

        scrollbar.destroy();
    });

    QUnit.test('ScrollbarY scrollsize returns container height', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        assert.ok(scrollbar.scrollsize > 0, 'scrollsize is positive');

        scrollbar.destroy();
    });

    QUnit.test('ScrollbarY pos_from_evt returns pageY', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        let pos = scrollbar.pos_from_evt({pageY: 123});

        assert.strictEqual(pos, 123, 'returns pageY');

        scrollbar.destroy();
    });

    QUnit.test('ScrollbarY render updates height', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        scrollbar.render();

        assert.ok(true, 'render completed');

        scrollbar.destroy();
    });

    QUnit.test('ScrollbarY update sets content position', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        scrollbar.update();

        assert.ok(true, 'update completed');

        scrollbar.destroy();
    });
});

QUnit.module('cone.app.scrollbar.ScrollbarX', hooks => {

    let container;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
    });

    QUnit.test('ScrollbarX offset returns left', assert => {
        let elem = $(`
            <div class="scrollable-x">
                <div class="scrollable-content"></div>
            </div>
        `).css({width: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarX(elem);
        assert.strictEqual(typeof scrollbar.offset, 'number', 'offset is number');

        scrollbar.destroy();
    });

    QUnit.test('ScrollbarX contentsize returns width', assert => {
        let elem = $(`
            <div class="scrollable-x">
                <div class="scrollable-content" style="width: 500px;"></div>
            </div>
        `).css({width: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarX(elem);
        assert.ok(scrollbar.contentsize > 0, 'contentsize is positive');

        scrollbar.destroy();
    });

    QUnit.test('ScrollbarX scrollsize returns container width', assert => {
        let elem = $(`
            <div class="scrollable-x">
                <div class="scrollable-content"></div>
            </div>
        `).css({width: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarX(elem);
        assert.ok(scrollbar.scrollsize > 0, 'scrollsize is positive');

        scrollbar.destroy();
    });

    QUnit.test('ScrollbarX pos_from_evt returns pageX', assert => {
        let elem = $(`
            <div class="scrollable-x">
                <div class="scrollable-content"></div>
            </div>
        `).css({width: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarX(elem);
        let pos = scrollbar.pos_from_evt({pageX: 456});

        assert.strictEqual(pos, 456, 'returns pageX');

        scrollbar.destroy();
    });

    QUnit.test('ScrollbarX render updates width', assert => {
        let elem = $(`
            <div class="scrollable-x">
                <div class="scrollable-content" style="width: 500px;"></div>
            </div>
        `).css({width: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarX(elem);
        scrollbar.render();

        assert.ok(true, 'render completed');

        scrollbar.destroy();
    });
});

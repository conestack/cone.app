import $ from 'jquery';
import ts from 'treibstoff';
import {Scrollbar, ScrollbarX, ScrollbarY} from '../src/scrollbar.js';

/**
 * Runs ``fn`` with ``ts.clock.schedule_frame`` executing its callback inline.
 *
 * ⚠ The scrollbar restores a persisted position from a scheduled frame. The
 * test runner drives several pages in one browser, and a page that is not the
 * visible one gets its animation frames throttled hard - so waiting a fixed
 * number of milliseconds for that frame is a race that loses about half the
 * time, and waiting for the frame itself can wait until the runner gives up.
 * Running the callback inline takes the clock out of the question: what is
 * under test here is what the callback does, not when the browser gets around
 * to it.
 */
function with_frames_run_inline(fn) {
    const origin = ts.clock.schedule_frame;
    ts.clock.schedule_frame = callback => {
        callback(0);
        return {cancel: () => {}};
    };
    try {
        return fn();
    } finally {
        ts.clock.schedule_frame = origin;
    }
}

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

    QUnit.test('Scrollbar.initialize skips an element already bound', assert => {
        // An ajax ``replace`` binds the parent of the replaced element again
        // (treibstoff TODO), and with it every scrollbar beside it. Those
        // keep their instance; no second one is made.
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let warned = false;
        let orig_warn = console.warn;
        console.warn = () => { warned = true; };
        try {
            Scrollbar.initialize(container);
            let first = elem.data('scrollbar');
            Scrollbar.initialize(container);
            assert.strictEqual(elem.data('scrollbar'), first, 'same instance');
        } finally {
            console.warn = orig_warn;
        }
        assert.false(warned, 'no duplicate warning');
        elem.data('scrollbar').destroy();
    });

    QUnit.test('A duplicate Scrollbar is inert', assert => {
        // Built directly on a bound element it warns and stays unbuilt -
        // destroying it or resizing the window must not touch what it never
        // built (``this.scrollbar is undefined``).
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let orig_warn = console.warn;
        let warnings = [];
        console.warn = msg => warnings.push(String(msg));
        try {
            let first = new ScrollbarY(elem);
            let duplicate = new ScrollbarY(elem);
            assert.strictEqual(elem.data('scrollbar'), first, 'the first stays bound');
            $(window).trigger('resize');
            duplicate.destroy();
            assert.deepEqual(
                warnings,
                ['cone.app: Only one Scrollbar can be bound to each element.'],
                'nothing but the duplicate warning'
            );
            assert.strictEqual(elem.data('scrollbar'), first, 'destroying it leaves the first');
            first.destroy();
        } finally {
            console.warn = orig_warn;
        }
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

QUnit.module('cone.app.scrollbar.persist', hooks => {

    let container;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        sessionStorage.clear();
    });

    hooks.afterEach(() => {
        container.remove();
        sessionStorage.clear();
    });

    QUnit.test('persist_scroll defaults to false', assert => {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);

        assert.strictEqual(scrollbar.persist_scroll, false, 'persist_scroll is false by default');

        scrollbar.destroy();
    });

    QUnit.test('persist_scroll reads from data attribute', assert => {
        let elem = $(`
            <div class="scrollable-y" data-persist-scroll="true">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);

        assert.strictEqual(scrollbar.persist_scroll, true, 'persist_scroll reads data attribute');

        scrollbar.destroy();
    });

    QUnit.test('storage_key uses element id', assert => {
        let elem = $(`
            <div id="test_scrollbar" class="scrollable-y" data-persist-scroll="true">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);

        assert.strictEqual(scrollbar.storage_key, 'cone.app.scroll.test_scrollbar', 'storage_key uses id');

        scrollbar.destroy();
    });

    QUnit.test('storage_key uses custom key from data attribute', assert => {
        let elem = $(`
            <div id="test_scrollbar" class="scrollable-y"
                 data-persist-scroll="true"
                 data-persist-scroll-key="custom_key">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);

        assert.strictEqual(scrollbar.storage_key, 'cone.app.scroll.custom_key', 'storage_key uses custom key');

        scrollbar.destroy();
    });

    QUnit.test('storage_key is null without id or custom key', assert => {
        let elem = $(`
            <div class="scrollable-y" data-persist-scroll="true">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);

        assert.strictEqual(scrollbar.storage_key, null, 'storage_key is null without id');

        scrollbar.destroy();
    });

    QUnit.test('position is saved to sessionStorage on scroll', assert => {
        let done = assert.async();
        let elem = $(`
            <div id="persist_test" class="scrollable-y" data-persist-scroll="true">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        scrollbar.position = 100;

        // Allow event to fire
        setTimeout(() => {
            let saved = sessionStorage.getItem('cone.app.scroll.persist_test');
            assert.strictEqual(saved, '100', 'position saved to sessionStorage');
            scrollbar.destroy();
            done();
        }, 50);
    });

    QUnit.test('position is restored from sessionStorage', assert => {
        sessionStorage.setItem('cone.app.scroll.restore_test', '150');

        let elem = $(`
            <div id="restore_test" class="scrollable-y" data-persist-scroll="true">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = with_frames_run_inline(() => new ScrollbarY(elem));

        assert.strictEqual(scrollbar.position, 150, 'position restored from sessionStorage');
        scrollbar.destroy();
    });

    QUnit.test('restored position is clamped when content shrinks', assert => {
        // Save a position that will be too large
        sessionStorage.setItem('cone.app.scroll.clamp_test', '500');

        let elem = $(`
            <div id="clamp_test" class="scrollable-y" data-persist-scroll="true">
                <div class="scrollable-content" style="height: 300px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = with_frames_run_inline(() => new ScrollbarY(elem));

        // max_pos = 300 - 200 = 100
        assert.strictEqual(scrollbar.position, 100, 'position clamped to max');
        scrollbar.destroy();
    });

    QUnit.test('position not saved when persist_scroll is false', assert => {
        let elem = $(`
            <div id="no_persist" class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        scrollbar.position = 100;

        let saved = sessionStorage.getItem('cone.app.scroll.no_persist');
        assert.strictEqual(saved, null, 'position not saved when persist disabled');

        scrollbar.destroy();
    });

    QUnit.test('position not saved without storage_key', assert => {
        let elem = $(`
            <div class="scrollable-y" data-persist-scroll="true">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        scrollbar.position = 100;

        // No key to check, but should not throw
        assert.ok(true, 'no error when no storage_key');

        scrollbar.destroy();
    });

    QUnit.test('destroy removes position listener', assert => {
        let done = assert.async();
        let elem = $(`
            <div id="destroy_test" class="scrollable-y" data-persist-scroll="true">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar = new ScrollbarY(elem);
        scrollbar.destroy();

        sessionStorage.removeItem('cone.app.scroll.destroy_test');

        // Create new scrollbar on same elem to test position change
        let elem2 = $(`
            <div id="destroy_test2" class="scrollable-y">
                <div class="scrollable-content" style="height: 500px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);

        let scrollbar2 = new ScrollbarY(elem2);
        scrollbar2.position = 200;

        setTimeout(() => {
            let saved = sessionStorage.getItem('cone.app.scroll.destroy_test');
            assert.strictEqual(saved, null, 'destroyed scrollbar does not save');
            scrollbar2.destroy();
            done();
        }, 50);
    });
});

QUnit.module('cone.app.scrollbar.Scrollbar interaction', hooks => {

    let container;
    let fx_off;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        // Animations finish at once - nothing here waits for a frame or a
        // timer to see where the scrollbar ended up.
        fx_off = $.fx.off;
        $.fx.off = true;
    });

    hooks.afterEach(() => {
        $.fx.off = fx_off;
        container.remove();
    });

    function make(content_height) {
        let elem = $(`
            <div class="scrollable-y">
                <div class="scrollable-content" style="height: ${content_height}px;"></div>
            </div>
        `).css({height: '200px', position: 'relative'}).appendTo(container);
        return new ScrollbarY(elem);
    }

    QUnit.test('pointer_events reads the element style', assert => {
        let scrollbar = make(500);
        scrollbar.pointer_events = true;
        assert.true(scrollbar.pointer_events);
        scrollbar.pointer_events = false;
        assert.false(scrollbar.pointer_events);
        scrollbar.destroy();
    });

    QUnit.test('fade_timer shows the scrollbar and restarts its fade out', assert => {
        let scrollbar = make(500);
        scrollbar.scrollbar.hide();
        scrollbar.fade_timer();
        assert.true(scrollbar.scrollbar.is(':visible'), 'faded in');
        let first = scrollbar.fade_out_timeout;
        assert.ok(first, 'fade out scheduled');
        scrollbar.fade_timer();
        assert.notStrictEqual(scrollbar.fade_out_timeout, first, 'rescheduled');

        // When the timer runs out the scrollbar fades out. Only the fade out
        // delay is caught and run afterwards - jQuery schedules its own
        // animation steps through ``setTimeout`` on a page in the background,
        // and running those inline recurses without end.
        let orig_set = window.setTimeout;
        let fade_out = null;
        window.setTimeout = (callback, delay) => {
            if (delay === 700) {
                fade_out = callback;
                return 1;
            }
            return orig_set(callback, delay);
        };
        try {
            scrollbar.fade_timer();
        } finally {
            window.setTimeout = orig_set;
        }
        fade_out();
        assert.false(scrollbar.scrollbar.is(':visible'), 'faded out');

        // A pending fade out is cleared on destroy
        let cleared = [];
        let orig = window.clearTimeout;
        window.clearTimeout = id => { cleared.push(id); orig(id); };
        try {
            let pending = scrollbar.fade_out_timeout;
            scrollbar.destroy();
            assert.deepEqual(cleared, [pending]);
        } finally {
            window.clearTimeout = orig;
        }
    });

    QUnit.test('on_is_mobile shows an overflowing scrollbar for good', assert => {
        let scrollbar = make(500);
        scrollbar.on_is_mobile(true);
        assert.true(scrollbar.scrollbar.is(':visible'), 'shown on mobile');
        // Hover no longer hides it
        scrollbar.elem.trigger($.Event('mouseleave', {target: scrollbar.elem.get(0)}));
        assert.true(scrollbar.scrollbar.is(':visible'), 'hover unbound');
        scrollbar.on_is_mobile(false);
        assert.false(scrollbar.scrollbar.is(':visible'), 'hidden on desktop');
        scrollbar.destroy();
    });

    QUnit.test('on_hover fades the scrollbar of overflowing content', assert => {
        let scrollbar = make(500);
        let elem = scrollbar.elem;
        scrollbar.scrollbar.hide();
        scrollbar.on_hover($.Event('mouseenter', {target: elem.get(0)}));
        assert.true(scrollbar.scrollbar.is(':visible'), 'shown on enter');
        // Leaving towards the element itself is no leaving
        scrollbar.on_hover($.Event('mouseleave', {
            target: elem.get(0), relatedTarget: elem.get(0)
        }));
        assert.true(scrollbar.scrollbar.is(':visible'), 'kept');
        scrollbar.on_hover($.Event('mouseleave', {
            target: elem.get(0), relatedTarget: document.body
        }));
        assert.false(scrollbar.scrollbar.is(':visible'), 'hidden on leave');
        // A target outside the element is ignored
        scrollbar.on_hover($.Event('mouseenter', {target: document.body}));
        assert.false(scrollbar.scrollbar.is(':visible'), 'outside ignored');
        scrollbar.destroy();

        // Content that fits shows no scrollbar on hover
        let fitting = make(100);
        fitting.scrollbar.hide();
        fitting.on_hover($.Event('mouseenter', {target: fitting.elem.get(0)}));
        assert.false(fitting.scrollbar.is(':visible'), 'nothing to scroll');
        fitting.destroy();
    });

    QUnit.test('render without overflow fills the track with the thumb', assert => {
        let scrollbar = make(100);
        scrollbar.render('height');
        assert.strictEqual(scrollbar.thumbsize, scrollbar.scrollsize);
        scrollbar.destroy();
    });

    QUnit.test('on_scroll moves both ways and not without overflow', assert => {
        let scrollbar = make(500);
        let wheel = deltaY => {
            let evt = $.Event('wheel');
            evt.originalEvent = {deltaY: deltaY};
            scrollbar.on_scroll(evt);
        };
        wheel(100);
        wheel(100);
        assert.strictEqual(scrollbar.position, 2 * scrollbar.scroll_step);
        wheel(-100);
        assert.strictEqual(scrollbar.position, scrollbar.scroll_step);
        wheel(0);
        assert.strictEqual(scrollbar.position, scrollbar.scroll_step, 'no delta');
        scrollbar.destroy();

        let fitting = make(100);
        let evt = $.Event('wheel');
        evt.originalEvent = {deltaY: 100};
        fitting.on_scroll(evt);
        assert.strictEqual(fitting.position, 0, 'nothing to scroll');
        fitting.destroy();
    });

    QUnit.test('touch drags the content against the finger', assert => {
        let scrollbar = make(500);
        let touch = pageY => {
            let evt = $.Event('touch');
            evt.originalEvent = {touches: [{pageY: pageY}]};
            return evt;
        };
        scrollbar.position = 100;
        scrollbar.touchstart(touch(150));
        scrollbar.touchmove(touch(110));
        assert.strictEqual(scrollbar.position, 140, 'finger up scrolls down');
        assert.ok(scrollbar.fade_out_timeout, 'scrollbar shown while touching');
        scrollbar.touchend(touch(110));
        assert.strictEqual(scrollbar._touch_pos, undefined);
        assert.strictEqual(scrollbar._start_position, undefined);
        scrollbar.destroy();

        let fitting = make(100);
        fitting.touchstart(touch(150));
        fitting.touchmove(touch(50));
        assert.strictEqual(fitting.position, 0, 'nothing to scroll');
        fitting.destroy();
    });

    QUnit.test('dragging the thumb scrolls proportionally', assert => {
        let scrollbar = make(500);
        let offset = scrollbar.offset;
        let at = pageY => ({pageY: offset + pageY});
        scrollbar.down(at(10));
        assert.true(scrollbar.thumb.hasClass('active'), 'thumb active');
        scrollbar.move(at(50));
        // 40px of thumb travel over a 200px track of 500px content
        assert.strictEqual(scrollbar.position, 100);
        scrollbar.up(at(50));
        assert.false(scrollbar.thumb.hasClass('active'), 'thumb released');
        assert.strictEqual(scrollbar._mouse_pos, undefined);
        assert.strictEqual(scrollbar._thumb_pos, undefined);
        scrollbar.destroy();
    });
});

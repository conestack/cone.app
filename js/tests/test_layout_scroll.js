import $ from 'jquery';

/**
 * Where the content scrolls, and where it does not.
 *
 * ⛔ The defect this pins: ``#content`` used to be the scrolling box **and**
 * carry the width limit of ``limit_content_width`` / ``limit_page_width``. The
 * strip left over beside a limited content then belonged to no scrollable
 * element at all - a wheel event there walked up to ``#content_area`` and
 * ``body``, neither of which overflows, and nothing moved. The strip reads as
 * part of the page, so it looked like the mouse wheel was broken.
 *
 * None of this is JavaScript. It is CSS plus the nesting in ``layout.pt``, and
 * only a real browser can answer it - which is why it lives here and not in
 * the python tests. Those pin the markup contract (the wrapper exists, it
 * carries ``overflow-auto``, ``#content`` does not); this pins what the
 * browser then does with it.
 */

// The files the browser actually gets, in the order it gets them: the
// utilities carrying the layout - ``d-flex``, ``overflow-auto``,
// ``container-xxl`` - live in bootstrap, the rules for ``#content_scroll``
// and ``#content`` in cone.app.css on top of it. Taken from the package's own
// static directory and not from node_modules, so the test cannot pass against
// a bootstrap the application does not ship.
const STYLESHEETS = [
    '/src/cone/app/browser/static/bootstrap/css/bootstrap.css',
    '/src/cone/app/browser/static/cone/cone.app.css'
];

function load_stylesheet(href) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => resolve(link);
        link.onerror = () => reject(new Error(`not served: ${href}`));
        document.head.appendChild(link);
    });
}

/**
 * The layout row of ``layout.pt``, reduced to what carries the geometry.
 *
 * ⚠ ``#content`` gets its width limit from an inline ``max-width`` on top of
 * ``container-xxl``. The class alone only bites above the xxl breakpoint and
 * the test runner's viewport is well below it, so without this the content
 * would fill the row, there would be no strip, and every assertion below
 * would pass while testing nothing. That the class lands on ``#content`` and
 * not on the wrapper is pinned in ``test_browser_layout.py``.
 */
function build_layout(container, options = {}) {
    const area = $('<div id="content_area" class="d-flex" />').appendTo(container);
    $('<div id="sidebar_left" class="d-flex flex-column flex-shrink-0" />')
        .css('width', '100px')
        .appendTo(area);
    const scroll = $('<div id="content_scroll" class="overflow-auto" />').appendTo(area);
    const content = $(
        '<div id="content" class="d-flex flex-column px-3 pb-4 py-2 container-xxl ms-0" />'
    ).css('max-width', '200px').appendTo(scroll);
    // Taller than the row, or nothing overflows and nothing scrolls.
    $('<div />').css('height', '900px').appendTo(content);
    const sidebar_right = options.sidebar_right
        ? $('<div id="sidebar_right" class="d-flex flex-column flex-shrink-0 px-0 pb-5" />')
            .css('width', '120px')
            .appendTo(area)
        : null;
    return {
        area: area[0],
        scroll: scroll[0],
        content: content[0],
        sidebar_right: sidebar_right ? sidebar_right[0] : null
    };
}

/**
 * The element a wheel event at this point would actually scroll.
 *
 * This is the question the defect turned on: not which element is under the
 * cursor, but which of its ancestors takes the scroll. Walking it explicitly
 * makes the assertion say what the browser does.
 */
function scroll_target_at(x, y) {
    let elem = document.elementFromPoint(x, y);
    while (elem && elem !== document.documentElement) {
        const overflow = getComputedStyle(elem).overflowY;
        const scrollable = overflow === 'auto' || overflow === 'scroll';
        if (scrollable && elem.scrollHeight > elem.clientHeight) {
            return elem;
        }
        elem = elem.parentElement;
    }
    return null;
}

/** Horizontal centre of the empty strip beside the width limited content. */
function strip_center(scroll, content) {
    const scroll_box = scroll.getBoundingClientRect();
    const content_box = content.getBoundingClientRect();
    // ``clientWidth`` and not the bounding box: a classic scrollbar sits
    // inside the border box and is not part of the strip.
    const strip_end = scroll_box.left + scroll.clientWidth;
    return {
        x: (content_box.right + strip_end) / 2,
        y: scroll_box.top + scroll_box.height / 2,
        width: strip_end - content_box.right
    };
}

QUnit.module('cone.app.layout scrolling', hooks => {

    let stylesheets, container;

    hooks.before(async () => {
        stylesheets = [];
        // Sequentially: cone.app.css overrides bootstrap, and a link element
        // added later wins only if it is also later in the document.
        for (const href of STYLESHEETS) {
            stylesheets.push(await load_stylesheet(href));
        }
    });

    hooks.after(() => {
        stylesheets.forEach(link => link.remove());
    });

    hooks.beforeEach(() => {
        // Fixed and on top: ``elementFromPoint`` only answers for what is
        // inside the viewport, and the runner puts its own markup on the page.
        container = $('<div />').css({
            position: 'fixed',
            top: 0,
            left: 0,
            width: '600px',
            height: '300px',
            background: '#fff',
            'z-index': 9999
        }).appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
    });

    QUnit.test('the wrapper is the scrolling box, not the content', assert => {
        const {scroll, content} = build_layout(container);

        assert.true(
            scroll.scrollHeight > scroll.clientHeight,
            '#content_scroll overflows and scrolls'
        );
        assert.strictEqual(
            getComputedStyle(scroll).overflowY,
            'auto',
            '#content_scroll carries the overflow'
        );
        assert.strictEqual(
            getComputedStyle(content).overflowY,
            'visible',
            '#content does not scroll itself'
        );
    });

    QUnit.test('the content keeps its width limit inside the wrapper', assert => {
        const {scroll, content} = build_layout(container);

        assert.true(
            content.getBoundingClientRect().width < scroll.clientWidth,
            'the limit still narrows the content'
        );
    });

    QUnit.test('the strip beside the content scrolls the content', assert => {
        const {scroll, content} = build_layout(container);
        const strip = strip_center(scroll, content);

        assert.true(strip.width > 10, `strip is ${strip.width}px wide`);
        assert.strictEqual(
            scroll_target_at(strip.x, strip.y),
            scroll,
            'a wheel event in the strip scrolls #content_scroll'
        );
    });

    QUnit.test('the strip scrolls the content beside sidebar_right', assert => {
        const {scroll, content, sidebar_right} = build_layout(
            container, {sidebar_right: true}
        );
        const strip = strip_center(scroll, content);

        assert.true(strip.width > 10, `strip is ${strip.width}px wide`);
        assert.strictEqual(
            scroll_target_at(strip.x, strip.y),
            scroll,
            'a wheel event in the strip scrolls #content_scroll'
        );
        // The two scrollbars must not sit on top of each other: the content's
        // ends where the sidebar begins, the sidebar brings its own.
        assert.true(
            scroll.getBoundingClientRect().right
                <= sidebar_right.getBoundingClientRect().left + 1,
            'the wrapper stops at sidebar_right'
        );
    });

    QUnit.test('a point over sidebar_right does not scroll the content', assert => {
        const {scroll, sidebar_right} = build_layout(container, {sidebar_right: true});
        const box = sidebar_right.getBoundingClientRect();

        assert.notStrictEqual(
            scroll_target_at(box.left + box.width / 2, box.top + box.height / 2),
            scroll,
            'the sidebar is not part of the content scroller'
        );
    });
});

import $ from 'jquery';
import ts from 'treibstoff';
import { LiveSearch } from '../src/livesearch.js';

QUnit.module('cone.app.livesearch', (hooks) => {
    let container,
        http_request_origin,
        query_elem_origin,
        compile_template_origin,
        clock_schedule_frame_origin,
        clock_schedule_timeout_origin,
        cone_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        http_request_origin = ts.http_request;
        query_elem_origin = ts.query_elem;
        compile_template_origin = ts.compile_template;
        clock_schedule_frame_origin = ts.clock.schedule_frame;
        clock_schedule_timeout_origin = ts.clock.schedule_timeout;
        cone_origin = window.cone;

        // Default mock for compile_template
        ts.compile_template = (inst, template, target) => {
            const html = $(template);
            html.appendTo(target);
            // Set result elem if t-elem="result" exists
            let result_elem = html.filter('[t-elem="result"]');
            if (result_elem.length) {
                inst.result = result_elem;
            }
            result_elem = html.find('[t-elem="result"]');
            if (result_elem.length) {
                inst.result = result_elem;
            }
        };
    });

    hooks.afterEach(() => {
        container.remove();
        ts.http_request = http_request_origin;
        ts.query_elem = query_elem_origin;
        ts.compile_template = compile_template_origin;
        ts.clock.schedule_frame = clock_schedule_frame_origin;
        ts.clock.schedule_timeout = clock_schedule_timeout_origin;
        if (cone_origin === undefined) {
            delete window.cone;
        } else {
            window.cone = cone_origin;
        }
    });

    QUnit.test('LiveSearch.initialize creates instance when element exists', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        ts.query_elem = (selector, context) => $(selector, context);

        // Mock clock methods
        ts.clock.schedule_frame = (cb) => {
            cb();
        };
        ts.clock.schedule_timeout = (_cb, _delay) => ({ cancel: () => {} });

        // Pass LiveSearch as factory to avoid referencing global cone
        LiveSearch.initialize(container, LiveSearch);

        const events = $._data(input.get(0), 'events');
        assert.ok(events?.keydown, 'keydown event bound');
        assert.ok(events?.change, 'change event bound');
    });

    QUnit.test('LiveSearch.initialize does nothing without element', (assert) => {
        ts.query_elem = () => null;

        // Should not throw
        LiveSearch.initialize(container);
        assert.ok(true, 'no error when element not found');
    });

    QUnit.test('LiveSearch.initialize accepts custom factory', (assert) => {
        $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        ts.query_elem = (selector, context) => $(selector, context);

        let custom_created = false;
        class CustomLiveSearch extends LiveSearch {
            constructor(elem) {
                super(elem);
                custom_created = true;
            }
        }

        LiveSearch.initialize(container, CustomLiveSearch);

        assert.true(custom_created, 'custom factory used');
    });

    QUnit.test('LiveSearch.initialize defaults to global cone.LiveSearch', (assert) => {
        $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let created_with = null;
        window.cone = {
            LiveSearch: class {
                constructor(elem) {
                    created_with = elem;
                }
            },
        };

        LiveSearch.initialize(container);

        assert.strictEqual(created_with.attr('id'), 'search-text', 'global factory used');
    });

    QUnit.test('LiveSearch constructor initializes properties', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        const livesearch = new LiveSearch(input);

        assert.strictEqual(livesearch.elem, input, 'elem stored');
        assert.strictEqual(livesearch.target, '/api/livesearch', 'target constructed');
        assert.strictEqual(livesearch._term, '', 'initial term empty');
        assert.strictEqual(livesearch._minlen, 3, 'default minlen is 3');
        assert.strictEqual(livesearch._delay, 250, 'default delay is 250ms');
        assert.strictEqual(livesearch._timeout_event, null, 'no pending timeout');
        assert.false(livesearch._in_progress, 'not in progress');
    });

    QUnit.test('LiveSearch search sends http request', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let request_opts = null;
        ts.http_request = (opts) => {
            request_opts = opts;
        };

        const livesearch = new LiveSearch(input);
        livesearch._term = 'test query';
        livesearch.search();

        assert.strictEqual(request_opts.url, '/api/livesearch', 'correct url');
        assert.strictEqual(request_opts.params.term, 'test query', 'term in params');
        assert.strictEqual(request_opts.type, 'json', 'json type');
        assert.ok(request_opts.success, 'success callback provided');
    });

    QUnit.test('LiveSearch on_result renders results', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        const content = $('<div id="content" />').appendTo(container);

        const livesearch = new LiveSearch(input);
        livesearch._term = 'test';

        const data = [
            { target: '/item1', icon: 'fa-file', value: 'Item 1', description: 'Desc 1' },
            { target: '/item2', icon: 'fa-folder', value: 'Item 2' },
        ];

        livesearch.on_result(data, 'success', {});

        assert.ok(content.find('.card').length > 0, 'card rendered');
    });

    QUnit.test('LiveSearch on_result handles empty results', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        const content = $('<div id="content" />').appendTo(container);

        const livesearch = new LiveSearch(input);
        livesearch._term = 'nomatch';

        livesearch.on_result([], 'success', {});

        assert.ok(content.find('.card').length > 0, 'card still rendered');
    });

    QUnit.test('LiveSearch on_keydown ignores Enter key', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let frame_scheduled = false;
        ts.clock.schedule_frame = () => {
            frame_scheduled = true;
        };

        new LiveSearch(input);

        const evt = new $.Event('keydown', { keyCode: 13 });
        input.trigger(evt);

        assert.false(frame_scheduled, 'no frame scheduled for Enter');
    });

    QUnit.test('LiveSearch on_keydown schedules frame for other keys', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let frame_scheduled = false;
        ts.clock.schedule_frame = (_cb) => {
            frame_scheduled = true;
        };

        new LiveSearch(input);

        const evt = new $.Event('keydown', { keyCode: 65 });
        input.trigger(evt);

        assert.true(frame_scheduled, 'frame scheduled for other keys');
    });

    QUnit.test('LiveSearch on_keydown triggers change if term changed', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        ts.clock.schedule_frame = (cb) => {
            cb();
        };
        ts.clock.schedule_timeout = () => ({ cancel: () => {} });

        new LiveSearch(input);
        let changes = 0;
        input.on('change', () => {
            changes++;
        });

        input.val('term');
        input.trigger(new $.Event('keydown', { keyCode: 65 }));
        assert.strictEqual(changes, 1, 'change triggered for changed term');

        input.trigger(new $.Event('keydown', { keyCode: 65 }));
        assert.strictEqual(changes, 1, 'no change triggered for unchanged term');
    });

    QUnit.test('LiveSearch on_change timeout performs search', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let timeout_cb = null;
        ts.clock.schedule_timeout = (cb) => {
            timeout_cb = cb;
            return { cancel: () => {} };
        };
        let request_opts = null;
        ts.http_request = (opts) => {
            request_opts = opts;
        };

        const livesearch = new LiveSearch(input);
        input.val('test');
        livesearch.on_change({});
        assert.strictEqual(request_opts, null, 'no search before timeout');

        timeout_cb();
        assert.strictEqual(livesearch._timeout_event, null, 'timeout event reset');
        assert.strictEqual(request_opts.url, '/api/livesearch', 'search url');
        assert.deepEqual(request_opts.params, { term: 'test' }, 'search term');
    });

    QUnit.test('LiveSearch on_change ignores when in progress', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let timeout_scheduled = false;
        ts.clock.schedule_timeout = () => {
            timeout_scheduled = true;
            return { cancel: () => {} };
        };

        const livesearch = new LiveSearch(input);
        livesearch._in_progress = true;
        input.val('test');
        livesearch.on_change({});

        assert.false(timeout_scheduled, 'no timeout when in progress');
    });

    QUnit.test('LiveSearch on_change ignores unchanged term', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let timeout_scheduled = false;
        ts.clock.schedule_timeout = () => {
            timeout_scheduled = true;
            return { cancel: () => {} };
        };

        const livesearch = new LiveSearch(input);
        livesearch._term = 'same';
        input.val('same');
        livesearch.on_change({});

        assert.false(timeout_scheduled, 'no timeout when term unchanged');
    });

    QUnit.test('LiveSearch on_change ignores short terms', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let timeout_scheduled = false;
        ts.clock.schedule_timeout = () => {
            timeout_scheduled = true;
            return { cancel: () => {} };
        };

        const livesearch = new LiveSearch(input);
        input.val('ab');
        livesearch.on_change({});

        assert.strictEqual(livesearch._term, 'ab', 'term updated');
        assert.false(timeout_scheduled, 'no timeout for short term');
    });

    QUnit.test('LiveSearch on_change schedules search for valid term', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let timeout_scheduled = false;
        let timeout_delay = null;
        ts.clock.schedule_timeout = (_cb, delay) => {
            timeout_scheduled = true;
            timeout_delay = delay;
            return { cancel: () => {} };
        };

        const livesearch = new LiveSearch(input);
        input.val('test');
        livesearch.on_change({});

        assert.true(timeout_scheduled, 'timeout scheduled');
        assert.strictEqual(timeout_delay, 250, 'correct delay');
        assert.strictEqual(livesearch._term, 'test', 'term updated');
    });

    QUnit.test('LiveSearch on_change cancels previous timeout', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let cancelled = false;
        ts.clock.schedule_timeout = (_cb, _delay) => ({
            cancel: () => {
                cancelled = true;
            },
        });

        const livesearch = new LiveSearch(input);
        input.val('first');
        livesearch.on_change({});

        input.val('second');
        livesearch.on_change({});

        assert.true(cancelled, 'previous timeout cancelled');
    });

    QUnit.test('LiveSearch render_no_results displays message', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let rendered_template = null;
        ts.compile_template = (_inst, template, _target) => {
            rendered_template = template;
        };

        const livesearch = new LiveSearch(input);
        livesearch.result = $('<div />');
        livesearch.render_no_results();

        assert.ok(rendered_template.includes('No search results'), 'no results message rendered');
    });

    QUnit.test('LiveSearch render_suggestion displays item', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let rendered_template = null;
        ts.compile_template = (_inst, template, _target) => {
            rendered_template = template;
        };

        const livesearch = new LiveSearch(input);
        livesearch.result = $('<div />');

        const item = {
            target: '/items/1',
            icon: 'fa-file',
            value: 'Test Item',
            description: 'Test description',
        };
        livesearch.render_suggestion(item);

        assert.ok(rendered_template.includes('/items/1'), 'target in template');
        assert.ok(rendered_template.includes('fa-file'), 'icon in template');
        assert.ok(rendered_template.includes('Test Item'), 'value in template');
        assert.ok(rendered_template.includes('Test description'), 'description in template');
    });

    QUnit.test('LiveSearch render_suggestion handles missing description', (assert) => {
        const input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let rendered_template = null;
        ts.compile_template = (_inst, template, _target) => {
            rendered_template = template;
        };

        const livesearch = new LiveSearch(input);
        livesearch.result = $('<div />');

        const item = {
            target: '/items/1',
            icon: 'fa-file',
            value: 'Test Item',
        };
        livesearch.render_suggestion(item);

        assert.ok(rendered_template.includes('Test Item'), 'value in template');
        assert.false(rendered_template.includes('undefined'), 'undefined not in template');
    });
});

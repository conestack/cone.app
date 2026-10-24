import $ from 'jquery';
import ts from 'treibstoff';
import {LiveSearch} from '../src/livesearch.js';

QUnit.module('cone.app.livesearch', hooks => {

    let container,
        http_request_origin,
        query_elem_origin,
        compile_template_origin,
        clock_schedule_frame_origin,
        clock_schedule_timeout_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        http_request_origin = ts.http_request;
        query_elem_origin = ts.query_elem;
        compile_template_origin = ts.compile_template;
        clock_schedule_frame_origin = ts.clock.schedule_frame;
        clock_schedule_timeout_origin = ts.clock.schedule_timeout;

        // Default mock for compile_template
        ts.compile_template = function(inst, template, target) {
            let html = $(template);
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
    });

    QUnit.test('LiveSearch.initialize creates instance when element exists', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        ts.query_elem = function(selector, context) {
            return $(selector, context);
        };

        // Mock clock methods
        ts.clock.schedule_frame = function(cb) { cb(); };
        ts.clock.schedule_timeout = function(cb, delay) {
            return {cancel: function() {}};
        };

        // Pass LiveSearch as factory to avoid referencing global cone
        LiveSearch.initialize(container, LiveSearch);

        let events = $._data(input.get(0), 'events');
        assert.ok(events && events.keydown, 'keydown event bound');
        assert.ok(events && events.change, 'change event bound');
    });

    QUnit.test('LiveSearch.initialize does nothing without element', assert => {
        ts.query_elem = function() { return null; };

        // Should not throw
        LiveSearch.initialize(container);
        assert.ok(true, 'no error when element not found');
    });

    QUnit.test('LiveSearch.initialize accepts custom factory', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        ts.query_elem = function(selector, context) {
            return $(selector, context);
        };

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

    QUnit.test('LiveSearch constructor initializes properties', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let livesearch = new LiveSearch(input);

        assert.strictEqual(livesearch.elem, input, 'elem stored');
        assert.strictEqual(livesearch.target, '/api/livesearch', 'target constructed');
        assert.strictEqual(livesearch._term, '', 'initial term empty');
        assert.strictEqual(livesearch._minlen, 3, 'default minlen is 3');
        assert.strictEqual(livesearch._delay, 250, 'default delay is 250ms');
        assert.strictEqual(livesearch._timeout_event, null, 'no pending timeout');
        assert.false(livesearch._in_progress, 'not in progress');
    });

    QUnit.test('LiveSearch search sends http request', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let request_opts = null;
        ts.http_request = function(opts) {
            request_opts = opts;
        };

        let livesearch = new LiveSearch(input);
        livesearch._term = 'test query';
        livesearch.search();

        assert.strictEqual(request_opts.url, '/api/livesearch', 'correct url');
        assert.strictEqual(request_opts.params.term, 'test query', 'term in params');
        assert.strictEqual(request_opts.type, 'json', 'json type');
        assert.ok(request_opts.success, 'success callback provided');
    });

    QUnit.test('LiveSearch on_result renders results', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        let content = $('<div id="content" />').appendTo(container);

        let livesearch = new LiveSearch(input);
        livesearch._term = 'test';

        let data = [
            {target: '/item1', icon: 'fa-file', value: 'Item 1', description: 'Desc 1'},
            {target: '/item2', icon: 'fa-folder', value: 'Item 2'}
        ];

        livesearch.on_result(data, 'success', {});

        assert.ok(content.find('.card').length > 0, 'card rendered');
    });

    QUnit.test('LiveSearch on_result handles empty results', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        let content = $('<div id="content" />').appendTo(container);

        let livesearch = new LiveSearch(input);
        livesearch._term = 'nomatch';

        livesearch.on_result([], 'success', {});

        assert.ok(content.find('.card').length > 0, 'card still rendered');
    });

    QUnit.test('LiveSearch on_keydown ignores Enter key', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let frame_scheduled = false;
        ts.clock.schedule_frame = function() {
            frame_scheduled = true;
        };

        let livesearch = new LiveSearch(input);

        let evt = new $.Event('keydown', {keyCode: 13});
        input.trigger(evt);

        assert.false(frame_scheduled, 'no frame scheduled for Enter');
    });

    QUnit.test('LiveSearch on_keydown schedules frame for other keys', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let frame_scheduled = false;
        ts.clock.schedule_frame = function(cb) {
            frame_scheduled = true;
        };

        let livesearch = new LiveSearch(input);

        let evt = new $.Event('keydown', {keyCode: 65});
        input.trigger(evt);

        assert.true(frame_scheduled, 'frame scheduled for other keys');
    });

    QUnit.test('LiveSearch on_change ignores when in progress', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let timeout_scheduled = false;
        ts.clock.schedule_timeout = function() {
            timeout_scheduled = true;
            return {cancel: function() {}};
        };

        let livesearch = new LiveSearch(input);
        livesearch._in_progress = true;
        input.val('test');
        livesearch.on_change({});

        assert.false(timeout_scheduled, 'no timeout when in progress');
    });

    QUnit.test('LiveSearch on_change ignores unchanged term', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let timeout_scheduled = false;
        ts.clock.schedule_timeout = function() {
            timeout_scheduled = true;
            return {cancel: function() {}};
        };

        let livesearch = new LiveSearch(input);
        livesearch._term = 'same';
        input.val('same');
        livesearch.on_change({});

        assert.false(timeout_scheduled, 'no timeout when term unchanged');
    });

    QUnit.test('LiveSearch on_change ignores short terms', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let timeout_scheduled = false;
        ts.clock.schedule_timeout = function() {
            timeout_scheduled = true;
            return {cancel: function() {}};
        };

        let livesearch = new LiveSearch(input);
        input.val('ab');
        livesearch.on_change({});

        assert.strictEqual(livesearch._term, 'ab', 'term updated');
        assert.false(timeout_scheduled, 'no timeout for short term');
    });

    QUnit.test('LiveSearch on_change schedules search for valid term', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let timeout_scheduled = false;
        let timeout_delay = null;
        ts.clock.schedule_timeout = function(cb, delay) {
            timeout_scheduled = true;
            timeout_delay = delay;
            return {cancel: function() {}};
        };

        let livesearch = new LiveSearch(input);
        input.val('test');
        livesearch.on_change({});

        assert.true(timeout_scheduled, 'timeout scheduled');
        assert.strictEqual(timeout_delay, 250, 'correct delay');
        assert.strictEqual(livesearch._term, 'test', 'term updated');
    });

    QUnit.test('LiveSearch on_change cancels previous timeout', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let cancelled = false;
        ts.clock.schedule_timeout = function(cb, delay) {
            return {
                cancel: function() { cancelled = true; }
            };
        };

        let livesearch = new LiveSearch(input);
        input.val('first');
        livesearch.on_change({});

        input.val('second');
        livesearch.on_change({});

        assert.true(cancelled, 'previous timeout cancelled');
    });

    QUnit.test('LiveSearch render_no_results displays message', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let rendered_template = null;
        ts.compile_template = function(inst, template, target) {
            rendered_template = template;
        };

        let livesearch = new LiveSearch(input);
        livesearch.result = $('<div />');
        livesearch.render_no_results();

        assert.ok(rendered_template.includes('No search results'),
            'no results message rendered');
    });

    QUnit.test('LiveSearch render_suggestion displays item', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let rendered_template = null;
        ts.compile_template = function(inst, template, target) {
            rendered_template = template;
        };

        let livesearch = new LiveSearch(input);
        livesearch.result = $('<div />');

        let item = {
            target: '/items/1',
            icon: 'fa-file',
            value: 'Test Item',
            description: 'Test description'
        };
        livesearch.render_suggestion(item);

        assert.ok(rendered_template.includes('/items/1'), 'target in template');
        assert.ok(rendered_template.includes('fa-file'), 'icon in template');
        assert.ok(rendered_template.includes('Test Item'), 'value in template');
        assert.ok(rendered_template.includes('Test description'),
            'description in template');
    });

    QUnit.test('LiveSearch render_suggestion handles missing description', assert => {
        let input = $(`
            <input id="search-text" data-search-target="/api" />
        `).appendTo(container);
        $('<div id="content" />').appendTo(container);

        let rendered_template = null;
        ts.compile_template = function(inst, template, target) {
            rendered_template = template;
        };

        let livesearch = new LiveSearch(input);
        livesearch.result = $('<div />');

        let item = {
            target: '/items/1',
            icon: 'fa-file',
            value: 'Test Item'
        };
        livesearch.render_suggestion(item);

        assert.ok(rendered_template.includes('Test Item'), 'value in template');
        assert.false(rendered_template.includes('undefined'),
            'undefined not in template');
    });
});

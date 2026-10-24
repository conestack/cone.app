import $ from 'jquery';
import ts from 'treibstoff';
import {
    BatchedItemsFilter,
    BatchedItemsSize,
    BatchedItemsSearch,
    batcheditems_handle_filter,
    batcheditems_size_binder,
    batcheditems_filter_binder
} from '../src/batcheditems.js';

QUnit.module('cone.app.batcheditems.BatchedItemsFilter', hooks => {

    let container,
        ajax_trigger_origin,
        ajax_path_origin,
        ajax_parse_target_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_trigger_origin = ts.ajax.trigger;
        ajax_path_origin = ts.ajax.path;
        ajax_parse_target_origin = ts.ajax.parse_target;
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.trigger = ajax_trigger_origin;
        ts.ajax.path = ajax_path_origin;
        ts.ajax.parse_target = ajax_parse_target_origin;
    });

    QUnit.test('BatchedItemsFilter constructor stores elem and name', assert => {
        let elem = $('<div />');
        let filter = new BatchedItemsFilter(elem, 'test_name');

        assert.strictEqual(filter.elem, elem, 'elem stored');
        assert.strictEqual(filter.name, 'test_name', 'name stored');
    });

    QUnit.test('set_filter triggers ajax with parsed target', assert => {
        let elem = $(`
            <div ajax:target="/api/items?page=1"
                 ajax:event="reload:#table">
            </div>
        `).appendTo(container);

        ts.ajax.parse_target = function(target) {
            return {
                path: '/api/items',
                query: '?page=1',
                params: {}
            };
        };

        let triggered = null;
        ts.ajax.trigger = function(opts) {
            triggered = opts;
        };

        let filter = new BatchedItemsFilter(elem, 'size');
        filter.set_filter('10');

        assert.strictEqual(triggered.name, 'reload', 'correct event name');
        assert.strictEqual(triggered.selector, '#table', 'correct selector');
        assert.strictEqual(triggered.target.params.size, '10',
            'filter param added to target');
    });

    QUnit.test('set_filter updates path when ajax:path present', assert => {
        let elem = $(`
            <div ajax:target="/api/items?page=1"
                 ajax:event="reload:#table"
                 ajax:path="true">
            </div>
        `).appendTo(container);

        ts.ajax.parse_target = function() {
            return {
                path: '/api/items',
                query: '?page=1',
                params: {}
            };
        };

        let path_opts = null;
        ts.ajax.path = function(opts) {
            path_opts = opts;
        };
        ts.ajax.trigger = function() {};

        let filter = new BatchedItemsFilter(elem, 'term');
        filter.set_filter('search');

        assert.ok(path_opts, 'ajax.path called');
        assert.strictEqual(path_opts.path, '/api/items?page=1&term=search',
            'path includes filter param');
        assert.strictEqual(path_opts.event, 'reload:#table',
            'event from ajax:event (full event string)');
    });

    QUnit.test('set_filter uses ajax:path-event when specified', assert => {
        let elem = $(`
            <div ajax:target="/api/items"
                 ajax:event="reload:#table"
                 ajax:path="true"
                 ajax:path-event="navigate">
            </div>
        `).appendTo(container);

        ts.ajax.parse_target = function() {
            return {path: '/api/items', query: '', params: {}};
        };

        let path_opts = null;
        ts.ajax.path = function(opts) {
            path_opts = opts;
        };
        ts.ajax.trigger = function() {};

        let filter = new BatchedItemsFilter(elem, 'page');
        filter.set_filter('2');

        assert.strictEqual(path_opts.event, 'navigate',
            'uses ajax:path-event instead of ajax:event');
    });
});

QUnit.module('cone.app.batcheditems.BatchedItemsSize', hooks => {

    let container,
        ajax_trigger_origin,
        ajax_parse_target_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_trigger_origin = ts.ajax.trigger;
        ajax_parse_target_origin = ts.ajax.parse_target;

        ts.ajax.parse_target = function() {
            return {path: '/api', query: '', params: {}};
        };
        ts.ajax.trigger = function() {};
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.trigger = ajax_trigger_origin;
        ts.ajax.parse_target = ajax_parse_target_origin;
    });

    QUnit.test('BatchedItemsSize.initialize creates instances', assert => {
        let html = $(`
            <div class="batched_items_slice_size">
                <select ajax:target="/api" ajax:event="reload:#list">
                    <option value="10">10</option>
                    <option value="25">25</option>
                </select>
            </div>
        `).appendTo(container);

        BatchedItemsSize.initialize(container);

        let select = container.find('select');
        let events = $._data(select.get(0), 'events');
        assert.ok(events && events.change, 'change event bound');
    });

    QUnit.test('BatchedItemsSize.initialize with custom selector', assert => {
        let html = $(`
            <select class="custom-size"
                    ajax:target="/api"
                    ajax:event="reload:#list">
                <option value="10">10</option>
            </select>
        `).appendTo(container);

        BatchedItemsSize.initialize(container, '.custom-size');

        let select = container.find('select');
        let events = $._data(select.get(0), 'events');
        assert.ok(events && events.change, 'change event bound with custom selector');
    });

    QUnit.test('BatchedItemsSize constructor sets name to size', assert => {
        let select = $(`
            <select ajax:target="/api" ajax:event="reload:#list">
                <option value="10">10</option>
            </select>
        `).appendTo(container);

        let instance = new BatchedItemsSize(select);

        assert.strictEqual(instance.name, 'size', 'name is size');
    });

    QUnit.test('BatchedItemsSize change_handle triggers filter', assert => {
        let select = $(`
            <select ajax:target="/api" ajax:event="reload:#list">
                <option value="10">10</option>
                <option value="25" selected>25</option>
            </select>
        `).appendTo(container);

        let triggered_target = null;
        ts.ajax.trigger = function(opts) {
            triggered_target = opts.target;
        };

        let instance = new BatchedItemsSize(select);
        select.trigger('change');

        assert.strictEqual(triggered_target.params.size, '25',
            'selected value passed to filter');
    });

    QUnit.test('BatchedItemsSize rebinds on subsequent initialization', assert => {
        let select = $(`
            <select ajax:target="/api" ajax:event="reload:#list">
                <option value="10">10</option>
            </select>
        `).appendTo(container);

        let trigger_count = 0;
        ts.ajax.trigger = function() {
            trigger_count++;
        };

        new BatchedItemsSize(select);
        new BatchedItemsSize(select);
        select.trigger('change');

        assert.strictEqual(trigger_count, 1, 'handler fires only once');
    });
});

QUnit.module('cone.app.batcheditems.BatchedItemsSearch', hooks => {

    let container,
        ajax_trigger_origin,
        ajax_parse_target_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_trigger_origin = ts.ajax.trigger;
        ajax_parse_target_origin = ts.ajax.parse_target;

        ts.ajax.parse_target = function() {
            return {path: '/api', query: '', params: {}};
        };
        ts.ajax.trigger = function() {};
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.trigger = ajax_trigger_origin;
        ts.ajax.parse_target = ajax_parse_target_origin;
    });

    QUnit.test('BatchedItemsSearch.initialize creates instances', assert => {
        let html = $(`
            <div class="batched_items_filter">
                <input type="text"
                       ajax:target="/api"
                       ajax:event="reload:#list" />
            </div>
        `).appendTo(container);

        BatchedItemsSearch.initialize(container);

        let input = container.find('input');
        let events = $._data(input.get(0), 'events');
        assert.ok(events && events.keyup, 'keyup event bound');
        assert.ok(events && events.keypress, 'keypress event bound');
        assert.ok(events && events.focus, 'focus event bound');
        assert.ok(events && events.change, 'change event bound');
    });

    QUnit.test('BatchedItemsSearch.initialize with custom selector and name', assert => {
        let html = $(`
            <input class="custom-search"
                   ajax:target="/api"
                   ajax:event="reload:#list" />
        `).appendTo(container);

        BatchedItemsSearch.initialize(container, '.custom-search', 'query');

        let input = container.find('input');
        let events = $._data(input.get(0), 'events');
        assert.ok(events && events.keyup, 'events bound with custom selector');
    });

    QUnit.test('BatchedItemsSearch focus_handle clears empty_filter', assert => {
        let input = $(`
            <input type="text"
                   class="empty_filter"
                   value="Search..."
                   ajax:target="/api"
                   ajax:event="reload:#list" />
        `).appendTo(container);

        let instance = new BatchedItemsSearch(input, 'term');
        input.trigger('focus');

        assert.false(input.hasClass('empty_filter'), 'empty_filter class removed');
        assert.strictEqual(input.val(), '', 'value cleared');
    });

    QUnit.test('BatchedItemsSearch focus_handle ignores non-empty filter', assert => {
        let input = $(`
            <input type="text"
                   value="actual search"
                   ajax:target="/api"
                   ajax:event="reload:#list" />
        `).appendTo(container);

        let instance = new BatchedItemsSearch(input, 'term');
        input.trigger('focus');

        assert.strictEqual(input.val(), 'actual search', 'value unchanged');
    });

    QUnit.test('BatchedItemsSearch keypress_handle prevents Enter default', assert => {
        let input = $(`
            <input type="text"
                   ajax:target="/api"
                   ajax:event="reload:#list" />
        `).appendTo(container);

        let instance = new BatchedItemsSearch(input, 'term');

        let evt = new $.Event('keypress', {keyCode: 13});
        input.trigger(evt);

        assert.true(evt.isDefaultPrevented(), 'default prevented for Enter');
    });

    QUnit.test('BatchedItemsSearch keypress_handle allows other keys', assert => {
        let input = $(`
            <input type="text"
                   ajax:target="/api"
                   ajax:event="reload:#list" />
        `).appendTo(container);

        let instance = new BatchedItemsSearch(input, 'term');

        let evt = new $.Event('keypress', {keyCode: 65});
        input.trigger(evt);

        assert.false(evt.isDefaultPrevented(), 'default not prevented for other keys');
    });

    QUnit.test('BatchedItemsSearch keyup_handle triggers on Enter', assert => {
        let input = $(`
            <input type="text"
                   value="test search"
                   ajax:target="/api"
                   ajax:event="reload:#list" />
        `).appendTo(container);

        let triggered_target = null;
        ts.ajax.trigger = function(opts) {
            triggered_target = opts.target;
        };

        let instance = new BatchedItemsSearch(input, 'term');
        let evt = new $.Event('keyup', {keyCode: 13});
        input.trigger(evt);

        assert.strictEqual(triggered_target.params.term, 'test search',
            'search triggered on Enter');
    });

    QUnit.test('BatchedItemsSearch change_handle triggers filter', assert => {
        let input = $(`
            <input type="text"
                   value="changed value"
                   ajax:target="/api"
                   ajax:event="reload:#list" />
        `).appendTo(container);

        let triggered_target = null;
        ts.ajax.trigger = function(opts) {
            triggered_target = opts.target;
        };

        let instance = new BatchedItemsSearch(input, 'term');
        input.trigger('change');

        assert.strictEqual(triggered_target.params.term, 'changed value',
            'filter triggered on change');
    });
});

QUnit.module('cone.app.batcheditems.deprecated', hooks => {

    let container,
        deprecate_origin,
        ajax_trigger_origin,
        ajax_parse_target_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        deprecate_origin = ts.deprecate;
        ajax_trigger_origin = ts.ajax.trigger;
        ajax_parse_target_origin = ts.ajax.parse_target;

        ts.ajax.parse_target = function() {
            return {path: '/api', query: '', params: {}};
        };
        ts.ajax.trigger = function() {};
    });

    hooks.afterEach(() => {
        container.remove();
        ts.deprecate = deprecate_origin;
        ts.ajax.trigger = ajax_trigger_origin;
        ts.ajax.parse_target = ajax_parse_target_origin;
    });

    QUnit.test('batcheditems_handle_filter calls deprecate', assert => {
        let deprecate_called = false;
        ts.deprecate = function(old_name) {
            if (old_name === 'batcheditems_handle_filter') {
                deprecate_called = true;
            }
        };

        let elem = $(`
            <div ajax:target="/api" ajax:event="reload:#list"></div>
        `).appendTo(container);

        batcheditems_handle_filter(elem, 'param', 'value');

        assert.true(deprecate_called, 'deprecate warning issued');
    });

    QUnit.test('batcheditems_size_binder calls deprecate', assert => {
        let deprecate_called = false;
        ts.deprecate = function(old_name) {
            if (old_name === 'batcheditems_size_binder') {
                deprecate_called = true;
            }
        };

        batcheditems_size_binder(container);

        assert.true(deprecate_called, 'deprecate warning issued');
    });

    QUnit.test('batcheditems_filter_binder calls deprecate', assert => {
        let deprecate_called = false;
        ts.deprecate = function(old_name) {
            if (old_name === 'batcheditems_filter_binder') {
                deprecate_called = true;
            }
        };

        batcheditems_filter_binder(container);

        assert.true(deprecate_called, 'deprecate warning issued');
    });

    QUnit.test('batcheditems_size_binder uses default selector', assert => {
        let html = $(`
            <div class="batched_items_slice_size">
                <select ajax:target="/api" ajax:event="reload:#list">
                    <option value="10">10</option>
                </select>
            </div>
        `).appendTo(container);

        ts.deprecate = function() {};
        batcheditems_size_binder(container);

        let select = container.find('select');
        let events = $._data(select.get(0), 'events');
        assert.ok(events && events.change, 'default selector works');
    });

    QUnit.test('batcheditems_filter_binder uses default selector and name', assert => {
        let html = $(`
            <div class="batched_items_filter">
                <input ajax:target="/api" ajax:event="reload:#list" />
            </div>
        `).appendTo(container);

        ts.deprecate = function() {};
        batcheditems_filter_binder(container);

        let input = container.find('input');
        let events = $._data(input.get(0), 'events');
        assert.ok(events && events.keyup, 'default selector works');
    });
});

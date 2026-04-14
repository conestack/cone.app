import $ from 'jquery';
import ts from 'treibstoff';
import {TableToolbar} from '../src/tabletoolbar.js';

QUnit.module('cone.app.tabletoolbar', hooks => {

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

    QUnit.test('TableToolbar.initialize binds size selector', assert => {
        let html = $(`
            <div class="table_length">
                <select ajax:target="/api" ajax:event="reload:#table">
                    <option value="10">10</option>
                    <option value="25">25</option>
                </select>
            </div>
        `).appendTo(container);

        TableToolbar.initialize(container);

        let select = container.find('.table_length select');
        let events = $._data(select.get(0), 'events');
        assert.ok(events && events.change, 'change event bound on size select');
    });

    QUnit.test('TableToolbar.initialize binds filter input', assert => {
        let html = $(`
            <div class="table_filter">
                <input type="text"
                       ajax:target="/api"
                       ajax:event="reload:#table" />
            </div>
        `).appendTo(container);

        TableToolbar.initialize(container);

        let input = container.find('.table_filter input');
        let events = $._data(input.get(0), 'events');
        assert.ok(events && events.keyup, 'keyup event bound on filter input');
        assert.ok(events && events.keypress, 'keypress event bound on filter input');
        assert.ok(events && events.focus, 'focus event bound on filter input');
        assert.ok(events && events.change, 'change event bound on filter input');
    });

    QUnit.test('TableToolbar.initialize binds both size and filter', assert => {
        let html = $(`
            <div>
                <div class="table_length">
                    <select ajax:target="/api" ajax:event="reload:#table">
                        <option value="10">10</option>
                    </select>
                </div>
                <div class="table_filter">
                    <input type="text"
                           ajax:target="/api"
                           ajax:event="reload:#table" />
                </div>
            </div>
        `).appendTo(container);

        TableToolbar.initialize(container);

        let select = container.find('.table_length select');
        let input = container.find('.table_filter input');

        let select_events = $._data(select.get(0), 'events');
        let input_events = $._data(input.get(0), 'events');

        assert.ok(select_events && select_events.change,
            'size select has change handler');
        assert.ok(input_events && input_events.keyup,
            'filter input has keyup handler');
    });

    QUnit.test('TableToolbar size change triggers filter', assert => {
        let html = $(`
            <div class="table_length">
                <select ajax:target="/api" ajax:event="reload:#table">
                    <option value="10">10</option>
                    <option value="25" selected>25</option>
                </select>
            </div>
        `).appendTo(container);

        let triggered_target = null;
        ts.ajax.trigger = function(opts) {
            triggered_target = opts.target;
        };

        TableToolbar.initialize(container);

        let select = container.find('.table_length select');
        select.trigger('change');

        assert.strictEqual(triggered_target.params.size, '25',
            'size parameter sent');
    });

    QUnit.test('TableToolbar filter change triggers search', assert => {
        let html = $(`
            <div class="table_filter">
                <input type="text"
                       value="search term"
                       ajax:target="/api"
                       ajax:event="reload:#table" />
            </div>
        `).appendTo(container);

        let triggered_target = null;
        ts.ajax.trigger = function(opts) {
            triggered_target = opts.target;
        };

        TableToolbar.initialize(container);

        let input = container.find('.table_filter input');
        input.trigger('change');

        assert.strictEqual(triggered_target.params.term, 'search term',
            'term parameter sent');
    });

    QUnit.test('TableToolbar handles missing elements gracefully', assert => {
        // Empty container - should not throw
        TableToolbar.initialize(container);
        assert.ok(true, 'no error with empty container');
    });

    QUnit.test('TableToolbar handles multiple tables in context', assert => {
        let html = $(`
            <div>
                <div class="table-wrapper">
                    <div class="table_length">
                        <select ajax:target="/api/table1" ajax:event="reload:#t1">
                            <option value="10">10</option>
                        </select>
                    </div>
                </div>
                <div class="table-wrapper">
                    <div class="table_length">
                        <select ajax:target="/api/table2" ajax:event="reload:#t2">
                            <option value="20">20</option>
                        </select>
                    </div>
                </div>
            </div>
        `).appendTo(container);

        TableToolbar.initialize(container);

        let selects = container.find('.table_length select');
        assert.strictEqual(selects.length, 2, 'two selects found');

        selects.each(function() {
            let events = $._data(this, 'events');
            assert.ok(events && events.change, 'each select has change handler');
        });
    });
});

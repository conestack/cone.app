import $ from 'jquery';
import ts from 'treibstoff';
import {Sharing} from '../src/sharing.js';

QUnit.module('cone.app.sharing', hooks => {

    let container,
        ajax_action_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_action_origin = ts.ajax.action;
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.action = ajax_action_origin;
    });

    QUnit.test('Sharing.initialize creates instance', assert => {
        let html = $(`
            <div>
                <input type="checkbox"
                       class="add_remove_role_for_principal"
                       name="user1"
                       value="admin" />
            </div>
        `).appendTo(container);

        new Sharing(container);

        // Verify event handler is bound by checking change triggers
        let action_called = false;
        ts.ajax.action = function() { action_called = true; };

        container.find('input').prop('checked', true).trigger('change');
        assert.true(action_called, 'change handler bound');
    });

    QUnit.test('Sharing static initialize method', assert => {
        let html = $(`
            <input type="checkbox"
                   class="add_remove_role_for_principal"
                   name="user1"
                   value="editor" />
        `).appendTo(container);

        ts.ajax.action = function() {};

        Sharing.initialize(container);

        let checkbox = container.find('input');
        let event_bound = $._data(checkbox.get(0), 'events');
        assert.ok(event_bound && event_bound.change, 'change event bound via initialize');
    });

    QUnit.test('set_principal_role triggers add action when checked', assert => {
        let html = $(`
            <div ajax:target="/api/sharing">
                <input type="checkbox"
                       class="add_remove_role_for_principal"
                       name="principal_id"
                       value="manager" />
            </div>
        `).appendTo(container);

        let action_params = null;
        ts.ajax.action = function(opts) {
            action_params = opts;
        };

        new Sharing(container);

        let checkbox = container.find('input');
        checkbox.prop('checked', true).trigger('change');

        assert.strictEqual(action_params.name, 'add_principal_role',
            'action name is add_principal_role');
        assert.strictEqual(action_params.mode, 'NONE', 'mode is NONE');
        assert.strictEqual(action_params.selector, 'NONE', 'selector is NONE');
        assert.strictEqual(action_params.url, '/api/sharing', 'url from ajax:target');
        assert.strictEqual(action_params.params.id, 'principal_id',
            'id from checkbox name');
        assert.strictEqual(action_params.params.role, 'manager',
            'role from checkbox value');
    });

    QUnit.test('set_principal_role triggers remove action when unchecked', assert => {
        let html = $(`
            <div ajax:target="/api/sharing">
                <input type="checkbox"
                       class="add_remove_role_for_principal"
                       name="user2"
                       value="viewer"
                       checked />
            </div>
        `).appendTo(container);

        let action_params = null;
        ts.ajax.action = function(opts) {
            action_params = opts;
        };

        new Sharing(container);

        let checkbox = container.find('input');
        checkbox.prop('checked', false).trigger('change');

        assert.strictEqual(action_params.name, 'remove_principal_role',
            'action name is remove_principal_role');
        assert.strictEqual(action_params.params.id, 'user2', 'correct principal id');
        assert.strictEqual(action_params.params.role, 'viewer', 'correct role');
    });

    QUnit.test('Sharing handles multiple checkboxes', assert => {
        let html = $(`
            <div ajax:target="/api/sharing">
                <input type="checkbox"
                       class="add_remove_role_for_principal"
                       name="user1"
                       value="admin" />
                <input type="checkbox"
                       class="add_remove_role_for_principal"
                       name="user2"
                       value="editor" />
            </div>
        `).appendTo(container);

        let action_calls = [];
        ts.ajax.action = function(opts) {
            action_calls.push(opts);
        };

        new Sharing(container);

        let checkboxes = container.find('input');
        checkboxes.eq(0).prop('checked', true).trigger('change');
        checkboxes.eq(1).prop('checked', true).trigger('change');

        assert.strictEqual(action_calls.length, 2, 'both checkboxes trigger actions');
        assert.strictEqual(action_calls[0].params.id, 'user1', 'first checkbox id');
        assert.strictEqual(action_calls[1].params.id, 'user2', 'second checkbox id');
    });

    QUnit.test('Sharing rebinds on subsequent initialization', assert => {
        let html = $(`
            <div ajax:target="/api/sharing">
                <input type="checkbox"
                       class="add_remove_role_for_principal"
                       name="user1"
                       value="admin" />
            </div>
        `).appendTo(container);

        let action_count = 0;
        ts.ajax.action = function() {
            action_count++;
        };

        // Initialize twice
        new Sharing(container);
        new Sharing(container);

        container.find('input').prop('checked', true).trigger('change');

        assert.strictEqual(action_count, 1,
            'handler fires only once after rebinding');
    });

    QUnit.test('set_principal_role prevents default event', assert => {
        let html = $(`
            <div ajax:target="/api/sharing">
                <input type="checkbox"
                       class="add_remove_role_for_principal"
                       name="user1"
                       value="admin" />
            </div>
        `).appendTo(container);

        ts.ajax.action = function() {};
        new Sharing(container);

        let prevented = false;
        let checkbox = container.find('input');

        checkbox.on('change', function(evt) {
            prevented = evt.isDefaultPrevented();
        });

        checkbox.prop('checked', true).trigger('change');

        assert.true(prevented, 'event default prevented');
    });
});

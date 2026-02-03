import ts from 'treibstoff';
import {createCookie, readCookie} from '../src/utils.js';

QUnit.module('cone.app.utils', hooks => {

    let create_cookie_origin,
        read_cookie_origin,
        deprecate_origin;

    hooks.beforeEach(() => {
        // Store original functions
        create_cookie_origin = ts.create_cookie;
        read_cookie_origin = ts.read_cookie;
        deprecate_origin = ts.deprecate;
    });

    hooks.afterEach(() => {
        // Restore original functions
        ts.create_cookie = create_cookie_origin;
        ts.read_cookie = read_cookie_origin;
        ts.deprecate = deprecate_origin;
    });

    QUnit.test('createCookie delegates to ts.create_cookie', assert => {
        let called_with = null;
        ts.create_cookie = function(name, value, days) {
            called_with = {name, value, days};
        };
        ts.deprecate = function() {};

        createCookie('test_cookie', 'test_value', 7);

        assert.deepEqual(called_with, {
            name: 'test_cookie',
            value: 'test_value',
            days: 7
        }, 'ts.create_cookie called with correct arguments');
    });

    QUnit.test('createCookie calls ts.deprecate', assert => {
        let deprecate_called = false;
        let deprecate_args = null;

        ts.create_cookie = function() {};
        ts.deprecate = function(old_name, new_name, version) {
            deprecate_called = true;
            deprecate_args = {old_name, new_name, version};
        };

        createCookie('name', 'value', 1);

        assert.true(deprecate_called, 'ts.deprecate was called');
        assert.strictEqual(deprecate_args.old_name, 'createCookie',
            'correct old function name');
        assert.strictEqual(deprecate_args.new_name, 'ts.create_cookie',
            'correct new function name');
        assert.strictEqual(deprecate_args.version, '1.1',
            'correct deprecation version');
    });

    QUnit.test('readCookie delegates to ts.read_cookie', assert => {
        ts.read_cookie = function(name) {
            return 'mocked_value_' + name;
        };
        ts.deprecate = function() {};

        let result = readCookie('my_cookie');

        assert.strictEqual(result, 'mocked_value_my_cookie',
            'returns value from ts.read_cookie');
    });

    QUnit.test('readCookie calls ts.deprecate', assert => {
        let deprecate_args = null;

        ts.read_cookie = function() { return null; };
        ts.deprecate = function(old_name, new_name, version) {
            deprecate_args = {old_name, new_name, version};
        };

        readCookie('name');

        assert.strictEqual(deprecate_args.old_name, 'readCookie',
            'correct old function name');
        assert.strictEqual(deprecate_args.new_name, 'ts.read_cookie',
            'correct new function name');
        assert.strictEqual(deprecate_args.version, '1.1',
            'correct deprecation version');
    });

    QUnit.test('readCookie returns null for non-existent cookie', assert => {
        ts.read_cookie = function() { return null; };
        ts.deprecate = function() {};

        let result = readCookie('nonexistent');

        assert.strictEqual(result, null, 'returns null for missing cookie');
    });
});

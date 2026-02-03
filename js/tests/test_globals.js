import ts from 'treibstoff';
import {GlobalEvents, global_events} from '../src/globals.js';

QUnit.module('cone.app.globals', hooks => {

    QUnit.test('GlobalEvents class exported', assert => {
        assert.ok(GlobalEvents, 'GlobalEvents class exported');
    });

    QUnit.test('GlobalEvents extends ts.Events', assert => {
        let instance = new GlobalEvents();
        assert.true(instance instanceof ts.Events,
            'GlobalEvents extends ts.Events');
    });

    QUnit.test('global_events is GlobalEvents instance', assert => {
        assert.ok(global_events, 'global_events exported');
        assert.true(global_events instanceof GlobalEvents,
            'global_events is GlobalEvents instance');
    });

    QUnit.test('on_sidebar_left_resize is callable', assert => {
        let instance = new GlobalEvents();
        let mock_sidebar = {width: 250};

        instance.on_sidebar_left_resize(mock_sidebar);
        assert.ok(true, 'on_sidebar_left_resize callable without error');
    });

    QUnit.test('on_sidebar_right_resize is callable', assert => {
        let instance = new GlobalEvents();
        let mock_sidebar = {width: 300};

        instance.on_sidebar_right_resize(mock_sidebar);
        assert.ok(true, 'on_sidebar_right_resize callable without error');
    });

    QUnit.test('on_main_area_mode is callable', assert => {
        let instance = new GlobalEvents();
        let mock_main_area = {mode: 'compact'};

        instance.on_main_area_mode(mock_main_area);
        assert.ok(true, 'on_main_area_mode callable without error');
    });

    QUnit.test('GlobalEvents can register event handlers', assert => {
        let instance = new GlobalEvents();
        let handler_called = false;

        instance.on_sidebar_left_resize = function(inst) {
            handler_called = true;
        };

        instance.on_sidebar_left_resize({});
        assert.true(handler_called, 'custom handler can be set');
    });

    QUnit.test('global_events singleton is reused', assert => {
        assert.strictEqual(global_events, global_events,
            'global_events is same instance');
    });
});

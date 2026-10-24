import $ from 'jquery';
import {keys, KeyBinder} from '../src/keybinder.js';

QUnit.module('cone.app.keybinder', hooks => {

    let keybinder;

    hooks.beforeEach(() => {
        // Reset keys state before each test
        keys.shift_down = false;
        keys.ctrl_down = false;
    });

    hooks.afterEach(() => {
        // Clean up event handlers
        $(window).off('keydown keyup');
        keys.shift_down = false;
        keys.ctrl_down = false;
    });

    QUnit.test('keys object initial state', assert => {
        assert.false(keys.shift_down, 'shift_down is initially false');
        assert.false(keys.ctrl_down, 'ctrl_down is initially false');
    });

    QUnit.test('KeyBinder constructor binds window events', assert => {
        keybinder = new KeyBinder();

        // Trigger shift key down (keyCode 16)
        $(window).trigger(new $.Event('keydown', {keyCode: 16}));
        assert.true(keys.shift_down, 'shift_down set to true on keydown');

        $(window).trigger(new $.Event('keyup', {keyCode: 16}));
        assert.false(keys.shift_down, 'shift_down set to false on keyup');
    });

    QUnit.test('KeyBinder tracks Ctrl key state', assert => {
        keybinder = new KeyBinder();

        // Trigger ctrl key down (keyCode 17)
        $(window).trigger(new $.Event('keydown', {keyCode: 17}));
        assert.true(keys.ctrl_down, 'ctrl_down set to true on keydown');

        $(window).trigger(new $.Event('keyup', {keyCode: 17}));
        assert.false(keys.ctrl_down, 'ctrl_down set to false on keyup');
    });

    QUnit.test('KeyBinder handles which property', assert => {
        keybinder = new KeyBinder();

        // Test using 'which' property instead of 'keyCode'
        $(window).trigger(new $.Event('keydown', {which: 16}));
        assert.true(keys.shift_down, 'shift_down set via which property');

        $(window).trigger(new $.Event('keydown', {which: 17}));
        assert.true(keys.ctrl_down, 'ctrl_down set via which property');
    });

    QUnit.test('KeyBinder ignores other keys', assert => {
        keybinder = new KeyBinder();

        // Trigger a different key (e.g., Enter = 13)
        $(window).trigger(new $.Event('keydown', {keyCode: 13}));
        assert.false(keys.shift_down, 'shift_down unchanged for other keys');
        assert.false(keys.ctrl_down, 'ctrl_down unchanged for other keys');
    });

    QUnit.test('KeyBinder handles simultaneous key presses', assert => {
        keybinder = new KeyBinder();

        // Press both Shift and Ctrl
        $(window).trigger(new $.Event('keydown', {keyCode: 16}));
        $(window).trigger(new $.Event('keydown', {keyCode: 17}));

        assert.true(keys.shift_down, 'shift_down is true');
        assert.true(keys.ctrl_down, 'ctrl_down is true');

        // Release Shift, Ctrl still down
        $(window).trigger(new $.Event('keyup', {keyCode: 16}));
        assert.false(keys.shift_down, 'shift_down released');
        assert.true(keys.ctrl_down, 'ctrl_down still pressed');

        // Release Ctrl
        $(window).trigger(new $.Event('keyup', {keyCode: 17}));
        assert.false(keys.ctrl_down, 'ctrl_down released');
    });
});

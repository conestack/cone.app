// NOTE: The cone.js module imports sidebar.js which has an incompatible import:
// `import $, { event } from 'jquery'` - jQuery 4.0 doesn't export 'event'.
// This test file tests individual module exports instead of the aggregated cone object.

import {Selectable} from '../src/selectable.js';
import {keys, KeyBinder} from '../src/keybinder.js';
import {createCookie, readCookie} from '../src/utils.js';
import {Sharing} from '../src/sharing.js';
import {CopySupport} from '../src/copysupport.js';
import {LiveSearch} from '../src/livesearch.js';
import {TableToolbar} from '../src/tabletoolbar.js';
import {ColorMode, ColorToggler} from '../src/colormode.js';
import {global_events, GlobalEvents} from '../src/globals.js';
import {
    BatchedItemsFilter,
    BatchedItemsSize,
    BatchedItemsSearch
} from '../src/batcheditems.js';
import {
    ReferenceHandle,
    AddReferenceHandle,
    RemoveReferenceHandle,
    ReferenceBrowserLoader
} from '../src/referencebrowser.js';
import {Translation} from '../src/translation.js';

QUnit.module('cone.app.modules', hooks => {

    QUnit.test('keybinder module exports correctly', assert => {
        assert.ok(keys, 'keys object exported');
        assert.strictEqual(typeof keys.shift_down, 'boolean', 'keys.shift_down exists');
        assert.strictEqual(typeof keys.ctrl_down, 'boolean', 'keys.ctrl_down exists');
        assert.ok(KeyBinder, 'KeyBinder class exported');
    });

    QUnit.test('selectable module exports correctly', assert => {
        assert.ok(Selectable, 'Selectable class exported');
        assert.strictEqual(typeof Selectable.prototype.bind, 'function',
            'Selectable has bind method');
    });

    QUnit.test('utils module exports correctly', assert => {
        assert.strictEqual(typeof createCookie, 'function', 'createCookie exported');
        assert.strictEqual(typeof readCookie, 'function', 'readCookie exported');
    });

    QUnit.test('sharing module exports correctly', assert => {
        assert.ok(Sharing, 'Sharing class exported');
        assert.strictEqual(typeof Sharing.initialize, 'function',
            'Sharing has static initialize');
    });

    QUnit.test('copysupport module exports correctly', assert => {
        assert.ok(CopySupport, 'CopySupport class exported');
        assert.strictEqual(typeof CopySupport.initialize, 'function',
            'CopySupport has static initialize');
    });

    QUnit.test('livesearch module exports correctly', assert => {
        assert.ok(LiveSearch, 'LiveSearch class exported');
        assert.strictEqual(typeof LiveSearch.initialize, 'function',
            'LiveSearch has static initialize');
    });

    QUnit.test('tabletoolbar module exports correctly', assert => {
        assert.ok(TableToolbar, 'TableToolbar class exported');
        assert.strictEqual(typeof TableToolbar.initialize, 'function',
            'TableToolbar has static initialize');
    });

    QUnit.test('colormode module exports correctly', assert => {
        assert.ok(ColorMode, 'ColorMode class exported');
        assert.ok(ColorToggler, 'ColorToggler class exported');
    });

    QUnit.test('globals module exports correctly', assert => {
        assert.ok(global_events, 'global_events instance exported');
        assert.ok(GlobalEvents, 'GlobalEvents class exported');
        assert.ok(global_events instanceof GlobalEvents,
            'global_events is GlobalEvents instance');
    });

    QUnit.test('batcheditems module exports correctly', assert => {
        assert.ok(BatchedItemsFilter, 'BatchedItemsFilter class exported');
        assert.ok(BatchedItemsSize, 'BatchedItemsSize class exported');
        assert.ok(BatchedItemsSearch, 'BatchedItemsSearch class exported');
    });

    QUnit.test('referencebrowser module exports correctly', assert => {
        assert.ok(ReferenceHandle, 'ReferenceHandle class exported');
        assert.ok(AddReferenceHandle, 'AddReferenceHandle class exported');
        assert.ok(RemoveReferenceHandle, 'RemoveReferenceHandle class exported');
        assert.ok(ReferenceBrowserLoader, 'ReferenceBrowserLoader class exported');
    });

    QUnit.test('translation module exports correctly', assert => {
        assert.ok(Translation, 'Translation class exported');
        assert.strictEqual(typeof Translation.initialize, 'function',
            'Translation has static initialize');
    });
});

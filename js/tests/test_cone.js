import * as batcheditems from '../src/batcheditems.js';
import { BatchedItemsFilter, BatchedItemsSearch, BatchedItemsSize } from '../src/batcheditems.js';
import * as colormode from '../src/colormode.js';
import { ColorMode, ColorToggler } from '../src/colormode.js';
import cone from '../src/cone.js';
import * as copysupport from '../src/copysupport.js';
import { CopySupport } from '../src/copysupport.js';
import * as globals from '../src/globals.js';
import { GlobalEvents, global_events } from '../src/globals.js';
import * as header from '../src/header.js';
import * as keybinder from '../src/keybinder.js';
import { KeyBinder, keys } from '../src/keybinder.js';
import * as layout from '../src/layout.js';
import * as livesearch from '../src/livesearch.js';
import { LiveSearch } from '../src/livesearch.js';
import * as mainmenu from '../src/mainmenu.js';
import * as navtree from '../src/navtree.js';
import * as referencebrowser from '../src/referencebrowser.js';
import {
    AddReferenceHandle,
    ReferenceBrowserLoader,
    ReferenceHandle,
    RemoveReferenceHandle,
} from '../src/referencebrowser.js';
import * as scrollbar from '../src/scrollbar.js';
import * as selectable from '../src/selectable.js';
import { Selectable } from '../src/selectable.js';
import * as sharing from '../src/sharing.js';
import { Sharing } from '../src/sharing.js';
import * as sidebar from '../src/sidebar.js';
import * as tabletoolbar from '../src/tabletoolbar.js';
import { TableToolbar } from '../src/tabletoolbar.js';
import * as translation from '../src/translation.js';
import { Translation } from '../src/translation.js';
import * as utils from '../src/utils.js';
import { createCookie, readCookie } from '../src/utils.js';

QUnit.module('cone.app.modules', (_hooks) => {
    QUnit.test('keybinder module exports correctly', (assert) => {
        assert.ok(keys, 'keys object exported');
        assert.strictEqual(typeof keys.shift_down, 'boolean', 'keys.shift_down exists');
        assert.strictEqual(typeof keys.ctrl_down, 'boolean', 'keys.ctrl_down exists');
        assert.ok(KeyBinder, 'KeyBinder class exported');
    });

    QUnit.test('selectable module exports correctly', (assert) => {
        assert.ok(Selectable, 'Selectable class exported');
        assert.strictEqual(
            typeof Selectable.prototype.bind,
            'function',
            'Selectable has bind method',
        );
    });

    QUnit.test('utils module exports correctly', (assert) => {
        assert.strictEqual(typeof createCookie, 'function', 'createCookie exported');
        assert.strictEqual(typeof readCookie, 'function', 'readCookie exported');
    });

    QUnit.test('sharing module exports correctly', (assert) => {
        assert.ok(Sharing, 'Sharing class exported');
        assert.strictEqual(typeof Sharing.initialize, 'function', 'Sharing has static initialize');
    });

    QUnit.test('copysupport module exports correctly', (assert) => {
        assert.ok(CopySupport, 'CopySupport class exported');
        assert.strictEqual(
            typeof CopySupport.initialize,
            'function',
            'CopySupport has static initialize',
        );
    });

    QUnit.test('livesearch module exports correctly', (assert) => {
        assert.ok(LiveSearch, 'LiveSearch class exported');
        assert.strictEqual(
            typeof LiveSearch.initialize,
            'function',
            'LiveSearch has static initialize',
        );
    });

    QUnit.test('tabletoolbar module exports correctly', (assert) => {
        assert.ok(TableToolbar, 'TableToolbar class exported');
        assert.strictEqual(
            typeof TableToolbar.initialize,
            'function',
            'TableToolbar has static initialize',
        );
    });

    QUnit.test('colormode module exports correctly', (assert) => {
        assert.ok(ColorMode, 'ColorMode class exported');
        assert.ok(ColorToggler, 'ColorToggler class exported');
    });

    QUnit.test('globals module exports correctly', (assert) => {
        assert.ok(global_events, 'global_events instance exported');
        assert.ok(GlobalEvents, 'GlobalEvents class exported');
        assert.ok(global_events instanceof GlobalEvents, 'global_events is GlobalEvents instance');
    });

    QUnit.test('batcheditems module exports correctly', (assert) => {
        assert.ok(BatchedItemsFilter, 'BatchedItemsFilter class exported');
        assert.ok(BatchedItemsSize, 'BatchedItemsSize class exported');
        assert.ok(BatchedItemsSearch, 'BatchedItemsSearch class exported');
    });

    QUnit.test('referencebrowser module exports correctly', (assert) => {
        assert.ok(ReferenceHandle, 'ReferenceHandle class exported');
        assert.ok(AddReferenceHandle, 'AddReferenceHandle class exported');
        assert.ok(RemoveReferenceHandle, 'RemoveReferenceHandle class exported');
        assert.ok(ReferenceBrowserLoader, 'ReferenceBrowserLoader class exported');
    });

    QUnit.test('translation module exports correctly', (assert) => {
        assert.ok(Translation, 'Translation class exported');
        assert.strictEqual(
            typeof Translation.initialize,
            'function',
            'Translation has static initialize',
        );
    });
});

QUnit.module('cone.app.cone', () => {
    QUnit.test('cone aggregates all module exports', (assert) => {
        const modules = [
            batcheditems,
            colormode,
            copysupport,
            globals,
            header,
            keybinder,
            layout,
            livesearch,
            mainmenu,
            navtree,
            referencebrowser,
            scrollbar,
            selectable,
            sharing,
            sidebar,
            tabletoolbar,
            translation,
            utils,
        ];
        const names = new Set();
        for (const module of modules) {
            for (const [name, value] of Object.entries(module)) {
                names.add(name);
                assert.strictEqual(cone[name], value, `cone.${name}`);
            }
        }
        assert.deepEqual(Object.keys(cone).sort(), [...names].sort(), 'no other members');
    });
});

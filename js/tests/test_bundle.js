import $ from 'jquery';
import ts from 'treibstoff';
import * as batcheditems from '../src/batcheditems.js';
import * as bundle from '../src/bundle.js';
import * as colormode from '../src/colormode.js';
import * as contextmenu from '../src/contextmenu.js';
import * as copysupport from '../src/copysupport.js';
import * as globals from '../src/globals.js';
import * as header from '../src/header.js';
import * as keybinder from '../src/keybinder.js';
import * as layout from '../src/layout.js';
import * as livesearch from '../src/livesearch.js';
import * as mainmenu from '../src/mainmenu.js';
import * as navtree from '../src/navtree.js';
import * as referencebrowser from '../src/referencebrowser.js';
import * as scrollbar from '../src/scrollbar.js';
import * as selectable from '../src/selectable.js';
import * as sharing from '../src/sharing.js';
import * as sidebar from '../src/sidebar.js';
import * as tabletoolbar from '../src/tabletoolbar.js';
import * as translation from '../src/translation.js';
import * as utils from '../src/utils.js';

QUnit.module('cone.app.bundle', () => {
    QUnit.test('bundle exports all module exports', (assert) => {
        const modules = [
            batcheditems,
            colormode,
            contextmenu,
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
        const exported = new Map(Object.entries(bundle));
        const names = new Set();
        for (const module of modules) {
            for (const [name, value] of Object.entries(module)) {
                names.add(name);
                assert.strictEqual(exported.get(name), value, name);
            }
        }
        assert.deepEqual([...exported.keys()].sort(), [...names].sort(), 'no other exports');
    });

    QUnit.test('bundle registers binders on ready', async (assert) => {
        await new Promise((resolve) => $(resolve));

        const binders = Object.values(ts.ajax.binders);
        const expected = [
            bundle.BatchedItemsSize,
            bundle.BatchedItemsSearch,
            bundle.CopySupport,
            bundle.ReferenceBrowserLoader,
            bundle.ReferenceHandle,
            bundle.Sharing,
            bundle.TableToolbar,
            bundle.Translation,
            bundle.ColorToggler,
            bundle.Scrollbar,
            bundle.LiveSearch,
            bundle.MainMenu,
            bundle.Header,
            bundle.MainArea,
            bundle.SidebarLeft,
            bundle.SidebarRight,
            bundle.NavTree,
        ];
        for (const cls of expected) {
            assert.true(binders.includes(cls.initialize), `${cls.name}.initialize registered`);
        }
    });

    QUnit.test('bundle initializes global handlers on ready', async (assert) => {
        await new Promise((resolve) => $(resolve));

        assert.ok(bundle.ColorMode.boundCallback, 'color mode bound');
        assert.ok(document.documentElement.getAttribute('data-bs-theme'), 'theme set');

        $(window).trigger(new $.Event('keydown', { keyCode: 16 }));
        assert.true(bundle.keys.shift_down, 'key binder bound');
        $(window).trigger(new $.Event('keyup', { keyCode: 16 }));

        // jQuery stores ``shown.bs.dropdown`` as type ``shown``, namespace ``bs.dropdown``
        const handlers = $._data(document, 'events').shown;
        const selectors = handlers.map((handler) => handler.selector);
        assert.true(selectors.includes('#contextmenu .dropdown'), 'context menu bound');
    });
});

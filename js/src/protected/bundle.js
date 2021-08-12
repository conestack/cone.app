import $ from 'jquery';
import ts from 'treibstoff';

import {BatchedItems} from './batcheditems.js';
import {CopySupport} from './copysupport.js';
import {KeyBinder} from './keybinder.js';
import {
    ReferenceBrowserLoader,
    ReferenceHandle
} from './referencebrowser.js';
import {SettingsTabs} from './settingstabs.js';
import {Sharing} from './sharing.js';
import {TableToolBar} from './tabletoolbar.js';

export * from './batcheditems.js';
export * from './copysupport.js';
export * from './keybinder.js';
export * from './keybinder.js';
export * from './referencebrowser.js';
export * from './selectable.js';
export * from './settingstabs.js';
export * from './sharing.js';
export * from './tabletoolbar.js';

$(function() {
    new KeyBinder();

    ts.ajax.register(BatchedItems.initialize, true);
    ts.ajax.register(CopySupport.initialize, true);
    ts.ajax.register(ReferenceBrowserLoader.initialize, true);
    ts.ajax.register(ReferenceHandle.initialize, true);
    ts.ajax.register(SettingsTabs.initialize, true);
    ts.ajax.register(Sharing.initialize, true);
    ts.ajax.register(TableToolBar.initialize, true);
});

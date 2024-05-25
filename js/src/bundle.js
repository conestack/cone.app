import $ from 'jquery';
import ts from 'treibstoff';

import {
    BatchedItemsSize,
    BatchedItemsSearch
} from './batcheditems.js';
import {ColorMode} from './colormode.js';
import {ColorToggler} from './colormode.js';
import {CopySupport} from './copysupport.js';
import {KeyBinder} from './keybinder.js';
import {LiveSearch} from './livesearch.js';
import {PersonalTools} from './personaltools.js';
import {
    ReferenceBrowserLoader,
    ReferenceHandle
} from './referencebrowser.js';
import {Scrollbar} from './scrollbar.js';
import {Sharing} from './sharing.js';
import {Sidebar} from './sidebar.js';
import {TableToolbar} from './tabletoolbar.js';
import {Translation} from './translation.js';

export * from './batcheditems.js';
export * from './colormode.js';
export * from './copysupport.js';
export * from './globals.js';
export * from './keybinder.js';
export * from './livesearch.js';
export * from './personaltools.js';
export * from './referencebrowser.js';
export * from './scrollbar.js';
export * from './selectable.js';
export * from './sharing.js';
export * from './sidebar.js';
export * from './tabletoolbar.js';
export * from './translation.js';
export * from './utils.js';

$(function() {
    new KeyBinder();
    new ColorMode();

    ts.ajax.register(BatchedItemsSize.initialize, true);
    ts.ajax.register(BatchedItemsSearch.initialize, true);
    ts.ajax.register(CopySupport.initialize, true);
    ts.ajax.register(ReferenceBrowserLoader.initialize, true);
    ts.ajax.register(ReferenceHandle.initialize, true);
    ts.ajax.register(Sharing.initialize, true);
    ts.ajax.register(TableToolbar.initialize, true);
    ts.ajax.register(Translation.initialize, true);
    ts.ajax.register(ColorToggler.initialize, true);
    ts.ajax.register(Scrollbar.initialize, true);
    ts.ajax.register(Sidebar.initialize, true);
    ts.ajax.register(PersonalTools.initialize, true);
    ts.ajax.register(LiveSearch.initialize, true);
});

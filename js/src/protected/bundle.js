import $ from 'jquery';
import ts from 'treibstoff';

//import {CopySupport} from './copysupport.js';
//import {Selectable} from './selectable.js';
//import {Settingstabs} from './settingstabs.js';
import {BatchedItems} from './batcheditems.js';
//import {ReferenceBrowser} from './referencebrowser.js';
import {TableToolBar} from './tabletoolbar.js';
//import {Sharing} from './sharing.js';
//import {KeyBinder} from './keybinder.js';

//export * from './copysupport.js';
//export * from './selectable.js';
//export * from './settingstabs.js';
export * from './batcheditems.js';
//export * from './referencebrowser.js';
export * from './tabletoolbar.js';
//export * from './sharing.js';
//export * from './keybinder.js';

$(function() {

    // initial binding
    //cone.KeyBinder();

    // add binders to treibstoff binding callbacks
    //ts.ajax.register(cone.Settingstabs.bind(cone), true);

    ts.ajax.register(BatchedItems.initialize, true);
    ts.ajax.register(TableToolBar.initialize, true);

    //ts.ajax.register(cone.Sharing.bind(cone), true);
    //ts.ajax.register(cone.CopySupport.bind(cone), true);
    //var refbrowser = yafowil.referencebrowser;
    //ts.ajax.register(refbrowser.browser_binder.bind(refbrowser), true);
    //ts.ajax.register(refbrowser.add_reference_binder.bind(refbrowser));
    //ts.ajax.register(refbrowser.remove_reference_binder.bind(refbrowser));
});

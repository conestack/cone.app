import * as copysupport from './copysupport.js';
import * as selectable from './selectable.js';
import * as settingstabs from './settingstabs.js';
import * as batcheditems from './batcheditems.js';
import * as referencebrowser from './referencebrowser.js';
import * as tabletoolbar from './tabletoolbar.js';
import * as sharing from './sharing.js';


let api = {};

Object.assign(api, copysupport);
Object.assign(api, selectable);
Object.assign(api, settingstabs);
Object.assign(api, batcheditems);
Object.assign(api, referencebrowser);
Object.assign(api, tabletoolbar);
Object.assign(api, sharing);

let cone_protected = api;
export default cone_protected;
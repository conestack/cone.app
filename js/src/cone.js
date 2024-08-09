import * as batcheditems from './batcheditems.js';
import * as colormode from './colormode.js';
import * as copysupport from './copysupport.js';
import * as keybinder from './keybinder.js';
import * as livesearch from './livesearch.js';
import * as referencebrowser from './referencebrowser.js';
import * as selectable from './selectable.js';
import * as settingstabs from './settingstabs.js';
import * as sharing from './sharing.js';
import * as sidebar from './sidebar.js';
import * as tabletoolbar from './tabletoolbar.js';
import * as utils from './utils.js';

let api = {};

Object.assign(api, batcheditems);
Object.assign(api, colormode);
Object.assign(api, copysupport);
Object.assign(api, keybinder);
Object.assign(api, livesearch);
Object.assign(api, referencebrowser);
Object.assign(api, selectable);
Object.assign(api, settingstabs);
Object.assign(api, sharing);
Object.assign(api, sidebar);
Object.assign(api, tabletoolbar);
Object.assign(api, utils);

let cone = api;
export default cone;

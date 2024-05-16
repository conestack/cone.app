import * as batcheditems from './batcheditems.js';
import * as copysupport from './copysupport.js';
import * as keybinder from './keybinder.js';
import * as livesearch from './livesearch.js';
import * as referencebrowser from './referencebrowser.js';
import * as selectable from './selectable.js';
import * as settingstabs from './settingstabs.js';
import * as sharing from './sharing.js';
import * as tabletoolbar from './tabletoolbar.js';
import * as utils from './utils.js';
import * as colormode from './colormode.js';
import * as sidebar from './sidebar.js';
import * as header from './header.js';

let api = {};

Object.assign(api, batcheditems);
Object.assign(api, copysupport);
Object.assign(api, keybinder);
Object.assign(api, livesearch);
Object.assign(api, referencebrowser);
Object.assign(api, selectable);
Object.assign(api, settingstabs);
Object.assign(api, sharing);
Object.assign(api, tabletoolbar);
Object.assign(api, utils);
Object.assign(api, colormode);
Object.assign(api, sidebar);
Object.assign(api, header);

let cone = api;
export default cone;

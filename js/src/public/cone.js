import * as content from './content.js';
import * as layout from './layout.js';
import * as mainmenu from './mainmenu.js';
import * as mobilenav from './mobilenav.js';
import * as navtree from './navtree.js';
import * as personaltools from './personaltools.js';
import * as scrollbar from './scrollbar.js';
import * as searchbar from './searchbar.js';
import * as sidebar from './sidebar.js';
import * as theme from './theme.js';
import * as toolbar from './toolbar.js';
import * as topnav from './topnav.js';
import * as utils from './utils.js';
import * as viewport from './viewport.js';

let api = {};

Object.assign(api, content);
Object.assign(api, layout);
Object.assign(api, mainmenu);
Object.assign(api, mobilenav);
Object.assign(api, navtree);
Object.assign(api, personaltools);
Object.assign(api, scrollbar);
Object.assign(api, searchbar);
Object.assign(api, sidebar);
Object.assign(api, theme);
Object.assign(api, toolbar);
Object.assign(api, topnav);
Object.assign(api, utils);
Object.assign(api, viewport);

let cone = api;
export default cone;

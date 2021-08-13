import $ from 'jquery';
import ts from 'treibstoff';

import {LiveSearch} from '../livesearch.js';

export * from '../livesearch.js';

$(function() {
    ts.ajax.register(LiveSearch.initialize, true);
});

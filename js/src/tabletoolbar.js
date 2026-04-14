import {
    BatchedItemsSize,
    BatchedItemsSearch
} from './batcheditems.js';

export class TableToolbar {

    static initialize(context) {
        BatchedItemsSize.initialize(context, '.table_length select');
        BatchedItemsSearch.initialize(context, '.table_filter input');
    }
}

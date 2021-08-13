import {BatchedItems} from "./batcheditems.js";

export class TableToolbar {

    static initialize(context) {
        BatchedItems.bind_size(context, '.table_length select');
        BatchedItems.bind_search(context, '.table_filter input');
    }
}

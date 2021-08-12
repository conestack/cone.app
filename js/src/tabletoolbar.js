import {BatchedItems} from "./batcheditems.js";

export class TableToolbar extends BatchedItems {

    static initialize(context) {
        new TableToolbar(
            context,
            '.table_length select',
            '.table_filter input',
            'term'
        );
    }

    constructor(context, size_selector, filter_selector, filter_name) {
        super(context, size_selector, filter_selector, filter_name);
    }
}

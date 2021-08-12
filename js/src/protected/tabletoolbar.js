import {BatchedItems} from "./batcheditems.js";

export class TableToolBar extends BatchedItems {

    static initialize(context) {
        new TableToolBar(
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

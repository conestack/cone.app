import {BatchedItems} from "./batcheditems.js";

export class TableToolBar extends BatchedItems {
    constructor(context) {
        //
    }

    tabletoolbarbinder(context) {
        this.items_binder(
            context,
            '.table_length select',
            '.table_filter input'
        );
    }
}

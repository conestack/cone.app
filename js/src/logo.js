import ts from 'treibstoff';
import { LayoutAware } from './layout.js';

/**
 * Class to manage the header logo.
 * @extends LayoutAware
 */
export class Logo extends LayoutAware {

    /**
     * Initializes the Logo instance.
     * @param {Element} context
     */
    static initialize(context) {
        const elem = ts.query_elem('#header-logo', context);
        if (!elem) {
            return;
        }
        new Logo(elem);
    }

    /**
     * Handles the logo text color based on the sidebar collapsed state.
     * @param {Object} inst
     * @param {Object} sidebar
     */
    on_sidebar_resize(inst, sidebar) {
        if (sidebar.collapsed) {
            this.elem.removeClass('text-white');
        } else {
            this.elem.addClass('text-white');
        }
    }
}

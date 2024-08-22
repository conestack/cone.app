import ts from 'treibstoff';

/**
 * Class to manage global events.
 */
export class GlobalEvents extends ts.Events {

    /**
     * Gets triggered when sidebar is resized.
     *
     * @param {Sidebar} inst
     */
    on_sidebar_resize(inst) {
    }

    /**
     * Gets triggered when main area toggles between compact and full mode.
     *
     * @param {MainArea} inst
     */
    on_main_area_mode(inst) {
    }
}

export const global_events = new GlobalEvents();

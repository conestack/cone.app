import ts from 'treibstoff';

export class GlobalEvents extends ts.Events {

    /**
     * Gets triggered when sidebar is resized.
     *
     * @param {Sidebar} inst
     */
    on_sidebar_resize(inst) {
    }

    /**
     * Gets triggered when header toggles between compact and full mode.
     *
     * @param {Header} inst
     */
    on_header_mode_toggle(inst) {
    }
}

export const global_events = new GlobalEvents();

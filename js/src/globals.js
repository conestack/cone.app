import ts from 'treibstoff';

export class GlobalEvents extends ts.Events {

    /**
     * Gets triggered when sidebar is resized.
     *
     * @param {Sidebar} inst
     */
    on_sidebar_resize(inst) {
    }
}

export const global_events = new GlobalEvents();

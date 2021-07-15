import $ from 'jquery'
import {cone} from '../src/globals.wip.js'

// viewport states
export const vp_states = {
    MOBILE: 0,
    SMALL: 1,
    MEDIUM: 2,
    LARGE: 3
}
export const VP_MOBILE = 0;
export const VP_SMALL = 1;
export const VP_MEDIUM = 2;
export const VP_LARGE = 3;

// viewport singleton
let cone_viewport = null;

export class ViewPort {

    constructor() {
        this.state = null;
        cone.viewportState = this.state;

        this._mobile_query = `(max-width:559.9px)`;
        this._small_query = `(min-width:560px) and (max-width: 989.9px)`;
        this._medium_query = `(min-width:560px) and (max-width: 1200px)`;
        this.update_viewport();
        $(window).on('resize', this.resize_handle.bind(this));
    }

    update_viewport() {
        if (window.matchMedia(this._mobile_query).matches) {
            this.state = VP_MOBILE;
        } else if (window.matchMedia(this._small_query).matches) {
            this.state = VP_SMALL;
        } else if (window.matchMedia(this._medium_query).matches) {
            this.state = VP_MEDIUM;
        } else {
            this.state = VP_LARGE;
        }
    }

    resize_handle(e) {
        let state = this.state;
        this.update_viewport();
        if (e && state != this.state) {
            var evt = $.Event('viewport_changed');
            evt.state = this.state;
            $(window).trigger(evt);
        }
    }
}

export class ViewPortAware {

    constructor() {
        this.vp_state = cone.viewportState;

        this._viewport_changed_handle = this.viewport_changed.bind(this);
        $(window).on('viewport_changed', this._viewport_changed_handle);
    }

    unload() {
        $(window).off('viewport_changed', this._viewport_changed_handle);
    }

    viewport_changed(e) {
        this.vp_state = e.state;
    }
}

/* $(function() {
    // create viewport singleton
    cone_viewport = new ViewPort();
}); */

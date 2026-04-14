import $ from 'jquery';

export let keys = {
    shift_down: false,
    ctrl_down: false
};

/**
 * XXX: Use ``ts.KeyState`` instead.
 */
export class KeyBinder {

    constructor() {
        $(window).on('keydown', this.key_down.bind(this));
        $(window).on('keyup', this.key_up.bind(this));
    }

    key_down(e) {
        switch (e.keyCode || e.which) {
            case 16:
                keys.shift_down = true;
                break;
            case 17:
                keys.ctrl_down = true;
                break;
        }
    }

    key_up(e) {
        switch (e.keyCode || e.which) {
            case 16:
                keys.shift_down = false;
                break;
            case 17:
                keys.ctrl_down = false;
                break;
        }
    }
}

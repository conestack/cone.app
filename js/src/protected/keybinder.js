import $ from 'jquery';

// keydown / keyup binder for shift and ctrl keys

export class KeyBinder {
    constructor() {
        this._keydown = this.key_down.bind(this);
        this._keyup = this.key_up.bind(this);
        $(document).on('keydown', this._keydown);
        $(document).on('keyup', this._keyup);
    }

    key_down(e) {
        switch (e.keyCode || e.which) {
            case 16:
                cone.keys.shift_down = true;
                break;
            case 17:
                cone.keys.ctrl_down = true;
                break;
        }
    }

    key_up(e) {
        switch (e.keyCode || e.which) {
            case 16:
                cone.keys.shift_down = false;
                   break;
            case 17:
                cone.keys.ctrl_down = false;
                break;
        }
    }
}

import $ from 'jquery';
import ts from 'treibstoff';

export class Sharing {

    static initialize(context) {
        new Sharing(context);
    }

    constructor(context) {
        let checkboxes = $('input.add_remove_role_for_principal', context);
        checkboxes.off('change').on('change', this.set_principal_role);
    }

    set_principal_role(evt) {
        evt.preventDefault();
        let checkbox = $(this);
        let action;
        if (this.checked) {
            action = 'add_principal_role';
        } else {
            action = 'remove_principal_role';
        }
        let url = checkbox.parent().attr('ajax:target');
        let params = {
            id: checkbox.attr('name'),
            role: checkbox.attr('value')
        };
        ts.ajax.action({
            name: action,
            mode: 'NONE',
            selector: 'NONE',
            url: url,
            params: params
        });
    }
}

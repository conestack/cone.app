import $ from 'jquery';
import ts from 'treibstoff';

export class Sharing {
    static initialize(context) {
        new Sharing(context);
    }

    constructor(context) {
        const checkboxes = $('input.add_remove_role_for_principal', context);
        checkboxes.off('change').on('change', this.set_principal_role);
    }

    set_principal_role(evt) {
        evt.preventDefault();
        const checkbox = $(this);
        let action;
        if (this.checked) {
            action = 'add_principal_role';
        } else {
            action = 'remove_principal_role';
        }
        const url = checkbox.parent().attr('ajax:target');
        const params = {
            id: checkbox.attr('name'),
            role: checkbox.attr('value'),
        };
        ts.ajax.action({
            name: action,
            mode: 'NONE',
            selector: 'NONE',
            url: url,
            params: params,
        });
    }
}

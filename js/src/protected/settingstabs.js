import $ from 'jquery';

export class Settingstabs {

    constructor(context) {
        this.elems = $('ul.settingstabs a', context);

        this._bind = this.bind_settings.bind(this);
        this.elems.on('click', this._bind);
    }

    bind_settings(e) {
        e.preventDefault();
        let elem = $(this);
        let target = ts.ajax.parsetarget(elem.attr('ajax:target'));
        ts.ajax.request({
            url: target.url,
            params: target.params,
            success: function(data, status, request) {
                let tabs = $(elem).parent().parent();
                $('li', tabs).removeClass('active');
                elem.parent().addClass('active');
                $('.settingstabpane')
                    .html(data)
                    .css('display', 'block')
                    .tsajax();
            }
        });
        this.elems.first().trigger('click');
    }
}

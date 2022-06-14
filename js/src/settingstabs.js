import $ from 'jquery';
import ts from 'treibstoff';

export class SettingsTabs {

    static initialize(context) {
        new SettingsTabs(context);
    }

    constructor(context) {
        this.tabs = $('ul.settingstabs a', context);
        this.tabs.on('click', this.load_tab).first().trigger('click');
    }

    load_tab(evt) {
        evt.preventDefault();
        let elem = $(this);
        let target = ts.ajax.parse_target(elem.attr('ajax:target'));
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
    }
}

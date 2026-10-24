import $ from 'jquery';

export class Translation {

    static initialize(context) {
        $('.translation-nav', context).each(function() {
            new Translation($(this));
        });
    }

    constructor(nav_elem) {
        $('div.invalid-feedback', nav_elem.parent()).show();
        this.nav_elem = nav_elem;
        this.fields_elem = nav_elem.next();
        this.show_lang_handle = this.show_lang_handle.bind(this);
        $('li > a', nav_elem).on('click', this.show_lang_handle);
        if ($('li.error', nav_elem).length) {
            $('li.error:first > a', nav_elem).trigger('click');
        } else {
            $('li > a.active', nav_elem).trigger('click');
        }
        this.fields_elem.show();
    }

    show_lang_handle(evt) {
        evt.preventDefault();
        $('li > a', this.nav_elem).removeClass('active');
        this.fields_elem.children().hide();
        let elem = $(evt.currentTarget);
        elem.addClass('active');
        $(elem.attr('href'), this.fields_elem).show();
    }
}

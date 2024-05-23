import $ from 'jquery';

export class Translation {

    static initialize(context) {
        $('.translation-nav', context).each(function() {
            new Translation($(this));
        });
    }

    constructor(nav_elem) {
        this.nav_elem = nav_elem;
        this.fields_elem = nav_elem.next();
        this.show_lang_handle = this.show_lang_handle.bind(this);
        $('li > a', nav_elem).on('click', this.show_lang_handle);
        if ($('li.error', nav_elem).length) {
            $('li.error:first > a', nav_elem).click();
        } else {
            $('li.active > a', nav_elem).click();
        }
        this.fields_elem.show();
    }

    show_lang_handle(evt) {
        evt.preventDefault();
        this.nav_elem.children().removeClass('active');
        this.fields_elem.children().hide();
        let elem = $(evt.currentTarget);
        elem.parent().addClass('active');
        $(elem.attr('href'), this.fields_elem).show();
    }
}

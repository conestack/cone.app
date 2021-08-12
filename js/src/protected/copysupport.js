import $ from 'jquery';

export class CopySupport {

    constructor(context) {
        this.context = context;

        this.paste_action = $('a#toolbaraction-paste', context);
        this.paste_action.off('click').on('click', this.handle_paste.bind(this));

        this.copyable = $('table tr.selectable.copysupportitem', context);
        if (!this.copyable.length) {
            return;
        }

        this.cut_action = $('a#toolbaraction-cut', context);
        this.cut_action.off('click').on('click', this.handle_cut.bind(this));

        this.copy_action = $('a#toolbaraction-copy', context);
        this.copy_action.off('click').on('click', this.handle_copy.bind(this));

        this.selectable = this.copyable.selectable({
            on_firstclick: this.on_firstclick.bind(this),
            on_select: this.on_select.bind(this)
        }).data('selectable');

        this.read_selected_from_cookie(this.cut_cookie, 'copysupport_cut');
        this.read_selected_from_cookie(this.copy_cookie, '');
    }

    // cut_cookie: 'cone.app.copysupport.cut',
    // copy_cookie: 'cone.app.copysupport.copy',

    on_firstclick(selectable, elem) {
        // tmp
        console.log('click');
        // end tmp
    }

    on_select(selectable) {
        //
    }

    write_selected_to_cookie(name) {
        let selected = $(this.selectable.selected);
        let ids = new Array();
        selected.each(function() {
            ids.push($(this).attr('ajax:target'));
        });
        let cookie = ids.join('::');
        createCookie(name, cookie);
        if (cookie.length) {
            $(this.paste_action).removeClass('disabled');
        } else {
            $(this.paste_action).addClass('disabled');
        }
    }

    read_selected_from_cookie(name, css) {
        let cookie = readCookie(name);
        if (!cookie) {
            return;
        }
        let ids = cookie.split('::');
        let that = this;
        let elem, target;
        $('table tr.selectable', this.context).each(function() {
            elem = $(this);
            target = elem.attr('ajax:target');
            for (let idx in ids) {
                if (ids[idx] == target) {
                    elem.addClass('selected');
                    if (css) {
                        elem.addClass(css);
                    }
                    that.selectable.add(elem.get(0));
                    break;
                }
            }
        });
    }

    handle_cut(e) {
        e.preventDefault();
        createCookie(this.copy_cookie, '', 0);
        this.write_selected_to_cookie(this.cut_cookie);
        this.copyable.removeClass('copysupport_cut');
        $(this.selectable.selected).addClass('copysupport_cut');
    }

    handle_copy(e) {
        e.preventDefault();
        createCookie(this.cut_cookie, '', 0);
        this.write_selected_to_cookie(this.copy_cookie);
        this.copyable.removeClass('copysupport_cut');
    }

    handle_paste(e) {
        e.preventDefault();
        let elem = $(e.currentTarget);
        if (elem.hasClass('disabled')) {
            return;
        }
        let target = ts.ajax.parsetarget(elem.attr('ajax:target'));
        ts.ajax.action({
            name: 'paste',
            mode: 'NONE',
            selector: 'NONE',
            url: target.url,
            params: target.params
        });
    }
}
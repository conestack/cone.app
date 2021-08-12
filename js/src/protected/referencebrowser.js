import $ from 'jquery';

export class ReferenceBrowser {

    constructor(context) {
        // target: null
    }

    overlay() {
        // XXX
        return $('#ajax-overlay').data('overlay');
    }

    browser_binder(context) {
        $('.referencebrowser_trigger', context).referencebrowser();
    }

    add_reference_binder(context) {
        $('a.addreference').off('click').on('click', function(event) {
            event.preventDefault();
            yafowil.referencebrowser.addreference($(this));
        });
    }

    remove_reference_binder(context) {
        $('a.removereference').off('click').on('click', function(event) {
            event.preventDefault();
            yafowil.referencebrowser.removereference($(this));
        });
    }

    addreference(elem) {
        let target = $(this.target);
        let uid = elem.attr('id');
        uid = uid.substring(4, uid.length);
        let label = $('.reftitle', elem.parent()).html();
        if (this.singlevalue()) {
            target.attr('value', label);
            let sel = '[name="' + target.attr('name') + '.uid"]';
            $(sel).attr('value', uid);
            this._set_selected_on_ajax_target(target.parent(), [uid]);
            this.overlay().close();
            return;
        }
        if (this.multivalue()) {
            if ($('[value="' + uid + '"]', target.parent()).length) {
                return;
            }
            let option = $('<option></option>');
            option.val(uid).html(label).attr('selected', 'selected');
            target.append(option);
        }
        this._reset_selected(target);
        this._toggle_enabled(elem);
    }

    removereference(elem) {
        let target = $(this.target);
        let uid = elem.attr('id');
        uid = uid.substring(4, uid.length);
        if (this.singlevalue()) {
            target.attr('value', '');
            let sel = '[name="' + target.attr('name') + '.uid"]';
            $(sel).attr('value', '');
        }
        if (this.multivalue()) {
            let sel = '[value="' + uid + '"]';
            if (!$(sel, target.parent()).length) {
                return;
            }
            $(sel, target).remove();
        }
        this._reset_selected(target);
        this._toggle_enabled(elem);
    }

    singlevalue() {
        return this.target.tagName == 'INPUT';
    }

    multivalue() {
        return this.target.tagName == 'SELECT';
    }

    _toggle_enabled(elem) {
        $('a', elem.parent()).toggleClass('disabled');
    }

    _reset_selected(elem) {
        let selected = new Array();
        if (this.singlevalue()) {
            selected.push(elem.attr('value'));
        }
        if (this.multivalue()) {
            $('[selected=selected]', elem).each(function() {
                selected.push($(this).attr('value'));
            });
        }
        this._set_selected_on_ajax_target(elem.parent(), selected);
        let overlay = this.overlay().getOverlay();
        let rb;
        $('div.referencebrowser a', overlay).each(function() {
            let link = $(this);
            if (link.attr('ajax:target')) {
                rb = yafowil.referencebrowser;
                rb._set_selected_on_ajax_target(link, selected);
            }
        });
    }

    _set_selected_on_ajax_target(elem, selected) {
        let target = ts.ajax.parsetarget(elem.attr('ajax:target'));
        target.params.selected = selected.join(',');
        let query = new Array();
        for (let name in target.params) {
            query.push(name + '=' + target.params[name]);
        }
        elem.attr('ajax:target', target.url + '?' + query.join('&'));
    }
}

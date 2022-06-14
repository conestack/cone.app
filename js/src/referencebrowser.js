import $ from 'jquery';
import ts from 'treibstoff';

export class ReferenceHandle {

    static initialize(context) {
        if (!context) {
            return;
        }
        let ol_elem = context.parents('div.modal');
        if (!ol_elem.length) {
            return;
        }
        let ol = ol_elem.data('overlay'),
            target = ol.ref_target;
        $('a.addreference', context).each(function() {
            new AddReferenceHandle($(this), target, ol);
        });
        $('a.removereference', context).each(function() {
            new RemoveReferenceHandle($(this), target);
        });
    }

    constructor(target) {
        this.target = target;
        this.target_tag = target.get(0).tagName;
    }

    single_value() {
        return this.target_tag == 'INPUT';
    }

    multi_value() {
        return this.target_tag.tagName == 'SELECT';
    }

    toggle_enabled(elem) {
        $('a', elem.parent()).toggleClass('disabled');
    }

    reset_selected(elem) {
        let selected = new Array();
        if (this.single_value()) {
            selected.push(elem.attr('value'));
        }
        if (this.multi_value()) {
            $('[selected=selected]', elem).each(function() {
                selected.push($(this).attr('value'));
            });
        }
        this.set_selected_on_ajax_target(elem.parent(), selected);
        let overlay = this.overlay().getOverlay();
        let that = this;
        $('div.referencebrowser a', overlay.elem).each(function() {
            let link = $(this);
            if (link.attr('ajax:target')) {
                that.set_selected_on_ajax_target(link, selected);
            }
        });
    }

    set_selected_on_ajax_target(elem, selected) {
        let target = ts.ajax.parse_target(elem.attr('ajax:target'));
        target.params.selected = selected.join(',');
        let query = new Array();
        for (let name in target.params) {
            query.push(name + '=' + target.params[name]);
        }
        elem.attr('ajax:target', target.url + '?' + query.join('&'));
    }
}

export class AddReferenceHandle extends ReferenceHandle {

    constructor(elem, target, overlay) {
        super(target);
        this.elem = elem;
        this.overlay = overlay;
        elem.off('click').on('click', this.add_reference.bind(this));
    }

    add_reference(evt) {
        evt.preventDefault();
        let elem = this.elem;
        let target = this.target;
        let uid = elem.attr('id');
        uid = uid.substring(4, uid.length);
        let label = $('.reftitle', elem.parent()).html();
        if (this.single_value()) {
            target.attr('value', label);
            let sel = '[name="' + target.attr('name') + '.uid"]';
            $(sel).attr('value', uid);
            this.set_selected_on_ajax_target(target.parent(), [uid]);
            this.overlay.close();
            return;
        }
        if (this.multi_value()) {
            if ($('[value="' + uid + '"]', target.parent()).length) {
                return;
            }
            let option = $('<option></option>');
            option.val(uid).html(label).attr('selected', 'selected');
            target.append(option);
        }
        this.reset_selected(target);
        this.toggle_enabled(elem);
    }
}

export class RemoveReferenceHandle extends ReferenceHandle {

    constructor(elem, target) {
        super(target);
        this.elem = elem;
        elem.off('click').on('click', this.remove_reference.bind(this));
    }

    remove_reference(evt) {
        evt.preventDefault();
        let elem = this.elem;
        let target = this.target;
        let uid = elem.attr('id');
        uid = uid.substring(4, uid.length);
        if (this.single_value()) {
            target.attr('value', '');
            let sel = '[name="' + target.attr('name') + '.uid"]';
            $(sel).attr('value', '');
        }
        if (this.multi_value()) {
            let sel = '[value="' + uid + '"]';
            if (!$(sel, target.parent()).length) {
                return;
            }
            $(sel, target).remove();
        }
        this.reset_selected(target);
        this.toggle_enabled(elem);
    }
}

export class ReferenceBrowserLoader {

    static initialize(context) {
        $('.referencebrowser_trigger', context).each(function() {
            new ReferenceBrowserLoader($(this));
        });
    }

    constructor(elem) {
        this.wrapper = elem.parent();
        let sel = `[name="${elem.data('reference-name')}"]`;
        this.target = $(sel, this.wrapper);
        elem.off('click').on('click', this.load_ref_browser.bind(this));
    }

    load_ref_browser(evt) {
        evt.preventDefault();
        let ol = ts.ajax.overlay({
            action: 'referencebrowser',
            target: this.wrapper.attr('ajax:target'),
            on_complete: this.on_complete.bind(this)
        });
        ol.ref_target = this.target;
    }

    on_complete(inst) {
        let target = this.target;
        $('a.addreference', inst.elem).each(function() {
            new AddReferenceHandle($(this), target, inst);
        });
        $('a.removereference', inst.elem).each(function() {
            new RemoveReferenceHandle($(this), target);
        });
    }
}

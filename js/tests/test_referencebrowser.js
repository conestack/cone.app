import $ from 'jquery';
import ts from 'treibstoff';
import {
    AddReferenceHandle,
    ReferenceBrowserLoader,
    ReferenceHandle,
    RemoveReferenceHandle,
} from '../src/referencebrowser.js';

QUnit.module('cone.app.referencebrowser.ReferenceHandle', (hooks) => {
    let container, ajax_parse_target_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_parse_target_origin = ts.ajax.parse_target;
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.parse_target = ajax_parse_target_origin;
    });

    QUnit.test('ReferenceHandle.initialize returns early without context', (assert) => {
        ReferenceHandle.initialize(null);
        assert.ok(true, 'no error with null context');
    });

    QUnit.test('ReferenceHandle.initialize returns early without modal parent', (assert) => {
        const context = $('<div />').appendTo(container);

        ReferenceHandle.initialize(context);
        assert.ok(true, 'no error without modal parent');
    });

    QUnit.test('ReferenceHandle.initialize returns early without ref_target', (assert) => {
        // This allows other components (e.g. catalog item picker) to reuse
        // the referencebrowser overlay with custom selection handling.
        const modal = $('<div class="modal" />').appendTo(container);
        const context = $('<div class="modal-body" />').appendTo(modal);
        const link = $('<a class="addreference" id="ref-123" />').appendTo(context);

        const overlay = { elem: modal }; // no ref_target
        modal.data('overlay', overlay);

        ReferenceHandle.initialize(context);

        const events = $._data(link.get(0), 'events');
        assert.notOk(events?.click, 'no click handler bound when ref_target missing');
    });

    QUnit.test('ReferenceHandle.initialize binds handles with ref_target', (assert) => {
        const modal = $('<div class="modal" />').appendTo(container);
        const context = $('<div class="modal-body" />').appendTo(modal);
        const add_link = $('<a class="addreference" id="ref-123" />').appendTo(context);
        const remove_link = $('<a class="removereference" id="ref-456" />').appendTo(context);

        const overlay = { elem: modal, ref_target: $('<input />') };
        modal.data('overlay', overlay);

        ReferenceHandle.initialize(context);

        assert.ok($._data(add_link.get(0), 'events')?.click, 'add handle bound');
        assert.ok($._data(remove_link.get(0), 'events')?.click, 'remove handle bound');
    });

    QUnit.test('ReferenceHandle constructor stores properties', (assert) => {
        const elem = $('<a />');
        const target = $('<input />');
        const overlay = { elem: $('<div />') };

        const handle = new ReferenceHandle(elem, target, overlay);

        assert.strictEqual(handle.elem, elem, 'elem stored');
        assert.strictEqual(handle.target, target, 'target stored');
        assert.strictEqual(handle.target_tag, 'INPUT', 'target_tag detected');
        assert.strictEqual(handle.overlay, overlay, 'overlay stored');
    });

    QUnit.test('ReferenceHandle single_value returns true for INPUT', (assert) => {
        const elem = $('<a />');
        const target = $('<input />');
        const overlay = {};

        const handle = new ReferenceHandle(elem, target, overlay);

        assert.true(handle.single_value(), 'INPUT is single value');
        assert.false(handle.multi_value(), 'INPUT is not multi value');
    });

    QUnit.test('ReferenceHandle multi_value returns true for SELECT', (assert) => {
        const elem = $('<a />');
        const target = $('<select />');
        const overlay = {};

        const handle = new ReferenceHandle(elem, target, overlay);

        assert.false(handle.single_value(), 'SELECT is not single value');
        assert.true(handle.multi_value(), 'SELECT is multi value');
    });

    QUnit.test('ReferenceHandle toggle_enabled toggles disabled class', (assert) => {
        const parent = $('<div />').appendTo(container);
        const link1 = $('<a class="addreference" />').appendTo(parent);
        const link2 = $('<a class="removereference disabled" />').appendTo(parent);

        const handle = new ReferenceHandle(link1, $('<input />'), {});

        handle.toggle_enabled(link1);

        assert.true(link1.hasClass('disabled'), 'first link now disabled');
        assert.false(link2.hasClass('disabled'), 'second link now enabled');
    });

    QUnit.test('ReferenceHandle set_selected_on_ajax_target updates target', (assert) => {
        const elem = $('<a ajax:target="/api/ref?foo=bar" />').appendTo(container);

        ts.ajax.parse_target = (_target) => ({ url: '/api/ref', params: { foo: 'bar' } });

        const handle = new ReferenceHandle($('<a />'), $('<input />'), {});
        handle.set_selected_on_ajax_target(elem, ['uid1', 'uid2']);

        const new_target = elem.attr('ajax:target');
        assert.ok(new_target.includes('selected=uid1,uid2'), 'selected param added');
    });
});

QUnit.module('cone.app.referencebrowser.AddReferenceHandle', (hooks) => {
    let container, ajax_parse_target_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_parse_target_origin = ts.ajax.parse_target;

        ts.ajax.parse_target = (target) => ({ url: target, params: {} });
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.parse_target = ajax_parse_target_origin;
    });

    QUnit.test('AddReferenceHandle constructor binds click', (assert) => {
        const elem = $('<a id="ref-uid123" />');
        const target = $('<input />');
        const overlay = { elem: $('<div />') };

        new AddReferenceHandle(elem, target, overlay);

        const events = $._data(elem.get(0), 'events');
        assert.ok(events?.click, 'click event bound');
    });

    QUnit.test('AddReferenceHandle add_reference for single value', (assert) => {
        const parent = $('<div />').appendTo(container);
        const elem = $('<a id="ref-abc123" />').appendTo(parent);
        $('<span class="reftitle">Test Label</span>').appendTo(parent);

        const target = $('<input name="myfield" />').appendTo(container);
        $('<input name="myfield.uid" value="" />').appendTo(container);

        let closed = false;
        const overlay = {
            elem: $('<div />'),
            close: () => {
                closed = true;
            },
        };

        const handle = new AddReferenceHandle(elem, target, overlay);

        const evt = new $.Event('click');
        handle.add_reference(evt);

        assert.strictEqual(target.attr('value'), 'Test Label', 'input value set to label');
        assert.strictEqual(
            $('[name="myfield.uid"]').attr('value'),
            'abc123',
            'uid hidden field set',
        );
        assert.true(closed, 'overlay closed for single value');
    });

    QUnit.test('AddReferenceHandle add_reference for multi value', (assert) => {
        const parent = $('<div />').appendTo(container);
        const elem = $('<a id="ref-xyz789" />').appendTo(parent);
        $('<span class="reftitle">New Option</span>').appendTo(parent);

        const targetWrapper = $('<div />').appendTo(container);
        const target = $('<select />').appendTo(targetWrapper);

        const overlay = { elem: $('<div />') };

        let change_triggered = false;
        target.on('change', () => {
            change_triggered = true;
        });

        const handle = new AddReferenceHandle(elem, target, overlay);

        const evt = new $.Event('click');
        handle.add_reference(evt);

        const options = target.find('option');
        assert.strictEqual(options.length, 1, 'option added');
        assert.strictEqual(options.val(), 'xyz789', 'option has correct value');
        assert.strictEqual(options.html(), 'New Option', 'option has correct label');
        assert.true(change_triggered, 'change event triggered');
    });

    QUnit.test('AddReferenceHandle updates selected on browser links', (assert) => {
        const parent = $('<div />').appendTo(container);
        const elem = $('<a id="ref-xyz789" />').appendTo(parent);
        $('<span class="reftitle">New Option</span>').appendTo(parent);

        const target_wrapper = $('<div ajax:target="/field" />').appendTo(container);
        const target = $('<select />').appendTo(target_wrapper);

        const overlay_elem = $(`
            <div>
                <div class="referencebrowser">
                    <a class="with-target" ajax:target="/browse">Browse</a>
                    <a class="without-target">Other</a>
                </div>
            </div>
        `);
        const overlay = { elem: overlay_elem };

        const handle = new AddReferenceHandle(elem, target, overlay);
        handle.add_reference(new $.Event('click'));

        assert.strictEqual(
            $('a.with-target', overlay_elem).attr('ajax:target'),
            '/browse?selected=xyz789',
            'selected set on browser link',
        );
        assert.strictEqual(
            $('a.without-target', overlay_elem).attr('ajax:target'),
            undefined,
            'link without ajax target untouched',
        );
        assert.strictEqual(
            target_wrapper.attr('ajax:target'),
            '/field?selected=xyz789',
            'selected set on field wrapper',
        );
    });

    QUnit.test('AddReferenceHandle prevents duplicate for multi value', (assert) => {
        const parent = $('<div />').appendTo(container);
        const elem = $('<a id="ref-dup001" />').appendTo(parent);
        $('<span class="reftitle">Duplicate</span>').appendTo(parent);

        const targetWrapper = $('<div />').appendTo(container);
        const target = $('<select />').appendTo(targetWrapper);
        $('<option value="dup001">Existing</option>').appendTo(targetWrapper);

        const overlay = { elem: $('<div />') };

        const handle = new AddReferenceHandle(elem, target, overlay);

        const evt = new $.Event('click');
        handle.add_reference(evt);

        assert.strictEqual(target.find('option').length, 0, 'no duplicate option added to select');
    });

    QUnit.test('AddReferenceHandle prevents default event', (assert) => {
        const parent = $('<div />').appendTo(container);
        const elem = $('<a id="ref-123" />').appendTo(parent);
        $('<span class="reftitle">Label</span>').appendTo(parent);

        const target = $('<input name="field" />').appendTo(container);
        $('<input name="field.uid" />').appendTo(container);

        const overlay = { elem: $('<div />'), close: () => {} };

        const handle = new AddReferenceHandle(elem, target, overlay);

        const evt = new $.Event('click');
        handle.add_reference(evt);

        assert.true(evt.isDefaultPrevented(), 'default prevented');
    });
});

QUnit.module('cone.app.referencebrowser.RemoveReferenceHandle', (hooks) => {
    let container, ajax_parse_target_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_parse_target_origin = ts.ajax.parse_target;

        ts.ajax.parse_target = (target) => ({ url: target, params: {} });
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.parse_target = ajax_parse_target_origin;
    });

    QUnit.test('RemoveReferenceHandle constructor binds click', (assert) => {
        const elem = $('<a id="ref-uid123" />');
        const target = $('<input />');
        const overlay = { elem: $('<div />') };

        new RemoveReferenceHandle(elem, target, overlay);

        const events = $._data(elem.get(0), 'events');
        assert.ok(events?.click, 'click event bound');
    });

    QUnit.test('RemoveReferenceHandle remove_reference for single value', (assert) => {
        const parent = $('<div />').appendTo(container);
        const elem = $('<a id="ref-abc123" />').appendTo(parent);

        const target = $('<input name="myfield" value="Old Value" />').appendTo(container);
        $('<input name="myfield.uid" value="abc123" />').appendTo(container);

        const overlay = { elem: $('<div />') };

        const handle = new RemoveReferenceHandle(elem, target, overlay);

        const evt = new $.Event('click');
        handle.remove_reference(evt);

        assert.strictEqual(target.attr('value'), '', 'input value cleared');
        assert.strictEqual($('[name="myfield.uid"]').attr('value'), '', 'uid hidden field cleared');
    });

    QUnit.test('RemoveReferenceHandle remove_reference for multi value', (assert) => {
        const parent = $('<div />').appendTo(container);
        const elem = $('<a id="ref-opt1" />').appendTo(parent);

        const targetWrapper = $('<div />').appendTo(container);
        const target = $('<select />').appendTo(targetWrapper);
        $('<option value="opt1" selected>Option 1</option>').appendTo(target);
        $('<option value="opt2" selected>Option 2</option>').appendTo(target);

        const overlay = { elem: $('<div />') };

        let change_triggered = false;
        target.on('change', () => {
            change_triggered = true;
        });

        const handle = new RemoveReferenceHandle(elem, target, overlay);

        const evt = new $.Event('click');
        handle.remove_reference(evt);

        assert.strictEqual(target.find('option').length, 1, 'option removed');
        assert.strictEqual(target.find('option').val(), 'opt2', 'correct option remains');
        assert.true(change_triggered, 'change event triggered');
    });

    QUnit.test('RemoveReferenceHandle ignores non-existent option', (assert) => {
        const parent = $('<div />').appendTo(container);
        const elem = $('<a id="ref-notexist" />').appendTo(parent);

        const targetWrapper = $('<div />').appendTo(container);
        const target = $('<select />').appendTo(targetWrapper);
        $('<option value="other">Other</option>').appendTo(target);

        const overlay = { elem: $('<div />') };

        const handle = new RemoveReferenceHandle(elem, target, overlay);

        const evt = new $.Event('click');
        handle.remove_reference(evt);

        assert.strictEqual(target.find('option').length, 1, 'option count unchanged');
    });

    QUnit.test('RemoveReferenceHandle prevents default event', (assert) => {
        const parent = $('<div />').appendTo(container);
        const elem = $('<a id="ref-123" />').appendTo(parent);

        const target = $('<input name="field" value="val" />').appendTo(container);
        $('<input name="field.uid" value="123" />').appendTo(container);

        const overlay = { elem: $('<div />') };

        const handle = new RemoveReferenceHandle(elem, target, overlay);

        const evt = new $.Event('click');
        handle.remove_reference(evt);

        assert.true(evt.isDefaultPrevented(), 'default prevented');
    });
});

QUnit.module('cone.app.referencebrowser.ReferenceBrowserLoader', (hooks) => {
    let container, ajax_overlay_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_overlay_origin = ts.ajax.overlay;
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.overlay = ajax_overlay_origin;
    });

    QUnit.test('ReferenceBrowserLoader.initialize creates instances', (assert) => {
        const wrapper = $('<div ajax:target="/api/ref" />').appendTo(container);
        const trigger = $(`
            <a class="referencebrowser_trigger"
               data-reference-name="myfield">Browse</a>
        `).appendTo(wrapper);
        $('<input name="myfield" />').appendTo(wrapper);

        ReferenceBrowserLoader.initialize(container);

        const events = $._data(trigger.get(0), 'events');
        assert.ok(events?.click, 'click event bound');
    });

    QUnit.test('ReferenceBrowserLoader constructor finds target', (assert) => {
        const wrapper = $('<div ajax:target="/api/ref" />').appendTo(container);
        const trigger = $(`
            <a class="referencebrowser_trigger"
               data-reference-name="reffield">Browse</a>
        `).appendTo(wrapper);
        const input = $('<input name="reffield" />').appendTo(wrapper);

        const loader = new ReferenceBrowserLoader(trigger);

        assert.strictEqual(loader.wrapper.get(0), wrapper.get(0), 'wrapper found');
        assert.strictEqual(loader.target.get(0), input.get(0), 'target found');
    });

    QUnit.test('ReferenceBrowserLoader load_ref_browser opens overlay', (assert) => {
        const wrapper = $('<div ajax:target="/api/browse" />').appendTo(container);
        const trigger = $(`
            <a class="referencebrowser_trigger"
               data-reference-name="field">Browse</a>
        `).appendTo(wrapper);
        const input = $('<input name="field" />').appendTo(wrapper);

        let overlay_opts = null;
        const mock_overlay = { ref_target: null };
        ts.ajax.overlay = (opts) => {
            overlay_opts = opts;
            return mock_overlay;
        };

        const loader = new ReferenceBrowserLoader(trigger);
        const evt = new $.Event('click');
        loader.load_ref_browser(evt);

        assert.strictEqual(overlay_opts.action, 'referencebrowser', 'correct action');
        assert.strictEqual(overlay_opts.title, 'Referencebrowser', 'correct title');
        assert.strictEqual(overlay_opts.css, 'modal-lg', 'correct css');
        assert.strictEqual(overlay_opts.target, '/api/browse', 'correct target');
        assert.ok(overlay_opts.on_complete, 'on_complete callback provided');
        assert.strictEqual(
            mock_overlay.ref_target.get(0),
            input.get(0),
            'ref_target set on overlay',
        );
    });

    QUnit.test('ReferenceBrowserLoader load_ref_browser prevents default', (assert) => {
        const wrapper = $('<div ajax:target="/api" />').appendTo(container);
        const trigger = $(`
            <a class="referencebrowser_trigger"
               data-reference-name="field">Browse</a>
        `).appendTo(wrapper);
        $('<input name="field" />').appendTo(wrapper);

        ts.ajax.overlay = () => ({});

        const loader = new ReferenceBrowserLoader(trigger);
        const evt = new $.Event('click');
        loader.load_ref_browser(evt);

        assert.true(evt.isDefaultPrevented(), 'default prevented');
    });

    QUnit.test('ReferenceBrowserLoader on_complete binds handlers', (assert) => {
        const wrapper = $('<div ajax:target="/api" />').appendTo(container);
        const trigger = $(`
            <a class="referencebrowser_trigger"
               data-reference-name="field">Browse</a>
        `).appendTo(wrapper);
        $('<input name="field" />').appendTo(wrapper);

        const loader = new ReferenceBrowserLoader(trigger);

        const overlay_elem = $(`
            <div>
                <a class="addreference" id="ref-001">Add</a>
                <a class="removereference" id="ref-002">Remove</a>
            </div>
        `);
        const mock_inst = { elem: overlay_elem };

        loader.on_complete(mock_inst);

        const add_link = overlay_elem.find('.addreference');
        const remove_link = overlay_elem.find('.removereference');

        const add_events = $._data(add_link.get(0), 'events');
        const remove_events = $._data(remove_link.get(0), 'events');

        assert.ok(add_events?.click, 'add reference click bound');
        assert.ok(remove_events?.click, 'remove reference click bound');
    });

    QUnit.test('ReferenceBrowserLoader rebinds on subsequent init', (assert) => {
        const wrapper = $('<div ajax:target="/api" />').appendTo(container);
        const trigger = $(`
            <a class="referencebrowser_trigger"
               data-reference-name="field">Browse</a>
        `).appendTo(wrapper);
        $('<input name="field" />').appendTo(wrapper);

        let overlay_count = 0;
        ts.ajax.overlay = () => {
            overlay_count++;
            return {};
        };

        new ReferenceBrowserLoader(trigger);
        new ReferenceBrowserLoader(trigger);

        trigger.trigger('click');

        assert.strictEqual(overlay_count, 1, 'handler fires only once');
    });
});

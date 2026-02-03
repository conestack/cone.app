import $ from 'jquery';
import ts from 'treibstoff';
import {
    ReferenceHandle,
    AddReferenceHandle,
    RemoveReferenceHandle,
    ReferenceBrowserLoader
} from '../src/referencebrowser.js';

QUnit.module('cone.app.referencebrowser.ReferenceHandle', hooks => {

    let container,
        ajax_parse_target_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_parse_target_origin = ts.ajax.parse_target;
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.parse_target = ajax_parse_target_origin;
    });

    QUnit.test('ReferenceHandle.initialize returns early without context', assert => {
        ReferenceHandle.initialize(null);
        assert.ok(true, 'no error with null context');
    });

    QUnit.test('ReferenceHandle.initialize returns early without modal parent',
        assert => {
        let context = $('<div />').appendTo(container);

        ReferenceHandle.initialize(context);
        assert.ok(true, 'no error without modal parent');
    });

    QUnit.test('ReferenceHandle constructor stores properties', assert => {
        let elem = $('<a />');
        let target = $('<input />');
        let overlay = {elem: $('<div />')};

        let handle = new ReferenceHandle(elem, target, overlay);

        assert.strictEqual(handle.elem, elem, 'elem stored');
        assert.strictEqual(handle.target, target, 'target stored');
        assert.strictEqual(handle.target_tag, 'INPUT', 'target_tag detected');
        assert.strictEqual(handle.overlay, overlay, 'overlay stored');
    });

    QUnit.test('ReferenceHandle single_value returns true for INPUT', assert => {
        let elem = $('<a />');
        let target = $('<input />');
        let overlay = {};

        let handle = new ReferenceHandle(elem, target, overlay);

        assert.true(handle.single_value(), 'INPUT is single value');
        assert.false(handle.multi_value(), 'INPUT is not multi value');
    });

    QUnit.test('ReferenceHandle multi_value returns true for SELECT', assert => {
        let elem = $('<a />');
        let target = $('<select />');
        let overlay = {};

        let handle = new ReferenceHandle(elem, target, overlay);

        assert.false(handle.single_value(), 'SELECT is not single value');
        assert.true(handle.multi_value(), 'SELECT is multi value');
    });

    QUnit.test('ReferenceHandle toggle_enabled toggles disabled class', assert => {
        let parent = $('<div />').appendTo(container);
        let link1 = $('<a class="addreference" />').appendTo(parent);
        let link2 = $('<a class="removereference disabled" />').appendTo(parent);

        let handle = new ReferenceHandle(link1, $('<input />'), {});

        handle.toggle_enabled(link1);

        assert.true(link1.hasClass('disabled'), 'first link now disabled');
        assert.false(link2.hasClass('disabled'), 'second link now enabled');
    });

    QUnit.test('ReferenceHandle set_selected_on_ajax_target updates target',
        assert => {
        let elem = $('<a ajax:target="/api/ref?foo=bar" />').appendTo(container);

        ts.ajax.parse_target = function(target) {
            return {url: '/api/ref', params: {foo: 'bar'}};
        };

        let handle = new ReferenceHandle($('<a />'), $('<input />'), {});
        handle.set_selected_on_ajax_target(elem, ['uid1', 'uid2']);

        let new_target = elem.attr('ajax:target');
        assert.ok(new_target.includes('selected=uid1,uid2'),
            'selected param added');
    });
});

QUnit.module('cone.app.referencebrowser.AddReferenceHandle', hooks => {

    let container,
        ajax_parse_target_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_parse_target_origin = ts.ajax.parse_target;

        ts.ajax.parse_target = function(target) {
            return {url: target, params: {}};
        };
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.parse_target = ajax_parse_target_origin;
    });

    QUnit.test('AddReferenceHandle constructor binds click', assert => {
        let elem = $('<a id="ref-uid123" />');
        let target = $('<input />');
        let overlay = {elem: $('<div />')};

        new AddReferenceHandle(elem, target, overlay);

        let events = $._data(elem.get(0), 'events');
        assert.ok(events && events.click, 'click event bound');
    });

    QUnit.test('AddReferenceHandle add_reference for single value', assert => {
        let parent = $('<div />').appendTo(container);
        let elem = $('<a id="ref-abc123" />').appendTo(parent);
        $('<span class="reftitle">Test Label</span>').appendTo(parent);

        let target = $('<input name="myfield" />').appendTo(container);
        $('<input name="myfield.uid" value="" />').appendTo(container);

        let closed = false;
        let overlay = {
            elem: $('<div />'),
            close: function() { closed = true; }
        };

        let handle = new AddReferenceHandle(elem, target, overlay);

        let evt = new $.Event('click');
        handle.add_reference(evt);

        assert.strictEqual(target.attr('value'), 'Test Label',
            'input value set to label');
        assert.strictEqual($('[name="myfield.uid"]').attr('value'), 'abc123',
            'uid hidden field set');
        assert.true(closed, 'overlay closed for single value');
    });

    QUnit.test('AddReferenceHandle add_reference for multi value', assert => {
        let parent = $('<div />').appendTo(container);
        let elem = $('<a id="ref-xyz789" />').appendTo(parent);
        $('<span class="reftitle">New Option</span>').appendTo(parent);

        let targetWrapper = $('<div />').appendTo(container);
        let target = $('<select />').appendTo(targetWrapper);

        let overlay = {elem: $('<div />')};

        let change_triggered = false;
        target.on('change', () => { change_triggered = true; });

        let handle = new AddReferenceHandle(elem, target, overlay);

        let evt = new $.Event('click');
        handle.add_reference(evt);

        let options = target.find('option');
        assert.strictEqual(options.length, 1, 'option added');
        assert.strictEqual(options.val(), 'xyz789', 'option has correct value');
        assert.strictEqual(options.html(), 'New Option', 'option has correct label');
        assert.true(change_triggered, 'change event triggered');
    });

    QUnit.test('AddReferenceHandle prevents duplicate for multi value', assert => {
        let parent = $('<div />').appendTo(container);
        let elem = $('<a id="ref-dup001" />').appendTo(parent);
        $('<span class="reftitle">Duplicate</span>').appendTo(parent);

        let targetWrapper = $('<div />').appendTo(container);
        let target = $('<select />').appendTo(targetWrapper);
        $('<option value="dup001">Existing</option>').appendTo(targetWrapper);

        let overlay = {elem: $('<div />')};

        let handle = new AddReferenceHandle(elem, target, overlay);

        let evt = new $.Event('click');
        handle.add_reference(evt);

        assert.strictEqual(target.find('option').length, 0,
            'no duplicate option added to select');
    });

    QUnit.test('AddReferenceHandle prevents default event', assert => {
        let parent = $('<div />').appendTo(container);
        let elem = $('<a id="ref-123" />').appendTo(parent);
        $('<span class="reftitle">Label</span>').appendTo(parent);

        let target = $('<input name="field" />').appendTo(container);
        $('<input name="field.uid" />').appendTo(container);

        let overlay = {elem: $('<div />'), close: function() {}};

        let handle = new AddReferenceHandle(elem, target, overlay);

        let evt = new $.Event('click');
        handle.add_reference(evt);

        assert.true(evt.isDefaultPrevented(), 'default prevented');
    });
});

QUnit.module('cone.app.referencebrowser.RemoveReferenceHandle', hooks => {

    let container,
        ajax_parse_target_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_parse_target_origin = ts.ajax.parse_target;

        ts.ajax.parse_target = function(target) {
            return {url: target, params: {}};
        };
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.parse_target = ajax_parse_target_origin;
    });

    QUnit.test('RemoveReferenceHandle constructor binds click', assert => {
        let elem = $('<a id="ref-uid123" />');
        let target = $('<input />');
        let overlay = {elem: $('<div />')};

        new RemoveReferenceHandle(elem, target, overlay);

        let events = $._data(elem.get(0), 'events');
        assert.ok(events && events.click, 'click event bound');
    });

    QUnit.test('RemoveReferenceHandle remove_reference for single value',
        assert => {
        let parent = $('<div />').appendTo(container);
        let elem = $('<a id="ref-abc123" />').appendTo(parent);

        let target = $('<input name="myfield" value="Old Value" />')
            .appendTo(container);
        $('<input name="myfield.uid" value="abc123" />').appendTo(container);

        let overlay = {elem: $('<div />')};

        let handle = new RemoveReferenceHandle(elem, target, overlay);

        let evt = new $.Event('click');
        handle.remove_reference(evt);

        assert.strictEqual(target.attr('value'), '', 'input value cleared');
        assert.strictEqual($('[name="myfield.uid"]').attr('value'), '',
            'uid hidden field cleared');
    });

    QUnit.test('RemoveReferenceHandle remove_reference for multi value',
        assert => {
        let parent = $('<div />').appendTo(container);
        let elem = $('<a id="ref-opt1" />').appendTo(parent);

        let targetWrapper = $('<div />').appendTo(container);
        let target = $('<select />').appendTo(targetWrapper);
        $('<option value="opt1" selected>Option 1</option>').appendTo(target);
        $('<option value="opt2" selected>Option 2</option>').appendTo(target);

        let overlay = {elem: $('<div />')};

        let change_triggered = false;
        target.on('change', () => { change_triggered = true; });

        let handle = new RemoveReferenceHandle(elem, target, overlay);

        let evt = new $.Event('click');
        handle.remove_reference(evt);

        assert.strictEqual(target.find('option').length, 1, 'option removed');
        assert.strictEqual(target.find('option').val(), 'opt2',
            'correct option remains');
        assert.true(change_triggered, 'change event triggered');
    });

    QUnit.test('RemoveReferenceHandle ignores non-existent option', assert => {
        let parent = $('<div />').appendTo(container);
        let elem = $('<a id="ref-notexist" />').appendTo(parent);

        let targetWrapper = $('<div />').appendTo(container);
        let target = $('<select />').appendTo(targetWrapper);
        $('<option value="other">Other</option>').appendTo(target);

        let overlay = {elem: $('<div />')};

        let handle = new RemoveReferenceHandle(elem, target, overlay);

        let evt = new $.Event('click');
        handle.remove_reference(evt);

        assert.strictEqual(target.find('option').length, 1,
            'option count unchanged');
    });

    QUnit.test('RemoveReferenceHandle prevents default event', assert => {
        let parent = $('<div />').appendTo(container);
        let elem = $('<a id="ref-123" />').appendTo(parent);

        let target = $('<input name="field" value="val" />').appendTo(container);
        $('<input name="field.uid" value="123" />').appendTo(container);

        let overlay = {elem: $('<div />')};

        let handle = new RemoveReferenceHandle(elem, target, overlay);

        let evt = new $.Event('click');
        handle.remove_reference(evt);

        assert.true(evt.isDefaultPrevented(), 'default prevented');
    });
});

QUnit.module('cone.app.referencebrowser.ReferenceBrowserLoader', hooks => {

    let container,
        ajax_overlay_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_overlay_origin = ts.ajax.overlay;
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.overlay = ajax_overlay_origin;
    });

    QUnit.test('ReferenceBrowserLoader.initialize creates instances', assert => {
        let wrapper = $('<div ajax:target="/api/ref" />').appendTo(container);
        let trigger = $(`
            <a class="referencebrowser_trigger"
               data-reference-name="myfield">Browse</a>
        `).appendTo(wrapper);
        $('<input name="myfield" />').appendTo(wrapper);

        ReferenceBrowserLoader.initialize(container);

        let events = $._data(trigger.get(0), 'events');
        assert.ok(events && events.click, 'click event bound');
    });

    QUnit.test('ReferenceBrowserLoader constructor finds target', assert => {
        let wrapper = $('<div ajax:target="/api/ref" />').appendTo(container);
        let trigger = $(`
            <a class="referencebrowser_trigger"
               data-reference-name="reffield">Browse</a>
        `).appendTo(wrapper);
        let input = $('<input name="reffield" />').appendTo(wrapper);

        let loader = new ReferenceBrowserLoader(trigger);

        assert.strictEqual(loader.wrapper.get(0), wrapper.get(0),
            'wrapper found');
        assert.strictEqual(loader.target.get(0), input.get(0), 'target found');
    });

    QUnit.test('ReferenceBrowserLoader load_ref_browser opens overlay',
        assert => {
        let wrapper = $('<div ajax:target="/api/browse" />').appendTo(container);
        let trigger = $(`
            <a class="referencebrowser_trigger"
               data-reference-name="field">Browse</a>
        `).appendTo(wrapper);
        let input = $('<input name="field" />').appendTo(wrapper);

        let overlay_opts = null;
        let mock_overlay = {ref_target: null};
        ts.ajax.overlay = function(opts) {
            overlay_opts = opts;
            return mock_overlay;
        };

        let loader = new ReferenceBrowserLoader(trigger);
        let evt = new $.Event('click');
        loader.load_ref_browser(evt);

        assert.strictEqual(overlay_opts.action, 'referencebrowser',
            'correct action');
        assert.strictEqual(overlay_opts.title, 'Referencebrowser',
            'correct title');
        assert.strictEqual(overlay_opts.css, 'modal-lg', 'correct css');
        assert.strictEqual(overlay_opts.target, '/api/browse', 'correct target');
        assert.ok(overlay_opts.on_complete, 'on_complete callback provided');
        assert.strictEqual(mock_overlay.ref_target.get(0), input.get(0),
            'ref_target set on overlay');
    });

    QUnit.test('ReferenceBrowserLoader load_ref_browser prevents default',
        assert => {
        let wrapper = $('<div ajax:target="/api" />').appendTo(container);
        let trigger = $(`
            <a class="referencebrowser_trigger"
               data-reference-name="field">Browse</a>
        `).appendTo(wrapper);
        $('<input name="field" />').appendTo(wrapper);

        ts.ajax.overlay = function() { return {}; };

        let loader = new ReferenceBrowserLoader(trigger);
        let evt = new $.Event('click');
        loader.load_ref_browser(evt);

        assert.true(evt.isDefaultPrevented(), 'default prevented');
    });

    QUnit.test('ReferenceBrowserLoader on_complete binds handlers', assert => {
        let wrapper = $('<div ajax:target="/api" />').appendTo(container);
        let trigger = $(`
            <a class="referencebrowser_trigger"
               data-reference-name="field">Browse</a>
        `).appendTo(wrapper);
        let input = $('<input name="field" />').appendTo(wrapper);

        let loader = new ReferenceBrowserLoader(trigger);

        let overlay_elem = $(`
            <div>
                <a class="addreference" id="ref-001">Add</a>
                <a class="removereference" id="ref-002">Remove</a>
            </div>
        `);
        let mock_inst = {elem: overlay_elem};

        loader.on_complete(mock_inst);

        let add_link = overlay_elem.find('.addreference');
        let remove_link = overlay_elem.find('.removereference');

        let add_events = $._data(add_link.get(0), 'events');
        let remove_events = $._data(remove_link.get(0), 'events');

        assert.ok(add_events && add_events.click,
            'add reference click bound');
        assert.ok(remove_events && remove_events.click,
            'remove reference click bound');
    });

    QUnit.test('ReferenceBrowserLoader rebinds on subsequent init', assert => {
        let wrapper = $('<div ajax:target="/api" />').appendTo(container);
        let trigger = $(`
            <a class="referencebrowser_trigger"
               data-reference-name="field">Browse</a>
        `).appendTo(wrapper);
        $('<input name="field" />').appendTo(wrapper);

        let overlay_count = 0;
        ts.ajax.overlay = function() {
            overlay_count++;
            return {};
        };

        new ReferenceBrowserLoader(trigger);
        new ReferenceBrowserLoader(trigger);

        trigger.trigger('click');

        assert.strictEqual(overlay_count, 1, 'handler fires only once');
    });
});

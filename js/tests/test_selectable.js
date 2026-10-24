import $ from 'jquery';
import {keys} from '../src/keybinder.js';
import {Selectable} from '../src/selectable.js';

QUnit.module('cone.app.selectable', hooks => {

    let container;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        // Reset keys state
        keys.shift_down = false;
        keys.ctrl_down = false;
    });

    hooks.afterEach(() => {
        container.remove();
        keys.shift_down = false;
        keys.ctrl_down = false;
    });

    QUnit.test('Selectable constructor initializes state', assert => {
        let options = {on_select: () => {}};
        let selectable = new Selectable(options);

        assert.strictEqual(selectable.options, options, 'options stored');
        assert.deepEqual(selectable.selected, [], 'selected is empty array');
        assert.strictEqual(selectable.select_direction, 0, 'select_direction is 0');
        assert.true(selectable.firstclick, 'firstclick is true');
    });

    QUnit.test('Selectable reset clears selection', assert => {
        let selectable = new Selectable();
        selectable.selected = ['item1', 'item2'];

        selectable.reset();

        assert.deepEqual(selectable.selected, [], 'selected cleared after reset');
    });

    QUnit.test('Selectable add appends element', assert => {
        let selectable = new Selectable();
        let elem1 = document.createElement('div');
        let elem2 = document.createElement('div');

        selectable.add(elem1);
        assert.strictEqual(selectable.selected.length, 1, 'one element added');
        assert.strictEqual(selectable.selected[0], elem1, 'correct element added');

        selectable.add(elem2);
        assert.strictEqual(selectable.selected.length, 2, 'two elements added');
    });

    QUnit.test('Selectable add prevents duplicates', assert => {
        let selectable = new Selectable();
        let elem = document.createElement('div');

        selectable.add(elem);
        selectable.add(elem);

        assert.strictEqual(selectable.selected.length, 1, 'no duplicates');
    });

    QUnit.test('Selectable remove removes element', assert => {
        let selectable = new Selectable();
        let elem1 = document.createElement('div');
        let elem2 = document.createElement('div');

        selectable.selected = [elem1, elem2];
        selectable.remove(elem1);

        assert.strictEqual(selectable.selected.length, 1, 'one element removed');
        assert.strictEqual(selectable.selected[0], elem2, 'correct element remains');
    });

    QUnit.test('Selectable select_no_key selects single element', assert => {
        let items = $(`
            <div class="item selected">Item 1</div>
            <div class="item">Item 2</div>
            <div class="item">Item 3</div>
        `).appendTo(container);

        let selectable = new Selectable();
        let elem = container.find('.item').eq(1);

        selectable.select_no_key(container, elem);

        assert.false(container.find('.item').eq(0).hasClass('selected'),
            'first item deselected');
        assert.true(elem.hasClass('selected'), 'clicked item selected');
        assert.strictEqual(selectable.selected.length, 1, 'only one selected');
        assert.strictEqual(selectable.selected[0], elem.get(0),
            'correct element in selected array');
    });

    QUnit.test('Selectable select_ctrl_down toggles selection', assert => {
        let items = $(`
            <div class="item">Item 1</div>
            <div class="item">Item 2</div>
        `).appendTo(container);

        let selectable = new Selectable();
        let elem = container.find('.item').eq(0);

        // First click adds selection
        selectable.select_ctrl_down(elem);
        assert.true(elem.hasClass('selected'), 'element selected');
        assert.strictEqual(selectable.selected.length, 1, 'one item selected');

        // Second click removes selection
        selectable.select_ctrl_down(elem);
        assert.false(elem.hasClass('selected'), 'element deselected');
        assert.strictEqual(selectable.selected.length, 0, 'no items selected');
    });

    QUnit.test('Selectable select_ctrl_down allows multiple selections', assert => {
        let items = $(`
            <div class="item">Item 1</div>
            <div class="item">Item 2</div>
            <div class="item">Item 3</div>
        `).appendTo(container);

        let selectable = new Selectable();
        let elem1 = container.find('.item').eq(0);
        let elem2 = container.find('.item').eq(2);

        selectable.select_ctrl_down(elem1);
        selectable.select_ctrl_down(elem2);

        assert.true(elem1.hasClass('selected'), 'first element selected');
        assert.true(elem2.hasClass('selected'), 'third element selected');
        assert.strictEqual(selectable.selected.length, 2, 'two items selected');
    });

    QUnit.test('Selectable get_nearest returns nearest selected index', assert => {
        let items = $(`
            <div class="item selected">Item 0</div>
            <div class="item">Item 1</div>
            <div class="item selected">Item 2</div>
            <div class="item">Item 3</div>
        `).appendTo(container);

        let selectable = new Selectable();

        // From index 1, nearest selected should be 0 or 2
        let nearest = selectable.get_nearest(container, 1);
        assert.ok(nearest === 0 || nearest === 2, 'returns valid nearest index');

        // From index 3, nearest selected should be 2
        nearest = selectable.get_nearest(container, 3);
        assert.strictEqual(nearest, 2, 'returns nearest from end');
    });

    QUnit.test('Selectable get_nearest returns -1 when no selection', assert => {
        let items = $(`
            <div class="item">Item 0</div>
            <div class="item">Item 1</div>
        `).appendTo(container);

        let selectable = new Selectable();
        let nearest = selectable.get_nearest(container, 0);

        assert.strictEqual(nearest, -1, 'returns -1 when no selected items');
    });

    QUnit.test('Selectable select_shift_down selects range', assert => {
        let items = $(`
            <div class="item selected">Item 0</div>
            <div class="item">Item 1</div>
            <div class="item">Item 2</div>
            <div class="item">Item 3</div>
        `).appendTo(container);

        let selectable = new Selectable();
        selectable.add(container.find('.item').get(0));

        let elem = container.find('.item').eq(2);
        selectable.select_shift_down(container, elem);

        assert.true(container.find('.item').eq(0).hasClass('selected'),
            'start item selected');
        assert.true(container.find('.item').eq(1).hasClass('selected'),
            'middle item selected');
        assert.true(container.find('.item').eq(2).hasClass('selected'),
            'end item selected');
        assert.false(container.find('.item').eq(3).hasClass('selected'),
            'item outside range not selected');
        assert.strictEqual(selectable.selected.length, 3, 'three items in selection');
    });

    QUnit.test('Selectable select_shift_down with no prior selection', assert => {
        let items = $(`
            <div class="item">Item 0</div>
            <div class="item">Item 1</div>
        `).appendTo(container);

        let selectable = new Selectable();
        let elem = container.find('.item').eq(1);

        selectable.select_shift_down(container, elem);

        assert.true(elem.hasClass('selected'), 'clicked item selected');
        assert.strictEqual(selectable.selected.length, 1, 'one item selected');
    });

    QUnit.test('Selectable handle_click without modifier keys', assert => {
        let items = $(`
            <div class="item">Item 0</div>
            <div class="item">Item 1</div>
        `).appendTo(container);

        let on_select_called = false;
        let selectable = new Selectable({
            on_select: () => { on_select_called = true; }
        });

        let elem = container.find('.item').eq(0);
        let evt = new $.Event('click');
        evt.currentTarget = elem.get(0);

        selectable.handle_click(evt);

        assert.true(elem.hasClass('selected'), 'element selected');
        assert.true(on_select_called, 'on_select callback triggered');
    });

    QUnit.test('Selectable handle_click with Ctrl key', assert => {
        let items = $(`
            <div class="item">Item 0</div>
            <div class="item">Item 1</div>
        `).appendTo(container);

        let selectable = new Selectable();
        keys.ctrl_down = true;

        let elem1 = container.find('.item').eq(0);
        let evt1 = new $.Event('click');
        evt1.currentTarget = elem1.get(0);
        selectable.handle_click(evt1);

        let elem2 = container.find('.item').eq(1);
        let evt2 = new $.Event('click');
        evt2.currentTarget = elem2.get(0);
        selectable.handle_click(evt2);

        assert.true(elem1.hasClass('selected'), 'first element selected');
        assert.true(elem2.hasClass('selected'), 'second element selected');
        assert.strictEqual(selectable.selected.length, 2, 'both items selected');
    });

    QUnit.test('Selectable handle_click with Shift key', assert => {
        let items = $(`
            <div class="item selected">Item 0</div>
            <div class="item">Item 1</div>
            <div class="item">Item 2</div>
        `).appendTo(container);

        let selectable = new Selectable();
        selectable.add(container.find('.item').get(0));
        keys.shift_down = true;

        let elem = container.find('.item').eq(2);
        let evt = new $.Event('click');
        evt.currentTarget = elem.get(0);

        selectable.handle_click(evt);

        assert.strictEqual(selectable.selected.length, 3, 'range selected');
    });

    QUnit.test('Selectable handle_click triggers on_firstclick once', assert => {
        let items = $('<div class="item">Item</div>').appendTo(container);

        let firstclick_count = 0;
        let selectable = new Selectable({
            on_firstclick: () => { firstclick_count++; }
        });

        let elem = container.find('.item');
        let evt = new $.Event('click');
        evt.currentTarget = elem.get(0);

        selectable.handle_click(evt);
        assert.strictEqual(firstclick_count, 1, 'on_firstclick called once');

        selectable.handle_click(evt);
        assert.strictEqual(firstclick_count, 1,
            'on_firstclick not called on subsequent clicks');
    });

    QUnit.test('Selectable notify calls callback with arguments', assert => {
        let received_args = [];
        let selectable = new Selectable({
            on_select: (...args) => { received_args = args; }
        });

        selectable.notify('on_select', 'arg1', 'arg2');

        assert.deepEqual(received_args, ['arg1', 'arg2'],
            'callback receives all arguments');
    });

    QUnit.test('Selectable notify handles missing callback', assert => {
        let selectable = new Selectable();

        assert.ok(() => {
            selectable.notify('on_nonexistent', 'arg');
        }, 'no error when callback does not exist');
    });

    QUnit.test('Selectable bind attaches click handler', assert => {
        let items = $('<div class="item">Item</div>').appendTo(container);
        let selectable = new Selectable();
        let elem = container.find('.item');

        selectable.bind(elem);
        elem.trigger('click');

        assert.true(elem.hasClass('selected'), 'click handler works after bind');
    });

    QUnit.test('Selectable bind replaces existing handler', assert => {
        let items = $('<div class="item">Item</div>').appendTo(container);
        let click_count = 0;
        let selectable = new Selectable({
            on_select: () => { click_count++; }
        });
        let elem = container.find('.item');

        // Bind twice
        selectable.bind(elem);
        selectable.bind(elem);
        elem.trigger('click');

        assert.strictEqual(click_count, 1, 'handler only fires once');
    });
});

QUnit.module('cone.app.selectable.jquery_plugin', hooks => {

    let container;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        keys.shift_down = false;
        keys.ctrl_down = false;
    });

    hooks.afterEach(() => {
        container.remove();
    });

    QUnit.test('$.fn.selectable creates Selectable instance', assert => {
        let items = $(`
            <div class="item">Item 0</div>
            <div class="item">Item 1</div>
        `).appendTo(container);

        let elems = container.find('.item');
        elems.selectable();

        let api = elems.data('selectable');
        assert.ok(api instanceof Selectable, 'Selectable instance stored in data');
    });

    QUnit.test('$.fn.selectable passes options', assert => {
        let items = $('<div class="item">Item</div>').appendTo(container);

        let callback_called = false;
        let elem = container.find('.item');
        elem.selectable({
            on_select: () => { callback_called = true; }
        });

        elem.trigger('click');
        assert.true(callback_called, 'options passed to Selectable');
    });

    QUnit.test('$.fn.selectable returns jQuery object', assert => {
        let items = $('<div class="item">Item</div>').appendTo(container);
        let elem = container.find('.item');

        let result = elem.selectable();
        assert.ok(result instanceof $, 'returns jQuery object for chaining');
    });
});

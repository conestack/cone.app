import $ from 'jquery';
import { keys } from '../src/keybinder.js';
import { Selectable } from '../src/selectable.js';

QUnit.module('cone.app.selectable', (hooks) => {
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

    QUnit.test('Selectable constructor initializes state', (assert) => {
        const options = { on_select: () => {} };
        const selectable = new Selectable(options);

        assert.strictEqual(selectable.options, options, 'options stored');
        assert.deepEqual(selectable.selected, [], 'selected is empty array');
        assert.strictEqual(selectable.anchor, null, 'no anchor');
        assert.true(selectable.firstclick, 'firstclick is true');
    });

    QUnit.test('Selectable reset clears selection', (assert) => {
        const selectable = new Selectable();
        selectable.selected = ['item1', 'item2'];

        selectable.reset();

        assert.deepEqual(selectable.selected, [], 'selected cleared after reset');
    });

    QUnit.test('Selectable add appends element', (assert) => {
        const selectable = new Selectable();
        const elem1 = document.createElement('div');
        const elem2 = document.createElement('div');

        selectable.add(elem1);
        assert.strictEqual(selectable.selected.length, 1, 'one element added');
        assert.strictEqual(selectable.selected[0], elem1, 'correct element added');

        selectable.add(elem2);
        assert.strictEqual(selectable.selected.length, 2, 'two elements added');
    });

    QUnit.test('Selectable add prevents duplicates', (assert) => {
        const selectable = new Selectable();
        const elem = document.createElement('div');

        selectable.add(elem);
        selectable.add(elem);

        assert.strictEqual(selectable.selected.length, 1, 'no duplicates');
    });

    QUnit.test('Selectable remove removes element', (assert) => {
        const selectable = new Selectable();
        const elem1 = document.createElement('div');
        const elem2 = document.createElement('div');

        selectable.selected = [elem1, elem2];
        selectable.remove(elem1);

        assert.strictEqual(selectable.selected.length, 1, 'one element removed');
        assert.strictEqual(selectable.selected[0], elem2, 'correct element remains');
    });

    QUnit.test('Selectable select_no_key selects single element', (assert) => {
        $(`
            <div class="item selected">Item 1</div>
            <div class="item">Item 2</div>
            <div class="item">Item 3</div>
        `).appendTo(container);

        const selectable = new Selectable();
        const elem = container.find('.item').eq(1);

        selectable.select_no_key(container, elem);

        assert.false(container.find('.item').eq(0).hasClass('selected'), 'first item deselected');
        assert.true(elem.hasClass('selected'), 'clicked item selected');
        assert.strictEqual(selectable.selected.length, 1, 'only one selected');
        assert.strictEqual(
            selectable.selected[0],
            elem.get(0),
            'correct element in selected array',
        );
        assert.strictEqual(selectable.anchor, elem.get(0), 'clicked item is anchor');
    });

    QUnit.test('Selectable select_ctrl_down toggles selection', (assert) => {
        $(`
            <div class="item">Item 1</div>
            <div class="item">Item 2</div>
        `).appendTo(container);

        const selectable = new Selectable();
        const elem = container.find('.item').eq(0);

        // First click adds selection
        selectable.select_ctrl_down(elem);
        assert.true(elem.hasClass('selected'), 'element selected');
        assert.strictEqual(selectable.selected.length, 1, 'one item selected');

        assert.strictEqual(selectable.anchor, elem.get(0), 'clicked item is anchor');

        // Second click removes selection
        selectable.select_ctrl_down(elem);
        assert.false(elem.hasClass('selected'), 'element deselected');
        assert.strictEqual(selectable.selected.length, 0, 'no items selected');
        assert.strictEqual(selectable.anchor, elem.get(0), 'deselected item is anchor');
    });

    QUnit.test('Selectable select_ctrl_down allows multiple selections', (assert) => {
        $(`
            <div class="item">Item 1</div>
            <div class="item">Item 2</div>
            <div class="item">Item 3</div>
        `).appendTo(container);

        const selectable = new Selectable();
        const elem1 = container.find('.item').eq(0);
        const elem2 = container.find('.item').eq(2);

        selectable.select_ctrl_down(elem1);
        selectable.select_ctrl_down(elem2);

        assert.true(elem1.hasClass('selected'), 'first element selected');
        assert.true(elem2.hasClass('selected'), 'third element selected');
        assert.strictEqual(selectable.selected.length, 2, 'two items selected');
    });

    QUnit.test('Selectable select_shift_down selects range', (assert) => {
        $(`
            <div class="item selected">Item 0</div>
            <div class="item">Item 1</div>
            <div class="item">Item 2</div>
            <div class="item">Item 3</div>
        `).appendTo(container);

        const selectable = new Selectable();
        selectable.select_no_key(container, container.find('.item').eq(0));

        const elem = container.find('.item').eq(2);
        selectable.select_shift_down(container, elem);

        assert.true(container.find('.item').eq(0).hasClass('selected'), 'start item selected');
        assert.true(container.find('.item').eq(1).hasClass('selected'), 'middle item selected');
        assert.true(container.find('.item').eq(2).hasClass('selected'), 'end item selected');
        assert.false(
            container.find('.item').eq(3).hasClass('selected'),
            'item outside range not selected',
        );
        assert.strictEqual(selectable.selected.length, 3, 'three items in selection');
    });

    QUnit.test('Selectable select_shift_down selects range backwards', (assert) => {
        $(`
            <div class="item">Item 0</div>
            <div class="item">Item 1</div>
            <div class="item">Item 2</div>
            <div class="item selected">Item 3</div>
        `).appendTo(container);

        const selectable = new Selectable();
        const items = container.find('.item');
        selectable.select_no_key(container, items.eq(3));

        selectable.select_shift_down(container, items.eq(1));

        assert.false(items.eq(0).hasClass('selected'), 'item outside range not selected');
        assert.true(items.eq(1).hasClass('selected'), 'start item selected');
        assert.true(items.eq(2).hasClass('selected'), 'middle item selected');
        assert.true(items.eq(3).hasClass('selected'), 'end item selected');
        assert.deepEqual(selectable.selected, items.slice(1, 4).get(), 'range in selection');
        assert.strictEqual(selectable.anchor, items.get(3), 'anchor kept');
    });

    QUnit.test('Selectable select_shift_down with no prior selection', (assert) => {
        $(`
            <div class="item">Item 0</div>
            <div class="item">Item 1</div>
        `).appendTo(container);

        const selectable = new Selectable();
        const elem = container.find('.item').eq(1);

        selectable.select_shift_down(container, elem);

        assert.true(elem.hasClass('selected'), 'clicked item selected');
        assert.strictEqual(selectable.selected.length, 1, 'one item selected');
        assert.strictEqual(selectable.anchor, elem.get(0), 'clicked item is anchor');
    });

    QUnit.test('Selectable handle_click without modifier keys', (assert) => {
        $(`
            <div class="item">Item 0</div>
            <div class="item">Item 1</div>
        `).appendTo(container);

        let on_select_called = false;
        const selectable = new Selectable({
            on_select: () => {
                on_select_called = true;
            },
        });

        const elem = container.find('.item').eq(0);
        const evt = new $.Event('click');
        evt.currentTarget = elem.get(0);

        selectable.handle_click(evt);

        assert.true(elem.hasClass('selected'), 'element selected');
        assert.true(on_select_called, 'on_select callback triggered');
    });

    QUnit.test('Selectable handle_click with Ctrl key', (assert) => {
        $(`
            <div class="item">Item 0</div>
            <div class="item">Item 1</div>
        `).appendTo(container);

        const selectable = new Selectable();
        keys.ctrl_down = true;

        const elem1 = container.find('.item').eq(0);
        const evt1 = new $.Event('click');
        evt1.currentTarget = elem1.get(0);
        selectable.handle_click(evt1);

        const elem2 = container.find('.item').eq(1);
        const evt2 = new $.Event('click');
        evt2.currentTarget = elem2.get(0);
        selectable.handle_click(evt2);

        assert.true(elem1.hasClass('selected'), 'first element selected');
        assert.true(elem2.hasClass('selected'), 'second element selected');
        assert.strictEqual(selectable.selected.length, 2, 'both items selected');
    });

    QUnit.test('Selectable handle_click with Shift key', (assert) => {
        $(`
            <div class="item selected">Item 0</div>
            <div class="item">Item 1</div>
            <div class="item">Item 2</div>
        `).appendTo(container);

        const selectable = new Selectable();
        selectable.select_no_key(container, container.find('.item').eq(0));
        keys.shift_down = true;

        const elem = container.find('.item').eq(2);
        const evt = new $.Event('click');
        evt.currentTarget = elem.get(0);

        selectable.handle_click(evt);

        assert.strictEqual(selectable.selected.length, 3, 'range selected');
    });

    QUnit.test('Selectable handle_click triggers on_firstclick once', (assert) => {
        $('<div class="item">Item</div>').appendTo(container);

        let firstclick_count = 0;
        const selectable = new Selectable({
            on_firstclick: () => {
                firstclick_count++;
            },
        });

        const elem = container.find('.item');
        const evt = new $.Event('click');
        evt.currentTarget = elem.get(0);

        selectable.handle_click(evt);
        assert.strictEqual(firstclick_count, 1, 'on_firstclick called once');

        selectable.handle_click(evt);
        assert.strictEqual(firstclick_count, 1, 'on_firstclick not called on subsequent clicks');
    });

    QUnit.test('Selectable notify calls callback with arguments', (assert) => {
        let received_args = [];
        const selectable = new Selectable({
            on_select: (...args) => {
                received_args = args;
            },
        });

        selectable.notify('on_select', 'arg1', 'arg2');

        assert.deepEqual(received_args, ['arg1', 'arg2'], 'callback receives all arguments');
    });

    QUnit.test('Selectable notify handles missing callback', (assert) => {
        const selectable = new Selectable();

        assert.ok(() => {
            selectable.notify('on_nonexistent', 'arg');
        }, 'no error when callback does not exist');
    });

    QUnit.test('Selectable bind attaches click handler', (assert) => {
        $('<div class="item">Item</div>').appendTo(container);
        const selectable = new Selectable();
        const elem = container.find('.item');

        selectable.bind(elem);
        elem.trigger('click');

        assert.true(elem.hasClass('selected'), 'click handler works after bind');
    });

    QUnit.test('Selectable bind replaces existing handler', (assert) => {
        $('<div class="item">Item</div>').appendTo(container);
        let click_count = 0;
        const selectable = new Selectable({
            on_select: () => {
                click_count++;
            },
        });
        const elem = container.find('.item');

        // Bind twice
        selectable.bind(elem);
        selectable.bind(elem);
        elem.trigger('click');

        assert.strictEqual(click_count, 1, 'handler only fires once');
    });

    QUnit.module('shift click range', (hooks) => {
        let selectable, items;

        hooks.beforeEach(() => {
            for (let i = 0; i < 7; i++) {
                $(`<div class="item">Item ${i}</div>`).appendTo(container);
            }
            items = container.children();
            selectable = new Selectable();
        });

        function click(index, modifier) {
            keys.ctrl_down = modifier === 'ctrl';
            keys.shift_down = modifier === 'shift';
            const evt = new $.Event('click');
            evt.currentTarget = items.get(index);
            selectable.handle_click(evt);
        }

        function assert_selected(assert, indices) {
            const css_selected = container
                .children('.selected')
                .map((_i, el) => $(el).index())
                .get();
            assert.deepEqual(css_selected, indices, 'selected css classes');
            const selected = selectable.selected.map((el) => $(el).index()).sort();
            assert.deepEqual(selected, indices, 'selected elements');
        }

        QUnit.test('extends the range from the anchor', (assert) => {
            click(1);
            click(3, 'shift');
            assert_selected(assert, [1, 2, 3]);

            click(5, 'shift');
            assert_selected(assert, [1, 2, 3, 4, 5]);
        });

        QUnit.test('shrinks the range towards the anchor', (assert) => {
            click(1);
            click(5, 'shift');
            click(3, 'shift');
            assert_selected(assert, [1, 2, 3]);
        });

        QUnit.test('selects backwards from the anchor', (assert) => {
            click(3);
            click(5, 'shift');
            click(1, 'shift');
            assert_selected(assert, [1, 2, 3]);
        });

        QUnit.test('ctrl click sets the anchor', (assert) => {
            click(1);
            click(4, 'ctrl');
            click(6, 'shift');
            assert_selected(assert, [4, 5, 6]);
        });

        QUnit.test('without anchor behaves like a plain click', (assert) => {
            // preselected item without a click, e.g. restored from a cookie
            items.eq(0).addClass('selected');
            selectable.add(items.get(0));

            click(2, 'shift');
            assert_selected(assert, [2]);

            click(4, 'shift');
            assert_selected(assert, [2, 3, 4]);
        });

        QUnit.test('ignores an anchor no longer in the container', (assert) => {
            click(1);
            items.eq(1).remove();
            items = container.children();

            click(3, 'shift');
            assert_selected(assert, [3]);

            click(5, 'shift');
            assert_selected(assert, [3, 4, 5]);
        });
    });
});

QUnit.module('cone.app.selectable.jquery_plugin', (hooks) => {
    let container;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        keys.shift_down = false;
        keys.ctrl_down = false;
    });

    hooks.afterEach(() => {
        container.remove();
    });

    QUnit.test('$.fn.selectable creates Selectable instance', (assert) => {
        $(`
            <div class="item">Item 0</div>
            <div class="item">Item 1</div>
        `).appendTo(container);

        const elems = container.find('.item');
        elems.selectable();

        const api = elems.data('selectable');
        assert.ok(api instanceof Selectable, 'Selectable instance stored in data');
    });

    QUnit.test('$.fn.selectable passes options', (assert) => {
        $('<div class="item">Item</div>').appendTo(container);

        let callback_called = false;
        const elem = container.find('.item');
        elem.selectable({
            on_select: () => {
                callback_called = true;
            },
        });

        elem.trigger('click');
        assert.true(callback_called, 'options passed to Selectable');
    });

    QUnit.test('$.fn.selectable returns jQuery object', (assert) => {
        $('<div class="item">Item</div>').appendTo(container);
        const elem = container.find('.item');

        const result = elem.selectable();
        assert.ok(result instanceof $, 'returns jQuery object for chaining');
    });
});

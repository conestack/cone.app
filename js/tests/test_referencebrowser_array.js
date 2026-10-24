import $ from 'jquery';

// Kept apart from test_referencebrowser.js: ``window.yafowil_array`` must
// exist before referencebrowser.js gets imported to register its handlers.
QUnit.module('cone.app.referencebrowser.yafowil_array', (hooks) => {
    const handlers = {};
    let container;

    hooks.before(async () => {
        window.yafowil_array = {
            on_array_event: (name, handler) => {
                handlers[name] = handler;
            },
        };
        await import('../src/referencebrowser.js');
        await new Promise((resolve) => $(resolve));
    });

    hooks.after(() => {
        delete window.yafowil_array;
    });

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
    });

    QUnit.test('on_add binds reference browser triggers', (assert) => {
        const wrapper = $('<div ajax:target="/api" />').appendTo(container);
        const trigger = $(`
            <a class="referencebrowser_trigger" data-reference-name="field">Browse</a>
        `).appendTo(wrapper);

        handlers.on_add({}, container);

        assert.ok($._data(trigger.get(0), 'events')?.click, 'click event bound');
    });

    QUnit.test('on_index updates reference name of triggers', (assert) => {
        const row = $(`
            <div>
                <a class="referencebrowser_trigger" data-reference-name="form.array.0.ref">
                    Browse
                </a>
            </div>
        `).appendTo(container);
        const calls = [];
        const inst = {
            base_id: 'form-array',
            set_value_index: (...args) => {
                calls.push(args);
                return 'form.array.1.ref';
            },
        };

        handlers.on_index(inst, row, 1);

        assert.deepEqual(calls, [['form.array.0.ref', 'form.array', 1, '.']]);
        assert.strictEqual(
            $('.referencebrowser_trigger', row).data('reference-name'),
            'form.array.1.ref',
        );
    });
});

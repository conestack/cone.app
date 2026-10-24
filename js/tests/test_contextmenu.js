import $ from 'jquery';
import { ContextMenuDropdown } from '../src/contextmenu.js';

QUnit.module('cone.app.contextmenu', (hooks) => {
    const inner_width_descriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    let container, bootstrap_origin, popper_updates;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        bootstrap_origin = window.bootstrap;
        popper_updates = 0;
        ContextMenuDropdown.initialize();
    });

    hooks.afterEach(() => {
        container.remove();
        $(document).off('show.bs.dropdown shown.bs.dropdown', '#contextmenu .dropdown');
        if (bootstrap_origin === undefined) {
            delete window.bootstrap;
        } else {
            window.bootstrap = bootstrap_origin;
        }
        Object.defineProperty(window, 'innerWidth', inner_width_descriptor);
    });

    function mock_bootstrap(popper) {
        window.bootstrap = {
            Dropdown: {
                getOrCreateInstance: () => ({ _popper: popper }),
            },
        };
    }

    function create_dropdown(left) {
        $(`
            <div id="contextmenu">
                <div class="dropdown">
                    <button data-bs-toggle="dropdown">Toggle</button>
                    <ul class="dropdown-menu dropdown-menu-end"
                        style="position: fixed; top: 0; width: 100px; margin: 0;">
                    </ul>
                </div>
            </div>
        `).appendTo(container);
        $('.dropdown-menu', container).css('left', `${left}px`);
        return $('.dropdown', container);
    }

    QUnit.test('show resets menu alignment', (assert) => {
        const dropdown = create_dropdown(0);

        $('button', dropdown).trigger('show.bs.dropdown');
        assert.false($('.dropdown-menu', dropdown).hasClass('dropdown-menu-end'));
    });

    QUnit.test('shown keeps menu inside viewport alignment', (assert) => {
        mock_bootstrap({ update: () => popper_updates++ });
        const dropdown = create_dropdown(0);
        const menu = $('.dropdown-menu', dropdown).removeClass('dropdown-menu-end');

        $('button', dropdown).trigger('shown.bs.dropdown');
        assert.false(menu.hasClass('dropdown-menu-end'), 'alignment unchanged');
        assert.strictEqual(popper_updates, 0, 'popper not updated');
    });

    QUnit.test('shown aligns overflowing menu to the end', (assert) => {
        mock_bootstrap({ update: () => popper_updates++ });
        const dropdown = create_dropdown(window.innerWidth - 50);
        const menu = $('.dropdown-menu', dropdown).removeClass('dropdown-menu-end');

        $('button', dropdown).trigger('shown.bs.dropdown');
        assert.true(menu.hasClass('dropdown-menu-end'), 'aligned to the end');
        assert.strictEqual(popper_updates, 1, 'popper updated');
    });

    QUnit.test('shown without popper instance', (assert) => {
        mock_bootstrap(null);
        const dropdown = create_dropdown(window.innerWidth - 50);
        const menu = $('.dropdown-menu', dropdown).removeClass('dropdown-menu-end');

        $('button', dropdown).trigger('shown.bs.dropdown');
        assert.true(menu.hasClass('dropdown-menu-end'), 'aligned to the end');
    });

    QUnit.test('shown falls back to document width', (assert) => {
        mock_bootstrap(null);
        const client_width = document.documentElement.clientWidth;
        Object.defineProperty(window, 'innerWidth', { value: 0, configurable: true });
        const dropdown = create_dropdown(client_width - 50);
        const menu = $('.dropdown-menu', dropdown).removeClass('dropdown-menu-end');

        $('button', dropdown).trigger('shown.bs.dropdown');
        assert.true(menu.hasClass('dropdown-menu-end'), 'aligned to the end');
    });
});

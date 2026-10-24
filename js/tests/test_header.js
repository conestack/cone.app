import $ from 'jquery';
import ts from 'treibstoff';
import { Header } from '../src/header.js';

QUnit.module('cone.app.header', (hooks) => {
    let container, ajax_attach_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_attach_origin = ts.ajax.attach;
        ts.ajax.attach = () => {};
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.attach = ajax_attach_origin;
        $('html, body').css('overscroll-behavior', '');
    });

    QUnit.test('Header.initialize returns early without #header-main', (assert) => {
        Header.initialize(container);
        assert.ok(true, 'no error without header-main');
    });

    QUnit.test('Header.initialize creates instance', (assert) => {
        $(`
            <div id="header-main">
                <div id="header-content">
                    <div id="personaltools"></div>
                </div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        Header.initialize(container);
        assert.ok(true, 'instance created');
    });

    QUnit.test('Header constructor stores elements', (assert) => {
        const elem = $(`
            <div id="header-main">
                <div id="header-content">
                    <div id="personaltools"></div>
                </div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        const instance = new Header(elem);

        assert.ok(instance.elem, 'elem stored');
        assert.ok(instance.header_content, 'header_content stored');
        assert.ok(instance.navbar_content_wrapper, 'navbar_content_wrapper stored');
        assert.ok(instance.navbar_content, 'navbar_content stored');
        assert.ok(instance.navbar_toggler, 'navbar_toggler stored');
        assert.ok(instance.personal_tools, 'personal_tools stored');
        assert.ok(instance.mainmenu, 'mainmenu stored');

        instance.destroy();
    });

    QUnit.test('Header set_mobile_menu_open adds class', (assert) => {
        const elem = $(`
            <div id="header-main">
                <div id="header-content"></div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        const instance = new Header(elem);
        instance.set_mobile_menu_open();

        assert.true(elem.hasClass('mobile-menu-open'), 'class added');

        instance.destroy();
    });

    QUnit.test('Header set_mobile_menu_closed removes class', (assert) => {
        const elem = $(`
            <div id="header-main" class="mobile-menu-open">
                <div id="header-content"></div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        const instance = new Header(elem);
        instance.set_mobile_menu_closed();

        assert.false(elem.hasClass('mobile-menu-open'), 'class removed');

        instance.destroy();
    });

    QUnit.test('Header on_is_compact handles compact mode', (assert) => {
        const elem = $(`
            <div id="header-main" class="full navbar-expand">
                <div id="header-content"></div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        const instance = new Header(elem);

        instance.on_is_compact(true);
        assert.true(elem.hasClass('compact'), 'compact class added');
        assert.false(elem.hasClass('full'), 'full class removed');

        instance.on_is_compact(false);
        assert.false(elem.hasClass('compact'), 'compact class removed');
        assert.true(elem.hasClass('full'), 'full class added');

        instance.destroy();
    });

    QUnit.test('Header on_is_super_compact moves personal tools', (assert) => {
        const elem = $(`
            <div id="header-main">
                <div id="header-content">
                    <div id="personaltools"></div>
                </div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        const instance = new Header(elem);

        instance.on_is_super_compact(true);
        assert.ok(
            $('#personaltools', instance.navbar_content).length,
            'personal_tools moved to navbar_content',
        );

        instance.on_is_super_compact(false);
        assert.ok(
            $('#personaltools', instance.header_content).length,
            'personal_tools moved back to header_content',
        );

        instance.destroy();
    });

    QUnit.test('Header destroy cleans up', (assert) => {
        const elem = $(`
            <div id="header-main">
                <div id="header-content"></div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        const instance = new Header(elem);
        instance.destroy();

        assert.ok(true, 'destroy completed');
    });

    QUnit.test('Header render_mobile_scrollbar called when compact', (assert) => {
        const elem = $(`
            <div id="header-main">
                <div id="header-content"></div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        const instance = new Header(elem);
        instance.is_compact = true;
        instance.mobile_scrollbar = { render: () => {}, destroy: () => {} };

        instance.render_mobile_scrollbar();
        assert.ok(true, 'render_mobile_scrollbar handled');

        instance.destroy();
    });

    QUnit.test('Header renders mobile scrollbar on main menu dropdown', (assert) => {
        const elem = $(`
            <div id="header-main">
                <div id="header-content"></div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu">
                    <a class="nav-link dropdown-toggle"></a>
                </nav>
            </div>
        `).appendTo(container);

        const instance = new Header(elem);
        instance.is_compact = true;
        instance.mobile_scrollbar.destroy();
        let rendered = 0;
        instance.mobile_scrollbar = {
            render: () => rendered++,
            destroy: () => {},
        };
        const toggle = $('.nav-link.dropdown-toggle', elem);

        toggle.trigger('shown.bs.dropdown');
        toggle.trigger('hidden.bs.dropdown');
        assert.strictEqual(rendered, 2, 'rendered on dropdown shown and hidden');

        instance.destroy();
        toggle.trigger('shown.bs.dropdown');
        assert.strictEqual(rendered, 2, 'dropdown handlers unbound on destroy');
    });

    QUnit.test('Header compact mobile menu collapse handling', (assert) => {
        const elem = $(`
            <div id="header-main">
                <div id="header-content"></div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        const instance = new Header(elem);
        instance.on_is_compact(true);
        instance.mobile_scrollbar.destroy();
        let rendered = false;
        let hidden = false;
        instance.mobile_scrollbar = {
            render: () => {
                rendered = true;
            },
            scrollbar: {
                hide: () => {
                    hidden = true;
                },
            },
            destroy: () => {},
        };
        const wrapper = instance.navbar_content_wrapper;

        wrapper.trigger('shown.bs.collapse');
        assert.true(rendered, 'mobile scrollbar rendered');
        assert.strictEqual($('body').css('overscroll-behavior'), 'none');

        wrapper.trigger('hide.bs.collapse');
        assert.true(hidden, 'mobile scrollbar hidden');
        assert.strictEqual($('body').css('overscroll-behavior'), 'auto');

        instance.destroy();
    });

    QUnit.module('personal tools dropdown room', (hooks) => {
        let elem;

        hooks.beforeEach(() => {
            // Mirrors the bootstrap navbar dropdown: the menu is positioned
            // absolutely below its toggle and overflows the personal tools.
            elem = $(`
                <div id="header-main">
                    <div id="header-content">
                        <div id="personaltools"
                             style="display: flex; height: 50px;">
                            <div id="language-dropdown" class="dropdown"
                                 style="position: relative; height: 100%;">
                                <div class="dropdown-toggle"></div>
                                <ul class="dropdown-menu"
                                    style="position: absolute; top: 100%;
                                           height: 80px; margin: 0;">
                                </ul>
                            </div>
                            <div id="personaltools-dropdown" class="dropdown"
                                 style="position: relative; height: 100%;">
                                <div class="dropdown-toggle"></div>
                                <ul class="dropdown-menu"
                                    style="position: absolute; top: 100%;
                                           height: 40px; margin: 0;">
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div id="navbar-content-wrapper">
                        <div id="navbar-content"></div>
                    </div>
                    <button id="navbar-toggler"></button>
                    <nav id="mainmenu"></nav>
                </div>
            `).appendTo(container);
        });

        // with jQuery present, bootstrap triggers its events on the toggle
        // as jQuery events, which bubble
        const dispatch = (dropdown, name) => {
            $('.dropdown-toggle', dropdown).trigger(name);
        };
        const show = (dropdown) => {
            $('.dropdown-menu', dropdown).addClass('show');
            dispatch(dropdown, 'shown.bs.dropdown');
        };
        const hide = (dropdown) => {
            $('.dropdown-menu', dropdown).removeClass('show');
            dispatch(dropdown, 'hidden.bs.dropdown');
        };
        const margin = (instance) => instance.personal_tools[0].style.marginBottom;

        QUnit.test('reserves room for the open menu when super compact', (assert) => {
            const instance = new Header(elem);
            instance.is_super_compact = true;
            const language = $('#language-dropdown', elem);

            show(language);
            assert.strictEqual(margin(instance), '80px', 'room for open menu');

            hide(language);
            assert.strictEqual(margin(instance), '', 'room released on hide');

            instance.destroy();
        });

        QUnit.test('reserves room for the new menu when switching menus', (assert) => {
            const instance = new Header(elem);
            instance.is_super_compact = true;
            const language = $('#language-dropdown', elem);
            const user = $('#personaltools-dropdown', elem);

            show(language);
            // bootstrap may show the next menu before hiding the previous one
            show(user);
            hide(language);
            assert.strictEqual(margin(instance), '40px', 'room for the menu still open');

            instance.destroy();
        });

        QUnit.test('reserves no room when not super compact', (assert) => {
            const instance = new Header(elem);
            instance.is_super_compact = false;

            show($('#language-dropdown', elem));
            assert.strictEqual(margin(instance), '', 'no room reserved');

            instance.destroy();
        });

        QUnit.test('releases room when leaving super compact', (assert) => {
            const instance = new Header(elem);
            instance.is_super_compact = true;
            show($('#language-dropdown', elem));

            instance.is_super_compact = false;
            assert.strictEqual(margin(instance), '', 'room released');
            assert.strictEqual($('.dropdown-menu.show', elem).length, 0, 'menus closed');

            instance.destroy();
        });

        QUnit.test('re-renders the mobile scrollbar', (assert) => {
            const instance = new Header(elem);
            instance.is_compact = true;
            instance.is_super_compact = true;
            let rendered = 0;
            instance.mobile_scrollbar.destroy();
            instance.mobile_scrollbar = {
                render: () => rendered++,
                destroy: () => {},
            };

            show($('#language-dropdown', elem));
            assert.strictEqual(rendered, 1, 'scrollbar rendered');

            instance.destroy();
        });

        QUnit.test('destroy unbinds the dropdown handlers', (assert) => {
            const instance = new Header(elem);
            instance.is_super_compact = true;
            instance.destroy();

            show($('#language-dropdown', elem));
            assert.strictEqual(margin(instance), '', 'handler unbound');
        });
    });
});

import $ from 'jquery';
import ts from 'treibstoff';
import {Header} from '../src/header.js';
import {global_events} from '../src/globals.js';

QUnit.module('cone.app.header', hooks => {

    let container,
        ajax_attach_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_attach_origin = ts.ajax.attach;
        ts.ajax.attach = function() {};
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.attach = ajax_attach_origin;
    });

    QUnit.test('Header.initialize returns early without #header-main', assert => {
        Header.initialize(container);
        assert.ok(true, 'no error without header-main');
    });

    QUnit.test('Header.initialize creates instance', assert => {
        let elem = $(`
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

    QUnit.test('Header constructor stores elements', assert => {
        let elem = $(`
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

        let instance = new Header(elem);

        assert.ok(instance.elem, 'elem stored');
        assert.ok(instance.header_content, 'header_content stored');
        assert.ok(instance.navbar_content_wrapper, 'navbar_content_wrapper stored');
        assert.ok(instance.navbar_content, 'navbar_content stored');
        assert.ok(instance.navbar_toggler, 'navbar_toggler stored');
        assert.ok(instance.personal_tools, 'personal_tools stored');
        assert.ok(instance.mainmenu, 'mainmenu stored');

        instance.destroy();
    });

    QUnit.test('Header set_mobile_menu_open adds class', assert => {
        let elem = $(`
            <div id="header-main">
                <div id="header-content"></div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        let instance = new Header(elem);
        instance.set_mobile_menu_open();

        assert.true(elem.hasClass('mobile-menu-open'), 'class added');

        instance.destroy();
    });

    QUnit.test('Header set_mobile_menu_closed removes class', assert => {
        let elem = $(`
            <div id="header-main" class="mobile-menu-open">
                <div id="header-content"></div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        let instance = new Header(elem);
        instance.set_mobile_menu_closed();

        assert.false(elem.hasClass('mobile-menu-open'), 'class removed');

        instance.destroy();
    });

    QUnit.test('Header on_is_compact handles compact mode', assert => {
        let elem = $(`
            <div id="header-main" class="full navbar-expand">
                <div id="header-content"></div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        let instance = new Header(elem);

        instance.on_is_compact(true);
        assert.true(elem.hasClass('compact'), 'compact class added');
        assert.false(elem.hasClass('full'), 'full class removed');

        instance.on_is_compact(false);
        assert.false(elem.hasClass('compact'), 'compact class removed');
        assert.true(elem.hasClass('full'), 'full class added');

        instance.destroy();
    });

    QUnit.test('Header on_is_super_compact moves personal tools', assert => {
        let elem = $(`
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

        let instance = new Header(elem);

        instance.on_is_super_compact(true);
        assert.ok($('#personaltools', instance.navbar_content).length,
            'personal_tools moved to navbar_content');

        instance.on_is_super_compact(false);
        assert.ok($('#personaltools', instance.header_content).length,
            'personal_tools moved back to header_content');

        instance.destroy();
    });

    QUnit.test('Header destroy cleans up', assert => {
        let elem = $(`
            <div id="header-main">
                <div id="header-content"></div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        let instance = new Header(elem);
        instance.destroy();

        assert.ok(true, 'destroy completed');
    });

    QUnit.test('Header render_mobile_scrollbar called when compact', assert => {
        let elem = $(`
            <div id="header-main">
                <div id="header-content"></div>
                <div id="navbar-content-wrapper">
                    <div id="navbar-content"></div>
                </div>
                <button id="navbar-toggler"></button>
                <nav id="mainmenu"></nav>
            </div>
        `).appendTo(container);

        let instance = new Header(elem);
        instance.is_compact = true;
        instance.mobile_scrollbar = {render: function() {}, destroy: function() {}};

        instance.render_mobile_scrollbar();
        assert.ok(true, 'render_mobile_scrollbar handled');

        instance.destroy();
    });
});

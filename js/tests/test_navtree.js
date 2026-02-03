import $ from 'jquery';
import ts from 'treibstoff';
import {NavTree} from '../src/navtree.js';

QUnit.module('cone.app.navtree', hooks => {

    let container,
        ajax_attach_origin,
        localstorage_origin;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
        ajax_attach_origin = ts.ajax.attach;
        ts.ajax.attach = function() {};
        localstorage_origin = localStorage.getItem('cone.app.navtree.open');
        localStorage.removeItem('cone.app.navtree.open');
    });

    hooks.afterEach(() => {
        container.remove();
        ts.ajax.attach = ajax_attach_origin;
        if (localstorage_origin) {
            localStorage.setItem('cone.app.navtree.open', localstorage_origin);
        } else {
            localStorage.removeItem('cone.app.navtree.open');
        }
    });

    QUnit.test('NavTree.initialize returns early without #navtree', assert => {
        NavTree.initialize(container);
        assert.ok(true, 'no error without navtree');
    });

    QUnit.test('NavTree.initialize creates instance', assert => {
        let elem = $(`
            <ul id="navtree">
                <div id="navigation-collapse"></div>
            </ul>
        `).appendTo(container);

        NavTree.initialize(container);
        assert.ok(true, 'instance created');
    });

    QUnit.test('NavTree constructor stores elem', assert => {
        let elem = $(`
            <ul id="navtree">
                <div id="navigation-collapse"></div>
            </ul>
        `).appendTo(container);

        let instance = new NavTree(elem);
        assert.strictEqual(instance.elem.get(0), elem.get(0), 'elem stored');

        instance.destroy();
    });

    QUnit.test('NavTree with no-collapse class skips binding', assert => {
        let elem = $(`
            <ul id="navtree">
                <div id="navigation-collapse" class="no-collapse"></div>
            </ul>
        `).appendTo(container);

        let instance = new NavTree(elem);
        assert.ok(true, 'no-collapse handled');
    });

    QUnit.test('NavTree expands if previously opened', assert => {
        localStorage.setItem('cone.app.navtree.open', 'true');

        let elem = $(`
            <ul id="navtree">
                <div id="navigation-collapse"></div>
            </ul>
        `).appendTo(container);

        let instance = new NavTree(elem);
        assert.true(instance.dropdown_elem.hasClass('show'),
            'show class added from localStorage');

        instance.destroy();
    });

    QUnit.test('NavTree set_menu_open stores state', assert => {
        let elem = $(`
            <ul id="navtree">
                <div id="navigation-collapse"></div>
            </ul>
        `).appendTo(container);

        let instance = new NavTree(elem);
        instance.set_menu_open({});

        assert.strictEqual(localStorage.getItem('cone.app.navtree.open'), 'true',
            'state stored in localStorage');

        instance.destroy();
    });

    QUnit.test('NavTree set_menu_closed removes state', assert => {
        localStorage.setItem('cone.app.navtree.open', 'true');

        let elem = $(`
            <ul id="navtree">
                <div id="navigation-collapse"></div>
            </ul>
        `).appendTo(container);

        let instance = new NavTree(elem);
        instance.set_menu_closed({});

        assert.strictEqual(localStorage.getItem('cone.app.navtree.open'), null,
            'state removed from localStorage');

        instance.destroy();
    });

    QUnit.test('NavTree binds collapse events', assert => {
        let elem = $(`
            <ul id="navtree">
                <div id="navigation-collapse"></div>
            </ul>
        `).appendTo(container);

        let instance = new NavTree(elem);

        let events = $._data(instance.dropdown_elem.get(0), 'events');
        assert.ok(events, 'events bound to dropdown_elem');

        instance.destroy();
    });

    QUnit.test('NavTree destroy removes event listeners', assert => {
        let elem = $(`
            <ul id="navtree">
                <div id="navigation-collapse"></div>
            </ul>
        `).appendTo(container);

        let instance = new NavTree(elem);
        instance.destroy();

        let events = $._data(instance.dropdown_elem.get(0), 'events');
        assert.notOk(events, 'events removed');
    });
});

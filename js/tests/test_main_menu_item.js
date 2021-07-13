import {MainMenuItem} from '../src/main_menu_item.js';

///////////////////////////////////////////////////////////////////////////////
// cone.MainMenuItem test helpers
///////////////////////////////////////////////////////////////////////////////

function create_mm_items(count) {
    // create data menu items array
    let data_menu_items =
        [
            {
                "selected": true,
                "icon": "bi bi-kanban",
                "id": "child_1",
                "description": null,
                "url": "http://localhost:8081/child_1/child_1",
                "target": "http://localhost:8081/child_1/child_1",
                "title": ""
            },
            {
                "selected": false, "icon":
                "bi bi-kanban", "id": "child_2",
                "description": null,
                "url": "http://localhost:8081/child_1/child_2",
                "target": "http://localhost:8081/child_1/child_2",
                "title": "child_2"
            },
            {
                "selected": false,
                "icon":
                "bi bi-kanban",
                "id": "child_3",
                "description": null,
                "url": "http://localhost:8081/child_1/child_3",
                "target": "http://localhost:8081/child_1/child_3",
                "title": "child_3"
            }
        ]
    ;

    // create number of dummy item elements
    for (let i=1; i <=count; i++) {
        let mainmenu_item_html = `
            <li class="mainmenu-item node-child_${i} menu"
                style="
                  display: flex;
                  align-items: center;
                  height: 100%;
                "
                id="elem${count}">
              <a>
                <i class="bi bi-heart"></i>
                <span class="mainmenu-title">
                </span>
              </a>
              <i class="dropdown-arrow bi bi-chevron-down"></i>
            </li>
        `;

        // append item element to mainmenu DOM
        $('#mainmenu').append(mainmenu_item_html);

        // set item menu-items data
        $(`#elem${count}`).data('menu-items', data_menu_items);
    }
}

function create_empty_item() {
    // create empty dummy item
    let mainmenu_item_html = `
        <li class="mainmenu-item"
            style="
            display: flex;
            align-items: center;
            height: 100%;">
          <a>
            <i class="bi bi-heart"></i>
            <span class="mainmenu-title">
            </span>
          </a>
        </li>
    `;

    // append empty dummy item to mainmenu DOM
    $('#mainmenu').append(mainmenu_item_html);
}

///////////////////////////////////////////////////////////////////////////////
// cone.MainMenuItem tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module.skip('cone.MainMenuItem', hooks => {
    hooks.before(() => {
        console.log('Set up cone.MainMenuItem tests');

        // create viewport instance
        cone.viewport = new cone.ViewPort();
    });

    hooks.after(() => {
        console.log('Tear down cone.MainMenuItem tests');

        // unset viewport instance
        cone.viewport = null;
    });

    QUnit.module('constructor', () => {
        QUnit.module('properties', hooks => {
            let TestMainMenuItem,
                test_mm_item;

            hooks.before(assert => {
                console.log('Set up MainMenuItem.constructor prop tests');

                // create dummy topnav DOM element
                create_topnav_elem();
                // create dummy mainmenu top DOM element
                create_mm_top_elem();
                // create dummy mainmenu item DOM elements
                create_mm_items(1);

                // dummy class
                TestMainMenuItem = class extends cone.MainMenuItem {
                    render_dd() {
                        assert.step('render_dd()');
                    }
                }
            });

            hooks.after(() => {
                console.log('Tear down MainMenuItem.constructor prop tests');

                // remove dummy DOM elements
                $('#topnav').remove();
                $('#main-menu').remove();

                // remove mainmenu item elements
                test_mm_item.menu.remove();
                test_mm_item.elem.remove();

                // delete dummy item
                test_mm_item = null;

                // reset viewport
                cone.viewport.state = null;
            });

            QUnit.test('properties', assert => {
                // create instance
                test_mm_item = new TestMainMenuItem($('.node-child_1'));

                // dummy item is instance of ViewPortAware class
                assert.ok(test_mm_item instanceof cone.ViewPortAware);

                // containing element
                assert.ok(test_mm_item.elem.is('li'));
                assert.ok(test_mm_item.elem.hasClass('node-child_1'));

                // dummy item has children
                assert.ok(test_mm_item.children);

                // menu
                assert.ok(test_mm_item.menu.is('div.cone-mainmenu-dropdown'));
                assert.strictEqual($('ul', test_mm_item.menu).length, 1);

                // dropdown
                assert.ok(test_mm_item.dd.is('ul.mainmenu-dropdown'));

                // arrow
                assert.ok(test_mm_item.arrow.is('i.dropdown-arrow'));

                // private methods
                assert.ok(test_mm_item._toggle);

                // verify method call
                assert.verifySteps(['render_dd()']);
            });
        });

        QUnit.module('mobile', hooks => {
            let TestMainMenuItem,
                test_mm_item;

            hooks.before(assert => {
                console.log('Set up MainMenuItem.constructor mobile tests');

                // mock mobile viewport
                cone.viewport.state = 0;

                // create dummy topnav DOM element
                create_topnav_elem();
                // create dummy mainmenu top DOM element
                create_mm_top_elem();
                // create dummy mainmenu item DOM element
                create_mm_items(1);

                // dummy class
                TestMainMenuItem = class extends cone.MainMenuItem {
                    mv_to_mobile() {
                        assert.step('mv_to_mobile()');
                    }
                    render_dd() {
                        assert.step('render_dd()');
                    }
                }
            });

            hooks.after(() => {
                console.log('Tear down MainMenuItem.constructor mobile tests');

                // remove dummy DOM elements
                $('#topnav').remove();
                $('#main-menu').remove();

                // remove mainmenu item elements
                test_mm_item.menu.remove();
                test_mm_item.elem.remove();

                // delete dummy item
                test_mm_item = null;

                // reset viewport
                cone.viewport.state = null;
            });

            QUnit.test('mobile', assert => {
                // create instance
                test_mm_item = new TestMainMenuItem($('.node-child_1'));

                // assert method call
                assert.verifySteps([
                    'render_dd()',
                    'mv_to_mobile()'
                ]);
            });
        });

        QUnit.module('desktop', hooks => {
            let TestMainMenuItem,
                test_mm_item;

            hooks.before(assert => {
                console.log('Set up MainMenuItem.constructor desktop tests');

                // mock large viewport
                cone.viewport.state = 3;

                // create dummy topnav DOM element
                create_topnav_elem();
                // create dummy mainmenu top DOM element
                create_mm_top_elem();
                // create dummy mainmenu item DOM elements
                create_mm_items(1);

                // dummy class
                TestMainMenuItem = class extends cone.MainMenuItem {
                    render_dd() {
                        assert.step('render_dd()');
                    }
                    mouseenter_toggle() {
                        assert.step('toggle()');
                    }
                }
            });

            hooks.after(() => {
                console.log('Tear down MainMenuItem.constructor desktop tests');

                // remove dummy DOM elements
                $('#topnav').remove();
                $('#main-menu').remove();

                // remove mainmenu item elements
                test_mm_item.menu.remove();
                test_mm_item.elem.remove();

                // delete dummy item
                test_mm_item = null;

                // reset viewport
                cone.viewport.state = null;
            });

            QUnit.test('desktop', assert => {
                // create instance
                test_mm_item = new TestMainMenuItem($('.node-child_1'));

                // trigger mouseenter, mouseleave
                test_mm_item.elem.trigger('mouseenter');
                test_mm_item.elem.trigger('mouseleave');

                // verify method calls
                assert.verifySteps([
                    'render_dd()',
                    'toggle()',
                    'toggle()'
                ]);

                // trigger mouseleave on menu
                test_mm_item.menu.css('display', 'block');
                test_mm_item.menu.trigger('mouseleave');
                assert.strictEqual(test_mm_item.menu.css('display'), 'none');
            });
        });
    });

    QUnit.module('methods', hooks => {
        hooks.before(() => {
            console.log('- now running: methods');
        })

        hooks.beforeEach(() => {
            // create dummy layout element, append to DOM
            let layout = $('<div id="layout"></div>');
            $('body').append(layout);

            // create dummy DOM elements
            create_topnav_elem();
            create_mm_top_elem();
            create_mm_items(2);
        });

        hooks.afterEach(() => {
            // remove dummy DOM elements
            $('#topnav').remove();
            $('#main-menu').remove();
            $('.cone-mainmenu-dropdown').remove();

            // reset viewport
            cone.viewport.state = null;
        });

        hooks.after(() => {
            // remove dummy layout element from DOM
            $('#layout').remove();
        });

        QUnit.module('render_dd()', hooks => {
            let test_mm_item;

            hooks.before(() => {
                console.log('Set up cone.MainMenuItem.render_dd tests');
            });

            hooks.after(() => {
                console.log('Tear down cone.MainMenuItem.render_dd tests');

                // delete instance
                test_mm_item = null;
            });

            QUnit.test('render_dd()', assert => {
                // create instance
                test_mm_item = new cone.MainMenuItem($('.node-child_1'));

                // 3 default children appended
                assert.strictEqual(test_mm_item.children.length, 3);
                // menu appended to layout
                assert.strictEqual(
                    $('#layout > .cone-mainmenu-dropdown').length,
                    1
                );
                // items appended to menu
                assert.strictEqual($('.mainmenu-dropdown > li').length, 3);
            });
        });

        QUnit.module('mv_to_mobile()', hooks => {
            let TestMainMenuItem,
                test_mm_item;

            hooks.before(() => {
                console.log('Set up cone.MainMenuItem.mv_to_mobile tests');

                // dummy class
                TestMainMenuItem = class extends cone.MainMenuItem {
                    mouseenter_toggle() {
                        assert.step('mouseenter_toggle()');
                    }
                }
            });
            hooks.after(() => {
                console.log('Tear down cone.MainMenuItem.mv_to_mobile tests');

                // delete instance
                test_mm_item = null;
            });

            QUnit.test('without sidebar', assert => {
                // create instance
                test_mm_item = new TestMainMenuItem($('.node-child_1'));

                // add mouseenter/leave event listener
                test_mm_item.menu.on('mouseenter mouseleave', () => {
                    assert.step('mouseenter/leave');
                });

                // trigger move to mobile
                test_mm_item.mv_to_mobile();
                // menu is appended to elem
                assert.strictEqual($(test_mm_item.menu, test_mm_item.elem).length
                                    , 1);

                // trigger mouseenter/leave events
                test_mm_item.elem.trigger('mouseenter');
                test_mm_item.menu.trigger('mouseleave');
                assert.strictEqual(test_mm_item.menu.css('left'), '0px');

                // trigger click on dropdown arrow
                test_mm_item.arrow.trigger('click');
                // menu visible after click
                assert.strictEqual(test_mm_item.menu.css('display'), 'block');
                assert.ok(test_mm_item.arrow.hasClass('bi bi-chevron-up'));
            });

            QUnit.test('with mainmenu sidebar', assert => {
                // mock main menu sidebar
                cone.main_menu_sidebar = true;

                // create instance
                test_mm_item = new TestMainMenuItem($('.node-child_1'));
                // trigger move to mobile
                test_mm_item.mv_to_mobile();
                // empty if function not called
                assert.verifySteps([]);

                // unset main_menu_sidebar
                cone.main_menu_sidebar = null;
            });
        });

        QUnit.module('mv_to_top()', hooks => {
            let TestMainMenuItem,
                test_mm_item;

            hooks.before(assert => {
                console.log('Set up cone.MainMenuItem.mv_to_top tests');

                // dummy class
                TestMainMenuItem = class extends cone.MainMenuItem {
                    mouseenter_toggle() {
                        assert.step('mouseenter_toggle()');
                    }
                }

                // mock mobile viewport
                cone.viewport.state = 0;
            });

            hooks.after(() => {
                console.log('Tear down cone.MainMenuItem.mv_to_top tests');

                // delete instance
                test_mm_item = null;
            });

            QUnit.test('mv_to_top()', assert => {
                // create instance
                item1 = new TestMainMenuItem($('.node-child_1'));

                // menu is in element - mobile viewport
                assert.strictEqual($(item1.menu, item1.elem).length, 1);
                assert.strictEqual(
                    $('#layout > .cone-mainmenu-dropdown').length,
                    0
                );

                // add event listener on arrow to check unbind
                item1.arrow.on('click', () => {
                    assert.step('click');
                });

                // invoke move to top
                item1.mv_to_top();
                // menu appended to #layout
                assert.strictEqual($('#layout > .cone-mainmenu-dropdown').length
                                   , 1);

                // trigger events to check for unbind
                item1.arrow.trigger('click');
                item1.elem.trigger('mouseenter');
                item1.elem.trigger('mouseleave');

                // verify method calls
                assert.verifySteps([
                    'mouseenter_toggle()',
                    'mouseenter_toggle()'
                ]);

                // show menu
                item1.menu.css('display', 'block');
                // trigger mouseleave
                item1.menu.trigger('mouseleave');
                assert.strictEqual(item1.menu.css('display'), 'none');
            });
        });

        QUnit.test('mouseenter_toggle()', assert => {
            // mock wrapper
            $('#layout').css({
                'width': '100vw',
                'height': '100vh'
            });
            // detach from wrapper to layout for offset tests
            $('#topnav').detach().appendTo('#layout');
            // create dummy item instance
            item1 = new cone.MainMenuItem($('.node-child_1'));
            item1.menu.css('display', 'none');

            // set dropdown position absolute
            $('.cone-mainmenu-dropdown').css('position', 'absolute');

            // trigger mouseenter
            item1.elem.trigger('mouseenter');
            assert.strictEqual(
                item1.menu.offset().left,
                item1.elem.offset().left
            );
            assert.strictEqual(item1.menu.css('display'), 'block');

            // trigger mouseleave
            item1.elem.trigger('mouseleave');
            assert.strictEqual(item1.menu.css('display'), 'none');
        });
    });
});
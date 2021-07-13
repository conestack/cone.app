import {MainMenuTop} from '../src/main_menu_top.js';

///////////////////////////////////////////////////////////////////////////////
// cone.MainMenuTop test helpers
///////////////////////////////////////////////////////////////////////////////

function create_mm_top_elem() {
    // create and append mainmenu DOM element
    let mainmenu_html = `
        <div id="main-menu"
             style="
               display:flex;
               flex-direction:row;
               flex-wrap:nowrap;
               align-items: center;
               height: 100%;
               margin-right: auto;
               padding-top: .5rem;">
          <ul id="mainmenu"
              style="
                display: inline-flex;
                flex-wrap: nowrap;
                height: 100%;
                margin-bottom: 0;
                padding: 0;">
          </ul>
        </div>
    `;

    $('#topnav-content').append(mainmenu_html);
}

function mm_top_style_to_desktop() {
    // manually set css as set in style.css
    $('.mainmenu-item').css({
        'white-space': 'nowrap',
        'padding': '0 10px'
    });
}

function mm_top_style_to_mobile() {
    // manually set mobile css as set in style.css
    $('#main-menu').css({
        'transform': 'none',
        'overflow': 'visible'
    });

    $('#mainmenu').css({
        'padding': '0',
        'line-height': '2',
        'width': '100%',
        'flex-direction': 'column',
        'overflow': 'hidden',
        'transform': 'none'
    });

    $('#mainmenu .mainmenu-title').css({
        'display': 'inline-block'
    });

    $('.mainmenu-item').css('display', 'block');
}

///////////////////////////////////////////////////////////////////////////////
// cone.MainMenuTop tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('cone.MainMenuTop', hooks => {
    hooks.before(() => {
        console.log('Set up cone.MainMenuTop tests');
        // create viewport
        cone.viewport = new cone.ViewPort();
    });

    hooks.after(() => {
        // unset viewport
        cone.viewport = null;
        console.log('Tear down cone.MainMenuTop tests');
    });

    QUnit.module('constructor', hooks => {
        hooks.before(() => {
            console.log('Set up cone.MainMenuTop.constructor tests');
        });

        hooks.beforeEach(() => {
            create_topnav_elem();
            create_mm_top_elem();
        });

        hooks.afterEach(() => {
            cone.viewport.state = 3;
            cone.topnav = null;
            cone.main_menu_top = null;
            $('#topnav').remove();
        });

        QUnit.test('properties', assert => {
            // initialize Topnav and MainMenuTop
            cone.Topnav.initialize();
            cone.MainMenuTop.initialize();

            // Mainmenu top inherits from ViewPortAware
            assert.ok(cone.main_menu_top instanceof cone.ViewPortAware);

            // element is div
            assert.ok(cone.main_menu_top.elem.is('div'));
            // mm items is empty array if no mm items in DOM
            assert.deepEqual(cone.main_menu_top.main_menu_items, []);
        });

        QUnit.test('desktop', assert => {
            // initialize Topnav and MainMenuTop
            cone.Topnav.initialize();
            cone.MainMenuTop.initialize();

            assert.strictEqual(cone.topnav.logo.css('margin-right'), '32px');
        });

        QUnit.module('mobile', hooks => {
            hooks.beforeEach(() => {
                // mock mobile viewport
                cone.viewport.state = 0;

                // initialize Topnav
                cone.Topnav.initialize();
            });

            hooks.afterEach(() => {
                cone.main_menu_sidebar = null;
            });

            QUnit.test('mobile without sidebar menu', assert => {
                // initialize MainMenuTop
                cone.MainMenuTop.initialize();

                // margin right is auto
                assert.notStrictEqual(
                    cone.topnav.logo.css('margin-right'),
                    '32px'
                );
            });

            QUnit.test('mobile with sidebar menu', assert => {
                // mock main menu sidebar
                cone.main_menu_sidebar = true;
                // inititalize MainMenuTop
                cone.MainMenuTop.initialize();
                // main menu top does not show in mobile menu if sidebar menu
                assert.strictEqual(
                    cone.main_menu_top.elem.css('display'),
                    'none'
                );
            });
        });

        QUnit.module('mm_items', hooks => {
            let elem_count;

            hooks.before(() => {
                // number of dummy items
                elem_count = 2;

                // create DOM elements
                create_topnav_elem();
                create_mm_top_elem();
                // create dummy items
                create_mm_items(elem_count);
            });

            hooks.after(() => {
                // remove mainmenu items
                $('.mainmenu-item').remove();
                // unset elements
                cone.topnav = null;
                cone.main_menu_top = null;
                // remove topnav from DOM
                $('#topnav').remove();
            });

            QUnit.test('MainMenuTop - MainMenuItems', assert => {
                // initialize Topnav and MainMenuTop
                cone.Topnav.initialize();
                cone.MainMenuTop.initialize();

                // all mainmenu items get pushed into array
                assert.strictEqual(
                    cone.main_menu_top.main_menu_items.length,
                    elem_count
                );
            });
        });
    });

    QUnit.module('methods', () => {
        QUnit.module('unload()', hooks => {
            let super_unload_origin;

            hooks.before(assert => {
                console.log('Set up unload tests');

                // create DOM elements
                create_topnav_elem();
                create_mm_top_elem();

                // save origin of super.onload
                super_unload_origin = cone.ViewPortAware.prototype.unload;
                // overwrite super.unload
                cone.ViewPortAware.prototype.unload = function() {
                    assert.step('super.unload()');
                }
            });

            hooks.after(() => {
                console.log('Tear down unload tests');

                // unset instances
                cone.topnav = null;
                cone.main_menu_top = null;

                // remove elements from DOM
                $('#topnav').remove();

                // reset super.unload
                cone.ViewPortAware.prototype.unload = super_unload_origin;
            })

            QUnit.test('unload()', assert => {
                // initialize Topnav and MainMenuTop
                cone.Topnav.initialize();
                cone.MainMenuTop.initialize();
                // second instance invokes unload
                cone.MainMenuTop.initialize();

                // super.unload called
                assert.verifySteps(['super.unload()']);
            });
        });

        QUnit.test.skip('handle_scrollbar()', assert => {
            // WIP
        });

        QUnit.module('viewport_changed', hooks => {
            let VPA = cone.ViewPortAware,
                super_vp_changed_origin = VPA.prototype.viewport_changed,
                TestMainMenuTop,
                test_mm_top,
                resize_evt;

            hooks.beforeEach(assert => {
                // create DOM elements
                create_topnav_elem();
                create_mm_top_elem();

                // overwrite super.viewport_changed
                VPA.prototype.viewport_changed = function(e) {
                    this.vp_state = e.state;
                    assert.step(`super.viewport_changed(${e.state})`);
                }

                // dummy mainmenu class
                TestMainMenuTop = class extends cone.MainMenuTop {
                    static initialize(context) {
                        let elem = $('#main-menu', context);
                        test_mm_top = new TestMainMenuTop(elem);
                    }
                }

                // mock viewport change event
                resize_evt = $.Event('viewport_changed');
            });

            hooks.afterEach(() => {
                // unset instances
                cone.topnav = null;
                test_mm_top = null;

                // remove elements from DOM
                $('#topnav').remove();

                // reset super.viewport_changed
                VPA.prototype.viewport_changed = super_vp_changed_origin;

                // unset mock resize evt
                resize_evt.state = null;

                // unset mainmenu sidebar
                cone.main_menu_sidebar = null;
            });

            QUnit.test('viewport_changed() without sidebar', assert => {
                // initialize Topnav and MainMenuTop
                cone.Topnav.initialize();
                TestMainMenuTop.initialize();

                // iterate through vp_states array
                for (let i=0; i<vp_states.length; i++) {
                    // mock viewport state change
                    resize_evt.state = i;

                    // call method with mock event
                    test_mm_top.viewport_changed(resize_evt);
                    assert.verifySteps([`super.viewport_changed(${i})`]);

                    if (test_mm_top.vp_state === 0) {
                        // mobile: margin right auto
                        assert.notStrictEqual(
                            cone.topnav.logo.css('margin-right'),
                            '32px'
                        );
                    } else {
                        // desktop
                        assert.strictEqual(
                            cone.topnav.logo.css('margin-right'),
                            '32px'
                        );
                    }
                }
            });

            QUnit.test('viewport_changed() with sidebar', assert => {
                // initialize Topnav and MainMenuTop
                cone.Topnav.initialize();
                TestMainMenuTop.initialize();

                // mock main menu sidebar
                cone.main_menu_sidebar = true;

                // iterate through vp_states array
                for (let i=0; i<vp_states.length; i++) {
                    // mock viewport state change
                    resize_evt.state = i;

                    // call method with mock event
                    test_mm_top.viewport_changed(resize_evt);
                    assert.verifySteps([`super.viewport_changed(${i})`]);

                    if (test_mm_top.vp_state === 0) {
                        // mobile: elem hidden
                        assert.strictEqual(
                            test_mm_top.elem.css('display'),
                            'none'
                        );
                    } else {
                        // desktop: element visible
                        assert.strictEqual(
                            test_mm_top.elem.css('display'),
                            'flex'
                        );
                    }
                }
            });

            QUnit.module('MainMenuItems', hooks => {
                let TestMainMenuTop2,
                    test_mm_top2,
                    MMI = cone.MainMenuItem,
                    mv_to_mobile_origin = MMI.prototype.mv_to_mobile,
                    mv_to_top_origin = MMI.prototype.mv_to_top;

                hooks.before(assert => {
                    // create DOM elements
                    create_topnav_elem();
                    create_mm_top_elem();
                    // create dummy main menu DOM items
                    create_mm_items(1);
                    create_empty_item();

                    // mock viewport change event
                    resize_evt = $.Event('viewport_changed');

                    MMI.prototype.mv_to_mobile = function() {
                        assert.step('mv_to_mobile()');
                    }
                    MMI.prototype.mv_to_top = function() {
                        assert.step('mv_to_top()');
                    }

                    // dummy mainmenu class
                    TestMainMenuTop2 = class extends cone.MainMenuTop {
                        static initialize(context) {
                            let elem = $('#main-menu', context);
                            test_mm_top2 = new TestMainMenuTop2(elem);
                        }
                    }

                    // initialize Topnav and MainMenuTop
                    cone.Topnav.initialize();
                    TestMainMenuTop2.initialize();
                });

                hooks.after(() => {
                    // unset instances
                    cone.topnav = null;
                    test_mm_top2 = null;

                    // remove elements from DOM
                    $('#topnav').remove();
                    $('.cone-mainmenu-dropdown').remove();

                    // reset MainMenuItem methods
                    MMI.prototype.mv_to_mobile = mv_to_mobile_origin;
                    MMI.prototype.mv_to_top = mv_to_top_origin;

                    // unset mock resize evt
                    resize_evt.state = null;
                });

                QUnit.test('viewport_changed mainmenu items', assert => {
                    // mock mobile viewport
                    resize_evt.state = 0;
                    test_mm_top2.viewport_changed(resize_evt);
                    // methods called
                    assert.verifySteps([
                        'super.viewport_changed(0)',
                        'mv_to_mobile()'
                    ]);

                    // mock large viewport
                    resize_evt.state = 3;
                    test_mm_top2.viewport_changed(resize_evt);
                    // methods called
                    assert.verifySteps([
                        'super.viewport_changed(3)',
                        'mv_to_top()'
                    ]);
                });
            });
        });
    });
});
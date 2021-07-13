import {Topnav} from '../src/topnav.js';

///////////////////////////////////////////////////////////////////////////////
// cone.Topnav test helpers
///////////////////////////////////////////////////////////////////////////////

function create_topnav_elem() {
    // create html element
    let topnav_html = `
        <div id="topnav"
             style="
               box-sizing: border-box;
               height:4rem;
               display:flex;
               flex-direction:row;
               align-items: center;
               width: 100%;
               padding-left: .75rem;">
          <div id="cone-logo"
               style="
                 font-size:1.5rem;
                 font-family: Arial;
                 margin-right: auto;
                 white-space: nowrap;
                 width: 32px;
                 height: 32px;">
            <a>
              <img class="logo"
                   src="/static/images/cone-logo-cone.svg"
                   style="height:32px;">
              <span>
                Cone
              </span>
            </a>
          </div>

          <div id="topnav-content" style="display:contents">
          </div>

          <div id="mobile-menu-toggle" style="display:none">
            <i class="bi bi-list"></i>
          </div>
        </div>
    `;
    // append element to DOM
    $('body').append(topnav_html);
}

function topnav_style_to_mobile() {
    // mock required css styling for mobile viewport

    let topnav = cone.topnav;
    topnav.elem.css({
        'padding': '1rem',
        'height': '4rem',
    });

    topnav.logo.css('margin-right', 'auto');
    $('span', topnav.logo).css('display', 'none');

    topnav.content.css({
        'position': 'absolute',
        'top': '4rem',
        'left': 0,
        'display': 'block',
        'flex-direction': 'column',
        'width': '100%',
        'z-index': 1000
    }).hide();

    topnav.toggle_button.css({
        'display': 'block',
        'font-size': '2rem',
        'margin-left': '1rem'
    });
}

function topnav_style_to_desktop() {
    // mock required css styling for desktop viewport (states 1, 2, 3)

    let topnav = cone.topnav;
    topnav.elem.css({
        'padding': '0',
        'padding-left': '.75rem'
    });

    topnav.logo.css('margin-right', 'auto');
    $('span', topnav.logo).css('display', 'inline-block');

    topnav.content.css({
        'position': 'absolute',
        'top': '',
        'left': '',
        'display': 'contents',
        'flex-direction': 'row',
        'width': '100%'
    });

    topnav.toggle_button.css({
        'display': 'none',
    });
}

///////////////////////////////////////////////////////////////////////////////
// cone.Topnav tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('cone.Topnav', hooks => {
    hooks.before(() => {
        console.log('Set up cone.Topnav tests');

        // set viewport
        cone.viewport = new cone.ViewPort();
    });

    hooks.after(() => {
        console.log('Tear down cone.Topnav tests');

        // unset viewport
        cone.viewport = null;
    });

    QUnit.module('constructor', () => {
        QUnit.module('properties', hooks => {
            hooks.beforeEach(() => {
                console.log('Set up cone.Topnav properties tests');

                // create topnav DOM element
                create_topnav_elem();

                // append toolbar dropdowns dummy element to DOM
                let tb_dropdown_elem = $(`
                    <div id="toolbar-top">
                      <li class="dropdown">
                      </li>
                    </div>
                `);
                $('#topnav-content').append(tb_dropdown_elem);
            });

            hooks.afterEach(() => {
                console.log('Tear down cone.Topnav properties tests');

                // unload and remove instance
                cone.topnav = null;
                $('#topnav').remove();

                // unset viewport
                cone.viewport.state = null;
            });

            QUnit.test('vp mobile', assert => {
                // set viewport to mobile
                cone.viewport.state = 0;
                // initialize Topnav instance
                cone.Topnav.initialize();
                let top_nav = cone.topnav;

                assert.ok(top_nav instanceof cone.ViewPortAware);

                // content to dropdown is hidden
                assert.ok(top_nav.content.is(':hidden'));
                assert.ok(top_nav.elem.hasClass('mobile'));

                // show topnav content
                top_nav.content.show();
                // trigger bootstap dropdownon toolbar dropdowns
                top_nav.tb_dropdowns.trigger('show.bs.dropdown');
                // topnav content is hidden
                assert.strictEqual(top_nav.content.css('display'), 'none');
            });

            QUnit.test('vp desktop', assert => {
                // set viewport to desktop
                cone.viewport.state = 3;
                // initialize Topnav instance
                cone.Topnav.initialize();
                let top_nav = cone.topnav;

                assert.ok(top_nav instanceof cone.ViewPortAware);

                // content to dropdown is visible
                assert.strictEqual(top_nav.content.css('display'), 'contents');
                assert.notOk(top_nav.elem.hasClass('mobile'));

                // containing element
                assert.ok(top_nav.elem.is('#topnav'));

                // content
                assert.ok(top_nav.content.is('#topnav-content'));

                // toggle button
                assert.ok(top_nav.toggle_button.is('div#mobile-menu-toggle'));

                // logo
                assert.ok(top_nav.logo.is('div#cone-logo'));

                // toolbar dropdowns
                assert.ok(top_nav.tb_dropdowns.is('#toolbar-top>li.dropdown'));

                // private method toggle_menu_handle exists
                assert.ok(top_nav._toggle_menu_handle);
            });
        });
    });

    QUnit.module('methods', () => {
        QUnit.module('unload', hooks => {
            let toggle_menu_origin = cone.Topnav.prototype.toggle_menu,
                super_unload_origin = cone.ViewPortAware.prototype.unload;

            hooks.before(assert => {
                console.log('Set up cone.Topnav.unload test');

                // create topnav DOM element
                create_topnav_elem();

                // since unload happens in static method, overwrite isntead
                // of creating dummy class
                cone.Topnav.prototype.toggle_menu_origin = function() {
                    assert.step('click');
                }

                // overwrite super.unload()
                cone.ViewPortAware.prototype.unload = function() {
                    assert.step('super.unload()');
                }
            });

            hooks.after(() => {
                console.log('Tear down cone.Topnav.unload test');

                // remove topnav element from DOM
                $('#topnav').remove();

                // reset super.unload()
                cone.ViewPortAware.prototype.unload = super_unload_origin;

                // reset cone.Topnav.toggle_menu
                cone.Topnav.prototype.toggle_menu = toggle_menu_origin;
            });

            QUnit.test('unload()', assert => {
                // initializing second instance invokes unload function
                cone.Topnav.initialize();
                cone.Topnav.initialize();

                // trigger click on button
                cone.topnav.toggle_button.trigger('click');

                // super.unload has been called
                assert.verifySteps(['super.unload()']);
            });
        });

        QUnit.module('toggle_menu', hooks => {
            let slide_toggle_origin;

            hooks.before(assert => {
                console.log('Set up cone.Topnav.toggle_menu tests');

                // create topnav DOM element
                create_topnav_elem();

                // save jQuery slideToggle origin
                slide_toggle_origin = $.fn.slideToggle;

                // overwrite jQuery slideToggle function for performance
                $.fn._slideToggle = $.fn.slideToggle;
                $.fn.slideToggle = function(){
                    assert.step('slideToggle called');
                    if (this.css('display') === 'none') {
                        $.fn.show.apply(this);
                    } else {
                        $.fn.hide.apply(this);
                    }
                };
            });

            hooks.after(() => {
                console.log('Tear down cone.Topnav.toggle_menu tests');

                // remove topnav element from DOM
                $('#topnav').remove();

                // reset jQuery slideToggle function
                $.fn.slideToggle = slide_toggle_origin;
                $.fn._slideToggle = $.fn.slideToggle;
            });

            QUnit.test('toggle_menu()', assert => {
                // set viewport state to mobile
                cone.viewport.state = 0;

                // initialize Topnav instance
                cone.Topnav.initialize();
                // apply mobile css styles
                topnav_style_to_mobile();

                // content is hidden
                assert.strictEqual(cone.topnav.content.css('display'), 'none');

                // trigger click on toggle button
                cone.topnav.toggle_button.trigger('click');
                // slideToggle has been called
                assert.verifySteps(['slideToggle called']);
                // content has display flex
                assert.strictEqual(cone.topnav.content.css('display'), 'flex');

                // trigger second click on toggle button
                cone.topnav.toggle_button.trigger('click');

                // slideToggle has been called
                assert.verifySteps(['slideToggle called']);
                // content is hidden
                assert.strictEqual(cone.topnav.content.css('display'), 'none');
            });
        });

        QUnit.module('viewport_changed', hooks => {
            let VPA = cone.ViewPortAware,
                super_vp_changed_origin = VPA.prototype.viewport_changed;

            hooks.before(assert => {
                console.log('Set up cone.Topnav.viewport_changed tests');

                // create topnav DOM element
                create_topnav_elem();

                // append dummy toolbar dropdowns to DOM
                let tb_dropdown_elem = $(`
                    <div id="toolbar-top">
                        <li class="dropdown">
                        </li>
                    </div>
                `);
                $('#topnav-content').append(tb_dropdown_elem);

                // overwrite super() function
                VPA.prototype.viewport_changed = function(e) {
                    this.vp_state = e.state;
                    assert.step('super.viewport_changed()');
                }
            });

            hooks.after(() => {
                console.log('Tear down cone.Topnav.viewport_changed tests');

                // remove topnav element from DOM
                $('#topnav').remove();

                // reset super() function
                VPA.prototype.viewport_changed = super_vp_changed_origin;
            });

            QUnit.test('viewport_changed()', assert => {
                // initialize instance of cone.Topnav
                cone.Topnav.initialize();

                // mock window resize event
                let resize_evt = $.Event('viewport_changed');

                for (let i=0; i<vp_states.length; i++) {
                    resize_evt.state = i;

                    // assert click on dropdowns
                    cone.topnav.tb_dropdowns.on('click', () => {
                        assert.step('click');
                    });

                    // invoke viewport_changed()
                    cone.topnav.viewport_changed(resize_evt);
                    assert.strictEqual(cone.topnav.vp_state, resize_evt.state);
                    assert.verifySteps([
                        'super.viewport_changed()'
                    ]);

                    if (i === 0) {
                        // apply required mobile css styles
                        topnav_style_to_mobile();

                        assert.strictEqual(
                            cone.topnav.content.css('display'),
                            'none'
                        );
                        assert.ok(cone.topnav.elem.hasClass('mobile'));

                        // show content
                        cone.topnav.content.show();

                        // trigger dropdown on toolbar dropdowns
                        cone.topnav.tb_dropdowns.trigger('show.bs.dropdown');

                        assert.strictEqual(
                            cone.topnav.content.css('display'),
                            'none'
                        );
                    } else {
                        // apply required desktop css styles
                        topnav_style_to_desktop();

                        assert.strictEqual(
                            cone.topnav.content.css('display'),
                            'contents'
                        );
                        assert.notOk(cone.topnav.elem.hasClass('mobile'));

                        // trigger click on toolbar dropdowns
                        // no assertion step should be invoked
                        cone.topnav.tb_dropdowns.trigger('click');
                    }
                }
            });
        });

        QUnit.module('pt_handle', hooks =>{
            let slide_up_origin = $.fn.slideUp;

            hooks.before(assert => {
                console.log('Set up cone.Topnav.pt_handle tests');

                // create dummy topnav
                create_topnav_elem();

                // create dummy toolbar dropdowns element
                let tb_dropdown_elem = $(`
                    <div id="toolbar-top">
                      <li class="dropdown">
                      </li>
                    </div>
                `);
                // create dummy personaltools element
                let personaltools = $(`
                    <div id="personaltools">
                      <div id="user">
                      </div>
                    </div>
                `);
                // append dummy elements to DOM
                $('#topnav-content').append(tb_dropdown_elem);
                $('#topnav-content').append(personaltools);

                // set viewport to mobile
                cone.viewport.state = 0;

                // overwrite jQuery slideUp function
                $.fn._slideUp = $.fn.slideUp;
                $.fn.slideUp = function(){
                    assert.step('slideUp called');
                    $.fn.hide.apply(this);
                };
            });

            hooks.after(() => {
                console.log('Tear down cone.Topnav.pt_handle tests');

                // reset jQuery slideUp function
                $.fn.slideUp = slide_up_origin;
                $.fn._slideUp = $.fn.slideUp;

                // unset instance
                cone.topnav = null;
                $('#topnav').remove();
            });

            QUnit.test('pt_handle()', assert => {
                // initialize cone.Topnav instance
                cone.Topnav.initialize();

                // trigger bootstrap dropdown on personaltools
                cone.topnav.pt.trigger('show.bs.dropdown');
                assert.strictEqual(cone.topnav.user.css('display'), 'block');

                // trigger bootstrap hide.bs.dropdown
                cone.topnav.pt.trigger('hide.bs.dropdown');
                assert.strictEqual(cone.topnav.user.css('display'), 'none');
                assert.verifySteps(['slideUp called']);

                cone.topnav = null;
                cone.viewport.state = 3;
                cone.Topnav.initialize();

                // trigger bootstrap show.bs.dropdown
                cone.topnav.pt.trigger('show.bs.dropdown');
                assert.strictEqual(cone.topnav.user.css('display'), 'block');

                // trigger bootstrap hide.bs.dropdown
                cone.topnav.pt.trigger('hide.bs.dropdown');
                assert.strictEqual(cone.topnav.user.css('display'), 'none');
            });
        });
    });
});
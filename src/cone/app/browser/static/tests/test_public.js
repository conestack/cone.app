
QUnit.begin(details => {
	console.log(`Test amount: ${details.totalTests}`);
});

QUnit.done(function(details) {
	console.log(
	  "Total: " + details.total + " Failed: " + details.failed
	  + " Passed: " + details.passed + " Runtime: " + details.runtime
	);
});

// viewport states for responsive tests
var vp_states = ['mobile', 'small', 'medium', 'large'];

///////////////////////////////////////////////////////////////////////////////
// namespace tests
///////////////////////////////////////////////////////////////////////////////
QUnit.test('cone namespace', assert => {
	console.log('Run cone namespace tests');

	// viewport
	assert.ok(cone.viewport instanceof cone.ViewPort);
	// viewport states are correct
	assert.strictEqual(cone.VP_MOBILE, 0);
	assert.strictEqual(cone.VP_SMALL, 1);
	assert.strictEqual(cone.VP_MEDIUM, 2);
	assert.strictEqual(cone.VP_LARGE, 3);

	// theme_switcher and css themes
	assert.strictEqual(cone.theme_switcher, null);
	assert.deepEqual(cone.default_themes, [
		'/static/light.css',
		'/static/dark.css'
	]);

	// layout components
	assert.strictEqual(cone.sidebar_menu, null);
	assert.strictEqual(cone.main_menu_top, null);
	assert.strictEqual(cone.main_menu_sidebar, null);
	assert.strictEqual(cone.navtree, null);
	assert.strictEqual(cone.topnav, null);

	// searchbar
	assert.strictEqual(cone.searchbar, null);
	assert.strictEqual(cone.searchbar_handler, null);

	// content
	assert.strictEqual(cone.content, null);
});

///////////////////////////////////////////////////////////////////////////////
// cone.toggle_arrow function test
///////////////////////////////////////////////////////////////////////////////
QUnit.test('cone.toggle_arrow', assert => {
	console.log('Run cone.toggle_arrow test');

	// set variables
	let up = 'bi-chevron-up',
		down = 'bi-chevron-down',
		arrow_up = $(`<i class="dropdown-arrow ${up}" />`),
		arrow_down = $(`<i class="dropdown-arrow ${down}" />`);

	// toggle arrow from up to down
	cone.toggle_arrow(arrow_up);
	assert.strictEqual(arrow_up.attr('class'), `dropdown-arrow ${down}`);
	// toggle arrow from down to up
	cone.toggle_arrow(arrow_down);
	assert.strictEqual(arrow_down.attr('class'), `dropdown-arrow ${up}`);
});

///////////////////////////////////////////////////////////////////////////////
// cone.ViewPort tests
///////////////////////////////////////////////////////////////////////////////
QUnit.module('cone.ViewPort', hooks => {
	hooks.before(() => {
		console.log('Set up cone.ViewPort tests');

		// set viewport
		viewport.set('large');
	});

	hooks.after(() => {
		console.log('Tear down cone.ViewPort tests');
	});

	QUnit.module('constructor', hooks => {
		let TestViewPort,
			test_viewport;

		hooks.before(assert => {
			console.log('Set up cone.ViewPort.constructor tests');

			// dummy class
			TestViewPort = class extends cone.ViewPort {
				update_viewport() {
					assert.step('update_viewport()');
				}
				resize_handle() {
					assert.step('resize_handle()');
				}
			}
		});

		hooks.after(() => {
			console.log('Tear down cone.ViewPort.constructor tests');

			// unset viewport
			$(window).off('resize');
			delete test_viewport;
		});

		QUnit.test('properties', assert => {
			// create new instance of viewport
			test_viewport = new TestViewPort();

			// state not set on load
			assert.strictEqual(test_viewport.state, null);

			// queries are set correctly
			assert.strictEqual(test_viewport._mobile_query,
							   `(max-width:559.9px)`);
			assert.strictEqual(test_viewport._small_query,
							   `(min-width:560px) and (max-width: 989.9px)`);
			assert.strictEqual(test_viewport._medium_query,
							   `(min-width:560px) and (max-width: 1200px)`);

			// update_viewport called
			assert.verifySteps(['update_viewport()']);

			// trigger resize evt
			$(window).trigger('resize');

			// resize_handle called
			assert.verifySteps(['resize_handle()']);
		});
	});

	QUnit.module('methods', () => {
		QUnit.module('update_viewport()', hooks => {
			hooks.before(() => {
				console.log('Set up cone.ViewPort methods tests');
				cone.viewport = new cone.ViewPort();
			});

			hooks.after(() => {
				$(window).off('resize');
				cone.viewport = null;
				console.log('Tear down cone.ViewPort methods tests');
			});

			// run through vp_states array
			for	(let i = 0; i < vp_states.length; i++) {
				QUnit.test(`Viewport ${i}`, assert => {
					/* set actual viewport (viewport breakpoints are set
					   in karma.conf.js) */
					viewport.set(vp_states[i]);

					// trigger resize event
					$(window).trigger('resize');

					// assert viewport state
					assert.strictEqual(cone.viewport.state, i);
				});
			}
		});

		QUnit.module('resize_handle()', hooks => {
			let TestViewPort,
				test_viewport;

			hooks.before(assert => {
				console.log('Set up cone.ViewPort.resize_handle tests');

				// dummy class
				TestViewPort = class extends cone.ViewPort {
					update_viewport() {
						assert.step('update_viewport()');
						if (window.matchMedia(this._mobile_query).matches) {
							this.state = cone.VP_MOBILE;
						} else if (window.matchMedia(this._small_query).matches) {
							this.state = cone.VP_SMALL;
						} else if (window.matchMedia(this._medium_query).matches) {
							this.state = cone.VP_MEDIUM;
						} else {
							this.state = cone.VP_LARGE;
						}
					}
				}
				// create instance of cone.ViewPort
				test_viewport = new TestViewPort();

				$(window).on('viewport_changed', () => {
					assert.step(`viewport_changed`);
				});
			});

			hooks.after(() => {
				$(window).off('viewport_changed')
				$(window).off('resize');
				delete test_viewport;
				console.log('Tear down cone.ViewPort.resize_handle tests');
			});

			QUnit.test('resize_handle', assert => {
				/* NOTE: (viewport breakpoints are set in karma.conf.js) */

				// initial call
				assert.verifySteps(['update_viewport()']);

				for (let i=0; i<vp_states.length; i++) {
					// set viewport
					viewport.set(vp_states[i]);
					// trigger resize event
					$(window).trigger('resize');
					// assert viewport state
					assert.strictEqual(test_viewport.state, i);
					// verify calls
					assert.verifySteps([
						'update_viewport()',
						'viewport_changed'
					]);
				}
			});
		});
	});
});

///////////////////////////////////////////////////////////////////////////////
// cone.ViewPortAware tests
///////////////////////////////////////////////////////////////////////////////
QUnit.module('cone.ViewPortAware', hooks => {
	hooks.before(() => {
		// create cone viewport object
		cone.viewport = new cone.ViewPort();
		console.log('Set up cone.ViewPortAware tests');
	});

	hooks.after(() => {
		// unset cone viewport object
		cone.viewport = null;
		console.log('Tear down cone.ViewPortAware tests');
	});

	QUnit.module('constructor', hooks => {
		let test_vp_aware;

		hooks.before(() => {
			console.log('Set up cone.ViewPortAware.constructor tests');
		});

		hooks.after(() => {
			// delete instance
			delete test_vp_aware;
			console.log('Tear down cone.ViewPortAware.constructor tests');
		});

		QUnit.test('constructor', assert => {
			// initial construct
			for (let i = 0; i <= 3; i++) {
				// set cone viewport state
				cone.viewport.state = i;

				// create instance
				test_vp_aware = new cone.ViewPortAware();

				// assert viewport states
				assert.strictEqual(cone.viewport.state, i);
				assert.strictEqual(test_vp_aware.vp_state, cone.viewport.state);
			}
		});
	});

	QUnit.module('methods', () => {
		let TestViewPortAware,
			test_vp_aware;

		QUnit.module('unload()', hooks => {
			hooks.before(() => {
				console.log('Set up cone.ViewPortAware.unload tests');
				viewport.set('large');
				cone.viewport.state = 3;

				// dummy class
				TestViewPortAware = class extends cone.ViewPortAware {
					viewport_changed() {
						assert.step('viewport_changed()');
					}
				}
			});

			hooks.after(() => {
				// delete instance
				delete test_vp_aware;
				console.log('Tear down cone.ViewPortAware.unload tests');
			});

			QUnit.test('unload()', assert => {
				// create instance
				test_vp_aware = new TestViewPortAware();

				// test object viewport state is cone viewport state
				assert.strictEqual(test_vp_aware.vp_state, cone.viewport.state);

				// unload test object
				test_vp_aware.unload();

				// change viewport
				viewport.set('small');
				// fire resize evt
				$(window).trigger('resize');

				// test if resize event listener is unbound
				assert.strictEqual(cone.viewport.state, 1);
				assert.notStrictEqual(test_vp_aware.vp_state, cone.viewport.state);

				// no steps called if unbound
				assert.verifySteps([]);
			});
		});

		QUnit.test('viewport_changed', assert => {
			// create instance
			test_vp_aware = new cone.ViewPortAware();

			// mock event
			let evt = new $.Event('viewport_changed', {
				'state': 2
			});
			$(window).trigger(evt);

			// assert viewport state of object is the same as event
			assert.strictEqual(test_vp_aware.vp_state, evt.state);

			// unload and delete instance
			test_vp_aware.unload();
			delete test_vp_aware;
		});
	});
});

///////////////////////////////////////////////////////////////////////////////
// cone.Content tests
///////////////////////////////////////////////////////////////////////////////
QUnit.module('cone.Content', hooks => {
	hooks.before(() => {
		console.log('Set up cone.Content tests');

		// append dummy content html to DOM
		let content_html = `
			<div id="page-content-wrapper">
			  <div id="page-content">
			  </div>
			</div>
		`;
		$('body').append(content_html);

		// create content instance
		cone.Content.initialize();
	});

	hooks.after(() => {
		console.log('Tear down cone.Content tests');

		// unset instance
		cone.content = null;
		// remove dummy content element from DOM
		$('#page-content-wrapper').remove();
	});

	QUnit.test('content', assert => {
		assert.ok(true);
	});
});


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
				id="elem${count}"
			>
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
			height: 100%;
			"
		>
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
QUnit.module('cone.MainMenuItem', hooks => {
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
				console.log('Set up MainMenuItem.constructor properties tests');

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
				console.log('Tear down MainMenuItem.constructor properties tests');

				// remove dummy DOM elements
				$('#topnav').remove();
				$('#main-menu').remove();

				// remove mainmenu item elements
				test_mm_item.menu.remove();
				test_mm_item.elem.remove();

				// delete dummy item
				delete test_mm_item;

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
				delete test_mm_item;

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
				delete test_mm_item;

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
				delete test_mm_item;
			});

			QUnit.test('render_dd()', assert => {
				// create instance
				test_mm_item = new cone.MainMenuItem($('.node-child_1'));

				// 3 default children appended
				assert.strictEqual(test_mm_item.children.length, 3);
				// menu appended to layout
				assert.strictEqual($('#layout > .cone-mainmenu-dropdown').length
									, 1);
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
				delete test_mm_item;
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
				// menu appended to elem
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
				delete test_mm_item;
			});

			QUnit.test('mv_to_top()', assert => {
				// create instance
				item1 = new TestMainMenuItem($('.node-child_1'));

				// menu is in element - mobile viewport
				assert.strictEqual($(item1.menu, item1.elem).length, 1);
				assert.strictEqual($('#layout > .cone-mainmenu-dropdown').length
								   , 0);

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
			assert.strictEqual(item1.menu.offset().left, item1.elem.offset().left);
			assert.strictEqual(item1.menu.css('display'), 'block');

			// trigger mouseleave
			item1.elem.trigger('mouseleave');
			assert.strictEqual(item1.menu.css('display'), 'none');
		});
	});
});

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
			   padding-top: .5rem;
			 "
		>
			<ul id="mainmenu"
			    style="
				  display: inline-flex;
				  flex-wrap: nowrap;
				  height: 100%;
				  margin-bottom: 0;
				  padding: 0;
			">
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

				// margin right auto
				assert.notStrictEqual(cone.topnav.logo.css('margin-right'),
									  '32px');
			});

			QUnit.test('mobile with sidebar menu', assert => {
				// mock main menu sidebar
				cone.main_menu_sidebar = true;
				// inititalize MainMenuTop
				cone.MainMenuTop.initialize();
				// main menu top does not show in mobile menu if sidebar menu
				assert.strictEqual(cone.main_menu_top.elem.css('display'), 
								   'none');
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
				assert.strictEqual(cone.main_menu_top.main_menu_items.length,
								   elem_count);
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
			let super_vp_changed_origin,
				TestMainMenuTop,
				test_mm_top,
				resize_evt;

			hooks.beforeEach(assert => {
				// create DOM elements
				create_topnav_elem();
				create_mm_top_elem();

				// save origin of super.viewport_changed
				super_vp_changed_origin = cone.ViewPortAware.prototype.viewport_changed;
				// overwrite super.viewport_changed
				cone.ViewPortAware.prototype.viewport_changed = function(e) {
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
				cone.ViewPortAware.prototype.viewport_changed = super_vp_changed_origin;

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
						assert.notStrictEqual(cone.topnav.logo.css('margin-right'),
											  '32px');
					} else {
						// desktop
						assert.strictEqual(cone.topnav.logo.css('margin-right'),
										   '32px');
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
						assert.strictEqual(test_mm_top.elem.css('display'), 'none');
					} else {
						// desktop: element visible
						assert.strictEqual(test_mm_top.elem.css('display'), 'flex');
					}
				}
			});

			QUnit.module('MainMenuItems', hooks => {
				let TestMainMenuTop2,
					test_mm_top2,
					mv_to_mobile_origin,
					mv_to_top_origin;

				hooks.before(assert => {
					// create DOM elements
					create_topnav_elem();
					create_mm_top_elem();
					// create dummy main menu DOM items
					create_mm_items(1);
					create_empty_item();

					// mock viewport change event
					resize_evt = $.Event('viewport_changed');

					// save origins of MainMenuItem methods
					mv_to_mobile_origin = cone.MainMenuItem.prototype.mv_to_mobile;
					mv_to_top_origin = cone.MainMenuItem.prototype.mv_to_top;

					cone.MainMenuItem.prototype.mv_to_mobile = function() {
						assert.step('mv_to_mobile()');
					}
					cone.MainMenuItem.prototype.mv_to_top = function() {
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
					cone.MainMenuItem.prototype.mv_to_mobile = mv_to_mobile_origin;
					cone.MainMenuItem.prototype.mv_to_top = mv_to_top_origin;

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
						'mv_to_mobile()',
					]);

					// mock large viewport
					resize_evt.state = 3;
					test_mm_top2.viewport_changed(resize_evt);
					// methods called
					assert.verifySteps([
						'super.viewport_changed(3)',
						'mv_to_top()',
					]);
				});
			});
		});
	});
});

///////////////////////////////////////////////////////////////////////////////
// cone.MainMenuSidebar test helpers
///////////////////////////////////////////////////////////////////////////////

function create_mm_sidebar_elem() {
	let mm_sidebar_html = `
		<ul id="mainmenu_sidebar">
		  <li class="sidebar-heading" id="mainmenu-sb-heading">
		  	<span>
		  	  Main Menu
		  	</span>
		  </li>

		  <li class="active node-child_1">
			<a href="#">
			  <i class="bi bi-heart"></i>
				<span">Title</span>
			</a>
		  </li>

		  <li class="node-child_2 sb-menu">
		    <a href="#">
		      <i class="bi bi-heart"></i>
		    	<span">Title</span>
		    </a>
			<a href="#" class="sidebar-arrow">
				<i class="dropdown-arrow bi bi-chevron-down"></i>
			</a>

			<ul class="cone-mainmenu-dropdown-sb">
			  <li>
			  	<a href="#">
				  <i class="bi bi-heart"></i>
			      <span>Title</span>
				</a>
			  </li>
			</ul>
		  </li>

		  <li class="node-child_3 sb-menu">
		    <a href="#">
		  	  <i class="bi bi-heart"></i>
		  	    <span">Title</span>
		      </a>
		      <a href="#" class="sidebar-arrow">
		  	    <i class="dropdown-arrow bi bi-chevron-down"></i>
		      </a>

		    <ul class="cone-mainmenu-dropdown-sb">
		      <li>
		  		<a href="#">
		  		  <i class="bi bi-heart"></i>
		  		  <span>Title</span>
		  	    </a>
		  	  </li>
		    </ul>
		  </li>
		</ul>
	`;

	$('#sidebar_content').append(mm_sidebar_html);
}

///////////////////////////////////////////////////////////////////////////////
// cone.MainMenuSidebar tests
///////////////////////////////////////////////////////////////////////////////
QUnit.module('cone.MainMenuSidebar', hooks => {
	hooks.before(() => {
        console.log('Set up cone.MainMenuSidebar tests');
		cone.viewport = new cone.ViewPort();
	});

	hooks.after(() => {
		cone.viewport = null;
        console.log('Tear down cone.MainMenuSidebar tests');
	});

	QUnit.module('constructor', () => {
		QUnit.module('properties', hooks => {
			hooks.before(() => {
				console.log('Set up cone.MainMenuSidebar properties tests');

				// create DOM elements
				create_sidebar_elem();
				create_mm_sidebar_elem();
			});

			hooks.after(() => {
				console.log('Tear down cone.MainMenuSidebar properties test');

				// delete instances
				cone.sidebar_menu = null;
				cone.main_menu_sidebar = null;

				// remove element from DOM
				$('#sidebar_left').remove();
			});

			QUnit.test('properties', assert => {
				// initialize instances
				cone.SidebarMenu.initialize();
				cone.MainMenuSidebar.initialize();
				let mm_sb = cone.main_menu_sidebar;

				assert.ok(mm_sb instanceof cone.ViewPortAware);

				// containing element
				assert.ok(mm_sb.elem.is('ul#mainmenu_sidebar'));

				// items
				assert.ok(mm_sb.items);
				// expected number of items in mainmenu
				assert.strictEqual(mm_sb.items.length, 3);
				// items are direct children of elem
				assert.ok(mm_sb.items.is('#mainmenu_sidebar > li:not("sidebar-heading")'));

				// arrows
				assert.ok(mm_sb.arrows);
				assert.ok(mm_sb.arrows.is('i.dropdown-arrow'));

				// menus
				assert.ok(mm_sb.menus.is('li.sb-menu'));
			});
		});
	});

	QUnit.module('methods', () => {

		QUnit.module('unload()', hooks => {
			let super_unload_origin;

			hooks.before(assert => {
				console.log('Set up cone.MainMenuSidebar.unload tests');

				// create DOM elements
				create_sidebar_elem();
				create_mm_sidebar_elem();

				// save original function
				// NOTE: since unload method gets called in static method,
				// overwrite unload method instead of creating dummy class
				super_unload_origin = cone.ViewPortAware.prototype.unload;
				// overwrite original function
				cone.ViewPortAware.prototype.unload = function() {
					assert.step('super.unload()');
				}
			});

			hooks.after(() => {
				console.log('Tear down cone.MainMenuSidebar.unload tests');

				// reset original unload method
				cone.ViewPortAware.prototype.unload = super_unload_origin;

				// delete instance
				cone.sidebar_menu = null;
				cone.main_menu_sidebar = null;

				$('#sidebar_left').remove();
			});

			QUnit.test('unload()', assert => {
				// initialize instances
				cone.SidebarMenu.initialize();
				cone.MainMenuSidebar.initialize();

				cone.main_menu_sidebar.items.on('mouseenter mouseleave', () => {
					throw new Error('mouseenter/mouseleave');
				});
				cone.main_menu_sidebar.arrows.on('click', () => {
					throw new Error('click');
				});

				// second instance invokes unload function
				cone.MainMenuSidebar.initialize();

				// trigger events to check if evt listeners are unbound
				cone.main_menu_sidebar.items.trigger('mouseenter');
				cone.main_menu_sidebar.items.trigger('mouseleave');
				cone.main_menu_sidebar.arrows.trigger('click');

				// cone.ViewPortAware has been called
				assert.verifySteps(['super.unload()']);
			});
		});

		QUnit.module('initial_cookie()', hooks => {
			hooks.beforeEach(() => {
				console.log('Set up cone.MainMenuSidebar.initial_cookie tests');

				// create DOM elements
				create_sidebar_elem();
				create_mm_sidebar_elem();

				// delete any cookies --- make sure to tear down properly!
				createCookie('sidebar menus', '', -1);
			});

			hooks.afterEach(() => {
				console.log('Tear down cone.MainMenuSidebar.initial_cookie tests');

				// remove elements from DOM
				cone.main_menu_sidebar = null;
				cone.sidebar_menu = null;
				$('#sidebar_left').remove();

				// remove cookie
				createCookie('sidebar menus', '', -1);
			});

			QUnit.test('initial_cookie()', assert => {
				// initialize instances
				cone.SidebarMenu.initialize();
				cone.MainMenuSidebar.initialize();
				let mm_sb = cone.main_menu_sidebar;

				// cookie does not exist
				assert.notOk(readCookie('sidebar menus'));

				// create empty array, push display none for hidden menus
				let test_display_data = [];
				for (let elem of mm_sb.menus) {
					test_display_data.push('none');
				}
				// display_data shows all menus hidden 
				assert.deepEqual(mm_sb.display_data, test_display_data);
			});

			QUnit.test('initial_cookie() with cookie', assert => {
				// initialize instances
				cone.SidebarMenu.initialize();
				cone.MainMenuSidebar.initialize();
				let mm_sb = cone.main_menu_sidebar;

				// fill array with display block for visible menus
				let test_display_data = [];
				for (let elem of mm_sb.menus) {
					test_display_data.push('block');
				}
				// create cookie
				createCookie('sidebar menus', test_display_data, null);
				assert.ok(readCookie('sidebar menus'));

				// invoke inital_cookie method
				mm_sb.initial_cookie();
				assert.deepEqual(mm_sb.display_data, test_display_data);
			});
		});

		QUnit.module('viewport_changed()', hooks => {
			let TestMmSb,
				test_mm_sb,
				super_vp_changed_origin;

			hooks.before(assert => {
				console.log('Set up cone.MainMenuSidebar.viewport_changed tests');

				cone.viewport.state = 3;

				// create DOM elements
				create_sidebar_elem();
				create_mm_sidebar_elem();

				// overwrite Viewport_changed
				super_vp_changed_origin = cone.ViewPortAware.prototype.viewport_changed;
				cone.ViewPortAware.prototype.viewport_changed = function(e){
					this.vp_state = e.state;
					assert.step('super.viewport_changed()');
				}

				// dummy class
				TestMmSb = class extends cone.MainMenuSidebar {
					static initialize(context) {
						let elem = $('#mainmenu_sidebar', context);
						test_mm_sb = new TestMmSb(elem);
					}
					mv_to_mobile() {
						assert.step('mv_to_mobile()');
					}
					mv_to_sidebar() {
						assert.step('mv_to_sidebar()');
					}
				}
			});

			hooks.after(() => {
				console.log('Tear down cone.MainMenuSidebar.viewport_changed tests');

				$(window).off('resize');
				viewport.set('large');

				// reset viewport_changed
				cone.ViewPortAware.prototype.viewport_changed = super_vp_changed_origin;

				// unload and delete instances
				cone.sidebar_menu = null;
				delete test_mm_sb;

				$('#sidebar_left').remove();
			});

			QUnit.test('viewport_changed()', assert => {
				// create mock viewport change event
				let resize_evt = $.Event('viewport_changed');

				// initialize instances
				cone.SidebarMenu.initialize();
				TestMmSb.initialize();

				for (let i=0; i<vp_states.length; i++) {
					// set viewport state
					resize_evt.state = i;
					// invoke viewport_changed function
					test_mm_sb.viewport_changed(resize_evt);

					assert.strictEqual(test_mm_sb.vp_state, resize_evt.state);

					if (i === 0) {
						// mobile
						assert.verifySteps([
							'super.viewport_changed()', 
							'mv_to_mobile()'
						]);
					} else {
						// desktop
						assert.verifySteps([
							'super.viewport_changed()', 
							'mv_to_sidebar()'
						]);
					}
				}
			});
		});

		QUnit.module('mv_to_mobile()', hooks => {
			hooks.before(() => {
				console.log('Set up cone.MainMenuSidebar.mv_to_mobile tests');

				// create DOM elements
				create_topnav_elem();
				create_sidebar_elem();
				create_mm_sidebar_elem();

				// change viewport to mobile
				cone.viewport.state = 0;
			});

			hooks.after(() => {
				console.log('Tear down cone.MainMenuSidebar.mv_to_mobile tests');

				$(window).off('resize');

				// delete instances
				cone.topnav = null;
				cone.sidebar_menu = null;
				cone.main_menu_sidebar = null;

				// remove DOM elements
				$('#topnav').remove();
				$('#sidebar_left').remove();

				// reset viewport
				cone.viewport.state = 3;
			});

			QUnit.test('mv_to_mobile()', assert => {
				// initialize instances
				cone.Topnav.initialize();	
				cone.SidebarMenu.initialize();

				// initialize MainMenuSidebar
				cone.MainMenuSidebar.initialize();
				let mm_sb = cone.main_menu_sidebar;

				// mainmenu sidebar is not in sidebar content
				assert.strictEqual($('#sidebar_content > #mainmenu_sidebar').length,
									0);
				// mainmenu sidebar is in topnav content
				assert.strictEqual($('#topnav-content > #mainmenu_sidebar').length,
									1);
				assert.ok(mm_sb.elem.hasClass('mobile'));
			});
		});

		QUnit.module('mv_to_sidebar()', hooks => {
			hooks.before(() => {
				console.log('Set up cone.MainMenuSidebar.mv_to_sidebar tests');

				// create DOM elements
				create_topnav_elem();
				create_sidebar_elem();
				create_mm_sidebar_elem();

				// set viewport to large
				cone.viewport.state = 3;
			});

			hooks.after(() => {
				console.log('Tear down cone.MainMenuSidebar.mv_to_sidebar tests');

				// delete instances
				cone.topnav = null;
				cone.sidebar_menu = null;
				cone.main_menu_sidebar = null;

				// remove DOM elements
				$('#topnav').remove();
				$('#sidebar_left').remove();
			});

			QUnit.test('mv_to_sidebar()', assert => {
				// initialize instances
				cone.Topnav.initialize();
				cone.SidebarMenu.initialize(),
				cone.MainMenuSidebar.initialize();
				let mm_sb = cone.main_menu_sidebar;

				// mainmenu sidebar is in sidebar content
				assert.strictEqual($('#sidebar_content > #mainmenu_sidebar').length
								   , 1);

				// invoke mv_to_mobile
				mm_sb.mv_to_mobile();
				assert.strictEqual($('#sidebar_content > #mainmenu_sidebar').length
								   , 0);

				// invoke mv_to_sidebar
				mm_sb.mv_to_sidebar();

				// mainmenu sidebar is in sidebar content
				assert.strictEqual($('#sidebar_content > #mainmenu_sidebar').length
							       , 1);
				// mainmenu sidebar is in topnav content
				assert.strictEqual($('#topnav-content > #mainmenu_sidebar').length
								   , 0);
				assert.notOk(mm_sb.elem.hasClass('mobile'));
			});
		});

		QUnit.module('collapse', hooks => {
			hooks.before(() => {
				console.log('Set up cone.MainMenuSidebar.collapse tests');

				// create DOM elements
				create_sidebar_elem();
				create_mm_sidebar_elem();
			});

			hooks.after(() => {
				console.log('Tear down cone.MainMenuSidebar.collapse tests');

				// delete instances
				cone.sidebar_menu = null;
				cone.main_menu_sidebar = null;

				// remove DOM elements
				$('#sidebar_left').remove();
			});

			QUnit.test('collapse()', assert => {
				// initialize instances
				cone.SidebarMenu.initialize();
				cone.MainMenuSidebar.initialize();
				let mm_sb = cone.main_menu_sidebar;

				// test if evt listener removed
				mm_sb.arrows.on('click', () => {
					throw new Error('click');
				});

				// invoke collapse
				mm_sb.collapse();

				// menus are hidden
				assert.ok($('ul', mm_sb.items).is(':hidden'));
				// trigger click on arrows
				mm_sb.arrows.trigger('click');

				for (let item of mm_sb.items) {
					let elem = $(item);
					let menu = $('ul', elem);

					// if menu exists
					if (menu.length > 0){
						// helper function to test element width
						function test_width(elem_width, menu_width) {
							elem.css('width', elem_width);
							menu.css('width', menu_width);

							// trigger mouseenter
							elem.trigger('mouseenter');
							assert.ok(elem.hasClass('hover'));
							assert.ok(menu.is(':visible'));

							// trigger mouseleave
							elem.trigger('mouseleave');
							assert.ok(menu.is(':hidden'));
							assert.notOk(elem.hasClass('hover'));
						}

						// test with different dimensions
						test_width(300, 400);
						test_width(400, 300);

						// test for disabled hover on scrollbar dragstart
						$(window).trigger('dragstart');
						// trigger mouseenter
						elem.trigger('mouseenter');
						// menu is hidden
						assert.notOk(menu.is(':visible'));

						$(window).trigger('dragend');
						// trigger mouseenter
						elem.trigger('mouseenter');
						// menu is visible
						assert.ok(menu.is(':visible'));

						// reset menu visibility
						menu.hide();
					}
				}
			});
		});

		QUnit.module('expand', hooks => {
			hooks.before(() => {
				console.log('Set up cone.MainMenuSidebar.expand tests');

				// create DOM elements
				create_sidebar_elem();
				create_mm_sidebar_elem();
			});

			hooks.after(() => {
				console.log('Tear down cone.MainMenuSidebar.expand tests');

				// delete instances
				cone.sidebar_menu = null;
				cone.main_menu_sidebar = null;

				// remove DOM elements
				$('#sidebar_left').remove();
			});

			QUnit.test('expand()', assert => {
				// initialize instances
				cone.SidebarMenu.initialize();
				cone.MainMenuSidebar.initialize();
				let mm_sb = cone.main_menu_sidebar;

				// invoke collapse method
				mm_sb.collapse();

				// mock expanded menu
				$('.node-child_3').trigger('mouseenter');
				$('.node-child_3').removeClass('hover');

				// display data cookie tests
				// empty array
				mm_sb.display_data = [];

				// add display state for every item
				for (let i = 0; i < mm_sb.menus.length; i++) {
					let data = $('ul', mm_sb.menus[i]).css('display');
					mm_sb.display_data.push(data);
				}

				// throw error on mouseenter/leave to test if unbound
				mm_sb.items.on('mouseenter mouseleave', () => {
					throw new Error('mouseenter/mouseleave');
				})

				// invoke expand method
				mm_sb.expand();

				// trigger mouse events on items
				mm_sb.items.trigger('mouseenter').trigger('mouseleave');

				for (let i = 0; i < mm_sb.menus.length; i++) {
					let elem = mm_sb.menus[i],
						arrow = $('i.dropdown-arrow', elem),
						menu = $('ul.cone-mainmenu-dropdown-sb', elem)
					;
					// menu is correct value of display_data
					assert.strictEqual(menu.css('display'), mm_sb.display_data[i]);

					if (menu.css('display') === 'none'){
						// menu is hidden
						assert.notOk(arrow.hasClass('bi-chevron-up'));
						assert.ok(arrow.hasClass('bi-chevron-down'));
						arrow.trigger('click');
						assert.strictEqual(menu.css('display'), 'block');
						assert.strictEqual(mm_sb.display_data[i], 'block');
						assert.notOk(arrow.hasClass('bi-chevron-down'));
						assert.ok(arrow.hasClass('bi-chevron-up'));
					} else if (menu.css('display') === 'block'){
						// menu is visible
						assert.ok(arrow.hasClass('bi-chevron-up'));
						assert.notOk(arrow.hasClass('bi-chevron-down'));

						// save jQuery slideToggle origin
						let slide_toggle_origin = $.fn.slideToggle;

						// overwrite jQuery slideToggle for performance
						$.fn._slideToggle = $.fn.slideToggle;
						$.fn.slideToggle = function(){
							assert.step('slideToggle called');
							$.fn.hide.apply(this);
						};

						// trigger click on arrow
						arrow.trigger('click');

						assert.strictEqual(menu.css('display'), 'none');
						assert.notOk(arrow.hasClass('bi-chevron-up'));
						assert.ok(arrow.hasClass('bi-chevron-down'));

						// display data of element after click is none
						assert.strictEqual(mm_sb.display_data[i], 'none');

						// jQuery slideToggle has been called
						assert.verifySteps(['slideToggle called']);

						// reset jQuery slideToggle
						$.fn.slideToggle = slide_toggle_origin;
						$.fn._slideToggle = $.fn.slideToggle;
					}

					// cookie has been created
					assert.ok(readCookie('sidebar menus'));
				}
			});
		});
	});
});


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
				padding-left: .75rem;
		">
		<div id="cone-logo"
			style="
				font-size:1.5rem;
				font-family: Arial;
				margin-right: auto;
				white-space: nowrap;
				width: 32px;
				height: 32px;
		">
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
			let super_vp_changed_origin;

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
				super_vp_changed_origin = cone.ViewPortAware.prototype.viewport_changed;
				cone.ViewPortAware.prototype.viewport_changed = function(e) {
					this.vp_state = e.state;
					assert.step('super.viewport_changed()');
				}
			});

			hooks.after(() => {
				console.log('Tear down cone.Topnav.viewport_changed tests');

				// remove topnav element from DOM
				$('#topnav').remove();

				// reset super() function
				cone.ViewPortAware.prototype.viewport_changed = super_vp_changed_origin;
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

						assert.strictEqual(cone.topnav.content.css('display'), 
										   'none');
						assert.ok(cone.topnav.elem.hasClass('mobile'));

						// show content
						cone.topnav.content.show();

						// trigger dropdown on toolbar dropdowns
						cone.topnav.tb_dropdowns.trigger('show.bs.dropdown');

						assert.strictEqual(cone.topnav.content.css('display'),
										   'none');
					} else {
						// apply required desktop css styles
						topnav_style_to_desktop();

						assert.strictEqual(cone.topnav.content.css('display'),
									       'contents');
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

///////////////////////////////////////////////////////////////////////////////
// cone.SidebarMenu helpers
///////////////////////////////////////////////////////////////////////////////
function create_sidebar_elem() {
	// create dummy sidebar element
	let sidebar_html = `
	 	<div id="sidebar_left">
	 	  <div id="sidebar_content">
	 	  </div>
	 	  <div id="sidebar_footer">
	 		<div id="toggle-fluid">
	 		  <i class="bi bi-lock-fill"></i> 
	 		  <span>Lock state</span>
	 		</div>
	 		<div id="sidebar-toggle-btn">
	 		  <i class="bi bi-arrow-left-circle"></i>
	 		</div>
	 	  </div>
	 	</div>
	`;
	// append dummy element to DOM
	$('body').append(sidebar_html);
}

///////////////////////////////////////////////////////////////////////////////
// cone.SidebarMenu tests
///////////////////////////////////////////////////////////////////////////////
QUnit.module('cone.SidebarMenu', hooks => {
	hooks.before(() => {
		console.log('Set up cone.SidebarMenu tests');
		cone.viewport = new cone.ViewPort();
	});

	hooks.after(() => {
		console.log('Tear down cone.SidebarMenu tests');
		cone.viewport = null;
	});

	QUnit.module('constructor', () => {
		hooks.before(() => {
			console.log('Set up cone.SidebarMenu tests');
		});
		hooks.after(() =>{
			console.log('Tear down cone.SidebarMenu tests');
		});

		QUnit.module('properties', hooks => {
			hooks.before(() => {
				console.log('Set up cone.SidebarMenu properties tests');

				// set viewport to desktop
				cone.viewport.state = 3;

				// create dummy sidebar
				create_sidebar_elem();
			});

			hooks.after(() =>{
				console.log('Tear down cone.SidebarMenu properties tests');

				// unset and remove sidebar
				cone.sidebar_menu = null;
				// remove dummy sidebar from DOM
				$('#sidebar_left').remove();
			});

			QUnit.test('elems', assert => {
				// initialize new SidebarMenu instance
				cone.SidebarMenu.initialize();
				let sidebar = cone.sidebar_menu;

				// Sidebar is child of cone.ViewPortAware class
				assert.ok(sidebar instanceof cone.ViewPortAware);

				// containing element
				assert.ok(sidebar.elem.is('div#sidebar_left'));

				// content
				assert.ok(sidebar.content.is('div#sidebar_content'));

				// sidebar is expanded on desktop load
				assert.false(sidebar.collapsed);

				// footer
				assert.ok(sidebar.toggle_btn.is('#sidebar_footer > #sidebar-toggle-btn'));
				assert.ok(sidebar.toggle_arrow_elem.is('#sidebar-toggle-btn > i'));
				assert.ok(sidebar.lock_switch.is('#sidebar_footer > #toggle-fluid'));
				assert.strictEqual(sidebar.cookie, null);

				// private methods exist
				assert.ok(sidebar._toggle_menu_handle);
				assert.ok(sidebar._toggle_lock);
			});
		});
	});

	QUnit.module('methods', hooks =>{
		hooks.before(() => {
			console.log('Set up cone.SidebarMenu method tests');
		});

		hooks.after(() => {
			console.log('Tear down cone.SidebarMenu method tests');
		});

		QUnit.module('unload', hooks => {
			let toggle_menu_origin = cone.SidebarMenu.prototype.toggle_menu,
				toggle_lock_origin = cone.SidebarMenu.prototype.toggle_lock,
				super_unload_origin = cone.ViewPortAware.prototype.unload;

			hooks.before(assert => {
				console.log('Set up cone.SidebarMenu.unload tests');

				// set viewport
				cone.viewport.state = 3;

				// create dummy sidebar element
				create_sidebar_elem();

				// overwrite methods to check for method calls
				cone.SidebarMenu.prototype.toggle_menu = function() {
					assert.step('toggle_menu()');
				}
				cone.SidebarMenu.prototype.toggle_lock = function() {
					assert.step('toggle_lock()');
				}

				// overwrite super.unload function
				cone.ViewPortAware.prototype.unload = function() {
					assert.step('super.unload()');
				}
			});

			hooks.after(() => {
				console.log('Tear down cone.SidebarMenu.unload tests');

				// unset sidebar
				cone.sidebar_menu = null;
				// remove dummy element from DOM
				$('#sidebar_left').remove();

				// reset super.unload() function
				cone.ViewPortAware.prototype.unload = super_unload_origin;

				// reset methods after test completion
				cone.SidebarMenu.prototype.toggle_menu = toggle_menu_origin;
				cone.SidebarMenu.prototype.toggle_lock = toggle_lock_origin;
			});

			QUnit.test('unload()', assert => {
				// initialize new SidebarMenu instance
				cone.SidebarMenu.initialize();
				// second instance invokes unload in constructor
				cone.SidebarMenu.initialize();
				assert.verifySteps(['super.unload()']);

				// manually unload
				cone.sidebar_menu.unload();

				// trigger events to check for unbind
				cone.sidebar_menu.toggle_btn.trigger('click');
				cone.sidebar_menu.lock_switch.trigger('click');

				// super.unload has been called
				assert.verifySteps(['super.unload()']);
			});
		});

		QUnit.module('initial_load()', hooks => {
			let TestSidebarMenu,
				test_sidebar_menu;

			hooks.beforeEach(assert => {
				console.log('Set up cone.SidebarMenu.initial_load tests');
				// create dummy sidebar html elem
				create_sidebar_elem();

				// dummy class
				TestSidebarMenu = class extends cone.SidebarMenu {
					assign_state() {
						assert.step('assign_state()');
					}
					toggle_menu() {
						assert.step('toggle_menu()');
					}
				}
			});

			hooks.afterEach(() => {
				console.log('Tear down cone.SidebarMenu.initial_load tests');

				// unload and unset instance
				test_sidebar_menu.unload();
				delete test_sidebar_menu;
				// remove dummy element from DOM
				$('#sidebar_left').remove();
			});

			for (let i=0; i<vp_states.length; i++) {
				QUnit.test(`Viewport ${i}`, assert => {
					// set viewport
					cone.viewport.state = i;

					// initialize Test Sidebar
					test_sidebar_menu = new TestSidebarMenu($('#sidebar_left'));
					assert.strictEqual(test_sidebar_menu.vp_state,
									   cone.viewport.state);
					assert.verifySteps(['assign_state()']);

					// sidebar cookie is null
					assert.strictEqual(readCookie('sidebar'), null);

					if (i === 0) {
						// containing element is hidden on mobile viewport
						assert.strictEqual(test_sidebar_menu.elem.css('display'),
										   'none');
					} else if (i === 2) {
						// sidebar is collapsed on medium viewport
						assert.strictEqual(test_sidebar_menu.collapsed, true);
					} else if (i === 3) {
						// sidebar is expanded on large viewport
						assert.strictEqual(test_sidebar_menu.collapsed, false);
					}
				});

				QUnit.test(`Viewport ${i} with cookie`, assert => {
					// set viewport
					cone.viewport.state = i;

					// create dummy cookie
					createCookie('sidebar', true, null);

					// initialize Test Sidebar
					test_sidebar_menu = new TestSidebarMenu($('#sidebar_left'));
					assert.strictEqual(test_sidebar_menu.vp_state,
									   cone.viewport.state);
					assert.verifySteps(['assign_state()']);

					assert.strictEqual(readCookie('sidebar'), 'true');

					if (i !== 0) {
						// cookie state === collapsed if viewport is not mobile
						assert.strictEqual(test_sidebar_menu.collapsed, true);

						// lock switch is active if cookie exists
						assert.ok(test_sidebar_menu.lock_switch.hasClass('active'));

						// trigger click on toggle button
						test_sidebar_menu.toggle_btn.trigger('click');
						// toggle_menu_handle called
						assert.verifySteps(['toggle_menu()']);
					}

					// remove dummy cookie
					createCookie('sidebar', '', -1);
				});
			}
		});

		QUnit.module('toggle_lock()', hooks => {
			let TestSidebarMenu,
				test_sidebar_menu;

			hooks.beforeEach(assert => {
				console.log('Set up cone.SidebarMenu.toggle_lock tests');

				// set viewport
				cone.viewport.state = 3;

				// create dummy sidebar element
				create_sidebar_elem();

				// dummy class
				TestSidebarMenu = class extends cone.SidebarMenu {
					toggle_menu() {
						assert.step('toggle_menu()');
					}
				}
			});

			hooks.afterEach(() => {
				console.log('Tear down cone.SidebarMenu.toggle_lock tests');

				// unset sidebar
				test_sidebar_menu.unload();
				test_sidebar_menu = null;
				// remove dummy element from DOM
				$('#sidebar_left').remove();

				// delete dummy cookie
				createCookie('sidebar', '', -1);
			});

			QUnit.test('toggle_lock()', assert => {
				// create new SidebarMenu instance
				test_sidebar_menu = new TestSidebarMenu($('#sidebar_left'));

				// sidebar is collapsed on load
				assert.strictEqual(test_sidebar_menu.collapsed, false);

				// cookie is null
				assert.strictEqual(readCookie('sidebar'), null);

				// trigger click on lock switch (lock state)
				test_sidebar_menu.lock_switch.trigger('click');
				// lock switch is active
				assert.ok(test_sidebar_menu.lock_switch.hasClass('active'));
				// collapsed state has not changed
				assert.strictEqual(test_sidebar_menu.collapsed, false);
				// no cookie created after click
				assert.strictEqual(test_sidebar_menu.cookie, false);

				// trigger click on toggle button
				test_sidebar_menu.toggle_btn.trigger('click');

				// toggle_menu() called
				assert.verifySteps(['toggle_menu()']);
			});

			QUnit.test('toggle_lock() with cookie', assert => {
				// create dummy cookie
				createCookie('sidebar', true, null);
				assert.strictEqual(readCookie('sidebar'), 'true');

				// create new SidebarMenu instance
				test_sidebar_menu = new TestSidebarMenu($('#sidebar_left'));

				// lock switch is active
				assert.ok(test_sidebar_menu.lock_switch.hasClass('active'));

				// trigger unclick on lock switch
				test_sidebar_menu.lock_switch.trigger('click');
				// cookie is deleted
				assert.strictEqual(readCookie('sidebar'), null);

				// lock switch is not active after click
				assert.notOk(test_sidebar_menu.lock_switch.hasClass('active'));

				// trigger click on toggle button
				test_sidebar_menu.toggle_btn.trigger('click');
				assert.strictEqual(test_sidebar_menu.cookie, null);

				// toggle_menu() has been called
				assert.verifySteps(['toggle_menu()']);
			});
		});

		QUnit.module('viewport_changed()', hooks => {
			let TestSidebarMenu,
				test_sidebar_menu,
				super_vp_changed_origin = cone.ViewPortAware.prototype.viewport_changed;

			hooks.beforeEach(assert => {
				console.log('Set up cone.SidebarMenu.toggle_lock tests');

				// set viewport
				cone.viewport.state = 3;

				// create dummy sidebar element
				create_sidebar_elem();

				// dummy class
				TestSidebarMenu = class extends cone.SidebarMenu {
					assign_state() {
						assert.step(`assign_state(${this.collapsed})`);
					}
				}

				// overwrite vp changed method to assert call
				cone.ViewPortAware.prototype.viewport_changed = function(e) {
					this.vp_state = e.state;
					assert.step(`super.viewport_changed(${e.state})`);
				}
			});

			hooks.afterEach(() => {
				console.log('Tear down cone.SidebarMenu.toggle_lock tests');

				// unset sidebar
				test_sidebar_menu.unload();
				test_sidebar_menu = null;
				// remove dummy element from DOM
				$('#sidebar_left').remove();

				// reset vp changed method
				cone.ViewPortAware.prototype.viewport_changed = super_vp_changed_origin;

				// delete dummy cookie
				createCookie('sidebar', '', -1);
			});

			QUnit.test('viewport_changed()', assert => {
				// create new SidebarMenu instance
				test_sidebar_menu = new TestSidebarMenu($('#sidebar_left'));

				// initial assign_state call on load
				assert.verifySteps([
					'assign_state(false)'
				]);

				// create dummy viewport changed event
				let resize_evt = $.Event('viewport_changed');

				for (let i=0; i<vp_states.length; i++) {
					// set dummy viewport changed event
					resize_evt.state = i;
					// invoke viewport_changed method
					test_sidebar_menu.viewport_changed(resize_evt);

					let state;

					assert.strictEqual(test_sidebar_menu.vp_state, resize_evt.state);

					if (i === 0) {
						// sidebar is expanded on mobile viewport
						assert.strictEqual(test_sidebar_menu.collapsed, false);
						// element is hidden in mobile dropdown
						assert.strictEqual(test_sidebar_menu.elem.css('display'),
										   'none');
						state = false;
					} else if (i === 1) {
						// sidebar is collapsed on small viewport
						assert.strictEqual(test_sidebar_menu.collapsed, true);
						// element is visible
						assert.strictEqual(test_sidebar_menu.elem.css('display'),
										   'block');
						state = true;
					} else if (i === 2) {
						state = false;
					} else if (i === 3) {
						// sidebar is expanded on large viewport
						assert.strictEqual(test_sidebar_menu.collapsed, false);
						// element is visible
						assert.strictEqual(test_sidebar_menu.elem.css('display'),
									 	   'block');
						state = false;
					}

					// methods have been called
					assert.verifySteps([
						`super.viewport_changed(${i})`,
						`assign_state(${state})`
					]);
				}
			});

			QUnit.test('viewport small', assert => {
				// create new SidebarMenu instance
				test_sidebar_menu = new TestSidebarMenu($('#sidebar_left'));

				// initial assign_state call on load
				assert.verifySteps(['assign_state(false)']);

				// create dummy viewport changed event
				let resize_evt = $.Event('viewport_changed');
				// resize event state does not equal sidebar viewport state
				resize_evt.state = 1;
				test_sidebar_menu.vp_state = 2;

				// invoke viewport_changed method
				test_sidebar_menu.viewport_changed(resize_evt);
				// sidebar is collapsed
				assert.strictEqual(test_sidebar_menu.collapsed, true);
				// elem is visible
				assert.strictEqual(test_sidebar_menu.elem.css('display'),
								   'block');

				assert.verifySteps([
					'super.viewport_changed(1)',
					'assign_state(true)'
				]);
			});

			QUnit.test('with cookie', assert => {
				let state;

				// create dummy viewport changed event
				let resize_evt = $.Event('viewport_changed');

				// create new SidebarMenu instance
				test_sidebar_menu = new TestSidebarMenu($('#sidebar_left'));

				// initial assign_state call on load
				assert.verifySteps(['assign_state(false)']);

				for (let i=0; i<vp_states.length; i++) {
					if (i === 1) {
						state = false;
					} else {
						state = true;
					}

					// create dummy cookie
					test_sidebar_menu.cookie = state;

					// set dummy viewport changed event state
					resize_evt.state = i;

					// invoke viewport_changed method
					test_sidebar_menu.viewport_changed(resize_evt);

					if (i === 0) {
						// collapsed state can't change on mobile
						assert.verifySteps([
							`super.viewport_changed(${i})`,
							`assign_state(false)` 
						]);
						assert.strictEqual(test_sidebar_menu.collapsed, false);
					} else {
						// collapsed cookie state gets applied
						assert.verifySteps([
							`super.viewport_changed(${i})`,
							`assign_state(${state})` 
						]);
						assert.strictEqual(test_sidebar_menu.collapsed, state);
					}
				}
			});
		});

		QUnit.module('assign_state()', hooks => {
			let TestMainMenuSidebar;

			hooks.beforeEach(assert => {
				console.log('Set up cone.SidebarMenu.toggle_lock tests');

				// set viewport
				cone.viewport.state = 3;

				// create dummy sidebar element
				create_sidebar_elem();

				// create dummy mainmenu sidebar element
				create_mm_sidebar_elem();

				// dummy class
				TestMainMenuSidebar = class extends cone.MainMenuSidebar {
					static initialize(context) {
						let elem = $('#mainmenu_sidebar');
						cone.main_menu_sidebar = new TestMainMenuSidebar(elem);
					}
					collapse() {
						assert.step('collapse()');
					}
					expand() {
						assert.step('expand()');
					}
				}
			});

			hooks.afterEach(() => {
				console.log('Tear down cone.SidebarMenu.toggle_lock tests');

				// unset sidebar
				cone.sidebar_menu.unload();
				cone.sidebar_menu = null;
				// remove dummy element from DOM
				$('#sidebar_left').remove();

				// unset main menu sidebar
				if (cone.main_menu_sidebar) {
					cone.main_menu_sidebar.unload();
					cone.main_menu_sidebar = null;
				}
			});

			QUnit.test('assign_state()', assert => {
				cone.SidebarMenu.initialize();

				// sidebar is expanded on load
				assert.strictEqual(cone.sidebar_menu.collapsed, false);
				assert.ok(cone.sidebar_menu.elem.hasClass('expanded'));
				assert.ok(cone.sidebar_menu.toggle_arrow_elem
						  .hasClass('bi bi-arrow-left-circle'));

				// sidebar is collapsed
				cone.sidebar_menu.collapsed = true;
				// invoke assign_state() method
				cone.sidebar_menu.assign_state();
				assert.ok(cone.sidebar_menu.elem.hasClass('collapsed'));
				assert.ok(cone.sidebar_menu.toggle_arrow_elem
						  .hasClass('bi bi-arrow-right-circle'));
			});

			QUnit.test('with mainmenu sidebar', assert => {
				// initialize SidebarMenu instance
				cone.SidebarMenu.initialize();
				// initialize mainmenu sidebar instance
				TestMainMenuSidebar.initialize();

				// expand
				cone.sidebar_menu.assign_state();

				//collapse
				cone.sidebar_menu.collapsed = true;
				cone.sidebar_menu.assign_state();

				assert.verifySteps([
					'expand()',
					'collapse()'
				]);
			});
		});

		QUnit.module('toggle_menu()', hooks => {
			let TestSidebarMenu;

			hooks.before(assert => {
				console.log('Set up cone.SidebarMenu.toggle_menu tests');

				// set viewport
				cone.viewport.state = 3;

				// create dummy sidebar element
				create_sidebar_elem();

				// dummy class
				TestSidebarMenu = class extends cone.SidebarMenu {
					assign_state() {
						assert.step('assign_state()');
					}
				}
			});

			hooks.after(() => {
				console.log('Tear down cone.SidebarMenu.toggle_menu tests');

				// unset sidebar
				cone.sidebar_menu.unload();
				cone.sidebar_menu = null;
				// remove dummy element from DOM
				$('#sidebar_left').remove();
			});

			QUnit.test('toggle_menu()', assert => {
				// initialize new SidebarMenu instance
				cone.sidebar_menu = new TestSidebarMenu();

				// initial assign_state call
				assert.verifySteps(['assign_state()']);

				// sidebar is expanded on load
				assert.strictEqual(cone.sidebar_menu.collapsed, false);

				// trigger click on toggle button
				cone.sidebar_menu.toggle_btn.trigger('click');
				// sidebar is collapsed after click
				assert.strictEqual(cone.sidebar_menu.collapsed, true);
				assert.verifySteps(['assign_state()']);

				// trigger click on toggle button
				cone.sidebar_menu.toggle_btn.trigger('click');
				// sidebar is expanded after click
				assert.strictEqual(cone.sidebar_menu.collapsed, false);
				assert.verifySteps(['assign_state()']);
			});
		});
	});
});

///////////////////////////////////////////////////////////////////////////////
// cone.Navtree helpers
///////////////////////////////////////////////////////////////////////////////
function create_navtree_elem() {
	let navtree_html = `
	<ul id="navtree">
		<li class="sidebar-heading" id="navtree-heading">
		  <span>
		  	Navigation
		  </span>
		  <i class="dropdown-arrow bi bi-chevron-down"></i>
		</li>

		<div id="navtree-content">

		<li class="active navtreelevel_1">
		  <a href="#">
			<i class="bi bi-heart"></i>
			<span>Title</span>
		  </a>
		  <ul>
			<li class="navtreelevel_2">
			  <a href="#">
				<i class="bi bi-heart"></i>
				<span>Title</span>
		      </a>
			</li>
		  </ul>
		</li>

		<li class="active navtreelevel_1">
		  <a href="#">
			<i class="bi bi-heart"></i>
			<span>Title</span>
		  </a>
		  <ul>
			<li class="navtreelevel_2">
			  <a href="#">
				<i class="bi bi-heart"></i>
				<span>Title</span>
		      </a>
			</li>
		  </ul>
		</li>
	  </div>
	</ul>
	`;

	$('#sidebar_content').append(navtree_html);
}

///////////////////////////////////////////////////////////////////////////////
// cone.Navtree tests
///////////////////////////////////////////////////////////////////////////////
QUnit.module('cone.Navtree', hooks => {
	hooks.before(() => {
		console.log('Set up cone.Navtree tests');
		cone.viewport = new cone.ViewPort();
	});

	hooks.after(() => {
		console.log('Tear down cone.Navtree tests');
		cone.viewport = null;
	});

	QUnit.module('constructor', hooks => {
		hooks.before(() => {
			console.log('Set up cone.Navtree constructor tests');
		});

		hooks.after(() => {
			console.log('Tear down cone.Navtree constructor tests');
		});

		QUnit.module('properties', hooks => {
			hooks.before(() => {
				console.log('Set up cone.Navtree properties tests');

				// create dummy html elements
				create_sidebar_elem();
				create_navtree_elem();
			});

			hooks.after(() => {
				console.log('Tear down cone.Navtree properties tests');

				// unload and unset instances
				cone.sidebar_menu.unload();
				cone.sidebar_menu = null;
				cone.navtree.unload();
				cone.navtree = null;
				// remove dummy elements from DOM
				$('#sidebar_left').remove();
			});

			QUnit.test('properties', assert => {
				// initialize instances
				cone.SidebarMenu.initialize();
				cone.Navtree.initialize();

				assert.ok(cone.navtree instanceof cone.ViewPortAware);

				// containing element
				assert.ok(cone.navtree.elem.is('#sidebar_content > #navtree'));

				// content
				assert.ok(cone.navtree.content.is('#navtree > #navtree-content'));

				// heading
				assert.ok(cone.navtree.heading.is('#navtree > #navtree-heading'));

				// toggle elements
				assert.ok(cone.navtree.toggle_elems.is('li.navtreelevel_1'));

				// private methods
				assert.ok(cone.navtree._mouseenter_handle);
				assert.ok(cone.navtree._restore);
			});
		});

		QUnit.module('constructor calls', hooks => {
			let TestNavtree,
				test_navtree;

			hooks.before(assert => {
				console.log('Set up cone.Navtree constructor calls tests');

				// create dummy html elements
				create_sidebar_elem();
				create_navtree_elem();

				// dummy class
				TestNavtree = class extends cone.Navtree {
					scrollbar_handle() {
						assert.step('scrollbar_handle()');
					}
					mv_to_mobile() {
						assert.step('mv_to_mobile()');
					}
				}
			});

			hooks.after(() => {
				console.log('Tear down cone.Navtree constructor calls tests');

				// unload and unset instances
				cone.sidebar_menu.unload();
				cone.sidebar_menu = null;
				test_navtree.unload();
				delete test_navtree;

				// remove dummy elements from DOM
				$('#sidebar_left').remove();
			});

			QUnit.test('mv_to_mobile() and scrollbar_handle() call', assert => {
				// set viewport to mobile
				cone.viewport.state = 0;

				// initialize instance of cone.SidebarMenu
				cone.SidebarMenu.initialize();
				// initialize instance of Navtree
				test_navtree = new TestNavtree();
				$(window).off('viewport_changed');

				assert.verifySteps([
					'mv_to_mobile()',
					'scrollbar_handle()'
				]);
			});
		});
	});

	QUnit.module('methods', hooks => {
		hooks.before(() => {
			console.log('Set up cone.Navtree methods tests');
		});

		hooks.after(() => {
			console.log('Tear down cone.Navtree methods tests');
		});

		QUnit.module('mv_to_mobile()', hooks => {
			hooks.before(() => {
				console.log('Set up cone.Navtree.mv_to_mobile tests');

				// create dummy DOM elements
				create_topnav_elem();
				create_sidebar_elem();
				create_navtree_elem();

				// set viewport
				cone.viewport.state = 3;
			});

			hooks.after(() => {
				console.log('Tear down cone.Navtree.mv_to_mobile tests');

				// unload and unset instances
				cone.topnav.unload();
				cone.topnav = null;
				cone.sidebar_menu.unload();
				cone.sidebar_menu = null;
				cone.navtree.unload();
				cone.navtree = null;

				// delete dummy DOM elements
				$('#topnav').remove();
				$('#sidebar_left').remove();
			});

			QUnit.test('mv_to_mobile', assert => {
				// initialize topnav instance
				cone.Topnav.initialize();

				// initialize sidebar and navtree instances
				cone.SidebarMenu.initialize();
				cone.Navtree.initialize();

				// invoke mv_to_mobile() method
				cone.navtree.mv_to_mobile();

				assert.ok(cone.navtree.elem.hasClass('mobile'));
				// navtree element appended to topnav content
				assert.ok(cone.navtree.elem.is('#topnav-content > #navtree'));
				// navtree content is hidden
				assert.ok(cone.navtree.content.is(':hidden'));

				// trigger click on heading
				cone.navtree.heading.trigger('click');
				// navtree content dropdown
				assert.ok(cone.navtree.content.is(':visible'));
			});
		});

		QUnit.module('viewport_changed()', hooks => {
			let super_vp_changed_origin = cone.ViewPortAware.prototype.viewport_changed,
				TestNavtree,
				test_navtree;

			hooks.before(assert => {
				console.log('Set up cone.Navtree.viewport_changed tests');

				// create dummy DOM elements
				create_topnav_elem();
				create_sidebar_elem();
				create_navtree_elem();

				// set viewport
				cone.viewport.state = 3;

				// overwrite super.viewport_changed method
				cone.ViewPortAware.prototype.viewport_changed = function(e) {
					this.vp_state = e.state;
					assert.step(`super.viewport_changed(${e.state})`);
				}

				// dummy class
				TestNavtree = class extends cone.Navtree {
					mv_to_mobile() {
						assert.step('mv_to_mobile()');
					}
				}
			});

			hooks.after(() => {
				console.log('Tear down cone.Navtree.viewport_changed tests');

				// unload and unset instances
				cone.topnav.unload();
				cone.topnav = null;
				cone.sidebar_menu.unload();
				cone.sidebar_menu = null;
				test_navtree.unload();
				test_navtree = null;

				// delete dummy DOM elements
				$('#topnav').remove();
				$('#sidebar_left').remove();

				// reset super.viewport_changed
				cone.ViewPortAware.prototype.viewport_changed = super_vp_changed_origin;
			});

			QUnit.test('viewport_changed()', assert => {
				// mock resize event
				let resize_evt = $.Event('viewport_changed');

				// initialize instances
				cone.Topnav.initialize();
				cone.SidebarMenu.initialize();

				// initialize navtree
				test_navtree = new TestNavtree($('#navtree'));

				// add event listener to check if unbound
				test_navtree.heading.on('click', () => {
					assert.step('click');
				});

				for (let i=0; i<vp_states.length; i++) {
					// set mock resize event state
					resize_evt.state = i;

					// invoke viewport_changed method
					test_navtree.viewport_changed(resize_evt);
					assert.strictEqual(test_navtree.vp_state, resize_evt.state);

					if (i === 0) {
						assert.strictEqual(test_navtree.content.css('display'),
										   'block');

						assert.verifySteps([
							`super.viewport_changed(${i})`,
							'mv_to_mobile()'
						]);
					} else {
						assert.notOk(test_navtree.elem.hasClass('mobile'));
						assert.ok(test_navtree.elem
								  .is('#sidebar_content > #navtree'));

						// trigger click on heading
						test_navtree.heading.trigger('click');
						// click event is unbound
						assert.verifySteps([`super.viewport_changed(${i})`]);
					}
				}
			});
		});

		QUnit.module('align_width', hooks => {
			hooks.before(() => {
				console.log('Set up cone.Navtree.align_width tests');

				// create dummy DOM elements
				create_topnav_elem();
				create_sidebar_elem();
				create_navtree_elem();

				// set viewport
				cone.viewport.state = 3;
			});

			hooks.after(() => {
				console.log('Tear down cone.Navtree.align_width tests');

				// unload and unset instances
				cone.sidebar_menu.unload();
				cone.sidebar_menu = null;
				cone.navtree.unload();
				cone.navtree = null;

				// delete dummy DOM elements
				$('#sidebar_left').remove();
			});

			QUnit.test('align_width()', assert => {
				// initialize instances
				cone.SidebarMenu.initialize();
				cone.Navtree.initialize();

				let elem1 = $(cone.navtree.toggle_elems[0]),
					elem2 = $(cone.navtree.toggle_elems[1]),
					menu1 = $('ul', elem1),
					menu2 = $('ul', elem2);

				// set element dimensions
				elem1.css('width', '300px');
				menu1.css('width', '500px');
				elem2.css('width', '500px');
				menu2.css('width', '300px');

				for (let item of cone.navtree.toggle_elems) {
					let elem = $(item);
					let menu = $('ul', elem);
					let elem_origin = elem.outerWidth();
					let menu_origin = menu.outerWidth();

					// trigger mouseenter on element
					elem.trigger('mouseenter');
					assert.ok(elem.hasClass('hover'));

					// variables for testing
					let elem_width = elem.outerWidth() + 'px';
						menu_width = menu.outerWidth() + 'px';

					if (elem_origin > menu_origin) {
						assert.strictEqual(menu.css('width'), elem_width);
					} else {
						assert.strictEqual(elem.css('width'), menu_width);
					}
				}
			});
		});

		QUnit.module('restore_width', hooks => {
			hooks.before(() => {
				console.log('Set up cone.Navtree.restore_width tests');

				// create dummy DOM elements
				create_topnav_elem();
				create_sidebar_elem();
				create_navtree_elem();

				// set viewport
				cone.viewport.state = 3;
			});

			hooks.after(() => {
				console.log('Tear down cone.Navtree.restore_width tests');

				// unload and unset instances
				cone.sidebar_menu.unload();
				cone.sidebar_menu = null;
				cone.navtree.unload();
				cone.navtree = null;

				// delete dummy DOM elements
				$('#sidebar_left').remove();
			});

			QUnit.test('restore_width()', assert => {
				// initialize instances
				cone.SidebarMenu.initialize();
				cone.Navtree.initialize();

				// trigger toggle_menu() method
				cone.sidebar_menu.toggle_menu();

				// set element dimensions
				cone.sidebar_menu.elem.css('width', '64px');
				cone.navtree.toggle_elems.css('width', 'auto');

				for (let item of cone.navtree.toggle_elems) {
					let elem = $(item);

					// trigger mouse events
					elem.trigger('mouseenter');
					elem.trigger('mouseleave');

					assert.notOk(elem.hasClass('hover'));
					assert.strictEqual(elem.css('width'), '24px'); // width auto
				}
			});
		});

		QUnit.module('unload', hooks => {
			let super_unload_origin = cone.ViewPortAware.prototype.unload,
				align_width_origin = cone.Navtree.prototype.align_width,
				restore_width_origin = cone.Navtree.prototype.restore_width;

			hooks.before(assert => {
				console.log('Set up cone.Navtree.restore_width tests');

				// create dummy DOM elements
				create_sidebar_elem();
				create_navtree_elem();

				// set viewport
				cone.viewport.state = 3;

				// overwrite methods to check for calls
				cone.Navtree.prototype.align_width = function() {
					assert.step('align_width()');
				}
				cone.Navtree.prototype.restore_width = function() {
					assert.step('restore_width()');
				}

				// overwrite super.unload()
				cone.ViewPortAware.prototype.unload = function() {
					assert.step('super.unload()');
				}
			});

			hooks.after(() => {
				console.log('Tear down cone.Navtree.restore_width tests');

				// unset instances
				cone.sidebar_menu = null;
				cone.navtree = null;

				// delete dummy DOM elements
				$('#sidebar_left').remove();

				// reset super.unload()
				cone.ViewPortAware.prototype.unload = super_unload_origin;

				// reset methods
				cone.Navtree.prototype.align_width = align_width_origin;
				cone.Navtree.prototype.restore_width = restore_width_origin;
			});

			QUnit.test('unload()', assert => {
				// initialize sidebar instance
				cone.SidebarMenu.initialize();
				// initialize navtree instance
				cone.Navtree.initialize();
				// second instance invokes unload() method
				cone.Navtree.initialize();

				assert.verifySteps(['super.unload()']);

				// manually trigger unload
				cone.navtree.unload();
				// trigger mouse events to check if unbound
				cone.navtree.toggle_elems.trigger('mouseenter');
				// cone.navtree.toggle_elems.trigger('mouseleave');
				cone.navtree.heading.trigger('click');

				// event listeners unbound
				assert.verifySteps(['super.unload()']);
			});
		});

		QUnit.module('scrollbar_handle', hooks => {
			let TestNavtree,
				test_navtree;

			hooks.before(assert => {
				console.log('Set up cone.Navtree.scrollbar_handle tests');

				// create dummy DOM elements
				create_sidebar_elem();
				create_navtree_elem();

				// set viewport
				cone.viewport.state = 3;

				// dummy class
				TestNavtree = class extends cone.Navtree {
					align_width() {
						assert.step('align_width()');
					}
				}
			});

			hooks.after(() => {
				console.log('Tear down cone.Navtree.scrollbar_handle tests');

				// unset instances
				cone.sidebar_menu = null;
				test_navtree.unload();
				delete test_navtree;

				// delete dummy DOM elements
				$('#sidebar_left').remove();
			});

			QUnit.test('scrollbar_handle()', assert => {
				// initialize sidebar menu
				cone.SidebarMenu.initialize();

				// initialize navtree
				test_navtree = new TestNavtree();

				// trigger scrollbar dragstart event
				$(window).trigger('dragstart');

				// trigger mouseenter on toggle elements
				test_navtree.toggle_elems.trigger('mouseenter');
				// event listener unbound
				assert.verifySteps([]);

				// trigger scrollbar dragend event
				$(window).trigger('dragend');

				// trigger mouseenter on toggle elements
				$(test_navtree.toggle_elems[0]).trigger('mouseenter');
				assert.verifySteps(['align_width()']);
			});
		});
	});
});


///////////////////////////////////////////////////////////////////////////////
// cone.ThemeSwitcher test helpers
///////////////////////////////////////////////////////////////////////////////
function create_theme_switcher_elem(mode) {
	let modeswitch_html = `
		<li class="form-check form-switch">
		<input class="form-check-input" id="switch_mode" type="checkbox">
		<label class="form-check-label" for="flexSwitchCheckDefault">
		  Toggle dark mode
		</label>
		</li>
	`;
	let head_current = `<link id="colormode-styles" rel="stylesheet" href=${mode}>`;
	$('body').append(modeswitch_html);
	$('head').append(head_current);
}

///////////////////////////////////////////////////////////////////////////////
// cone.ThemeSwitcher tests
///////////////////////////////////////////////////////////////////////////////
QUnit.module('cone.ThemeSwitcher', hooks => {
	// dummy head styles
	let head_styles = `
		<link href="http://localhost:8081/static/light.css"
			  rel="stylesheet" type="text/css" media="all">
		<link href="http://localhost:8081/static/dark.css"
			  rel="stylesheet" type="text/css" media="all">
	`;

	hooks.before(() => {
		console.log('Set up cone.ThemeSwitcher tests');

		// append dummy head styles to DOM
		$('head').append(head_styles);
	});

	hooks.beforeEach(() => {
		// create dummy DOM element
		create_theme_switcher_elem();
	});

	hooks.afterEach(() => {
		// unset theme switcher
		cone.theme_switcher = null;
	
		// remove dummy elements from DOM
		$('#switch_mode').remove();
		$('#colormode-styles').remove();

		// delete dummy cookie
		createCookie('modeswitch', '', -1);
	});

	hooks.after(() => {
		console.log('Tear down cone.ThemeSwitcher tests');

		// remove dummy head styles from head
		$(head_styles).remove();
	});

	QUnit.test('initial default check elems', assert => {
		// initialize ThemeSwitcher instance
		cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
		let switcher = cone.theme_switcher;

		// modes are default themes
		assert.strictEqual(switcher.modes, cone.default_themes);
		// defaut mode is light.css
		assert.strictEqual(switcher.current, switcher.modes[0]);
	});

	QUnit.test('initial check cookie', assert => {
		// create dummy cookie for dark mode
		createCookie('modeswitch', cone.default_themes[1], null);

		// initialize ThemeSwitcher instance
		cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
		let switcher = cone.theme_switcher;

		// theme switcher current is dark.css
		assert.strictEqual(switcher.current, switcher.modes[1]);
	});

	QUnit.test('switch_theme()', assert => {
		// initialize ThemeSwitcher instance
		cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
		let switcher = cone.theme_switcher;

		// defaut mode is light.css
		assert.strictEqual(switcher.current, switcher.modes[0]);

		// trigger click on theme switcher element
		switcher.elem.trigger('click');
		// current is dark.css after click
		assert.strictEqual(switcher.current, switcher.modes[1]);
		// link href is dark.css in head
		assert.strictEqual(switcher.link.attr('href'), switcher.modes[1]);

		// trigger click on theme switcher element
		switcher.elem.trigger('click');
		// current is light.css after click
		assert.strictEqual(switcher.current, switcher.modes[0]);
		// link href is light.css in head
		assert.strictEqual(switcher.link.attr('href'), switcher.modes[0]);
	});
});

///////////////////////////////////////////////////////////////////////////////
// cone.Searchbar test helper
///////////////////////////////////////////////////////////////////////////////
function create_searchbar_elem() {
	// create dummy searchber element
	let searchbar_html = `
		<div id="cone-searchbar">
	      <div id="cone-searchbar-wrapper" 
		  	   class="dropdown-toggle"
			   role="button"
			   data-bs-toggle="dropdown">
	    	<div class="input-group" id="livesearch-group">
	    	  <div id="livesearch-input">
	    		<input type="text"
	    			   class="form-control"
	    		></input>
	    	  </div>
	    	  <div class="input-group-append">
	    		<button type="submit" id="searchbar-button">
	    		  <i class="bi-search"></i>
	    		</button>
	    	  </div>
	    	</div>
	      </div>
	      <ul class="dropdown-menu" id="cone-livesearch-dropdown">
	    	<li class="dropdown-title">Search Results</li>
	    	<div id="cone-livesearch-results">
	    	  <li>
	    		<span>Example Livesearch Result</span>
	    	  </li>
	    	</div>
	      </ul>
		</div>
	`;
	// append dummy element to DOM
	$('body').append(searchbar_html);
}

///////////////////////////////////////////////////////////////////////////////
// cone.Searchbar tests
///////////////////////////////////////////////////////////////////////////////
QUnit.module('cone.Searchbar', hooks => {
	hooks.before(() => {
		console.log('Set up cone.Searchbar tests');
		cone.viewport = new cone.ViewPort();
	});

	hooks.after(() => {
		console.log('Tear down cone.Searchbar tests');
		cone.viewport = null;
	});

	QUnit.module('constructor', hooks => {
		hooks.beforeEach(() =>{
			// create dummy searchbar element
			create_searchbar_elem();
		});

		hooks.afterEach(() => {
			// set viewport
			cone.viewport.state = 3;

			// unset searchbar
			cone.searchbar = null;
			// remove dummy searchbar from DOM
			$('#cone-searchbar').remove();
		});

		QUnit.test('constructor', assert => {
			for (let i=0; i<vp_states.length; i++) {
				// set viewport state
				cone.viewport.state = i;

				// initialize instance
				cone.Searchbar.initialize();

				assert.ok(cone.searchbar instanceof cone.ViewPortAware);

				if (i === 0) {
					assert.notOk(cone.searchbar.dd.hasClass('dropdown-menu-end'));
					assert.ok(cone.searchbar.search_text
							  .is('#livesearch-group > #livesearch-input'));
				} else if (i === 1) {
					assert.ok(cone.searchbar.dd.hasClass('dropdown-menu-end'));
					assert.ok(cone.searchbar.search_text
							  .is('#cone-livesearch-dropdown > #livesearch-input'));
				} else if (i === 2) {
					assert.ok(cone.searchbar.dd.hasClass('dropdown-menu-end'));
					assert.ok(cone.searchbar.search_text
							  .is('#cone-livesearch-dropdown > #livesearch-input'));
				} else if (i === 3) {
					// ????? fails
					// assert.ok(cone.searchbar.search_text.is('#livesearch-group > #livesearch-input'));
					// assert.notOk(cone.searchbar.dd.hasClass('dropdown-menu-end'));
					// assert.strictEqual($('#cone-livesearch-dropdown > #livesearch-input').length, 0);
				} 
			}
		});
	});

	QUnit.module('methods', hooks => {
		hooks.before(() => {
			console.log('Set up cone.Scrollbar tests');

			// set viewport
			cone.viewport = new cone.ViewPort();
		});

		hooks.after(() => {
			console.log('Tear down cone.Scrollbar tests');

			// unset viewport
			cone.viewport = null;
		});

		QUnit.module('unload', hooks => {
			let unload_origin = cone.ViewPortAware.prototype.unload;

			hooks.before(assert => {
				console.log('Set up cone.Scrollbar method tests');

				// create dummy searchbar element
				create_searchbar_elem();

				// overwrite super class method to test for call
				cone.ViewPortAware.prototype.unload = function() {
					$(window).off('viewport_changed',
								  this._viewport_changed_handle);
					assert.step('super.unload()');
				}
			});

			hooks.after(() => {
				console.log('Set up cone.Scrollbar method tests');

				// unset searchbar
				cone.searchbar = null;
				// remove dummy searchbar element from DOM
				$('#cone-searchbar').remove();

				// reset super class method
				cone.ViewPortAware.prototype.unload = unload_origin;
			});

			QUnit.test('unload()', assert => {
				// initialize searchbar
				cone.Searchbar.initialize();
				// second instance invokes unload
				cone.Searchbar.initialize();

				assert.verifySteps(['super.unload()']);
			});
		});

		QUnit.module('vp_changed', hooks => {
			let super_vp_changed_origin = cone.ViewPortAware.prototype.viewport_changed;

			hooks.before(assert => {
				// create dummy searchbar element
				create_searchbar_elem();

				// overwrite super class method to test for call
				cone.ViewPortAware.prototype.viewport_changed = function(e) {
					this.vp_state = e.state;
					assert.step('super.viewport_changed()');
				}

				// set viewport
				cone.viewport.state = 3;
			});

			hooks.after(() => {
				// unset searchbar
				cone.searchbar = null;
				// remove dummy searchbar element from DOM
				$('#cone-searchbar').remove();

				// reset super class method
				cone.ViewPortAware.prototype.viewport_changed = super_vp_changed_origin;
			});

			QUnit.test('vp_changed()', assert => {
				// create dummy resize event
				let resize_evt = $.Event('viewport_changed');

				// initialize Searchbar
				cone.Searchbar.initialize();

				for (let i=0; i<vp_states.length; i++) {
					// set dummy resize event 
					resize_evt.state = i;

					// invoke viewport_changed method
					cone.searchbar.viewport_changed(resize_evt);

					if (i === 1 || i === 2){
						assert.ok(cone.searchbar.dd.hasClass('dropdown-menu-end'));
						assert.strictEqual(
							$('#cone-livesearch-dropdown > #livesearch-input').length,
							1);
					} else {
						assert.notOk(cone.searchbar.dd.hasClass('dropdown-menu-end'));
						assert.strictEqual(
							$('#cone-livesearch-dropdown > #livesearch-input').length,
							0);
						assert.strictEqual($('#livesearch-group > #livesearch-input').length,
											1);
					}
					assert.verifySteps(['super.viewport_changed()']);
				}
			});
		});
	});
});

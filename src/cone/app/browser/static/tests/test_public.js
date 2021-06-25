
const { test } = QUnit;


QUnit.begin( details => {
	console.log( `Test amount: ${details.totalTests}` );
});

QUnit.done( function( details ) {
	console.log(
	  "Total: " + details.total + " Failed: " + details.failed
	  + " Passed: " + details.passed + " Runtime: " + details.runtime
	);
});


QUnit.test.skip('jQuery fadeOut overwrite example', assert => {
	let test_elem = $(`
		<div id="test"></div>
	`);
	$('body').append(test_elem);

	// save origin
	let fade_out_origin = $.fn.fadeOut;

	// overwrite
	$.fn._fadeOut = $.fn.fadeOut;
	$.fn.fadeOut = function(){
		assert.step('fadeOut called');
		$.fn.hide.apply(this);
	};

	$('#test').fadeOut();

	assert.verifySteps(['fadeOut called']);
	assert.strictEqual($('#test').css('display'), 'none');

	// reset
	$.fn.fadeOut = fade_out_origin;
	$.fn._fadeOut = $.fn.fadeOut;
});

// viewport states for responsive tests
var vp_states = ['mobile', 'small', 'medium', 'large'];

// namespace
QUnit.test('cone namespace', assert => {
	console.log('NOW RUNNING: cone Namespace');
	// viewport
	assert.ok(cone.viewport instanceof cone.ViewPort);
	assert.strictEqual(cone.VP_MOBILE, 0, 'cone.VP_MOBILE is 0');
	assert.strictEqual(cone.VP_SMALL, 1, 'cone.VP_SMALL is 1');
	assert.strictEqual(cone.VP_MEDIUM, 2, 'cone.VP_MEDIUM is 2');
	assert.strictEqual(cone.VP_LARGE, 3, 'cone.VP_LARGE is 3');

	// theme
	assert.strictEqual(cone.theme_switcher, null, 'cone.theme_switcher is null');
	assert.deepEqual(cone.default_themes, ['/static/light.css', '/static/dark.css'], 'cone.default_themes correct');

	// layout components
	assert.strictEqual(cone.sidebar_menu, null, 'cone.sidebar_menu is null');
	assert.strictEqual(cone.main_menu_top, null, 'cone.main_menu_top is null');
	assert.strictEqual(cone.main_menu_sidebar, null, 'cone.main_menu_sidebar is null');
	assert.strictEqual(cone.navtree, null, 'cone.navtree is null');
	assert.strictEqual(cone.topnav, null, 'cone.topnav is null');

	// searchbar
	assert.strictEqual(cone.searchbar, null, 'cone.searchbar is null');
	assert.strictEqual(cone.searchbar_handler, null, 'cone.searchbar_handler is null');

	// content
	assert.strictEqual(cone.content, null, 'cone.content is null');

	console.log('COMPLETE: cone Namespace');
	console.log('-------------------------------------');
});

// toggle_arrow function
QUnit.test('Test cone.toggle_arrow', assert => {
	let up = 'bi-chevron-up',
		down = 'bi-chevron-down',
		arrow_up = $(`<i class="dropdown-arrow ${up}" />`),
		arrow_down = $(`<i class="dropdown-arrow ${down}" />`);
	cone.toggle_arrow(arrow_up);
	assert.strictEqual(arrow_up.attr('class'), `dropdown-arrow ${down}`, 'arrow class = down');
	cone.toggle_arrow(arrow_down);
	assert.strictEqual(arrow_down.attr('class'), `dropdown-arrow ${up}`, 'arrow class = up');
});

// XXXXXX cone.ViewPort XXXXXX
QUnit.module('cone.ViewPort', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.ViewPort');
		cone.viewport = new cone.ViewPort; 
	})

	hooks.after( () => {
		cone.viewport = null;
		console.log('COMPLETE: cone.ViewPort');
		console.log('-------------------------------------');
	})

	function switch_viewport(i, assert) {
		viewport.set(states[i]);
		$(window).trigger('resize');

		assert.strictEqual($(window).width(), window_widths[i], `window width ${window_widths[i]}`);
		assert.strictEqual($(window).height(), window_heights[i], `window height ${window_heights[i]}`);
		assert.strictEqual(cone.viewport.state, i, `cone.viewport.state is ${i}`);
	}

	let states = ['mobile', 'small', 'medium', 'large'],
	    window_widths = [559, 561, 1000, 1600],
	    window_heights = [600, 1024, 900, 1024];

	for( let i = 0; i < vp_states.length; i++ ) {
		QUnit.test(`vp${i}`, assert => {
			console.log(`- test: vp${i}`);
			switch_viewport(i, assert);
		})
	}
});

// XXXXXXX cone.ViewPortAware XXXXXXX
QUnit.module('cone.ViewPortAware', hooks => {

	hooks.before( () => {
		cone.viewport = new cone.ViewPort();
		console.log('NOW RUNNING: cone.ViewPortAware');
	});

	hooks.after( () => {
		cone.viewport = null;
		console.log('COMPLETE: cone.ViewPortAware');
		console.log('-------------------------------------');
	});

	QUnit.module('initial', hooks => {
		hooks.before( () => {
			console.log('- now running: initial');
		});

		hooks.after( () => {
			console.log('- done: initial');
		});
	
		hooks.beforeEach( () => {
			viewport.set('large');
			cone.viewport = new cone.ViewPort();
			test_obj = new cone.ViewPortAware();
		});

		hooks.afterEach( () => {
			cone.viewport = null;
			test_obj = null;
			delete test_obj;
		});

		for( let i = 0; i <= 3; i++ ) {
			QUnit.test(`vp${i}`, assert => {
				console.log(`-- test: vp${i}`);
				viewport.set(vp_states[i]);
				$(window).trigger('resize');
				assert.strictEqual(cone.viewport.state, i, `cone.viewport.state is ${i}`);
				assert.strictEqual(test_obj.vp_state, cone.viewport.state, 'vp_state is cone.viewport.state');
			});
		}
	});

	QUnit.module('unload()', hooks => {
		hooks.before( () => {
			console.log('- now running: unload()');
			viewport.set('large');
			cone.viewport = new cone.ViewPort();
			test_obj = new cone.ViewPortAware();
		});

		test('unload vp', assert => {
			console.log('-- test: unload vp');
			assert.strictEqual(test_obj.vp_state, cone.viewport.state, 'vp_state is cone.viewport.state');
			test_obj.unload();
			viewport.set('small');
			$(window).trigger('resize');

			assert.notStrictEqual(test_obj.vp_state, cone.viewport.state, 'vp_state not changed after unload');
		});

		hooks.after( () => {
			cone.viewport = null;
			test_obj = null;
			delete test_obj;
			console.log('- done: unload()');
		});
	});
});

// XXXXXX cone.Content XXXXXXX
QUnit.module.todo('cone.Content', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.Content');
		let content_html = `
			<div id="page-content-wrapper">
			  <div id="page-content">
			  </div>
			</div>
		`;
		$('body').append(content_html);

		cone.Content.initialize( $('body') );
	})

	hooks.after( () => {
		cone.content = null;
		$('#page-content-wrapper').remove();
		console.log('COMPLETE: cone.Content');
		console.log('-------------------------------------');
	})

	test('content', assert => {
		console.log('- test: content');
		assert.ok(true);
	})
});

// XXXXXX cone.MainMenuItem XXXXXX
QUnit.module('cone.MainMenuItem', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.MainMenuItem');
		cone.viewport = new cone.ViewPort();
	});

	hooks.after( () => {
		cone.viewport = null;
		console.log('COMPLETE: cone.MainMenuItem');
		console.log('-------------------------------------');
	});

	QUnit.module('constructor', hooks => {
		hooks.before( () => {
			console.log('- now running: constructor');
		})
		hooks.beforeEach( () => {
			create_topnav_elem();
			create_mm_top_elem();
			create_mm_items(2);
			create_empty_item();
		});
		hooks.afterEach( () => {
			$('#topnav').remove();
			$('#main-menu').remove();
			$('.cone-mainmenu-dropdown').remove();
			item1 = null;
			item2 = null;
		});

		QUnit.test('mobile', assert => {
			console.log('-- test: mobile');

			// prepare
			let mv_to_mobile_origin = cone.MainMenuItem.prototype.mv_to_mobile;
			cone.MainMenuItem.prototype.mv_to_mobile = function() {
				assert.step('mv_to_mobile()');
			}

			cone.viewport.state = 0;
			item1 = new cone.MainMenuItem( $('.node-child_1') );

			assert.verifySteps(['mv_to_mobile()']);
			cone.MainMenuItem.prototype.mv_to_mobile = mv_to_mobile_origin;
		});

		QUnit.test('desktop', assert => {
			console.log('-- test: desktop');

			cone.viewport.state = 3;
			let toggle_origin = cone.MainMenuItem.prototype.mouseenter_toggle;
			cone.MainMenuItem.prototype.mouseenter_toggle = function() {
				assert.step('mouseenter_toggle()');
			}

			item1 = new cone.MainMenuItem( $('.node-child_1') );
			item1.elem.trigger('mouseenter');
			item1.elem.trigger('mouseleave');
			
			assert.verifySteps([
				'mouseenter_toggle()',
				'mouseenter_toggle()'
			]);

			cone.MainMenuItem.prototype.mouseenter_toggle = toggle_origin;
			item1 = null;

			// switch elems
			item1 = new cone.MainMenuItem( $('.node-child_1') );
			item2 = new cone.MainMenuItem( $('.node-child_2') );
			$(item1.menu).css('display', 'none'); // done in css
			$(item2.menu).css('display', 'none'); // done in css

			item1.elem.trigger('mouseenter'); // so menu is visible
			assert.strictEqual(item1.menu.css('display'), 'block');
			item2.elem.trigger('mouseenter');
			item1.menu.trigger('mouseleave');

			assert.strictEqual(item1.menu.css('display'), 'none');
		});
	});

	QUnit.module('methods', hooks => {
		hooks.before( () => {
			console.log('- now running: methods');
		})
		hooks.beforeEach( () => {
			let layout = $('<div id="layout"></div>');
			$('body').append(layout);
			create_topnav_elem();
			create_mm_top_elem();
			create_mm_items(2);
		});
		hooks.afterEach( () => {
			$('#topnav').remove();
			$('#main-menu').remove();
			$('.cone-mainmenu-dropdown').remove();
			item1 = null;
			item2 = null;
			cone.viewport.state = 3;
		});
		hooks.after( () => {
			$('#layout').remove();
		});

		QUnit.test('render_dd()', assert => {
			console.log('-- test: render_dd()');
			item1 = new cone.MainMenuItem( $('.node-child_1') );
			assert.strictEqual(item1.children.length, 3);
			// menu appended to layout
			assert.strictEqual( $('#layout > .cone-mainmenu-dropdown' ).length, 1);
			// items appended to menu
			assert.strictEqual( $('.mainmenu-dropdown > li' ).length, 3);
		});

		QUnit.test('mv_to_mobile()', assert => {
			console.log('-- test: mv_to_mobile()');

			// prepare
			let toggle_origin = cone.MainMenuItem.prototype.mouseenter_toggle;
			cone.MainMenuItem.prototype.mouseenter_toggle = function() {
				assert.step('mouseenter_toggle()');
			}

			// no sidebar
			item1 = new cone.MainMenuItem( $('.node-child_1') );
			item1.menu.on('mouseenter mouseleave', function() {
				assert.step('mouseenter/leave');
			});
			item1.mv_to_mobile();
			assert.strictEqual( $(item1.menu, item1.elem).length, 1 );
			item1.elem.trigger('mouseenter');
			item1.menu.trigger('mouseleave');
			assert.strictEqual(item1.menu.css('left'), '0px');

			item1.arrow.trigger('click');
			assert.strictEqual(item1.menu.css('display'), 'block');
			assert.ok(item1.arrow.hasClass('bi bi-chevron-up'));

			$('.cone-mainmenu-dropdown').remove();
			item1 = null;

			// with sidebar
			cone.main_menu_sidebar = true;
			item1 = new cone.MainMenuItem( $('.node-child_1') );
			item1.mv_to_mobile();
			assert.strictEqual( $('#layout > .cone-mainmenu-dropdown').length, 1);
			assert.strictEqual( $('.node-child_1 > .cone-mainmenu-dropdown').length, 0);

			cone.MainMenuItem.prototype.mouseenter_toggle = toggle_origin;
			cone.main_menu_sidebar = null;
		});

		QUnit.test('mv_to_top()', assert => {
			console.log('-- test: mv_to_top()');

			// prepare
			let toggle_origin = cone.MainMenuItem.prototype.mouseenter_toggle;
			cone.MainMenuItem.prototype.mouseenter_toggle = function() {
				assert.step('mouseenter_toggle()');
			}

			cone.viewport.state = 0;
			item1 = new cone.MainMenuItem( $('.node-child_1') );
			assert.strictEqual( $(item1.menu, item1.elem).length, 1 );
			assert.strictEqual( $('#layout > .cone-mainmenu-dropdown').length, 0);

			item1.arrow.on('click', () => {
				assert.step('click');
			})

			item1.mv_to_top();
			assert.strictEqual( $('#layout > .cone-mainmenu-dropdown').length, 1);
			item1.arrow.trigger('click');
			item1.elem.trigger('mouseenter');
			item1.elem.trigger('mouseleave');

			assert.verifySteps([
				'mouseenter_toggle()',
				'mouseenter_toggle()'
			]);

			
			item1.menu.css('display', 'block');
			item1.menu.trigger('mouseleave');
			assert.strictEqual(item1.menu.css('display'), 'none');
			cone.MainMenuItem.prototype.mouseenter_toggle = toggle_origin;
		});

		QUnit.test('mouseenter_toggle()', assert => {
			console.log('-- test: mouseenter_toggle()');

			$('#layout').css({
				'width': '100vw',
				'height': '100vh'
			});
			$('#topnav').detach().appendTo('#layout');
			item1 = new cone.MainMenuItem( $('.node-child_1') );
			item1.menu.css('display', 'none'); // css

			$('.cone-mainmenu-dropdown').css('position', 'absolute');

			// mouseenter
			item1.elem.trigger('mouseenter');
			assert.strictEqual(item1.menu.offset().left, item1.elem.offset().left);
			assert.strictEqual(item1.menu.css('display'), 'block');

			// mouseleave
			item1.elem.trigger('mouseleave');
			assert.strictEqual(item1.menu.css('display'), 'none');
		});
	});
});

// XXXXXX cone.MainMenuTop XXXXXX
QUnit.module('cone.MainMenuTop', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.MainMenuTop');
		cone.viewport = new cone.ViewPort();
	});

	hooks.after( () => {
		cone.viewport = null;
		console.log('COMPLETE: cone.MainMenuTop');
		console.log('-------------------------------------');
	});

	QUnit.module('constructor', hooks => {
		hooks.before( () => {
			console.log('- now running: constructor');
		})
		hooks.beforeEach( () => {
			create_topnav_elem();
			create_mm_top_elem();
		});
		hooks.afterEach( () => {
			cone.viewport.state = 3;
			cone.topnav = null;
			cone.main_menu_top = null;
			$('#topnav').remove();
		});

		QUnit.test('unload() call', assert => {
			console.log('-- test: unload() call');
			cone.Topnav.initialize();
			cone.MainMenuTop.initialize();
			// save original function
			let unload_origin = cone.MainMenuTop.prototype.unload;
			// overwrite original function
			cone.MainMenuTop.prototype.unload = function() {
				assert.step( "unload() happened" );
			}
			cone.MainMenuTop.initialize();
			assert.verifySteps(["unload() happened"]);

			// reset original function
			cone.MainMenuTop.prototype.unload = unload_origin;
		});

		QUnit.test('elems', assert => {
			console.log('-- test: elems');
			cone.Topnav.initialize();
			cone.MainMenuTop.initialize();
			assert.ok(cone.main_menu_top instanceof cone.ViewPortAware);
		});

		QUnit.test('desktop', assert => {
			console.log('-- test: desktop');
			cone.Topnav.initialize();
			cone.MainMenuTop.initialize();
			assert.strictEqual(cone.topnav.logo.css('margin-right'), '32px');
		});

		QUnit.test('mobile', assert => {
			console.log('-- test: mobile');
			cone.viewport.state = 0;
			cone.Topnav.initialize();
			cone.MainMenuTop.initialize();
			// margin right auto
			// assert.strictEqual(cone.topnav.logo.css('margin-right'), '2rem');
			cone.main_menu_top = null;

			// with mm sidebar
			cone.main_menu_sidebar = true;
			cone.MainMenuTop.initialize();
			assert.strictEqual(cone.main_menu_top.elem.css('display'), 'none');
			cone.main_menu_sidebar = null;
		});

		QUnit.test('MainMenuItems', assert => {
			console.log('-- test: mainmenu items');

			// prepare
			let elem_count = 2;
			create_mm_items(elem_count);

			cone.Topnav.initialize();
			cone.MainMenuTop.initialize();

			assert.strictEqual(cone.main_menu_top.main_menu_items.length, elem_count);
			$('.mainmenu-item').remove();
		});
	});

	QUnit.module('methods', hooks => {
		hooks.before( () => {
			console.log('- now running: methods');
		})
		hooks.beforeEach( () => {
			create_topnav_elem();
			create_mm_top_elem();
		});
		hooks.afterEach( () => {
			cone.viewport.state = 3;
			cone.topnav = null;
			cone.main_menu_top = null;
			$('#topnav').remove();

			if($('.mainmenu-item').length > 0) {
				$('.mainmenu-item').remove();
			}
		});

		QUnit.test('unload()', assert => {
			console.log('-- test: unload()');
			cone.Topnav.initialize();
			cone.MainMenuTop.initialize();
			let unload_origin = cone.ViewPortAware.prototype.unload;
			cone.ViewPortAware.prototype.unload = function() {
				assert.step('super.unload()');
			}
			cone.main_menu_top.unload();
			assert.verifySteps(["super.unload()"]);
			cone.ViewPortAware.prototype.unload = unload_origin;
		});

		QUnit.test.skip('handle_scrollbar()', assert => {
			// WIP
		});

		QUnit.test('viewport_changed()', assert => {
			console.log('-- test: viewport_changed()');
			
			// prepare
			let resize_evt = $.Event('viewport_changed');
			resize_evt.state = 0;
			
			let super_vp_changed_origin = cone.ViewPortAware.prototype.viewport_changed,
				mv_to_mobile_origin = cone.MainMenuItem.prototype.mv_to_mobile,
				mv_to_top_origin = cone.MainMenuItem.prototype.mv_to_top;
			
			cone.ViewPortAware.prototype.viewport_changed = function(e) {
				this.vp_state = e.state;
				assert.step( "super.viewport_changed()" );
			}
			cone.MainMenuItem.prototype.mv_to_mobile = function() {
				assert.step('mv_to_mobile()');
			}
			cone.MainMenuItem.prototype.mv_to_top = function() {
				assert.step('mv_to_top()');
			}
			

			cone.Topnav.initialize();
			cone.MainMenuTop.initialize();

			// mobile
			cone.main_menu_top.viewport_changed(resize_evt);
			// margin right auto

			// mobile with sidebar
			cone.main_menu_sidebar = true;
			cone.main_menu_top.viewport_changed(resize_evt);
			assert.strictEqual(cone.main_menu_top.elem.css('display'), 'none');
			cone.main_menu_sidebar = null;

			// desktop
			resize_evt.state = 3;
			cone.main_menu_top.viewport_changed(resize_evt);
			assert.strictEqual(cone.topnav.logo.css('margin-right'), '32px');

			// dektop with sidebar
			cone.main_menu_sidebar = true;
			cone.main_menu_top.viewport_changed(resize_evt);
			assert.strictEqual(cone.main_menu_top.elem.css('display'), 'flex');
			cone.main_menu_sidebar = null;
			cone.main_menu_top = null;

			// main menu items
			create_mm_items(1);
			create_empty_item();
			cone.MainMenuTop.initialize();
			resize_evt.state = 0;
			cone.main_menu_top.viewport_changed(resize_evt);
			resize_evt.state = 3;
			cone.main_menu_top.viewport_changed(resize_evt);

			assert.verifySteps([
				"super.viewport_changed()",
				"super.viewport_changed()",
				"super.viewport_changed()",
				"super.viewport_changed()",
				"super.viewport_changed()",
				"mv_to_mobile()",
				"super.viewport_changed()",
				"mv_to_top()"
			]);

			// reset
			cone.ViewPortAware.prototype.viewport_changed = super_vp_changed_origin;
			cone.MainMenuItem.prototype.mv_to_mobile = mv_to_mobile_origin;
			cone.MainMenuItem.prototype.mv_to_top = mv_to_top_origin;
		});
	});
});

// XXXXXX cone.MainMenuSidebar XXXXXX
QUnit.module('cone.MainMenuSidebar', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.MainMenuSidebar');
		cone.viewport = new cone.ViewPort();
	});

	hooks.after( () => {
		cone.viewport = null;
		console.log('COMPLETE: cone.MainMenuSidebar');
		console.log('-------------------------------------');
	});

	QUnit.module('constructor', hooks => {
		hooks.before( () => {
			console.log('before');
			create_elems();
		});

		QUnit.test('unload() call', assert => {
			// save original function
			let unload_origin = cone.MainMenuSidebar.prototype.unload;
			// overwrite original function
			cone.MainMenuSidebar.prototype.unload = function() {
				assert.step( "unload() happened" );
			}
			cone.MainMenuSidebar.initialize();
			assert.verifySteps(["unload() happened"]);

			// reset original function
			cone.MainMenuSidebar.prototype.unload = unload_origin;
		});

		QUnit.test('elements', assert => {
			console.log('- test: elements');
			let mm_sb = cone.main_menu_sidebar;
			assert.ok(mm_sb instanceof cone.ViewPortAware);
			assert.strictEqual(mm_sb.elem.attr('id'), 'mainmenu_sidebar');
		});

		QUnit.test('initial_cookie()', assert => {
			console.log('- test: initial_cookie()');
			let mm_sb = cone.main_menu_sidebar;
			assert.notOk(readCookie('sidebar menus'));

			let test_display_data = [];
			for(let elem of mm_sb.menus) {
				test_display_data.push('none');
			}
			assert.deepEqual(mm_sb.display_data, test_display_data);
		});

		QUnit.test('initial_cookie() with cookie', assert => {
			console.log('- test: initial_cookie() with cookie');

			let mm_sb = cone.main_menu_sidebar;
			let test_display_data = [];
			for(let elem of mm_sb.menus) {
				test_display_data.push('block');
			}
			createCookie('sidebar menus', test_display_data, null);
			assert.ok(readCookie('sidebar menus'));
			mm_sb.initial_cookie();
			assert.deepEqual(mm_sb.display_data, test_display_data);

			// cleanup
			createCookie('sidebar menus', '', -1);
		});

		QUnit.test('mv_to_mobile call', assert => {
			console.log('- test: mv_to_mobile called');
			cone.sidebar_menu = null;
			cone.main_menu_sidebar = null;

			// save original function
			let mv_to_mobile_origin = cone.MainMenuSidebar.prototype.mv_to_mobile;
			// overwrite original function
			cone.MainMenuSidebar.prototype.mv_to_mobile = function() {
				assert.step( "mv_to_mobile() happened" );
			}
			
			viewport.set('mobile');
			cone.viewport = new cone.ViewPort();
			
			create_topnav_elem();
			cone.Topnav.initialize();
			cone.SidebarMenu.initialize();
			cone.MainMenuSidebar.initialize();
			
			$(window).off('viewport_changed');
			assert.verifySteps(["mv_to_mobile() happened"]);

			// reset original function
			cone.MainMenuSidebar.prototype.mv_to_mobile = mv_to_mobile_origin;
		});

		hooks.after( () => {
			cone.sidebar_menu = null;
			cone.main_menu_sidebar = null;
			$('#sidebar_left').remove();
			// cone.viewport = null;
			console.log('after')
		});
	});

	QUnit.module('methods', hooks => {
		hooks.before( () => {
			console.log('- now running: methods');
		});
		hooks.beforeEach( () => {
			viewport.set('large');
			$(window).trigger('resize');
			create_elems();
		});
		hooks.afterEach( () => {
			cone.sidebar_menu = null;
			cone.main_menu_sidebar = null;
			$('#sidebar_left').remove();
			if(cone.topnav) {
				cone.topnav = null;
				$('#topnav').remove();
			}
		});
		hooks.after( () => {
			console.log('- done: methods');
		});

		QUnit.test('viewport_changed()', assert => {
			console.log('-- test: viewport_changed()');

			create_topnav_elem();
			cone.Topnav.initialize();
			let mm_sb = cone.main_menu_sidebar;
			let resize_evt = $.Event('viewport_changed');
			resize_evt.state = 0;

			// save original functions
			let super_vp_changed_origin = cone.ViewPortAware.prototype.viewport_changed,
				mv_to_mobile_origin = mm_sb.mv_to_mobile,
				mv_to_sidebar_origin = mm_sb.mv_to_sidebar
			;
			// overwrite original functions
			cone.ViewPortAware.prototype.viewport_changed = function(e) {
				this.vp_state = e.state;
				assert.step( "super.viewport_changed() happened" );
			}
			mm_sb.mv_to_mobile = function() {
				assert.step( "mv_to_mobile() happened" );
			}
			mm_sb.mv_to_sidebar = function() {
				assert.step( "mv_to_sidebar() happened" );
			}

			mm_sb.viewport_changed(resize_evt);
			assert.strictEqual(mm_sb.vp_state, resize_evt.state);

			resize_evt.state = 2;
			mm_sb.viewport_changed(resize_evt);
			assert.strictEqual(mm_sb.vp_state, resize_evt.state);

			assert.verifySteps([
				"super.viewport_changed() happened", 
				"mv_to_mobile() happened",
				"super.viewport_changed() happened",
				"mv_to_sidebar() happened"
			]);

			// reset original functions
			cone.ViewPortAware.prototype.viewport_changed = super_vp_changed_origin;
			mm_sb.mv_to_mobile = mv_to_mobile_origin;
			mm_sb.mv_to_sidebar = mv_to_sidebar_origin;
		});

		QUnit.test('mv_to_mobile()', assert => {
			console.log('-- test: mv_to_mobile()');
			
			let mm_sb = cone.main_menu_sidebar;
			create_topnav_elem();
			cone.Topnav.initialize();

			assert.strictEqual( $('#sidebar_content > #mainmenu_sidebar').length, 1 );
			mm_sb.mv_to_mobile();

			assert.strictEqual( $('#sidebar_content > #mainmenu_sidebar').length, 0 );
			assert.strictEqual( $('#topnav-content > #mainmenu_sidebar').length, 1 );
			assert.ok(mm_sb.elem.hasClass('mobile'));
		});

		QUnit.test('mv_to_sidebar()', assert => {
			console.log('-- test: mv_to_sidebar()');
			
			let mm_sb = cone.main_menu_sidebar;
			create_topnav_elem();
			cone.Topnav.initialize();

			mm_sb.mv_to_mobile();
			assert.strictEqual( $('#sidebar_content > #mainmenu_sidebar').length, 0 );
			mm_sb.mv_to_sidebar();

			assert.strictEqual( $('#sidebar_content > #mainmenu_sidebar').length, 1 );
			assert.strictEqual( $('#topnav-content > #mainmenu_sidebar').length, 0 );
			assert.notOk(mm_sb.elem.hasClass('mobile'));
		});

		QUnit.test('collapse()', assert => {
			console.log('-- test: collapse()');

			cone.main_menu_sidebar.arrows.on('click', () => {
				throw new Error( "click happened" );
			});

			let mm_sb = cone.main_menu_sidebar;
			mm_sb.collapse();
			assert.ok( $('ul', mm_sb.items).is(':hidden') );
			mm_sb.arrows.trigger('click');

			for(let item of mm_sb.items) {
                let elem = $(item);
                let menu = $('ul', elem);

				if( menu.length > 0 ){

					function test_width(elem_width, menu_width) {
						elem.css('width', elem_width);
						menu.css('width', menu_width);
						elem.trigger('mouseenter');
						assert.ok(elem.hasClass('hover'));

						// assert.strictEqual(elem.outerWidth(), menu.outerWidth());
						assert.ok(menu.is(':visible'));

						elem.trigger('mouseleave');
						assert.ok(menu.is(':hidden'));
						assert.notOk(elem.hasClass('hover'));
					}

					test_width(300, 400);
					test_width(400, 300);

					$(window).trigger('dragstart');
					elem.trigger('mouseenter');
					assert.notOk(menu.is(':visible'));

					$(window).trigger('dragend');
					elem.trigger('mouseenter');
					assert.ok(menu.is(':visible'));
				}
            }
		});

		QUnit.test('expand()', assert => {
			console.log('-- test: expand()');
			let mm_sb = cone.main_menu_sidebar;
			mm_sb.collapse();

			// mock expanded menu
			$('.node-child_3').trigger('mouseenter');
			$('.node-child_3').removeClass('hover');

			mm_sb.display_data = [];
			for(let i = 0; i < mm_sb.menus.length; i++) {
				let data = $('ul', mm_sb.menus[i]).css('display');
				mm_sb.display_data.push(data);
			}

			mm_sb.items.on('mouseenter mouseleave', () => {
				throw new Error( "mouseenter/mouseleave happened" );
			})
			mm_sb.expand();
			mm_sb.items.trigger('mouseenter').trigger('mouseleave');

			for(let i = 0; i < mm_sb.menus.length; i++) {
				let elem = mm_sb.menus[i],
					arrow = $('i.dropdown-arrow', elem),
					menu = $('ul.cone-mainmenu-dropdown-sb', elem)
				;

				assert.strictEqual(menu.css('display'), mm_sb.display_data[i]);
	
				if( menu.css('display') === 'none' ){
					assert.notOk(arrow.hasClass('bi-chevron-up'));
					assert.ok(arrow.hasClass('bi-chevron-down'));
					arrow.trigger('click');
					assert.strictEqual(menu.css('display'), 'block');
					assert.strictEqual(mm_sb.display_data[i], 'block');
					assert.notOk(arrow.hasClass('bi-chevron-down'));
					assert.ok(arrow.hasClass('bi-chevron-up'));
				} else if( menu.css('display') === 'block' ){
					assert.ok(arrow.hasClass('bi-chevron-up'));
					assert.notOk(arrow.hasClass('bi-chevron-down'));

					// save origin
					let slide_toggle_origin = $.fn.slideToggle;
					
					// overwrite
					$.fn._slideToggle = $.fn.slideToggle;
					$.fn.slideToggle = function(){
						assert.step('slideToggle called');
						$.fn.hide.apply(this);
					};
					
					arrow.trigger('click');
					assert.strictEqual(menu.css('display'), 'none');
					
					assert.notOk(arrow.hasClass('bi-chevron-up'));
					assert.ok(arrow.hasClass('bi-chevron-down'));
					assert.strictEqual(mm_sb.display_data[i], 'none');
					
					assert.verifySteps(['slideToggle called']);

					// reset
					$.fn.slideToggle = slide_toggle_origin;
					$.fn._slideToggle = $.fn.slideToggle;
				}
				assert.ok(readCookie('sidebar menus'));
			}
		});

		QUnit.test('expand()', assert => {
			console.log('-- test: expand()');

			let mm_sb = cone.main_menu_sidebar;
			mm_sb.collapse();

			// mock expanded menu
			$('.node-child_3').trigger('mouseenter');
			$('.node-child_3').removeClass('hover');

			mm_sb.display_data = [];
			for(let i = 0; i < mm_sb.menus.length; i++) {
				let data = $('ul', mm_sb.menus[i]).css('display');
				mm_sb.display_data.push(data);
			}

			mm_sb.items.on('mouseenter mouseleave', () => {
				throw new Error( "mouseenter/mouseleave happened" );
			})
			mm_sb.expand();
			mm_sb.items.trigger('mouseenter').trigger('mouseleave');

			for(let i = 0; i < mm_sb.menus.length; i++) {
				let elem = mm_sb.menus[i],
					arrow = $('i.dropdown-arrow', elem),
					menu = $('ul.cone-mainmenu-dropdown-sb', elem)
				;

				assert.strictEqual(menu.css('display'), mm_sb.display_data[i]);
	
				if( menu.css('display') === 'none' ){
					assert.notOk(arrow.hasClass('bi-chevron-up'));
					assert.ok(arrow.hasClass('bi-chevron-down'));
					arrow.trigger('click');
					assert.strictEqual(menu.css('display'), 'block');
					assert.strictEqual(mm_sb.display_data[i], 'block');
					assert.notOk(arrow.hasClass('bi-chevron-down'));
					assert.ok(arrow.hasClass('bi-chevron-up'));
				} else if( menu.css('display') === 'block' ){
					assert.ok(arrow.hasClass('bi-chevron-up'));
					assert.notOk(arrow.hasClass('bi-chevron-down'));

					// save origin
					let slide_toggle_origin = $.fn.slideToggle;
					
					// overwrite
					$.fn._slideToggle = $.fn.slideToggle;
					$.fn.slideToggle = function(){
						assert.step('slideToggle called');
						$.fn.hide.apply(this);
					};
					
					arrow.trigger('click');
					assert.strictEqual(menu.css('display'), 'none');
					
					assert.notOk(arrow.hasClass('bi-chevron-up'));
					assert.ok(arrow.hasClass('bi-chevron-down'));
					assert.strictEqual(mm_sb.display_data[i], 'none');
					
					assert.verifySteps(['slideToggle called']);

					// reset
					$.fn.slideToggle = slide_toggle_origin;
					$.fn._slideToggle = $.fn.slideToggle;
				}
				assert.ok(readCookie('sidebar menus'));
			}
		});

		QUnit.test('unload()', assert => {
			console.log('-- test: unload()');
	
			// save original function
			let super_unload_origin = cone.ViewPortAware.prototype.unload;
			// overwrite original function
			cone.ViewPortAware.prototype.unload = function() {
				assert.step( "super.unload() happened" );
			}
			cone.main_menu_sidebar.items.on('mouseenter mouseleave', () => {
				throw new Error( "mouseenter/mouseleave happened" );
			});
			cone.main_menu_sidebar.arrows.on('click', () => {
				throw new Error( "click happened" );
			});
	
			cone.main_menu_sidebar.unload();
			cone.main_menu_sidebar.items.trigger('mouseenter').trigger('mouseleave');
			cone.main_menu_sidebar.arrows.trigger('click');
	
			assert.verifySteps(["super.unload() happened"]);
	
			// reset original function
			cone.ViewPortAware.prototype.unload = super_unload_origin;
		});
	});

	//////////////////////////////////////////

	function create_elems() {
		create_sidebar_elem();
		create_mm_sidebar_elem();
		cone.SidebarMenu.initialize();
		cone.MainMenuSidebar.initialize();
	}

});

/* XXXXXXX cone.Topnav XXXXXXX */
QUnit.module('cone.Topnav', hooks => {
	hooks.before ( () => {
		console.log('NOW RUNNING: cone.Topnav');
		cone.viewport = new cone.ViewPort();
	})
	hooks.after( () => {
		cone.topnav = null;
		cone.viewport = null;
		$('#topnav').remove();
		console.log('COMPLETE: cone.Topnav');
		console.log('-------------------------------------');
	})

	QUnit.module('constructor', hooks => {
		hooks.beforeEach( () => {
			create_topnav_elem();
		});
		hooks.afterEach( () => {
			cone.topnav = null;
			$('#topnav').remove();
		});

		QUnit.test('unload() called', assert => {
			console.log('-- test: unload() called');
			cone.Topnav.initialize();
			let unload_origin = cone.Topnav.prototype.unload;
			cone.Topnav.prototype.unload = function() {
				assert.step('unload() called');
			}
			cone.Topnav.initialize();
			assert.verifySteps(["unload() called"]);
			cone.Topnav.prototype.unload = unload_origin;
		});

		QUnit.test('vp mobile', assert => {
			console.log('-- test: vp mobile');
			cone.viewport.state = 0;

			let tb_dropdown_elem = $(`
				<div id="toolbar-top">
					<li class="dropdown">
					</li>
				</div>
			`);
			$('#topnav-content').append(tb_dropdown_elem);

			cone.Topnav.initialize();
			assert.ok(cone.topnav instanceof cone.ViewPortAware, 'cone.topnav instance of ViewPortAware');
			let topnav = cone.topnav;
			assert.ok(topnav.content.is(':hidden'));
			assert.ok(topnav.elem.hasClass('mobile'));

			cone.topnav.content.show();
			cone.topnav.tb_dropdowns.trigger('show.bs.dropdown');
			assert.strictEqual(cone.topnav.content.css('display'), 'none');

			$('#toolbar-top').remove();
		});

		QUnit.test('pt_handle() called', assert => {
			console.log('-- test: pt_handle() called');
			let pt_handle_origin = cone.Topnav.prototype.pt_handle;
			cone.Topnav.prototype.pt_handle = function() {
				assert.step('pt_handle() called');
			}
			cone.Topnav.initialize();
			assert.verifySteps(['pt_handle() called']);
			cone.Topnav.prototype.pt_handle = pt_handle_origin;
		});
	});

	QUnit.module('methods', hooks => {
		hooks.beforeEach( () => {
			create_topnav_elem();
		});
		hooks.afterEach( () => {
			cone.topnav = null;
			$('#topnav').remove();
			cone.viewport.state = 3;
		});

		QUnit.test('unload()', assert => {
			console.log('-- test: unload()');
			let super_unload_origin = cone.ViewPortAware.prototype.unload,
				toggle_menu_origin = cone.Topnav.prototype.toggle_menu;

			cone.ViewPortAware.prototype.unload = function() {
				assert.step('super.unload()');
			}
			cone.Topnav.prototype.toggle_menu = function() {
				assert.step('toggle_menu()');
			}

			cone.Topnav.initialize();
			cone.topnav.unload();
			cone.topnav.toggle_button.trigger('click');
			
			assert.verifySteps(['super.unload()']);

			cone.ViewPortAware.prototype.unload = super_unload_origin;
			cone.Topnav.prototype.toggle_menu = toggle_menu_origin;
		});

		QUnit.test('toggle_menu()', assert => {
			console.log('-- test: toggle_menu()');
			cone.viewport.state = 0;
			cone.Topnav.initialize();
			topnav_style_to_mobile();
			assert.strictEqual(cone.topnav.content.css('display'), 'none');
			cone.topnav.toggle_button.trigger('click');
			assert.strictEqual(cone.topnav.content.css('display'), 'flex');

			// save origin
			let slide_toggle_origin = $.fn.slideToggle;
					
			// overwrite
			$.fn._slideToggle = $.fn.slideToggle;
			$.fn.slideToggle = function(){
				assert.step('slideToggle called');
				$.fn.hide.apply(this);
			};
			cone.topnav.toggle_button.trigger('click');

			assert.verifySteps(['slideToggle called']);
			assert.strictEqual(cone.topnav.content.css('display'), 'none');
			
			// reset
			$.fn.slideToggle = slide_toggle_origin;
			$.fn._slideToggle = $.fn.slideToggle;
		});

		QUnit.test('viewport_changed()', assert => {
			console.log('-- test: viewport_changed()');

			let tb_dropdown_elem = $(`
				<div id="toolbar-top">
					<li class="dropdown">
					</li>
				</div>
			`);
			$('#topnav-content').append(tb_dropdown_elem);

			cone.Topnav.initialize();
			let resize_evt = $.Event('viewport_changed');
			resize_evt.state = 0;

			let super_vp_changed_origin = cone.ViewPortAware.prototype.viewport_changed;
			cone.ViewPortAware.prototype.viewport_changed = function(e) {
				this.vp_state = e.state;
				assert.step( "super.viewport_changed() happened" );
			}

			// mobile
			cone.topnav.viewport_changed(resize_evt);
			topnav_style_to_mobile();
			assert.strictEqual(cone.topnav.vp_state, resize_evt.state);
			assert.strictEqual(cone.topnav.content.css('display'), 'none');
			assert.ok(cone.topnav.elem.hasClass('mobile'));
			cone.topnav.content.show();
			cone.topnav.tb_dropdowns.trigger('show.bs.dropdown');
			assert.strictEqual(cone.topnav.content.css('display'), 'none');

			//desktop
			cone.topnav.tb_dropdowns.on('click', () => {
				assert.step('click happened');
			});
			resize_evt.state = 3;
			cone.topnav.viewport_changed(resize_evt);
			assert.strictEqual(cone.topnav.content.css('display'), 'block');
			assert.notOk(cone.topnav.elem.hasClass('mobile'));
			cone.topnav.tb_dropdowns.trigger('click');
			
			assert.verifySteps([
				"super.viewport_changed() happened",
				"super.viewport_changed() happened"
			]);

			// reset
			cone.ViewPortAware.prototype.viewport_changed = super_vp_changed_origin;
			$('#toolbar-top').remove();
		});

		QUnit.test('pt_handle()', assert => {
			console.log('-- test: pt_handle()');

			let tb_dropdown_elem = $(`
				<div id="toolbar-top">
					<li class="dropdown">
					</li>
				</div>
			`);
			let personaltools = $(`
				<div id="personaltools">
					<div id="user">
					</div>
				</div>
			`);
			$('#topnav-content').append(tb_dropdown_elem);
			$('#topnav-content').append(personaltools);

			cone.viewport.state = 0;
			cone.Topnav.initialize();

			cone.topnav.pt.trigger('show.bs.dropdown');
			assert.strictEqual(cone.topnav.user.css('display'), 'block');


			// save origin
			let slide_up_origin = $.fn.slideUp;
					
			// overwrite
			$.fn._slideUp = $.fn.slideUp;
			$.fn.slideUp = function(){
				assert.step('slideUp called');
				$.fn.hide.apply(this);
			};

			// test
			cone.topnav.pt.trigger('hide.bs.dropdown');
			assert.strictEqual(cone.topnav.user.css('display'), 'none');
			assert.verifySteps(['slideUp called']);

			// reset
			$.fn.slideUp = slide_up_origin;
			$.fn._slideUp = $.fn.slideUp;

			cone.topnav = null;
			cone.viewport.state = 3;
			cone.Topnav.initialize();

			cone.topnav.pt.trigger('show.bs.dropdown');
			assert.strictEqual(cone.topnav.user.css('display'), 'block');

			cone.topnav.pt.trigger('hide.bs.dropdown');
			assert.strictEqual(cone.topnav.user.css('display'), 'none');

			$('#toolbar-top').remove();
		});
	});
});

// XXXXXX cone.SidebarMenu XXXXXX
QUnit.module('cone.SidebarMenu', hooks => {
	hooks.before( function() {
		console.log('NOW RUNNING: cone.SidebarMenu');
		cone.viewport = new cone.ViewPort();
	});

	hooks.after( () => {
		cone.viewport = null;
		console.log('COMPLETE: cone.SidebarMenu')
		console.log('-------------------------------------');
	});

	QUnit.module('constructor', hooks => {
		hooks.before( () => {
			console.log('- now running: constructor');
		})
		hooks.beforeEach( () => {
			create_sidebar_elem();
		});
		hooks.afterEach( () => {
			cone.sidebar_menu = null;
			$('#sidebar_left').remove();
		});

		QUnit.test('unload() call', assert => {
			console.log('-- test: unload() call');
			cone.SidebarMenu.initialize();
			// save original function
			let unload_origin = cone.SidebarMenu.prototype.unload;
			// overwrite original function
			cone.SidebarMenu.prototype.unload = function() {
				assert.step( "unload() happened" );
			}
			cone.SidebarMenu.initialize();
			assert.verifySteps(["unload() happened"]);

			// reset original function
			cone.SidebarMenu.prototype.unload = unload_origin;
		});

		QUnit.test('elems', assert => {
			console.log('-- test: elems');
			cone.SidebarMenu.initialize();
			let sidebar = cone.sidebar_menu;
			assert.ok( sidebar instanceof cone.ViewPortAware);
			assert.ok(sidebar.content);
		});

		QUnit.test('initial_load() call', assert => {
			console.log('-- test: initial_load() call');
			let initial_load_origin = cone.SidebarMenu.prototype.initial_load;
			cone.SidebarMenu.prototype.initial_load = function() {
				assert.step('initial_load()');
			}
			cone.SidebarMenu.initialize();
			assert.verifySteps(['initial_load()']);
			cone.SidebarMenu.prototype.initial_load = initial_load_origin;
		});
	});

	QUnit.module('methods', hooks =>{
		hooks.beforeEach( () => {
			create_sidebar_elem();
		});
		hooks.afterEach( () => {
			$('#sidebar_left').remove();
			cone.sidebar_menu = null;
		});

		QUnit.test('unload()', assert => {
			console.log('-- test: unload()');

			let super_unload_origin = cone.ViewPortAware.prototype.unload,
				toggle_menu_origin = cone.SidebarMenu.prototype.toggle_menu,
				toggle_lock_origin = cone.SidebarMenu.prototype.toggle_lock;

			cone.ViewPortAware.prototype.unload = function() {
				assert.step('super.unload()');
			}
			cone.SidebarMenu.prototype.toggle_menu = function() {
				assert.step('toggle_menu()');
			}
			cone.SidebarMenu.prototype.toggle_lock = function() {
				assert.step('toggle_lock()');
			}

			cone.SidebarMenu.initialize();

			cone.sidebar_menu.unload();
			cone.sidebar_menu.toggle_btn.trigger('click');
			cone.sidebar_menu.lock_switch.trigger('click');

			assert.verifySteps(['super.unload()']);
	
			// reset original functions
			cone.ViewPortAware.prototype.unload = super_unload_origin;
			cone.SidebarMenu.prototype.toggle_menu = toggle_menu_origin;
			cone.SidebarMenu.prototype.toggle_lock = toggle_lock_origin;
		});

		QUnit.test('initial_load()', assert => {
			console.log('-- test: initial_load()');

			// prepare
			let assign_state_origin = cone.SidebarMenu.prototype.assign_state,
				toggle_menu_origin = cone.SidebarMenu.prototype.toggle_menu;

			cone.SidebarMenu.prototype.assign_state = function() {
				assert.step('assign_state()');
			}
			cone.SidebarMenu.prototype.toggle_menu = function() {
				assert.step('toggle_menu()');
			}

			// mobile
			cone.viewport.state = 0;
			cone.SidebarMenu.initialize();
			assert.strictEqual(readCookie('sidebar'), null);
			assert.strictEqual(cone.sidebar_menu.elem.css('display'), 'none');
			cone.sidebar_menu = null;

			cone.viewport.state = 2;
			cone.SidebarMenu.initialize();
			assert.strictEqual(readCookie('sidebar'), null);
			assert.strictEqual(cone.sidebar_menu.collapsed, true);
			cone.sidebar_menu = null;

			cone.viewport.state = 3;
			cone.SidebarMenu.initialize();
			assert.strictEqual(readCookie('sidebar'), null);
			assert.strictEqual(cone.sidebar_menu.collapsed, false);
			cone.sidebar_menu = null;

			cone.viewport.state = 3;
			createCookie('sidebar', true, null);
			cone.SidebarMenu.initialize();
			assert.strictEqual(readCookie('sidebar'), 'true');
			assert.strictEqual(cone.sidebar_menu.collapsed, true);
			cone.sidebar_menu.toggle_btn.trigger('click');
			assert.ok(cone.sidebar_menu.lock_switch.hasClass('active'));
			cone.sidebar_menu = null;

			assert.verifySteps([
				'assign_state()', 
				'assign_state()', 
				'assign_state()',
				'assign_state()'
			]);

			// reset
			createCookie('sidebar', '', -1);
			cone.SidebarMenu.prototype.assign_state = assign_state_origin;
			cone.SidebarMenu.prototype.toggle_menu = toggle_menu_origin;
		});

		QUnit.test('toggle_lock()', assert => {
			console.log('-- test: toggle_lock()');

			// prepare
			let toggle_menu_origin = cone.SidebarMenu.prototype.toggle_menu;
			cone.SidebarMenu.prototype.toggle_menu = function() {
				assert.step('toggle_menu()');
			}

			cone.SidebarMenu.initialize();

			assert.strictEqual(cone.sidebar_menu.collapsed, false);

			// without cookie
			assert.strictEqual(readCookie('sidebar'), null);
			cone.sidebar_menu.lock_switch.trigger('click');
			assert.ok(cone.sidebar_menu.lock_switch.hasClass('active'));
			assert.strictEqual(cone.sidebar_menu.collapsed, false);
			assert.strictEqual(cone.sidebar_menu.cookie, false);
			cone.sidebar_menu.toggle_btn.trigger('click');
			// cone.sidebar_menu = null;

			// with cookie
			createCookie('sidebar', true, null);
			assert.strictEqual(readCookie('sidebar'), 'true');
			cone.sidebar_menu.toggle_lock();
			assert.strictEqual(readCookie('sidebar'), null);
			assert.notOk(cone.sidebar_menu.lock_switch.hasClass('active'));
			cone.sidebar_menu.toggle_btn.trigger('click');
			assert.strictEqual(cone.sidebar_menu.cookie, null);


			assert.verifySteps(['toggle_menu()']);
			// reset
			cone.SidebarMenu.prototype.toggle_menu = toggle_menu_origin;
		});

		QUnit.test('viewport_changed()', assert => {
			console.log('-- test: viewport_changed()');
			cone.SidebarMenu.initialize();

			// prepare
			let resize_evt = $.Event('viewport_changed');
			resize_evt.state = 0;

			let super_vp_changed_origin = cone.ViewPortAware.prototype.viewport_changed,
				assign_state_origin = cone.SidebarMenu.prototype.assign_state;

			cone.ViewPortAware.prototype.viewport_changed = function(e) {
				this.vp_state = e.state;
				assert.step( "super.viewport_changed()" );
			}
			cone.SidebarMenu.prototype.assign_state = function() {
				assert.step('assign_state()');
			}

			// mobile
			cone.sidebar_menu.viewport_changed(resize_evt);
			assert.strictEqual(cone.sidebar_menu.vp_state, resize_evt.state);
			assert.strictEqual(cone.sidebar_menu.collapsed, false);
			assert.strictEqual(cone.sidebar_menu.elem.css('display'), 'none');

			// small
			resize_evt.state = 1;
			cone.sidebar_menu.viewport_changed(resize_evt);
			assert.strictEqual(cone.sidebar_menu.elem.css('display'), 'block');

			// small 2
			resize_evt.state = 1;
			cone.sidebar_menu.vp_state = 2;
			cone.sidebar_menu.viewport_changed(resize_evt);
			assert.strictEqual(cone.sidebar_menu.collapsed, true);
			assert.strictEqual(cone.sidebar_menu.elem.css('display'), 'block');

			// desktop
			resize_evt.state = 3;
			cone.sidebar_menu.viewport_changed(resize_evt);
			assert.strictEqual(cone.sidebar_menu.collapsed, false);
			assert.strictEqual(cone.sidebar_menu.elem.css('display'), 'block');

			// with cookie
			resize_evt.state = 2;
			cone.sidebar_menu.cookie = true;
			cone.sidebar_menu.viewport_changed(resize_evt);
			assert.strictEqual(cone.sidebar_menu.collapsed, true);
			assert.strictEqual(cone.sidebar_menu.elem.css('display'), 'block');

			assert.verifySteps([
				"super.viewport_changed()",
				'assign_state()',
				"super.viewport_changed()",
				'assign_state()',
				"super.viewport_changed()",
				'assign_state()',
				"super.viewport_changed()",
				'assign_state()',
				"super.viewport_changed()",
				'assign_state()'
			]);

			// reset
			cone.sidebar_menu.cookie = null;
			cone.ViewPortAware.prototype.viewport_changed = super_vp_changed_origin;
			cone.SidebarMenu.prototype.assign_state = assign_state_origin;
		});

		QUnit.test('assign_state()', assert => {
			console.log('-- test: assign_state()');
			cone.SidebarMenu.initialize();

			// collapsed false
			assert.strictEqual(cone.sidebar_menu.collapsed, false);
			assert.ok(cone.sidebar_menu.elem.hasClass('expanded'));
			assert.ok(cone.sidebar_menu.toggle_arrow_elem.hasClass('bi bi-arrow-left-circle'));

			// collapsed true
			cone.sidebar_menu.collapsed = true;
			cone.sidebar_menu.assign_state();
			assert.ok(cone.sidebar_menu.elem.hasClass('collapsed'));
			assert.ok(cone.sidebar_menu.toggle_arrow_elem.hasClass('bi bi-arrow-right-circle'));
			cone.sidebar_menu = null;

			// with mainmenu sidebar
			create_mm_sidebar_elem();

			let collapse_origin = cone.MainMenuSidebar.prototype.collapse,
				expand_origin = cone.MainMenuSidebar.prototype.expand;

			cone.MainMenuSidebar.prototype.collapse = function() {
				assert.step('collapse()');
			}
			cone.MainMenuSidebar.prototype.expand = function() {
				assert.step('expand()');
			}
			cone.SidebarMenu.initialize();
			cone.MainMenuSidebar.initialize();
			
			// expand
			cone.sidebar_menu.assign_state();

			//collapse
			cone.sidebar_menu.collapsed = true;
			cone.sidebar_menu.assign_state();

			assert.verifySteps([
				'expand()',
				'collapse()'
			]);

			// reset
			cone.MainMenuSidebar.prototype.collapse = collapse_origin;
			cone.MainMenuSidebar.prototype.expand = expand_origin;
			cone.main_menu_sidebar = null;
		});

		QUnit.test('toggle_menu()', assert => {
			console.log('-- test: toggle_menu()');

			// prepare
			let assign_state_origin = cone.SidebarMenu.prototype.assign_state;
			cone.SidebarMenu.prototype.assign_state = function() {
				assert.step('assign_state()');
			}

			cone.SidebarMenu.initialize();
			assert.strictEqual(cone.sidebar_menu.collapsed, false);
			cone.sidebar_menu.toggle_btn.trigger('click');
			assert.strictEqual(cone.sidebar_menu.collapsed, true);
			cone.sidebar_menu.toggle_btn.trigger('click');
			assert.strictEqual(cone.sidebar_menu.collapsed, false);

			assert.verifySteps([
				'assign_state()',
				'assign_state()',
				'assign_state()'
			]);
			// reset
			cone.SidebarMenu.prototype.assign_state = assign_state_origin;
		});
	});
});

// XXXXXX cone.Navtree XXXXXX
QUnit.module('cone.Navtree', hooks => {
	hooks.before( () => {
		cone.viewport = new cone.ViewPort();
		console.log('NOW RUNNING: cone.Navtree');
	});

	hooks.after( () => {
		cone.viewport = null;
		console.log('COMPLETE: cone.Navtree');
		console.log('-------------------------------------');
	});

	QUnit.module('constructor', hooks => {
		hooks.before( () => {
			console.log('- now running: constructor');
		});
		hooks.beforeEach( () => {
			viewport.set('large');
			$(window).trigger('resize');
			create_sidebar_elem();
			create_navtree_elem();
			cone.SidebarMenu.initialize();
			cone.Navtree.initialize();
		})
		hooks.afterEach( () => {
			cone.navtree = null;
			cone.sidebar_menu = null;
			$('#sidebar_left').remove();
		})
		hooks.after( () => {
			console.log('- done: constructor');
		})

		QUnit.test('unload() call', assert => {
			console.log('-- test: unload() call');
			// save original function
			let unload_origin = cone.Navtree.prototype.unload;
			// overwrite original function
			cone.Navtree.prototype.unload = function() {
				assert.step( "unload() happened" );
			}
			cone.Navtree.initialize();
			assert.verifySteps(["unload() happened"]);

			// reset original function
			cone.Navtree.prototype.unload = unload_origin;
		});

		QUnit.test('elems', assert => {
			console.log('-- test: elems');
			let navtree = cone.navtree;
			assert.ok( navtree instanceof cone.ViewPortAware);
			assert.ok(navtree.content);
			assert.ok(navtree.heading);
			assert.ok(navtree.toggle_elems);
		})

		QUnit.test('mv_to_mobile() call', assert => {
			console.log('-- test: mv_to_mobile() call');
			cone.sidebar_menu = null;
			cone.navtree = null;
			cone.viewport = null;
			viewport.set('mobile');
			cone.viewport = new cone.ViewPort();
		
			let mv_to_mobile_origin = cone.Navtree.prototype.mv_to_mobile;
			// overwrite original function
			cone.Navtree.prototype.mv_to_mobile = function() {
				assert.step( "mv_to_mobile() happened" );
			}

			cone.SidebarMenu.initialize();
			cone.Navtree.initialize();
			$(window).off('viewport_changed');
			
			assert.verifySteps(["mv_to_mobile() happened"]);
			// reset original function
			cone.Navtree.prototype.mv_to_mobile = mv_to_mobile_origin;
		});

		QUnit.test('scrollbar_handle() call', assert => {
			console.log('-- test: scrollbar_handle() call');
			cone.navtree = null;

			scrollbar_handle_origin = cone.Navtree.prototype.scrollbar_handle;
			cone.Navtree.prototype.scrollbar_handle = function() {
				assert.step( "scrollbar_handle() happened" );
			}

			cone.Navtree.initialize();
			$(window).off('viewport_changed');
			assert.verifySteps(["scrollbar_handle() happened"]);

			cone.Navtree.prototype.scrollbar_handle = scrollbar_handle_origin;
		})
	});

	QUnit.module('methods', hooks => {
		hooks.before( () => {
			console.log('- now running: methods');
		});
		hooks.beforeEach( () => {
			viewport.set('large');
			$(window).trigger('resize');
			create_sidebar_elem();
			create_navtree_elem();
			cone.SidebarMenu.initialize();
			cone.Navtree.initialize();
		});
		hooks.afterEach( () => {
			cone.navtree = null;
			cone.sidebar_menu = null;
			$('#sidebar_left').remove();
			if(cone.topnav) {
				cone.topnav = null;
				$('#topnav').remove();
			}
		});
		hooks.after( () => {
			console.log('- done: methods');
		});

		QUnit.test('mv_to_mobile', assert => {
			console.log('-- test: mv_to_mobile()');
			create_topnav_elem();
			cone.Topnav.initialize();

			cone.navtree.mv_to_mobile();
			assert.ok(cone.navtree.elem.hasClass('mobile'));
			assert.strictEqual( $('#topnav-content > #navtree').length, 1);
			assert.strictEqual( $('#sidebar_content > #navtree').length, 0);
			assert.ok(cone.navtree.content.is(':hidden'));
			cone.navtree.heading.trigger('click');
			assert.ok(cone.navtree.content.is(':visible'));
		});

		QUnit.test('viewport_changed()', assert => {
			console.log('-- test: viewport_changed()');
			create_topnav_elem();
			cone.Topnav.initialize();
			let resize_evt = $.Event('viewport_changed');
			resize_evt.state = 0;

			let super_vp_changed_origin = cone.ViewPortAware.prototype.viewport_changed;
			cone.ViewPortAware.prototype.viewport_changed = function(e) {
				this.vp_state = e.state;
				assert.step( "super.viewport_changed() happened" );
			}

			// mobile
			let mv_to_mobile_origin = cone.Navtree.prototype.mv_to_mobile;
			cone.Navtree.prototype.mv_to_mobile = function() {
				assert.step( "mv_to_mobile() happened" );
			}

			cone.navtree.viewport_changed(resize_evt);
			assert.strictEqual(cone.navtree.vp_state, resize_evt.state);

			//desktop
			cone.navtree.heading.on('click', () => {
				assert.step('click happened');
			});
			resize_evt.state = 2;
			cone.navtree.viewport_changed(resize_evt);
			assert.notOk(cone.navtree.elem.hasClass('mobile'));
			assert.strictEqual( $('#topnav-content > #navtree').length, 0);
			assert.strictEqual( $('#sidebar_content > #navtree').length, 1);
			cone.navtree.heading.trigger('click');
			assert.ok(cone.navtree.content.is(':visible'));
			
			assert.verifySteps([
				"super.viewport_changed() happened",
				"mv_to_mobile() happened",
				"super.viewport_changed() happened"
			]);

			// reset
			cone.ViewPortAware.prototype.viewport_changed = super_vp_changed_origin;
			cone.Navtree.prototype.mv_to_mobile = mv_to_mobile_origin;
		});

		QUnit.test('align_width()', assert => {
			console.log('-- test: align_width()');

			let elem1 = $(cone.navtree.toggle_elems[0]),
				elem2 = $(cone.navtree.toggle_elems[1]),
				menu1 = $('ul', elem1),
				menu2 = $('ul', elem2);

			elem1.css('width', '300px');
			menu1.css('width', '500px');
			elem2.css('width', '500px');
			menu2.css('width', '300px');
			
			for(let item of cone.navtree.toggle_elems) {
				let elem = $(item);
				let menu = $('ul', elem);
				let elem_origin = elem.outerWidth();
				let menu_origin = menu.outerWidth();

				elem.trigger('mouseenter');
				assert.ok(elem.hasClass('hover'));

				let elem_width = elem.outerWidth() + 'px';
				    menu_width = menu.outerWidth() + 'px';

				if (elem_origin > menu_origin) {
					assert.strictEqual( menu.css('width'), elem_width );
				} else {
					assert.strictEqual( elem.css('width'), menu_width );
				}
			}
		});

		QUnit.test('restore_width()', assert => {
			console.log('-- test: restore_width()');

			cone.sidebar_menu.toggle_menu();
			cone.sidebar_menu.elem.css('width', '64px');
			cone.navtree.toggle_elems.css('width', 'auto');

			for(let item of cone.navtree.toggle_elems) {
				let elem = $(item);
				elem.trigger('mouseenter');
				elem.trigger('mouseleave');
				assert.notOk(elem.hasClass('hover'));
				assert.strictEqual(elem.css('width'), '24px'); // auto
			}
		});

		QUnit.test('unload()', assert => {
			console.log('-- test: unload()');

			cone.navtree = null;
			let align_width_origin = cone.Navtree.prototype.align_width,
				restore_width_origin = cone.Navtree.prototype.restore_width
			;

			cone.Navtree.prototype.change_event_functions = function() {
				this.align_width = function() {
					throw new Error( "align_width() happened" );
				}
				this._mouseenter_handle = this.align_width.bind(this);
				// this.toggle_elems.on('mouseenter', this._mouseenter_handle);
				this.restore_width = function() {
					throw new Error( "restore_width() happened" );
				}
				this._restore = this.restore_width.bind(this);
				// this.toggle_elems.on('mouseleave', this._restore);
			}
			cone.Navtree.initialize();
			cone.navtree.change_event_functions();

			// $(window).off('resize');

			// save original function
			let super_unload_origin = cone.ViewPortAware.prototype.unload;
			// overwrite original function
			cone.ViewPortAware.prototype.unload = function() {
				assert.step( "super.unload() happened" );
			}
			cone.navtree.heading.on('click', () => {
				throw new Error('click happened');
			});

			cone.navtree.unload();
			cone.navtree.toggle_elems.trigger('mouseenter').trigger('mouseleave');
			cone.navtree.heading.trigger('click');
	
			assert.verifySteps(["super.unload() happened"]);
	
			// reset original function
			cone.ViewPortAware.prototype.unload = super_unload_origin;
			cone.Navtree.prototype.align_width = align_width_origin;
			cone.Navtree.prototype.restore_width = restore_width_origin;
		});

		QUnit.test('scrollbar_handle()', assert => {
			console.log('-- test: scrollbar_handle()');

			cone.navtree = null;
			// save original functions
			let align_width_origin = cone.Navtree.align_width;
			
			// overwrite original functions
			cone.Navtree.prototype.change_align_width = function() {
				this.align_width = function() {
					assert.step( "align_width() happened" );
				}
				this._mouseenter_handle = this.align_width.bind(this);
			}

			cone.Navtree.initialize();
			cone.navtree.change_align_width();

			$(window).trigger('dragstart');
			cone.navtree.toggle_elems.trigger('mouseenter');

			$(window).trigger('dragend');
			// check on one elem
			$(cone.navtree.toggle_elems[0]).trigger('mouseenter'); 

			assert.verifySteps(["align_width() happened"]);

			// reset original function
			cone.Navtree.prototype.align_width = align_width_origin;
		});

		
	});
});

// XXXXXX cone.ThemeSwitcher XXXXXX
QUnit.module('cone.ThemeSwitcher', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.ThemeSwitcher');
		let head_styles = `
			<link href="http://localhost:8081/static/light.css" rel="stylesheet" type="text/css" media="all">
			<link href="http://localhost:8081/static/dark.css" rel="stylesheet" type="text/css" media="all">
		`;
		$('head').append(head_styles);
	});


	hooks.afterEach( () => {
		cone.theme_switcher = null;
		$('#switch_mode').remove();
		$('#colormode-styles').remove();
		createCookie('modeswitch', '', -1);
	});

	hooks.after( () => {
		console.log('COMPLETE: cone.ThemeSwitcher');
		console.log('-------------------------------------');
		let head_styles = `
			<link href="http://localhost:8081/static/light.css" rel="stylesheet" type="text/css" media="all">
			<link href="http://localhost:8081/static/dark.css" rel="stylesheet" type="text/css" media="all">
		`;
		$(head_styles).remove();
	});

	test('initial default check elems', assert => {
		console.log('- test: initial default check');
		create_elems();
		cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
		let switcher = cone.theme_switcher;

		assert.strictEqual(switcher.modes, cone.default_themes, 'modes is default themes');
		assert.strictEqual(switcher.current, switcher.modes[0], 'default mode light.css');
	});

	test('initial check cookie', assert => {
		console.log('- test: initial cookie check');
		create_elems();
		createCookie('modeswitch', cone.default_themes[1], null);

		cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
		let switcher = cone.theme_switcher;

		assert.strictEqual(switcher.modes, cone.default_themes, 'modes is default themes');
		assert.strictEqual(switcher.current, switcher.modes[1], 'current is dark.css');
	});

	test('switch_theme()', assert => {
		console.log('- test: switch theme');
		create_elems();
		cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
		let switcher = cone.theme_switcher;

		assert.strictEqual(switcher.modes, cone.default_themes, 'modes is default themes');
		assert.strictEqual(switcher.current, switcher.modes[0], 'default mode light.css');

		switcher.elem.trigger('click');
		assert.strictEqual(switcher.current, switcher.modes[1], 'mode after click dark.css');
		assert.strictEqual(switcher.link.attr('href'), switcher.modes[1], 'head link after click dark.css');

		switcher.elem.trigger('click');
		assert.strictEqual(switcher.current, switcher.modes[0], 'mode after 2 click light.css');
		assert.strictEqual(switcher.link.attr('href'), switcher.modes[0], 'head link after 2 click light.css');
	});


	//////////////////////////////
	function create_elems(mode) {
		let modeswitch_html = `
			<li class="form-check form-switch">
			<input class="form-check-input" id="switch_mode" type="checkbox">
			<label class="form-check-label" for="flexSwitchCheckDefault">Toggle dark mode</label>
			</li>
		`;
		let head_current = `<link id="colormode-styles" rel="stylesheet" href=${mode}>`;
		$('body').append(modeswitch_html);
		$('head').append(head_current);
	}
});

// XXXXXX cone.Searchbar XXXXXX
QUnit.module('cone.Searchbar', hooks => {

	hooks.before( () => {
		console.log('NOW RUNNING: cone.Searchbar');
		cone.viewport = new cone.ViewPort();
	});
	hooks.afterEach( () => {
		cone.searchbar = null;
		$('#cone-searchbar').remove();
	});
	hooks.after( () => {
		cone.viewport = null;
		console.log('COMPLETE: cone.Searchbar');
		console.log('-------------------------------------');
	});

	QUnit.module('constructor', hooks => {
		hooks.beforeEach( () =>{
			create_searchbar_elem();
		});

		hooks.afterEach( () => {
			cone.viewport.state = 3;
			cone.searchbar = null;
			$('#cone-searchbar').remove();
		})

		QUnit.test('unload() called', assert => {
			cone.Searchbar.initialize();
			let unload_origin = cone.Searchbar.prototype.unload;
			cone.Searchbar.prototype.unload = function() {
				assert.step('unload() happened');
			}
			cone.Searchbar.initialize();
			assert.verifySteps(["unload() happened"]);
			cone.Searchbar.prototype.unload = unload_origin;
		});

		QUnit.test('vp small', assert => {
			cone.viewport.state = 1;
			cone.Searchbar.initialize();
			assert.ok(cone.searchbar.dd.hasClass('dropdown-menu-end'));
			assert.strictEqual( $('#cone-livesearch-dropdown > #livesearch-input').length, 1 );
		});

		QUnit.test('vp medium', assert => {
			cone.viewport.state = 2;
			cone.Searchbar.initialize();
			assert.ok(cone.searchbar.dd.hasClass('dropdown-menu-end'));
			assert.strictEqual( $('#cone-livesearch-dropdown > #livesearch-input').length, 1 );
		});
	});

	QUnit.module('methods', hooks => {
		hooks.beforeEach( () =>{
			create_searchbar_elem();
		});

		hooks.afterEach( () => {
			cone.viewport.state = 3;
			cone.searchbar = null;
			$('#cone-searchbar').remove();
		});

		QUnit.test('unload()', assert => {
			let unload_origin = cone.ViewPortAware.prototype.unload;
			cone.ViewPortAware.prototype.unload = function() {
				$(window).off('viewport_changed', this._viewport_changed_handle);
				assert.step( "super.unload()" );
			}
			cone.Searchbar.initialize();

			cone.searchbar.unload();
			assert.verifySteps(["super.unload()"]);
			cone.ViewPortAware.prototype.unload = unload_origin;
		});

		QUnit.test('vp_changed()', assert => {
			// prepare
			let resize_evt = $.Event('viewport_changed');

			let super_vp_changed_origin = cone.ViewPortAware.prototype.viewport_changed;
			cone.ViewPortAware.prototype.viewport_changed = function(e) {
				this.vp_state = e.state;
				assert.step( "super.viewport_changed()" );
			}

			cone.viewport.state = 3;
			cone.Searchbar.initialize();

			// small
			resize_evt.state = 1;
			cone.searchbar.viewport_changed(resize_evt);
			assert.ok(cone.searchbar.dd.hasClass('dropdown-menu-end'));
			assert.strictEqual( $('#cone-livesearch-dropdown > #livesearch-input').length, 1 );

			// medium
			resize_evt.state = 2;
			cone.searchbar.viewport_changed(resize_evt);
			assert.ok(cone.searchbar.dd.hasClass('dropdown-menu-end'));
			assert.strictEqual( $('#cone-livesearch-dropdown > #livesearch-input').length, 1 );

			// large
			resize_evt.state = 3;
			cone.searchbar.viewport_changed(resize_evt);
			assert.notOk(cone.searchbar.dd.hasClass('dropdown-menu-end'));
			assert.strictEqual( $('#cone-livesearch-dropdown > #livesearch-input').length, 0 );
			assert.strictEqual( $('#livesearch-group > #livesearch-input').length, 1 );

			assert.verifySteps([
				"super.viewport_changed()",
				"super.viewport_changed()",
				"super.viewport_changed()"
			]);

			cone.ViewPortAware.prototype.viewport_changed = super_vp_changed_origin;
		});
	});
});

// XXXXXX cone.ScrollBar XXXXXX
QUnit.module('cone.ScrollBar', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.ScrollBar');
	})
	hooks.after( () => {
		console.log('COMPLETE: cone.ScrollBar');
		console.log('-------------------------------------');
	})

	let test_container_dim = 400,
		test_content_dim = 800;

	QUnit.module('constructor', hooks => {
		hooks.beforeEach( () => {
			create_scrollbar_elem('x');
		});
		hooks.afterEach( () => {
			$('#test-container').remove();
			test_scrollbar = null;
			delete test_scrollbar;
		});

		QUnit.test('resize observer', assert => {
			let update_origin = cone.ScrollBar.prototype.update,
				observe_origin = cone.ScrollBar.prototype.observe_container;

			cone.ScrollBar.prototype.update = function() {
				assert.step('update()');
			}
			cone.ScrollBar.prototype.observe_container = function() {
				this.scrollbar_observer.observe(this.elem.get(0));
				assert.step('observe_container()');
			}

			test_scrollbar = new cone.ScrollBar( $('#test-container') );

			let done = assert.async();
			setTimeout( function() {
				test_scrollbar.elem.css('width', '202px');
				done();
			}, 501);

			let done2 = assert.async();
			setTimeout( function() {
				assert.verifySteps([
					'observe_container()',
					'update()',
					'update()'
				]);
				test_scrollbar.scrollbar_observer.unobserve(test_scrollbar.elem.get(0));
				done2();
			}, 600);

			let done3 = assert.async();
			setTimeout( function() {
				// reset
				cone.ScrollBar.prototype.update = update_origin;
				cone.ScrollBar.prototype.observe_container = observe_origin;
				done3();
			}, 601);
		});
	});

	QUnit.module('methods', hooks => {
		hooks.beforeEach( () => {
			create_scrollbar_elem('x');
		});
		hooks.afterEach( () => {
			$('#test-container').remove();
			test_scrollbar = null;
			delete test_scrollbar;
		});

		QUnit.test('observe_container()', assert => {
			let update_origin = cone.ScrollBar.prototype.update;
			cone.ScrollBar.prototype.update = function() {
				assert.step('update()');
			}
			test_scrollbar = new cone.ScrollBar( $('#test-container') );

			let done = assert.async();
			setTimeout( () => {
				assert.verifySteps(['update()']);
				test_scrollbar.scrollbar_observer.unobserve(test_scrollbar.elem.get(0));
				done();
			}, 600);

			cone.ScrollBar.prototype.observe_container = update_origin;
		});

		QUnit.test('unload()', assert => {
			test_scrollbar = new cone.ScrollBar( $('#test-container') );
			test_scrollbar.scrollbar.on('click', () => {
				assert.step('scrollbar click');
			});
			test_scrollbar.elem.on('click', () => {
				assert.step('elem click');
			});
			test_scrollbar.thumb.on('click', () => {
				assert.step('thumb click');
			});

			test_scrollbar.unload();
			test_scrollbar.scrollbar.trigger('click');
			test_scrollbar.elem.trigger('click');
			test_scrollbar.thumb.trigger('click');

			assert.verifySteps([]);
		});

		QUnit.test('mouse_in_out()', assert => {
			test_scrollbar = new cone.ScrollBar( $('#test-container') );
			test_scrollbar.scrollbar.css('display', 'none');

			test_scrollbar.contentsize = 2;
			test_scrollbar.scrollsize = 1;
			test_scrollbar.elem.trigger('mouseenter');
			assert.strictEqual(test_scrollbar.scrollbar.css('display'), '');

			// save origin
			let fade_out_origin = $.fn.fadeOut;

			// overwrite
			$.fn._fadeOut = $.fn.fadeOut;
			$.fn.fadeOut = function(){
				assert.step('fadeOut called');
				$.fn.hide.apply(this);
			};
	
			test_scrollbar.elem.trigger('mouseleave');
			assert.verifySteps(['fadeOut called']);
			assert.strictEqual(test_scrollbar.scrollbar.css('display'), 'none');

			// reset
			$.fn.fadeOut = fade_out_origin;
		});

		QUnit.test('scroll_handle()', assert => {
			let set_position_origin = cone.ScrollBar.prototype.set_position;
			cone.ScrollBar.prototype.set_position = function() {
				assert.step('set_position()');
			}
			test_scrollbar = new cone.ScrollBar( $('#test-container') );
			test_scrollbar.contentsize = 1;
			test_scrollbar.scrollsize = 2;
			test_scrollbar.scroll_handle();

			test_scrollbar.scrollsize = test_container_dim;
			test_scrollbar.contentsize = test_content_dim;

			$(window).on('syntheticWheel', test_scrollbar._scroll);

			assert.strictEqual(test_scrollbar.position, 0, 'position 0 before scroll');

			let scroll_up = $.event.fix( new WheelEvent("syntheticWheel", {"deltaY": 1, "deltaMode": 0}) ),
				scroll_down = $.event.fix( new WheelEvent("syntheticWheel", {"deltaY": -1, "deltaMode": 0}) );

			$(window).trigger(scroll_up);
			assert.strictEqual(test_scrollbar.position, 10);

			$(window).trigger(scroll_down);
			assert.strictEqual(test_scrollbar.position, 0);

			assert.verifySteps([
				'set_position()',
				'set_position()'
			]);

			cone.ScrollBar.prototype.set_position = set_position_origin;
		});

		QUnit.test('prevent_overflow()', assert => {
			test_scrollbar = new cone.ScrollBar( $('#test-container') );
			test_scrollbar.contentsize = 400;
			test_scrollbar.scrollsize = 200;
			let threshold = test_scrollbar.contentsize - test_scrollbar.scrollsize;

			// scroll to end
			test_scrollbar.position = 500;
			test_scrollbar.prevent_overflow();
			assert.strictEqual(test_scrollbar.position, threshold);

			// scroll to start
			test_scrollbar.position = -500;
			test_scrollbar.prevent_overflow();
			assert.strictEqual(test_scrollbar.position, 0);
		});

		QUnit.test('click_handle()', assert => {
			let set_position_origin = cone.ScrollBar.prototype.set_position,
				get_evt_data_origin = cone.ScrollBar.prototype.get_evt_data,
				get_offset_origin = cone.ScrollBar.prototype.get_offset;

			cone.ScrollBar.prototype.set_position = function() {
				assert.step('set_position()');
			}
			cone.ScrollBar.prototype.get_evt_data = function() {
				assert.step('get_evt_data()');
			}
			cone.ScrollBar.prototype.get_offset = function() {
				assert.step('get_offset()');
			}

			test_scrollbar = new cone.ScrollBar( $('#test-container') );
			test_scrollbar.scrollbar.trigger('click');
			
			assert.verifySteps([
				'get_evt_data()',
				'get_offset()',
				'set_position()'
			]);

			assert.notOk(test_scrollbar.thumb.hasClass('active'));

			cone.ScrollBar.prototype.set_position = set_position_origin;
			cone.ScrollBar.prototype.get_evt_data = get_evt_data_origin;
			cone.ScrollBar.prototype.get_offset = get_offset_origin;
		});

		QUnit.test('drag_handle()', assert => {
			let set_position_origin = cone.ScrollBar.prototype.set_position,
				get_evt_data_origin = cone.ScrollBar.prototype.get_evt_data,
				get_offset_origin = cone.ScrollBar.prototype.get_offset;

			cone.ScrollBar.prototype.set_position = function() {
				assert.step('set_position()');
				// prevent overflow
				let threshold = this.contentsize - this.scrollsize;
				if(this.position >= threshold) {
					this.position = threshold;
				} else if(this.position <= 0) {
					this.position = 0;
				}
			}
			cone.ScrollBar.prototype.get_evt_data = function(e) {
				assert.step('get_evt_data()');
				return e.pageX;
			}
			cone.ScrollBar.prototype.get_offset = function() {
				return this.elem.offset().left;
			}

			test_scrollbar = new cone.ScrollBar( $('#test-container') );
			test_scrollbar.contentsize = 400;
			test_scrollbar.scrollsize = 200;
	
			let threshold = test_scrollbar.contentsize - test_scrollbar.scrollsize;

			function trigger_synthetic_drag(val, newVal){
				let synthetic_mousedown,
					synthetic_mousemove
				;
				synthetic_mousedown = new $.Event("mousedown", {"pageX": val, "pageY": 0});
				synthetic_mousemove = new $.Event("mousemove", {"pageX": newVal, "pageY": 0});

				test_scrollbar.thumb.trigger(synthetic_mousedown);
				assert.ok(test_scrollbar.thumb.hasClass('active'), 'thumb active');
	
				let mouse_pos = val - test_scrollbar.get_offset(),
					thumb_position = test_scrollbar.position / (test_scrollbar.contentsize / test_scrollbar.scrollsize),
					mouse_pos_on_move = newVal - test_scrollbar.get_offset(),
					calc_new_thumb_pos = thumb_position + mouse_pos_on_move - mouse_pos
				;
				calc_new_position = test_scrollbar.contentsize * calc_new_thumb_pos / test_scrollbar.scrollsize;

				$(document).trigger(synthetic_mousemove);
			}
	
			// drag to end
			trigger_synthetic_drag(0, 1000);
			assert.strictEqual(test_scrollbar.position, threshold, 'position is threshold drag to end');
	
			// drag to start
			trigger_synthetic_drag(threshold, -1000);
			assert.strictEqual(test_scrollbar.position, 0, 'position is 0 drag to start');
	
			// drag
			trigger_synthetic_drag(0, 124.8, `drag pos correct`);
	
			$(document).trigger('mouseup');
			assert.notOk(test_scrollbar.thumb.hasClass('active'), 'thumb not active after click');


			assert.verifySteps([
				"get_evt_data()",
				"get_evt_data()",
				"set_position()",
				"get_evt_data()",
				"get_evt_data()",
				"set_position()",
				"get_evt_data()",
				"set_position()",
				"get_evt_data()",
				"get_evt_data()",
				"set_position()",
				"get_evt_data()",
				"set_position()",
				"get_evt_data()",
				"set_position()"
			]);

			cone.ScrollBar.prototype.set_position = set_position_origin;
			cone.ScrollBar.prototype.get_evt_data = get_evt_data_origin;
			cone.ScrollBar.prototype.get_offset = get_offset_origin;
		});
	});
});

QUnit.module('cone.ScrollBarX', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.ScrollBarX');
	})
	hooks.after( () => {
		console.log('COMPLETE: cone.ScrollBarX');
		console.log('-------------------------------------');
	})

	QUnit.module('methods', hooks => {
		hooks.beforeEach( () => {
			create_scrollbar_elem('x');
		});
		hooks.afterEach( () => {
			$('#test-container').remove();
			test_scrollbar = null;
			delete test_scrollbar;
		});

		QUnit.test('compile()', assert => {
			test_scrollbar = new cone.ScrollBarX( $('#test-container') );
			test_compile(assert);
		});

		QUnit.test('update()', assert => {
			let set_position_origin = cone.ScrollBarX.prototype.set_position;
			cone.ScrollBarX.prototype.set_position = function() {
				assert.step('set_position()');
			}

			test_scrollbar = new cone.ScrollBarX( $('#test-container') );
			test_scrollbar.content.css('width', '400px');
			test_scrollbar.elem.css('width', '200px');

			test_scrollbar.contentsize = 400;
			test_scrollbar.scrollsize = 200;
			let thumbsize = test_scrollbar.scrollsize ** 2 / test_scrollbar.contentsize;
			test_scrollbar.update();
			assert.strictEqual(test_scrollbar.thumbsize, thumbsize);

			test_scrollbar.contentsize = 300;
			test_scrollbar.update();
			assert.strictEqual(test_scrollbar.contentsize, test_scrollbar.content.outerWidth());

			test_scrollbar.contentsize = 100;
			test_scrollbar.content.css('width', '100px');
			test_scrollbar.update();
			assert.strictEqual(test_scrollbar.thumbsize, test_scrollbar.scrollsize);

			assert.verifySteps([
				'set_position()',
				'set_position()',
				'set_position()'
			]);
			cone.ScrollBarX.prototype.set_position = set_position_origin;
		});

		QUnit.test('set_position()', assert => {
			let prevent_overflow_origin = cone.ScrollBarX.prototype.prevent_overflow;
			cone.ScrollBarX.prototype.prevent_overflow = function() {
				let threshold = this.contentsize - this.scrollsize;
				if(this.position >= threshold) {
					this.position = threshold;
				} else if(this.position <= 0) {
					this.position = 0;
				}
				assert.step('prevent_overflow()');
			}

			test_scrollbar = new cone.ScrollBarX( $('#test-container') );
			
			test_set_position(assert);

			assert.verifySteps([
				'prevent_overflow()',
				'prevent_overflow()'
			]);
			cone.ScrollBarX.prototype.prevent_overflow = prevent_overflow_origin;
		});

		QUnit.test('get_evt_data()', assert => {
			test_scrollbar = new cone.ScrollBarX( $('#test-container') );

			let mousedown = new $.Event("mousedown", {"pageX": true, "pageY": false});
			test_scrollbar.get_evt_data(mousedown);
			assert.strictEqual(test_scrollbar.get_evt_data(mousedown), true);
		});

		QUnit.test('get_offset()', assert => {
			test_scrollbar = new cone.ScrollBarX( $('#test-container') );
			assert.strictEqual(test_scrollbar.elem.offset().left, test_scrollbar.get_offset());
		});
	});
});

QUnit.module('cone.ScrollBarY', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.ScrollBarY');
	});
	hooks.after( () => {
		console.log('COMPLETE: cone.ScrollBarY');
		console.log('-------------------------------------');
	});

	QUnit.module('methods', hooks => {
		hooks.beforeEach( () => {
			create_scrollbar_elem('y');
		});
		hooks.afterEach( () => {
			$('#test-container').remove();
			test_scrollbar = null;
			delete test_scrollbar;
		});

		QUnit.test('compile()', assert => {
			test_scrollbar = new cone.ScrollBarY( $('#test-container') );
			test_compile(assert);
		});

		QUnit.test('update()', assert => {
			let set_position_origin = cone.ScrollBarY.prototype.set_position;
			cone.ScrollBarY.prototype.set_position = function() {
				assert.step('set_position()');
			}

			test_scrollbar = new cone.ScrollBarY( $('#test-container') );
			test_scrollbar.content.css('height', '400px');
			test_scrollbar.elem.css('height', '200px');

			test_scrollbar.contentsize = 400;
			test_scrollbar.scrollsize = 200;
			let thumbsize = test_scrollbar.scrollsize ** 2 / test_scrollbar.contentsize;
			test_scrollbar.update();
			assert.strictEqual(test_scrollbar.thumbsize, thumbsize);

			test_scrollbar.contentsize = 300;
			test_scrollbar.update();
			assert.strictEqual(test_scrollbar.contentsize, test_scrollbar.content.outerHeight());

			test_scrollbar.contentsize = 100;
			test_scrollbar.content.css('height', '100px');
			test_scrollbar.update();
			assert.strictEqual(test_scrollbar.thumbsize, test_scrollbar.scrollsize);

			assert.verifySteps([
				'set_position()',
				'set_position()',
				'set_position()'
			]);
			cone.ScrollBarY.prototype.set_position = set_position_origin;
		});

		QUnit.test('set_position()', assert => {
			let prevent_overflow_origin = cone.ScrollBarY.prototype.prevent_overflow;
			cone.ScrollBarY.prototype.prevent_overflow = function() {
				assert.step('prevent_overflow()');
				let threshold = this.contentsize - this.scrollsize;
				if(this.position >= threshold) {
					this.position = threshold;
				} else if(this.position <= 0) {
					this.position = 0;
				}
			}

			test_scrollbar = new cone.ScrollBarY( $('#test-container') );
			test_set_position(assert);

			assert.verifySteps([
				'prevent_overflow()',
				'prevent_overflow()'
			]);
			cone.ScrollBarY.prototype.prevent_overflow = prevent_overflow_origin;
		});

		QUnit.test('get_evt_data()', assert => {
			test_scrollbar = new cone.ScrollBarY( $('#test-container') );

			let mousedown = new $.Event("mousedown", {"pageX": false, "pageY": true});
			test_scrollbar.get_evt_data(mousedown);
			assert.strictEqual(test_scrollbar.get_evt_data(mousedown), true);
		});

		QUnit.test('get_offset()', assert => {
			test_scrollbar = new cone.ScrollBarY( $('#test-container') );
			assert.strictEqual(test_scrollbar.elem.offset().top, test_scrollbar.get_offset());
		});
	});

});

///////// html /////////

// topnav
function create_topnav_elem() {
	//console.log('create_topnav_elem called');
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

	$('body').append(topnav_html);
}

function topnav_style_to_mobile() {
	//console.log('topnav_style_to_mobile() called');

    let topnav = cone.topnav;
    topnav.elem.css({
        'padding': '1rem',
        'height': '4rem',
    });
    topnav.logo.css('margin-right', 'auto');
    $('span', topnav.logo).css('display', 'none'); // hidden via css

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
	//console.log('topnav_style_to_desktop() called');

    let topnav = cone.topnav;
    topnav.elem.css({
        'padding': '0',
        'padding-left': '.75rem'
    });
    topnav.logo.css('margin-right', 'auto'); // needed?
    $('span', topnav.logo).css('display', 'inline-block'); // show via css

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

// mainmenu top

function create_mm_top_elem() {
	//console.log('create_mm_top_elem called');

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
	$('.mainmenu-item').css({
		'white-space': 'nowrap',
		'padding': '0 10px'
	});
}

function mm_top_style_to_mobile() {
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

// searchbar

function create_searchbar_elem() {
	//console.log('create_searchbar_elem() called');

	let searchbar_html = `
		<div id="cone-searchbar">
	      <div id="cone-searchbar-wrapper" class="dropdown-toggle" role="button" data-bs-toggle="dropdown">
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

	$('body').append(searchbar_html);
}

// sidebar

function create_sidebar_elem() {
	// console.log('CALLED: create_sidebar_elem()');

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

	$('body').append(sidebar_html);
}

// mainmenu sidebar

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

// mainmenu items

function create_mm_items(count) {
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

	for(let i=1; i <=count; i++) {
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

		$('#mainmenu').append(mainmenu_item_html);

		$(`#elem${count}`).data('menu-items', data_menu_items);
	}
}

function create_empty_item() {
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

		$('#mainmenu').append(mainmenu_item_html);
}

// navtree

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

// scrollbar

function create_scrollbar_elem(dir) {
	if( dir === 'x' ){
		container_width = 200;
		container_height = 200;
		content_width = 400;
		content_height = 200;
	} else if ( dir === 'y' ){
		container_width = 200;
		container_height = 200;
		content_width = 200;
		content_height = 400;
	}
	let scrollbar_test_elem = `
		<div style="width:${container_width}px;
					height:${container_height}px;
					overflow:hidden;
					left:0;
					top:0;
					position:absolute;"
			id="test-container"
		>
			<div style="width:${content_width}px; height:${content_height}; position:relative;">
			</div>
		</div>
	`;
	$('body').append(scrollbar_test_elem);
}

function test_compile(assert){
	assert.ok(test_scrollbar instanceof cone.ScrollBar);

	let done = assert.async();
	setTimeout( () => {
		assert.ok(test_scrollbar.content.hasClass('scroll-content'));
		assert.ok(test_scrollbar.elem.hasClass('scroll-container'));
		assert.strictEqual( $('#test-container > .scrollbar').length, 1);
		assert.strictEqual( $('#test-container > .scrollbar > .scroll-handle').length, 1);
		done();
	}, 100);
}

function test_set_position(assert){
	test_scrollbar.contentsize = 400;
	test_scrollbar.scrollsize = 200;
	test_scrollbar.position = 0;
	test_scrollbar.set_position();
	
	function calc_thumb_pos(){
		return test_scrollbar.position / (test_scrollbar.contentsize / test_scrollbar.scrollsize) + 'px';
	}
	if(test_scrollbar instanceof cone.ScrollBarX){
		assert.strictEqual(test_scrollbar.content.css('right'), test_scrollbar.position + 'px');
		assert.strictEqual(test_scrollbar.thumb.css('left'), calc_thumb_pos());
	} else if (test_scrollbar instanceof cone.ScrollBarY ) {
		assert.strictEqual(test_scrollbar.content.css('bottom'), test_scrollbar.position + 'px');
		assert.strictEqual(test_scrollbar.thumb.css('top'), calc_thumb_pos());
	}

	test_scrollbar.contentsize = 800;
	test_scrollbar.scrollsize = 300;
	test_scrollbar.position = 500;
	test_scrollbar.set_position();

	if(test_scrollbar instanceof cone.ScrollBarX){
		assert.strictEqual(test_scrollbar.content.css('right'), test_scrollbar.position + 'px');
		assert.strictEqual(test_scrollbar.thumb.css('left'), calc_thumb_pos());
	} else if (test_scrollbar instanceof cone.ScrollBarY ) {
		assert.strictEqual(test_scrollbar.content.css('bottom'), test_scrollbar.position + 'px');
		assert.strictEqual(test_scrollbar.thumb.css('top'), calc_thumb_pos());
	}
}

const { test } = QUnit;

var vp_states = ['mobile', 'small', 'medium', 'large'];

/* mock Viewport state */
function mockNewViewport(mock_state) {
	cone.viewport = new cone.ViewPort();
	cone.viewport.state = mock_state;
	cone.vp_state = mock_state;
}
function mockViewportChange(mock_state) {
	cone.viewport.state = mock_state;
	cone.vp_state = mock_state;
	let e = {state:mock_state};

	var evt = $.Event('viewport_changed');
	evt.state = mock_state;
	$(window).trigger(evt);
}

QUnit.skip('responsive stuff', assert => {

	/* Set to 320px x 500px
	   values must be int
	   only works in karma, not qunit in browser! */
	let val1 = 320;
	let val2 = 500;
	viewport.set(val1, val2);

	assert.strictEqual($(window).width(), val1, 'viewport changed');
})

// XXXXXX namespace XXXXXX
QUnit.skip('cone namespace', hooks => {
	test('test cone elems', assert => {
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
  })
});

// XXXXXX cone.ViewPort XXXXXX
QUnit.skip('cone.ViewPort', hooks => {
	hooks.before( () => {
		cone.viewport = new cone.ViewPort; 
	})

	hooks.after( () => {
		cone.viewport = null;
		// delete cone.viewport;
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

	for( let i = 0; i <= 3; i++ ) {
		QUnit.test(`vp${i}`, assert => {
			switch_viewport(i, assert);
		})
	}
})

// XXXXXXX cone.ViewPortAware XXXXXXX
QUnit.skip('cone.ViewPortAware', hooks => {

	QUnit.module('initial', hooks => {
		hooks.beforeEach( () => {
			cone.viewport = new cone.ViewPort();
			test_obj = new cone.ViewPortAware();
		})

		hooks.afterEach( () => {
			cone.viewport = null;
			test_obj = null;
			// delete cone.viewport;
			// delete test_obj;
		})

		let states = ['mobile', 'small', 'medium', 'large'];
		function switch_viewport(i, assert) {
			viewport.set(states[i]);
			$(window).trigger('resize');

			assert.strictEqual(cone.viewport.state, i, `cone.viewport.state is ${i}`);
			assert.strictEqual(test_obj.vp_state, cone.viewport.state, 'vp_state is cone.viewport.state');
		}

		for( let i = 0; i <= 3; i++ ) {
			QUnit.test(`vp${i}`, assert => {
				switch_viewport(i, assert);
			})
		}
	})

	QUnit.module('unload()', hooks => {
		hooks.before( () => {
			viewport.set(1800, 1024);
			cone.viewport = new cone.ViewPort();
			test_obj = new cone.ViewPortAware();
		})

		test('unload vp', assert =>{
			assert.strictEqual(test_obj.vp_state, cone.viewport.state, 'vp_state is cone.viewport.state');
			test_obj.unload();
			viewport.set(500, 200);
			$(window).trigger('resize');

			assert.notStrictEqual(test_obj.vp_state, cone.viewport.state, 'vp_state not changed after unload');
		})

		hooks.after( () => {
			cone.viewport = null;
			test_obj = null;
			// delete cone.viewport;
			// delete test_obj;
		})
	})

	hooks.after( () => {
		console.log('DONE - cone.ViewPortAware');
	})
});



// XXXXXX cone.Searchbar XXXXXX

//cone.searchbar and cone.mainMenuTop seem to conflict, why??
// -> changed position from after mmtop to before mmtop

QUnit.skip('cone.Searchbar', hooks => {
	let vp_states = ['mobile', 'small', 'medium', 'large'];

	hooks.after( () => {
		console.log('DONE - cone.Searchbar');
		cone.searchbar = null;
		cone.viewport = null;
		$('#cone-searchbar').remove();
	})

	QUnit.module('initial load', hooks => {
		for( let i = 0; i <= 3; i++ ) {
			QUnit.module(`Viewport ${i}`, hooks => {
				hooks.beforeEach( () => {
					viewport.set(vp_states[i]);
					cone.viewport = new cone.ViewPort();
					create_searchbar_elem();
					cone.searchbar = new cone.Searchbar( $('#cone-searchbar') );
				})

				hooks.afterEach( () => {
					cone.searchbar = null;
					cone.viewport = null;
					//delete cone.searchbar;
					$('#cone-searchbar').remove();
				})

				test('check elems', assert => {
					check_elems(assert);
				})
			})
		}
	})

	QUnit.module('vp_changed()', hooks => {
		hooks.before( () => {
			viewport.set('large');
			cone.viewport = new cone.ViewPort();
			create_searchbar_elem();
			cone.searchbar = new cone.Searchbar( $('#cone-searchbar') );
		})

		for( let i = 0; i <= 3; i++ ) {
			test(`Viewport ${i}`, assert => {
				viewport.set(vp_states[i]);
				$(window).trigger('resize');
				check_elems(assert);
			})
		}
	})

	//////////////////////////////////
	function check_elems(assert) {
		console.log('check_elems() called');
		assert.strictEqual(cone.searchbar.vp_state, cone.viewport.state, 'cone vp_state is viewport state');
		assert.strictEqual(cone.searchbar.elem.css('display'), 'block', 'elem display block');

		if( cone.searchbar.vp_state === 1 || cone.searchbar.vp_state === 2 ) {
			assert.ok(cone.searchbar.dd.hasClass('dropdown-menu-end'), 'dropdown has class dd-menu-end');
			//check if search_text prepended
			assert.strictEqual( $('input', '#cone-livesearch-dropdown').length, 1, 'search-text prepended' ); 
			assert.strictEqual( $('> #livesearch-input', '#livesearch-group').length, 0, 'livesearch-input not in group' );
		} else {
			assert.strictEqual( $('input', '#cone-livesearch-dropdown').length, 0, 'search-text not prepended' );
			assert.notOk(cone.searchbar.dd.hasClass('dropdown-menu-end'), 'dd does not have class end');
			assert.strictEqual( $('> #livesearch-input', '#livesearch-group').length, 1, 'livesearch-input in group' );
		}
	}
})

// XXXXXX cone.Content WIP XXXXXXX
QUnit.skip('cone.Content', hooks => {
	hooks.before( () => {
		let content_html = `
			<div id="page-content-wrapper">
			  <div id="page-content">
			  </div>
			</div>
		`;
		$('body').append(content_html);

		cone.Content.initialize( $('body') );
	})

	test('content', assert => {
		assert.ok(true);
	})
})

// XXXXXX cone.ScrollBar XXXXXX
QUnit.skip( 'cone.ScrollBar', hooks => {
	hooks.after( () => {
		console.log('DONE - cone.ScrollBar');
	})

	let test_container_dim = 400,
		test_content_dim = 800,
		test_thumbsize = test_container_dim ** 2 / test_content_dim;

	QUnit.module('cone.ScrollBarX', hooks => {

		hooks.before( () => {
			//init
			console.log('--- cone.ScrollBarX ---');
			let scrollbar_test_elem = `
			<div style="width:${test_container_dim}px; height:200px; overflow:hidden; left:0; top:0; position:absolute;" id="test-container-x">
				<div style="width:${test_content_dim}px; height:200px; position:relative;">
				</div>
			</div>
			`;
			$('body').append(scrollbar_test_elem);
			test_scrollbar_x = new cone.ScrollBarX($('#test-container-x'));
		})

		hooks.afterEach( () => {
			//reset
			reset_obj(test_scrollbar_x);
		})

		hooks.after( () => {
			//cleanup
			$('#test-container-x').remove();
			test_scrollbar_x = null;
			// delete test_scrollbar_x;
			$(document).off();
		})

		test('compile()', assert => {
			test_compile(test_scrollbar_x, assert);
			assert.ok(test_scrollbar_x.scrollbar.parents("#test-container-x").length == 1, 'container has scrollbar');
			assert.ok(test_scrollbar_x.content.parents("#test-container-x").length == 1, 'container has content');
		})

		test('update() fixed dim', assert => {
			update_fixed_dim(test_scrollbar_x, assert);
		});

		test('update() random dim', assert => {
			update_random_dim(test_scrollbar_x, assert);
		})

		test('mouse_in_out()', assert => {
			handle_mouse_in_out(test_scrollbar_x, assert);
		})

		test('scroll_handle()', assert => {
			test_scroll_handle(test_scrollbar_x, assert);
		})

		test('click_handle()', assert => {
			test_click_handle(test_scrollbar_x, assert);
		})

		test('drag_handle()', assert => {
			test_drag_handle(test_scrollbar_x, assert);
		})

		// events deleted
		test('unload()', assert => {
			test_scrollbar_x.unload();
			assert.notOk($._data($(test_scrollbar_x.elem)[0], "events"), 'elem events removed');
			assert.notOk($._data($(test_scrollbar_x.scrollbar)[0], "events"), 'scrollbar events removed');
			// assert.notOk($._data($(test_scrollbar_x.thumb).get(0), "events")); //something fishy!
		})
    })

  	QUnit.module('cone.ScrollBarY', hooks => {
		hooks.before( () => {
			//init
			console.log('--- cone.ScrollBarY ---');
			let scrollbar_test_elem = `
				<div style="width:200pxpx; height:${test_container_dim}px; overflow:hidden; left:0; top:0; position:absolute;" id="test-container-y">
				<div style="width:200px; height:${test_content_dim}px; position:relative;">
				</div>
				</div>
			`;
			$('body').append(scrollbar_test_elem);
			test_scrollbar_y = new cone.ScrollBarY($('#test-container-y'));
		})

		hooks.afterEach( () => {
			//reset
			reset_obj(test_scrollbar_y);
		})

		hooks.after( () => {
			//cleanup
			$('#test-container-y').remove();
			test_scrollbar_y = null;
			// delete test_scrollbar_y;
			$(document).off();
		})

		test('compile()', assert => {
			test_compile(test_scrollbar_y, assert);
			assert.ok(test_scrollbar_y.scrollbar.parents("#test-container-y").length == 1, 'container has scrollbar');
			assert.ok(test_scrollbar_y.content.parents("#test-container-y").length == 1, 'container has content');
		})

		test('update() fixed dim', assert => {
			update_fixed_dim(test_scrollbar_y, assert);
		});

		test('update() random dim', assert => {
			update_random_dim(test_scrollbar_y, assert);
		})

		test('mouse_in_out()', assert => {
			handle_mouse_in_out(test_scrollbar_y, assert);
		})

		test('scroll_handle()', assert => {
			test_scroll_handle(test_scrollbar_y, assert);
		})

		test('click_handle()', assert => {
			test_click_handle(test_scrollbar_y, assert);
		})

		test('drag_handle()', assert => {
			test_drag_handle(test_scrollbar_y, assert);
		})

		// events deleted
		test('unload()', assert => {
			test_scrollbar_y.unload();
			assert.notOk($._data($(test_scrollbar_y.elem)[0], "events"), 'elem events removed');
			assert.notOk($._data($(test_scrollbar_y.scrollbar)[0], "events"), 'scrollbar events removed');
			// assert.notOk($._data($(test_scrollbar_x.thumb).[0], "events")); //something fishy!
		})
    });

  	////////////////////////////////////////////

	function test_compile(test_elem, assert) {
		assert.strictEqual(test_elem.position, 0, 'position 0');
		assert.strictEqual(test_elem.unit, 10, 'unit is 10px');

		test_elem.compile();

		test_elem.scrollbar.css('display', 'none'); // hidden via css
		assert.ok(test_elem.scrollbar.hasClass('scrollbar'), 'scrollbar hasClass scrollbar');
		assert.ok(test_elem.elem.hasClass('scroll-container'), 'elem hasClass scroll-container');
		assert.ok(test_elem.content.hasClass('scroll-content'), 'content hasClass scroll-content');
		assert.ok(test_elem.elem.children('div').length == 2, 'elem has two children');
		assert.ok(test_elem.thumb.parents('.scrollbar').length == 1, 'scrollbar has thumb');
		assert.ok(test_elem.scrollbar.is(':hidden'), 'scrollbar hidden');
	}

	function reset_obj(obj) {
		console.log('done - ' + QUnit.config.current.testName);
		test_container_dim = 400,
		test_content_dim = 800,
		test_thumbsize = test_container_dim ** 2 / test_content_dim;
		obj.position = 0;
		obj.scrollsize = test_container_dim;
		obj.contentsize = test_content_dim;
		obj.thumbsize = test_thumbsize;

		if(obj instanceof cone.ScrollBarX) {
			obj.elem.css('width', `${test_container_dim}px`);
			obj.content.css('width', `${test_content_dim}px`);
			obj.thumb.css('width', `${test_thumbsize}px`);
		} else
		if(obj instanceof cone.ScrollBarY) {
			obj.elem.css('height', `${test_container_dim}px`);
			obj.content.css('height', `${test_content_dim}px`);
			obj.thumb.css('height', `${test_thumbsize}px`);
		}
	}

	function update_fixed_dim(test_elem, assert) {
		test_container_dim = 300;
		test_thumbsize = test_container_dim ** 2 / test_content_dim;

		if(test_elem instanceof cone.ScrollBarX) {
			test_elem.elem.css('width', `${test_container_dim}px`);
		} else
		if(test_elem instanceof cone.ScrollBarY) {
			test_elem.elem.css('height', `${test_container_dim}px`);
		}

		test_elem.update();
		assert.strictEqual(test_elem.scrollsize, test_container_dim, 'scrollbar size is container size');
		assert.strictEqual(test_elem.thumbsize, test_thumbsize, 'thumbsize correct');
	}

	function update_random_dim(test_elem, assert) {
		for(let i=0; i<10; i++) {
			test_elem.position = 0;
			let new_test_container_dim = Math.floor(Math.random() * 1000),
				new_test_content_dim = Math.floor(Math.random() * 1000),
				new_test_thumbsize = new_test_container_dim ** 2 / new_test_content_dim;

			if(test_elem instanceof cone.ScrollBarX) {
				test_elem.elem.css('width', `${new_test_container_dim}px`);
				test_elem.content.css('width', `${new_test_content_dim}px`);
			} else
			if(test_elem instanceof cone.ScrollBarY) {
				test_elem.elem.css('height', `${new_test_container_dim}px`);
				test_elem.content.css('height', `${new_test_content_dim}px`);
			}

			test_elem.update();

			if(new_test_content_dim >= new_test_container_dim) {
				assert.strictEqual(test_elem.thumbsize, new_test_thumbsize, `thumbsize ${new_test_thumbsize}`);
			}
			assert.strictEqual(test_elem.scrollsize, new_test_container_dim, `scrollsize ${new_test_container_dim}`);
		}
	}

	function handle_mouse_in_out(test_elem, assert) {
		assert.strictEqual(test_elem.scrollbar.css('display'), 'none', 'scrollbar hidden on load');
		test_elem.elem.trigger('mouseenter');
		assert.strictEqual(test_elem.scrollbar.css('display'), 'block', 'scrollbar visible on mouseenter');
		test_elem.elem.trigger('mouseleave');

		let done = assert.async();
		setTimeout(function() {
			assert.strictEqual(test_elem.scrollbar.css('display'), 'none', 'scrollbar hidden on mouseleave');
			done();
		}, 1000 );
	}

	function test_scroll_handle(test_elem, assert) {
		// set val as number of scroll ticks
		function sim_scroll(val, dir){
			let delta = dir === 'pos' ? 1:-1;
			for(let i=0; i<val; i++){
				var syntheticEvent = new WheelEvent("syntheticWheel", {"deltaY": delta, "deltaMode": 0});
				let synthetic_scroll = $.event.fix(syntheticEvent);
				$(window).trigger(synthetic_scroll);
			}
		}
		$(window).on('syntheticWheel', test_elem._scroll);

		assert.strictEqual(test_elem.position, 0, 'position 0 before scroll');

		let threshold = test_elem.contentsize - test_elem.scrollsize;

		/* scroll to end */
		sim_scroll(500, 'pos');
		assert.strictEqual(test_elem.position, threshold, 'stop on container end');

		/* scroll to start */
		sim_scroll(500, 'neg');
		assert.strictEqual(test_elem.position, 0, 'stop on container start');

		/* scroll to middle */
		sim_scroll( (test_elem.scrollsize / 20), 'pos');
		let result_middle = Math.ceil( test_elem.scrollsize/20 ) * 10;
		assert.strictEqual(test_elem.position, result_middle, 'scroll to middle');

		/* content = container */
		if(test_elem instanceof cone.ScrollBarX) {
			test_elem.content.css('width', `${test_elem.scrollsize}px`);
		} else
		if(test_elem instanceof cone.ScrollBarY) {
			test_elem.content.css('height', `${test_elem.scrollsize}px`);
		}
		test_elem.update();

		let pos = test_elem.position;
		let offset = test_elem.get_offset();
		sim_scroll(100, 'pos');
		assert.strictEqual(test_elem.position, pos, 'position not changed');
		assert.strictEqual(test_elem.get_offset(), offset, 'offset not changed');
  	}

	function test_click_handle(test_elem, assert) {
		$(window).on('syntheticClick', test_elem._click_handle);

		let offset = test_elem.get_offset(),
			click_threshold = offset + test_elem.scrollsize;

		function trigger_synthetic_click(val){
		let new_thumb_pos = val - offset - test_elem.thumbsize / 2,
			calc_new_pos = test_elem.contentsize * new_thumb_pos / test_elem.scrollsize,
			threshold = test_elem.contentsize - test_elem.scrollsize,
			synthetic_click
		;
		if(test_elem instanceof cone.ScrollBarX) {
			synthetic_click = new $.Event("syntheticClick", {"pageX": val, "pageY": 0});
		} else
		if(test_elem instanceof cone.ScrollBarY) {
			synthetic_click = new $.Event("syntheticClick", {"pageX": 0, "pageY": val});
		}
		// prevent_overflow()
		if(calc_new_pos >= threshold) {
			calc_new_pos = threshold;
		} else if(calc_new_pos <= 0) {
			calc_new_pos = 0;
		}

		$(window).trigger(synthetic_click);
		// assert.ok(test_elem.thumb.hasClass('active'));
		assert.strictEqual(test_elem.position, calc_new_pos, 'position correct after click');
		}

		trigger_synthetic_click(0, 0);
		trigger_synthetic_click(click_threshold, 0);
		trigger_synthetic_click((click_threshold - offset) / 2, 0);
	}

	function test_drag_handle(test_elem, assert) {
		let calc_new_position;
		let threshold = test_elem.contentsize - test_elem.scrollsize;
		test_elem.update();

		function trigger_synthetic_drag(val, newVal){
			let synthetic_mousedown,
				synthetic_mousemove
			;
			if(test_elem instanceof cone.ScrollBarX) {
				synthetic_mousedown = new $.Event("mousedown", {"pageX": val, "pageY": 0});
				synthetic_mousemove = new $.Event("mousemove", {"pageX": newVal, "pageY": 0});
			} else
			if(test_elem instanceof cone.ScrollBarY) {
				synthetic_mousedown = new $.Event("mousedown", {"pageX": 0, "pageY": val});
				synthetic_mousemove = new $.Event("mousemove", {"pageX": 0, "pageY": newVal});
			}

			test_elem.thumb.trigger(synthetic_mousedown);
			assert.ok(test_elem.thumb.hasClass('active'), 'thumb active');

			let mouse_pos = val - test_elem.get_offset(),
				thumb_position = test_elem.position / (test_elem.contentsize / test_elem.scrollsize),
				mouse_pos_on_move = newVal - test_elem.get_offset(),
				calc_new_thumb_pos = thumb_position + mouse_pos_on_move - mouse_pos
			;
			calc_new_position = test_elem.contentsize * calc_new_thumb_pos / test_elem.scrollsize;

			// prevent_overflow()
			if(calc_new_position >= threshold) {
				calc_new_position = threshold;
			} else if(calc_new_position <= 0) {
				calc_new_position = 0;
			}
			$(document).trigger(synthetic_mousemove);

			assert.strictEqual(test_elem.position, calc_new_position, `new position: ${calc_new_position}`);
		}

		// drag to end
		trigger_synthetic_drag(0, 1000);
		assert.strictEqual(test_elem.position, threshold, 'position is threshold drag to end');

		// drag to start
		trigger_synthetic_drag(threshold, -1000);
		assert.strictEqual(test_elem.position, 0, 'position is 0 drag to start');

		// drag
		trigger_synthetic_drag(0, 124.8, `drag pos correct`);

		$(document).trigger('mouseup');
		assert.notOk(test_elem.thumb.hasClass('active'), 'thumb not active after click');
	}
});

QUnit.skip('Test cone.toggle_arrow', assert => {
	let up = 'bi-chevron-up',
		down = 'bi-chevron-down',
		arrow_up = $(`<i class="dropdown-arrow ${up}" />`),
		arrow_down = $(`<i class="dropdown-arrow ${down}" />`);
	cone.toggle_arrow(arrow_up);
	assert.strictEqual(arrow_up.attr('class'), `dropdown-arrow ${down}`, 'arrow class = down');
	cone.toggle_arrow(arrow_down);
	assert.strictEqual(arrow_down.attr('class'), `dropdown-arrow ${up}`, 'arrow class = up');
});


/* XXXXXXX cone.topnav XXXXXXX */

QUnit.skip('cone.Topnav', hooks => {

	let vp_states = ['mobile', 'small', 'medium', 'large'];

	hooks.after( () => {
		console.log('AFTER')
	})
	QUnit.module('initial load', hooks => {
		for( let i=0; i <=3; i++ ) {

			QUnit.module(`Viewport ${i}`, hooks => {
				hooks.before( () => {
					console.log('before called');
					create_topnav_elem();

					viewport.set(vp_states[i]);
					cone.viewport = new cone.ViewPort();
					cone.Topnav.initialize( $('body') );

					if(cone.topnav.vp_state === 0) {
						topnav_style_to_mobile();
					} else {
						topnav_style_to_desktop();
					}
				})

				test(`cone.viewport ${i}`, assert => {
					console.log(`cone.viewport ${i}`);
					
					assert.ok(cone.topnav instanceof cone.Topnav, 'cone.topnav instance of Topnav');
					assert.ok(cone.topnav instanceof cone.ViewPortAware, 'cone.topnav instance of ViewPortAware');
	
					//test that required elements exist
					assert.ok(cone.topnav.elem, '.elem exists');
					assert.ok(cone.topnav.logo, '.logo exists');
					assert.ok(cone.topnav.content, '.content exists');
					assert.ok(cone.topnav.toggle_button, '.toggle_button exists');
	
					assert.strictEqual(cone.topnav.vp_state, i, `topnav.vp_state ${i}`);
					assertVisibility(assert);
					
					// why does it fail?
					// if( cone.viewport.state === 0 ) {
					// 	test_toggle_menu(assert);
					// }
				})

				hooks.after( () => {
					cone.topnav = null;
					cone.viewport = null;
					$('#topnav').remove();
				})
			})
		}
	})

	QUnit.module('viewport_changed()', hooks => {

		hooks.before( () => {
			create_topnav_elem();

			viewport.set('large');
			cone.viewport = new cone.ViewPort();
			cone.Topnav.initialize( $('body') );
			topnav_style_to_desktop();
		})

		hooks.after( () => {
			console.log('after');
			cone.topnav = null;
			cone.viewport = null;
			$('#topnav').remove();
		})

		for( let i=0; i <=3; i++ ) {

			QUnit.module(`Viewport ${i}`, hooks => {
				hooks.before( () => {
					console.log('before hooks')
					viewport.set(vp_states[i]);
					cone.viewport = new cone.ViewPort();
					$(window).trigger('resize');

					if(cone.topnav.vp_state === 0) {
						topnav_style_to_mobile();
					} else {
						topnav_style_to_desktop();
					}
				})

				test(`cone.viewport ${i}`, assert => {
					console.log(`cone.viewport ${i}`);
					assertVisibility(assert);
					if( cone.viewport.state === 0 ) {
						test_toggle_menu(assert);
					}
				})

				hooks.afterEach( () => {
					console.log(`done - cone.viewport ${i}`);
				})
			})
		}
    });

	test('unload', assert => {
		create_topnav_elem();
		viewport.set('mobile');
		cone.viewport = new cone.ViewPort();
		cone.Topnav.initialize( $('body') );
		topnav_style_to_mobile();

		let display_state = cone.topnav.content.css('display');
		cone.topnav.unload();
		cone.topnav.toggle_button.trigger('click');
		assert.strictEqual( cone.topnav.content.css('display'), display_state, 'evt listener removed' );

		cone.topnav = null;
		cone.viewport = null;
		$('#topnav').remove();
	})

	test('topnav not null', assert => {
		create_topnav_elem();
		cone.viewport = new cone.ViewPort();
		cone.Topnav.initialize( $('body') );

		assert.notStrictEqual(cone.topnav, null, 'topnav is not null');
		
		cone.Topnav.initialize( $('body') );
	})

	/////////////////////////////////////////

	function assertVisibility(assert) {

		let topnav = cone.topnav;

		assert.ok(topnav.elem.is(':visible'), 'elem is visible');
		assert.strictEqual(topnav.elem.css('display'), 'flex', 'elem display is flex');
		assert.strictEqual(topnav.elem.outerHeight(), 64, 'elem height is 4rem (64px)');
		//assert.strictEqual(topnav.elem.outerWidth(), $('body').outerWidth(), 'elem width fills layout');
  
		assert.ok(topnav.logo.is(':visible'), 'logo is visible');
		let logo_img = $('img', topnav.logo);
		assert.strictEqual(logo_img.attr('src'), '/static/images/cone-logo-cone.svg', 'correct img');
		//assert.strictEqual(logo_img.outerHeight(), 32, 'logo height is 32'); // fails, why?
		//assert.strictEqual(logo_img.outerHeight(), 32, 'logo width is 32');

		if(cone.viewport.state === cone.VP_MOBILE) {
			assert.ok(topnav.elem.hasClass('mobile'), 'elem has class mobile');
			assert.ok(topnav.content.is(':hidden'), 'content is hidden');
			assert.strictEqual(topnav.toggle_button.css('display'), 'block', 'toggle btn visible');
			assert.ok(topnav.content.is(':hidden'), 'content hidden');
			assert.strictEqual($('span', topnav.logo).css('display'), 'none', 'logo title hidden');
			assert.strictEqual(topnav.elem.css('padding'), '16px', 'elem padding 16px = 1rem');
		} 
		else {
			assert.notOk(topnav.elem.hasClass('mobile'), 'elem does not have class mobile');
			assert.strictEqual(topnav.content.css('display'), 'contents', 'content has display contents');
			assert.ok(topnav.toggle_button.is(':hidden'), 'toggle btn hidden');
			assert.strictEqual(topnav.logo.css('font-size'), '24px', 'font size is 24px (1.5rem)');
			assert.ok($('span', topnav.logo).is(':visible'), 'logo title visible');
		}
	}

	function test_toggle_menu(assert) {
		assert.strictEqual(cone.topnav.content.css('display'), 'none', 'content hidden');
		
		let done = assert.async();

		cone.topnav.toggle_button.trigger('click');
		assert.strictEqual(cone.topnav.content.css('display'), 'flex', 'topnav content visible on click');

		cone.topnav.toggle_button.trigger('click');
		setTimeout(function() {
		  assert.strictEqual(cone.topnav.content.css('display'), 'none', 'display none on 2nd click')
		  done();
		}, 1000 );
	}
})


// XXXXXX cone.MainMenuTop XXXXXX

QUnit.skip( 'cone.MainMenuTop', hooks => {

	let vp_states = ['mobile', 'small', 'medium', 'large'];

	hooks.after( () => {
		console.log('AFTER MMTOP')
		console.log(cone.topnav);
		console.log(cone.main_menu_top);
	})

	QUnit.module('no sidebar', hooks => {

		QUnit.module('initial load', hooks => {

			for( let i = 0; i <= 3; i++ ) {
				QUnit.module(`Viewport ${i}`, hooks => {
					hooks.before( () => {
						console.log('before called');
						create_elems(vp_states[i]);
					})

					test('check elems', assert => {
						check_elems(assert);
					})

					hooks.after( assert => {
						console.log('after called');
						remove_elems(assert);
					})
				})
			}
		})
	})

	QUnit.module('with sidebar', hooks => {

		QUnit.module('initial load', hooks => {

			for( let i = 0; i <= 3; i++ ) {
				QUnit.module(`Viewport ${i}`, hooks => {
					hooks.before( () => {
						cone.main_menu_sidebar = true;
						console.log('before called');
						create_elems(vp_states[i]);
					})

					test('check elems', assert => {
						check_elems(assert);
					})

					hooks.after( assert => {
						console.log('after called');
						remove_elems(assert);
					})
				})
			}
		})
	})

	///////////////////////////////////////////

	function create_elems(vp) {
		console.log('create_elems called');

		create_topnav_elem();
		create_mm_top_elem();

		viewport.set(vp);
		cone.viewport = new cone.ViewPort();

		let mainmenu_elem = $('#main-menu');
		let topnav_elem = $('#topnav');

		cone.topnav = new cone.Topnav(topnav_elem);
		cone.main_menu_top = new cone.MainMenuTop(mainmenu_elem);

		if( vp === 'mobile') {
			topnav_style_to_mobile();
		} else {
			mm_top_style_to_mobile();
		}
	}

	function check_elems(assert) {
		let mm_top = cone.main_menu_top;
		assert.strictEqual(cone.main_menu_top.vp_state, cone.viewport.state, 'vp_state is viewport.state');
		assert.ok(cone.topnav, 'cone.topnav exists');
		assert.ok(mm_top.elem, 'elem exists');
		assert.ok(mm_top.main_menu_items[1], 'all 2 array children exist');

		if(mm_top.vp_state === 0) {
			assert.notStrictEqual(cone.topnav.logo.css('margin-right'), '32px', `logo margin NOT 2rem`);
			if(cone.main_menu_sidebar) {
				assert.strictEqual(mm_top.elem.css('display'), 'none', 'elem hidden');
			} else {
				assert.strictEqual(mm_top.elem.css('display'), 'flex', 'elem display is flex')
			}
		} else {
			assert.strictEqual(cone.topnav.logo.css('margin-right'), '32px', `logo margin:2rem(32px)`);
			// assert.strictEqual(mm_top.elem.css('display'), 'flex', 'elem visible'); // fails because external css styling not included
		}
	}

	function remove_elems(assert) {
		console.log('remove_elems called');

		function remove_topnav(){
			cone.topnav = null;
			//delete cone.topnav;
		}

		// timeout required - else topnav gets deleted before mainmenu
		let done = assert.async();

		setTimeout(function() {
			remove_topnav();
			done();
		}, 100 );

		cone.main_menu_top = null;
		//delete cone.main_menu_top;
		cone.viewport = null;
		//delete cone.viewport;

		$('#topnav').remove();
	}

})

// cone.MainMenuItem ///
//   let data_menu_items = `[{
// 	  "target": "#",
// 	  "description": null,
// 	  "selected": false,
// 	  "url": "#",
// 	  "id": "child_1",
// 	  "icon": "bi bi-kanban",
// 	  "title": "child_1"
// 	}]`;

// 	let item = $(`
// 	  <li class="mainmenu-item"
// 	      data-menu-items="${data_menu_items}">
// 	    <a href="#">
// 	      <i class="#"></i>
// 	      <span class="mainmenu-title">
// 	        Title
// 	      </span>
// 	    </a>
// 	    <i class="#"></i>
// 	  </li>`
// 	);

QUnit.module('cone.SidebarMenu', hooks => {

	QUnit.module('initial load', hooks => {
		hooks.before( () => {
			console.log('before initial');
		})
		hooks.after( () => {
			console.log('DONE - inital load')
		})

		for( let i = 0; i <= 3; i++ ) {
			QUnit.module(`Viewport ${i}`, hooks => {
				hooks.beforeEach( () => {
					viewport.set(vp_states[i]);
					cone.viewport = new cone.ViewPort();
					create_sidebar_elem();
					cone.SidebarMenu.initialize($('body'));
				})

				hooks.afterEach( () => {
					cone.sidebar_menu = null;
					cone.viewport = null;
					$('#sidebar_left').remove();
				})

				test('check elems', assert => {
					assert.ok(true)
					let sidebar = cone.sidebar_menu;
					check_elems(assert);
				})
			})
		}
	})

	QUnit.module('viewport_changed()', assert => {
		hooks.beforeEach( () => {
			console.log('before vp changed')
			viewport.set('large');
			cone.viewport = new cone.ViewPort();
			create_sidebar_elem();
			cone.SidebarMenu.initialize($('body'));
		})

		for( let i = 0; i <= 3; i++ ) {
			QUnit.module(`Viewport ${i}`, hooks => {
				hooks.beforeEach( () => {
					viewport.set(vp_states[i]);
					$(window).trigger('resize');
				})

				test('check elems', assert => {
					assert.ok(true)
					let sidebar = cone.sidebar_menu;
					//check_elems(assert);
				})
			})
		}

		hooks.after( () => {
			console.log('after')
			cone.sidebar_menu = null;
			cone.viewport = null;
			$('#sidebar_left').remove();
		})
	})



	/////////////////////////////////////////
	function check_elems(assert) {
		let sidebar = cone.sidebar_menu;
		assert.ok(sidebar.elem, 'elem exists');

		if(sidebar.vp_state === cone.VP_MOBILE) {
			assert.ok(sidebar.elem.hasClass('expanded'), 'sidebar class expanded');
			assert.notOk(sidebar.elem.hasClass('collapsed'), 'sidebar class not collapsed');
		} else
		if(sidebar.vp_state === cone.VP_LARGE && sidebar.cookie === null) {
			assert.ok(sidebar.elem.hasClass('expanded'), 'sidebar class expanded');
			assert.notOk(sidebar.elem.hasClass('collapsed'), 'sidebar class not collapsed');
		} else
		if(sidebar.cookie === null) {
			assert.ok(sidebar.elem.hasClass('collapsed'), 'sidebar class collapsed');
			assert.notOk(sidebar.elem.hasClass('expanded'), 'sidebar class not expanded');
		} 
	}
})

  QUnit.skip('test Sidebar', assert => {
    cone.viewport = new cone.ViewPort();
    mockViewportChange(cone.VP_LARGE);


    if(sidebar.cookie === null) {
        assert.strictEqual(sidebar.collapsed, false, 'collapsed is null');
        assert.strictEqual(sidebar.cookie, null, 'cookie is null');
    } else {
        assert.notStrictEqual(sidebar.collapsed, null, 'collapsed is not null');
        assert.notStrictEqual(sidebar.cookie, null, 'cookie is not null');
    }

    // toggle button test
    sidebar.toggle_menu();

    assert.notStrictEqual(sidebar.collapsed, null, 'collapsed after click not null');
    assert.notStrictEqual(sidebar.cookie, null, 'cookie after click not null');
    let st = sidebar.collapsed;

    sidebar.toggle_menu();
    assert.notStrictEqual(sidebar.collapsed, st, 'collapsed diff after 2. click');
  })


// XXXXXX cone.ThemeSwitcher XXXXXX
QUnit.skip('cone.ThemeSwitcher', hooks => {
	hooks.before( () => {
		console.log('before called');

		let head_styles = `
			<link href="http://localhost:8081/static/light.css" rel="stylesheet" type="text/css" media="all">
			<link href="http://localhost:8081/static/dark.css" rel="stylesheet" type="text/css" media="all">
		`;
		$('head').append(head_styles);
	})

	hooks.beforeEach( assert => {
		console.log('beforeEach called');
	});

	hooks.afterEach( () => {
		console.log('afterEach called');
		cone.theme_switcher = null;
		// delete cone.theme_switcher;
		$('#switch_mode').remove();
		$('#colormode-styles').remove();
		createCookie('modeswitch', '', -1);
	})

	hooks.after( () => {
		console.log('DONE - cone.ThemeSwitcher');
	})

	test('initial default check elems', assert => {
		create_elems();
		cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
		let switcher = cone.theme_switcher;

		assert.strictEqual(switcher.modes, cone.default_themes, 'modes is default themes');
		assert.strictEqual(switcher.current, switcher.modes[0], 'default mode light.css');
	})

	test('initial check cookie', assert => {
		create_elems();
		createCookie('modeswitch', cone.default_themes[1], null);

		cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
		let switcher = cone.theme_switcher;

		assert.strictEqual(switcher.modes, cone.default_themes, 'modes is default themes');
		assert.strictEqual(switcher.current, switcher.modes[1], 'current is dark.css');
	})

	test('switch_theme()', assert => {
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
	})


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
})

///////// html /////////


// topnav
function create_topnav_elem() {
	console.log('create_topnav_elem called');
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
	console.log('topnav_style_to_mobile() called');

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
	console.log('topnav_style_to_desktop() called');

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
	console.log('create_mm_top_elem called');
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
					Title
				</span>
			</a>
		</li>
	`;

	let mainmenu_item_menu_html = `
		<li class="mainmenu-item menu"
			style="
				display: flex;
				align-items: center;
				height: 100%;
			"
		>
			<a>
				<i class="bi bi-heart"></i>
				<span class="mainmenu-title">
					Title
				</span>
			</a>

			<i class="dropdown-arrow bi bi-chevron-down"></i>
		</li>
	`;

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
	$('#mainmenu').append(mainmenu_item_html);
	$('#mainmenu').append(mainmenu_item_menu_html);
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
	console.log('create_searchbar_elem() called');

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
	console.log('create_sidebar_elem() called');

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

const { test } = QUnit;

var vp_states = ['mobile', 'small', 'medium', 'large'];

// QUnit.begin = function() {
//     console.log('####');
// };

// QUnit.testStart = function(test) {
//     var module = test.module ? test.module : '';
//     console.log('#' + module + " " + test.name + ": started.");
// };

// QUnit.testDone = function(test) {
//     var module = test.module ? test.module : '';
//     console.log('#' + module + " " + test.name + ": done.");
//     console.log('####');
// };

// XXXXXX namespace XXXXXX
QUnit.module('cone namespace', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone Namespace');
	})

	test('test cone elems', assert => {
		console.log('- test: cone elems');
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
  	});

	hooks.after( () => {
		console.log('COMPLETE: cone Namespace');
		console.log('-------------------------------------');
	})
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

	for( let i = 0; i <= 3; i++ ) {
		QUnit.test(`vp${i}`, assert => {
			console.log(`- test: vp${i}`);
			switch_viewport(i, assert);
		})
	}
})

// XXXXXXX cone.ViewPortAware XXXXXXX
QUnit.module('cone.ViewPortAware', hooks => {

	hooks.before( () => {
		console.log('NOW RUNNING: cone.ViewPortAware');
	});

	hooks.after( () => {
		console.log('COMPLETE: cone.ViewPortAware');
		console.log('-------------------------------------');
	});

	QUnit.module('initial', hooks => {
		hooks.before( () => {
			console.log('- now running: initial');
		})

		hooks.after( () => {
			console.log('- done: initial');
		})
	
		hooks.beforeEach( () => {
			cone.viewport = new cone.ViewPort();
			test_obj = new cone.ViewPortAware();
		});

		hooks.afterEach( () => {
			cone.viewport = null;
			test_obj = null;
			delete test_obj;
		});

		let states = ['mobile', 'small', 'medium', 'large'];
		function switch_viewport(i, assert) {
			viewport.set(states[i]);
			$(window).trigger('resize');

			assert.strictEqual(cone.viewport.state, i, `cone.viewport.state is ${i}`);
			assert.strictEqual(test_obj.vp_state, cone.viewport.state, 'vp_state is cone.viewport.state');
		}

		for( let i = 0; i <= 3; i++ ) {
			QUnit.test(`vp${i}`, assert => {
				console.log(`-- test: vp${i}`);
				switch_viewport(i, assert);
			});
		}
	});

	QUnit.module('unload()', hooks => {
		hooks.before( () => {
			console.log('- now running: unload()');
			viewport.set(1800, 1024);
			cone.viewport = new cone.ViewPort();
			test_obj = new cone.ViewPortAware();
		});

		test('unload vp', assert => {
			console.log('-- test: unload vp');
			assert.strictEqual(test_obj.vp_state, cone.viewport.state, 'vp_state is cone.viewport.state');
			test_obj.unload();
			viewport.set(500, 200);
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



// XXXXXX cone.Searchbar XXXXXX

//cone.searchbar and cone.mainMenuTop seem to conflict, why??
// -> changed position from after mmtop to before mmtop

QUnit.module('cone.Searchbar', hooks => {
	let vp_states = ['mobile', 'small', 'medium', 'large'];

	hooks.before( () => {
		console.log('NOW RUNNING: cone.Searchbar');
	});

	hooks.after( () => {
		cone.searchbar = null;
		cone.viewport = null;
		$('#cone-searchbar').remove();
		console.log('COMPLETE: cone.Searchbar');
		console.log('-------------------------------------');
	})

	QUnit.module('initial load', hooks => {
		for( let i = 0; i <= 3; i++ ) {
			QUnit.module(`Viewport ${i}`, hooks => {
				hooks.beforeEach( () => {
					console.log(`- now running: Viewport ${i}`);
					viewport.set(vp_states[i]);
					cone.viewport = new cone.ViewPort();
					create_searchbar_elem();
					cone.searchbar = new cone.Searchbar( $('#cone-searchbar') );
				})

				hooks.afterEach( () => {
					cone.searchbar = null;
					cone.viewport = null;
					$('#cone-searchbar').remove();
					console.log(`- done: Viewport ${i}`);
				})

				test('check elems', assert => {
					console.log(`-- test: check elems`);
					check_elems(assert);
				})
			})
		}
	})

	QUnit.module('vp_changed()', hooks => {
		hooks.before( () => {
			console.log('- now running: vp_changed()');
			viewport.set('large');
			cone.viewport = new cone.ViewPort();
			create_searchbar_elem();
			cone.searchbar = new cone.Searchbar( $('#cone-searchbar') );
		});

		hooks.after( () => {
			console.log('- done: vp_changed()');
		})

		for( let i = 0; i <= 3; i++ ) {
			test(`Viewport ${i}`, assert => {
				console.log(`-- test: Viewport ${i}`);
				viewport.set(vp_states[i]);
				$(window).trigger('resize');
				check_elems(assert);
			})
		}
	})

	//////////////////////////////////

	function check_elems(assert) {
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
})


// XXXXXX cone.ScrollBar XXXXXX
QUnit.module( 'cone.ScrollBar', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.ScrollBar');
	})
	hooks.after( () => {
		console.log('COMPLETE: cone.ScrollBar');
		console.log('-------------------------------------');
	})

	let test_container_dim = 400,
		test_content_dim = 800,
		test_thumbsize = test_container_dim ** 2 / test_content_dim;

	QUnit.module('cone.ScrollBarX', hooks => {

		hooks.before( () => {
			//init
			console.log('- now running: cone.ScrollBarX');
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
			delete test_scrollbar_x;
			$(document).off();
			console.log('- done: cone.ScrollBarX');
		})

		test('compile()', assert => {
			console.log('-- test: compile');
			test_compile(test_scrollbar_x, assert);
			assert.ok(test_scrollbar_x.scrollbar.parents("#test-container-x").length == 1, 'container has scrollbar');
			assert.ok(test_scrollbar_x.content.parents("#test-container-x").length == 1, 'container has content');
		})

		test('update() fixed dim', assert => {
			console.log('-- test: update() fixed dim');
			update_fixed_dim(test_scrollbar_x, assert);
		});

		test('update() random dim', assert => {
			console.log('-- test: update() random dim');
			update_random_dim(test_scrollbar_x, assert);
		})

		test('mouse_in_out()', assert => {
			console.log('-- test: mouse_in_out');
			handle_mouse_in_out(test_scrollbar_x, assert);
		})

		test('scroll_handle()', assert => {
			console.log('-- test: scroll_handle');
			test_scroll_handle(test_scrollbar_x, assert);
		})

		test('click_handle()', assert => {
			console.log('-- test: click_handle');
			test_click_handle(test_scrollbar_x, assert);
		})

		test('drag_handle()', assert => {
			console.log('-- test: drag_handle');
			test_drag_handle(test_scrollbar_x, assert);
		})

		// events deleted
		test('unload()', assert => {
			console.log('-- test: unload');
			test_scrollbar_x.unload();
			assert.notOk($._data($(test_scrollbar_x.elem)[0], "events"), 'elem events removed');
			assert.notOk($._data($(test_scrollbar_x.scrollbar)[0], "events"), 'scrollbar events removed');
			// assert.notOk($._data($(test_scrollbar_x.thumb).get(0), "events")); //something fishy!
		})
    })

  	QUnit.module('cone.ScrollBarY', hooks => {
		hooks.before( () => {
			//init
			console.log('- now running: cone.ScrollBarY');
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
			delete test_scrollbar_y;
			$(document).off();
			console.log('- done: cone.ScrollBarY');
		})

		test('compile()', assert => {
			console.log('-- test: compile');
			test_compile(test_scrollbar_y, assert);
			assert.ok(test_scrollbar_y.scrollbar.parents("#test-container-y").length == 1, 'container has scrollbar');
			assert.ok(test_scrollbar_y.content.parents("#test-container-y").length == 1, 'container has content');
		})

		test('update() fixed dim', assert => {
			console.log('-- test: update() fixed dim');
			update_fixed_dim(test_scrollbar_y, assert);
		});

		test('update() random dim', assert => {
			console.log('-- test: update() random dim');
			update_random_dim(test_scrollbar_y, assert);
		})

		test('mouse_in_out()', assert => {
			console.log('-- test: mouse_in_out');
			handle_mouse_in_out(test_scrollbar_y, assert);
		})

		test('scroll_handle()', assert => {
			console.log('-- test: scroll_handle');
			test_scroll_handle(test_scrollbar_y, assert);
		})

		test('click_handle()', assert => {
			console.log('-- test: click_handle');
			test_click_handle(test_scrollbar_y, assert);
		})

		test('drag_handle()', assert => {
			console.log('-- test: drag_handle');
			test_drag_handle(test_scrollbar_y, assert);
		})

		// events deleted
		test('unload()', assert => {
			console.log('-- test: unload');
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

test('Test cone.toggle_arrow', assert => {
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

QUnit.module('cone.Topnav', hooks => {

	hooks.before ( () => {
		console.log('NOW RUNNING: cone.Topnav');
	})
	hooks.after( () => {
		cone.topnav = null;
		cone.viewport = null;
		$('#topnav').remove();
		console.log('COMPLETE: cone.Topnav');
		console.log('-------------------------------------');
	})

	QUnit.module('initial load', () => {
		for( let i=0; i <=3; i++ ) {

			QUnit.module(`Viewport ${i}`, hooks => {
				hooks.before( () => {
					console.log(`- now running: initial Viewport ${i}`);
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
					console.log(`-- test: cone.viewport ${i}`);
					
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
					console.log(`- done: initial Viewport ${i}`);
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
			cone.topnav = null;
			cone.viewport = null;
			$('#topnav').remove();
		})

		for( let i=0; i <=3; i++ ) {

			QUnit.module(`Viewport ${i}`, hooks => {
				hooks.before( () => {
					console.log(`- now running: change to Viewport ${i}`);
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
					console.log(`-- test: cone.viewport ${i}`);
					assertVisibility(assert);
					if( cone.viewport.state === 0 ) {
						test_toggle_menu(assert);
					}
				})

				hooks.afterEach( () => {
					console.log(`- done: change to Viewport ${i}`);
				})
			})
		}
    });

	test('unload', assert => {
		console.log(`- test: unload`);
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
		console.log(`- test: not null`);
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


QUnit.module('cone.SidebarMenu', hooks => {

	let elem = $('#sidebar_left');

	hooks.before( function() {
		console.log('NOW RUNNING: cone.SidebarMenu');
	});

	hooks.after( () => {
		cone.sidebar_menu = null;
		cone.viewport = null;
		elem.remove();

		console.log('COMPLETE: cone.SidebarMenu')
		console.log('-------------------------------------');
	});

	QUnit.module('initial load', () => {

		for( let i = 0; i <= 3; i++ ) {
			QUnit.module(`Viewport ${i}`, hooks => {
				hooks.before( () => {
					viewport.set(vp_states[i]);
					cone.viewport = new cone.ViewPort();

					create_sidebar_elem();
					cone.SidebarMenu.initialize($('body'));
				});

				hooks.after( () => {
					cone.sidebar_menu = null;
					cone.viewport = null;
					elem.remove();
				});

				test('check elems', assert => {
					console.log(`-- test: initial load Viewport ${i}`);
					check_elems(assert);
				});
			});
		}
	});

	QUnit.module.todo('viewport_changed()', hooks => {

		hooks.before( () => {
			console.log('- now running: viewport_changed()');

			viewport.set('large');
			cone.viewport = new cone.ViewPort();
			create_sidebar_elem();
			cone.SidebarMenu.initialize($('body'));
		});

		hooks.after( () => {
			console.log('- DONE: viewport_changed()');
			cone.viewport = null;
			cone.sidebar_menu = null;
			elem.remove();
		});

		for( let i = 0; i <= 3; i++ ) {
			QUnit.module(`Viewport ${i}`, hooks => {
				hooks.before( () => {
					viewport.set(vp_states[i]);
					$(window).trigger('resize');
				});

				test('check elems', assert => {
					console.log(`-- test: change to Viewport ${i}`);
					assert.ok(true)
					let sidebar = cone.sidebar_menu;
					check_elems(assert);
				});

				hooks.after( () => {
					cone.viewport = null;
				});
			});
		}
	});

	QUnit.module('toggle_lock()', () => {

		QUnit.module('no cookie', hooks => {
			hooks.before( () => {
				console.log( '-- now running: no cookie' );
	
				viewport.set('large');
				cone.viewport = new cone.ViewPort();
				create_sidebar_elem();
				cone.SidebarMenu.initialize( $('body') );
			});

			hooks.after( () => {
				console.log( '-- DONE: no cookie' );
				cone.viewport = null;
				cone.sidebar_menu = null;
				elem.remove();
			});

			test('initial no cookie', assert => {
				let sidebar = cone.sidebar_menu;
				console.log( '--- test: initial (no cookie)' );
	
				assert.notOk( readCookie('sidebar'), 'no sidebar cookie' );
				assert.notOk( sidebar.cookie, 'no sidebar_menu cookie' );
				assert.notOk( sidebar.lock_switch.hasClass('active'), 'lock_switch doesnt have class active' );
	
				sidebar.lock_switch.trigger('click');
	
				assert.ok( sidebar.lock_switch.hasClass('active') );
				assert.strictEqual( readCookie('sidebar'), 'false' );
				assert.strictEqual( sidebar.collapsed, false );
				
				sidebar.toggle_btn.trigger('click');
				assert.strictEqual( sidebar.collapsed, false );
	
				check_collapsed(assert);
			})
	
			test('vp_changed()', assert => {
				let sidebar = cone.sidebar_menu;
				console.log( '--- test: vp_changed()' );
	
				viewport.set('small');
				$(window).trigger('resize');
				assert.strictEqual( sidebar.collapsed, false );
				check_collapsed(assert);
	
				viewport.set('mobile');
				$(window).trigger('resize');
				assert.strictEqual( sidebar.collapsed, false );
				check_collapsed(assert);
	
				viewport.set('large');
				$(window).trigger('resize');
				assert.strictEqual( sidebar.collapsed, false );
				check_collapsed(assert);
			})
	
			test('second click', assert => {
				let sidebar = cone.sidebar_menu;
				console.log( '--- test: second click' );
	
				sidebar.lock_switch.trigger('click');
	
				assert.notOk( sidebar.lock_switch.hasClass('active') );
				assert.strictEqual( readCookie('sidebar'), null );
				assert.strictEqual( sidebar.collapsed, false );
				
				sidebar.toggle_btn.trigger('click');
				assert.strictEqual( sidebar.collapsed, true );
	
				check_collapsed(assert);
			})
		});

		QUnit.module('with cookie', hooks => {
			hooks.before( () => {
				console.log( '-- now running: with cookie' );
				createCookie('sidebar', 'true', null);

				viewport.set('large');
				cone.viewport = new cone.ViewPort();
				create_sidebar_elem();
				cone.SidebarMenu.initialize( $('body') );
			});

			hooks.after( () => {
				console.log( '-- DONE: with cookie' );
			});

			test('initial no cookie', assert => {
				let sidebar = cone.sidebar_menu;
				console.log( '--- test: initial (with cookie)' );

				assert.strictEqual( sidebar.cookie, true );
				assert.strictEqual( sidebar.collapsed, true );
				check_collapsed(assert);

				assert.ok( sidebar.lock_switch.hasClass('active') );

				sidebar.lock_switch.trigger('click');

				assert.notOk( sidebar.lock_switch.hasClass('active') );
				assert.strictEqual( readCookie('sidebar'), null );

				sidebar.toggle_btn.trigger('click');
				assert.strictEqual( sidebar.collapsed, false );
				check_collapsed(assert);
			})
	
			test('vp_changed()', assert => {
				let sidebar = cone.sidebar_menu;
				console.log( '--- test: vp_changed()' );
	
				viewport.set('small');
				$(window).trigger('resize');
				assert.strictEqual( sidebar.collapsed, true );
				check_collapsed(assert);
	
				viewport.set('mobile');
				$(window).trigger('resize');
				assert.strictEqual( sidebar.collapsed, false );
				check_collapsed(assert);
	
				viewport.set('large');
				$(window).trigger('resize');
				assert.strictEqual( sidebar.collapsed, false );
				check_collapsed(assert);
			})

		});

		test('unload()', assert => {
			console.log('- test: unload()');
			assert.ok(true);

			let collapsed = cone.sidebar_menu.collapsed;
			let switch_state = cone.sidebar_menu.lock_switch.hasClass('active');
			cone.sidebar_menu.unload();
			cone.sidebar_menu.toggle_btn.trigger('click');
			cone.sidebar_menu.lock_switch.trigger('click');

			assert.strictEqual(collapsed, cone.sidebar_menu.collapsed);
			assert.strictEqual(switch_state, cone.sidebar_menu.lock_switch.hasClass('active'));
		});

	});


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
		} /* else
		if(sidebar.cookie === null) {
			assert.ok(sidebar.elem.hasClass('collapsed'), 'sidebar class collapsed');
			assert.notOk(sidebar.elem.hasClass('expanded'), 'sidebar class not expanded');
		}  */
	}

	function check_collapsed(assert) {
		let sidebar = cone.sidebar_menu;

		if( sidebar.collapsed === true ) {
			assert.ok(sidebar.elem.hasClass('collapsed'), 'sidebar class collapsed');
			assert.notOk(sidebar.elem.hasClass('expanded'), 'sidebar class not expanded');
			assert.strictEqual( sidebar.toggle_arrow_elem.attr('class'), 'bi bi-arrow-right-circle' );
		} else
		if( sidebar.collapsed === false ) {
			assert.ok(sidebar.elem.hasClass('expanded'), 'sidebar class expanded');
			assert.notOk(sidebar.elem.hasClass('collapsed'), 'sidebar class not collapsed');
			assert.strictEqual( sidebar.toggle_arrow_elem.attr('class'), 'bi bi-arrow-left-circle' );
		} else {
			console.log('else???')
		}
	}
});




// XXXXXX cone.MainMenuTOP XXXXXX
QUnit.module('cone.MainMenu TOP', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.MainMenuTop');
	});

	hooks.after( () => {
		console.log('COMPLETE: cone.MainMenuTop');
		console.log('-------------------------------------');
	});

	QUnit.module('initial load', () => {
		for( let i=0; i <=3; i++ ) {
			QUnit.module(`Viewport ${i}`, hooks => {
				hooks.before( () => {
					console.log(`- now running: initial load Viewport ${i}`);
					viewport.set(vp_states[i]);
					cone.viewport = new cone.ViewPort();

					initialize_elems();
					$(window).off('viewport_changed');

					if(cone.viewport.state === 0) {
						topnav_style_to_mobile();
					} else {
						topnav_style_to_desktop();
					}
				});

				if(i === 0) {
					test('mobile creation', assert => {
						console.log('-- test: test mobile elems');
						assert.ok(true)
						check_elems(assert);
					});
				} else {
					test('check main_menu_items creation', assert => {
						console.log('-- test: test desktop elems');
						assert.ok(true)
					});
				}

				hooks.after( () => {
					console.log('remove elems');

					cone.topnav = null;
					cone.main_menu_top = null;

					$('#topnav').remove();
				});
			});
		}
	});

	QUnit.test('handle_scrollbar()', assert => {
		viewport.set('medium');
		cone.viewport = new cone.ViewPort();
		initialize_elems();

		console.log('- test: handle_scrollbar()');
		let item = cone.main_menu_top.main_menu_items[0];

		// overwrite method
		cone.MainMenuItem.prototype.change_toggle = function() {
			this.mouseenter_toggle = function() {
				assert.step( "mouseenter happened" );
			}
			this._toggle = this.mouseenter_toggle.bind(this);
			this.elem.off().on('mouseenter mouseleave', this._toggle);
		}
		item.change_toggle();

		// function not called
		$(window).trigger('dragstart');
		item.elem.trigger('mouseenter');
		assert.verifySteps([]);

		// function called
		$(window).trigger('dragend');
		item.elem.trigger('mouseenter');
		assert.verifySteps(["mouseenter happened"]);

		// cleanup
		cone.main_menu_top = null;
		cone.topnav = null;
		$('#topnav').remove();
		$('.cone-mainmenu-dropdown').remove();
	})

	QUnit.test.todo('super.unload()', assert => {
		console.log('- test: super.unload()');
		viewport.set('large');
		cone.viewport = new cone.ViewPort();
		initialize_elems();

		// overwrite method
		cone.ViewPortAware.prototype.change_super_unload = function() {
			this.unload = function() {
				$(window).off('viewport_changed', this._viewport_changed_handle);
				assert.step( "super.unload() happened" );
			}
		}
		cone.main_menu_top.change_super_unload();
		cone.main_menu_top.unload();

		// unload called
		assert.verifySteps(["super.unload() happened"]);

		// cleanup
		cone.main_menu_top = null;
		cone.topnav = null;
		$('#topnav').remove();
		$('.cone-mainmenu-dropdown').remove();
	})

	QUnit.test('unload() called', assert => {
		console.log('- test: unload() called');
		viewport.set('large');
		cone.viewport = new cone.ViewPort();
		initialize_elems();

		// overwrite method
		cone.MainMenuTop.prototype.change_unload = function() {
			this.unload = function() {
				assert.step( "unload() happened" );
			}
		}
		cone.main_menu_top.change_unload();
		cone.MainMenuTop.initialize();
		$(window).off('viewport_changed');

		// unload called
		assert.verifySteps(["unload() happened"]);

		// cleanup
		cone.main_menu_top = null;
		cone.topnav = null;
		$('#topnav').remove();
		$('.cone-mainmenu-dropdown').remove();
	})

	QUnit.test('mobile with sidebar', assert => {
		console.log(`- test: initial load mobile with sidebar`);
		viewport.set('mobile');
		cone.viewport = new cone.ViewPort();
		create_sidebar_elem();
		create_mm_sidebar_elem();
		create_topnav_elem();
		create_mm_top_elem();
		cone.Topnav.initialize();
		cone.SidebarMenu.initialize();
		cone.MainMenuSidebar.initialize();
		cone.MainMenuTop.initialize();
		topnav_style_to_mobile();

		assert.ok( $('main-menu', cone.topnav.content) )
		assert.strictEqual(cone.main_menu_top.vp_state, 0);
		assert.strictEqual( $('#topnav-content > #main-menu').length, 1 );
		assert.strictEqual( $('#topnav-content > #mainmenu_sidebar').length, 1 );

		assert.strictEqual( cone.main_menu_top.elem.css('display'), 'none' );
		assert.strictEqual( cone.main_menu_sidebar.elem.css('display'), 'block' );


		// cleanup
		cone.main_menu_top = null;
		cone.topnav = null;
		$(window).off('viewport_changed');
		cone.main_menu_sidebar = null;
		cone.sidebar_menu = null;
		$('#topnav').remove();
		$('.cone-mainmenu-dropdown').remove();
		$('#sidebar_left').remove();
	})

	QUnit.module('viewport changed', () => {

		QUnit.module('no sidebar', hooks => {
			hooks.before( () => {
				console.log('- now running: no sidebar | vp changed');
				viewport.set('large');
				cone.viewport = new cone.ViewPort();
				initialize_elems();
				topnav_style_to_desktop();
			});

			hooks.after( () => {
				cone.main_menu_top = null;
				cone.topnav = null;
				console.log('- done: no sidebar | vp changed')
			});

			for(let i=0; i<=3; i++) {
				QUnit.module(`Viewport ${i}`, () => {
					test('resize', assert => {
						console.log('-- test: resize: ' + i);
						assert.ok(true)
						viewport.set(vp_states[i]);
						$(window).trigger('resize');

						let mm_top = cone.main_menu_top;

						if(mm_top.vp_state === 0) {
							topnav_style_to_mobile();
						} else {
							topnav_style_to_desktop();
						}
					});
				});
			}
		});

		QUnit.module('with sidebar', hooks => {
			hooks.before( () => {
				console.log('- now running: sidebar | vp changed');
				viewport.set('large');
				cone.viewport = new cone.ViewPort();
				create_sidebar_elem();
				create_mm_sidebar_elem();
				cone.SidebarMenu.initialize();
				cone.MainMenuSidebar.initialize();
				initialize_elems();
				topnav_style_to_desktop();
			});

			hooks.after( () => {
				cone.main_menu_top = null;
				cone.topnav = null;
				cone.sidebar_menu = null;
				cone.main_menu_sidebar = null;
				$('#topnav').remove();
				$('#sidebar_left').remove();
				console.log('- done: no sidebar | vp changed')
			});

			for(let i=0; i<=3; i++) {
				QUnit.module(`Viewport ${i}`, () => {
					test('resize', assert => {
						assert.ok(true)
						console.log('-- test: resize: ' + i);
						viewport.set(vp_states[i]);
						$(window).trigger('resize');
						let mm_top = cone.main_menu_top;

						if(mm_top.vp_state === 0) {
							topnav_style_to_mobile();
						} else {
							topnav_style_to_desktop();
						}
					});
				});
			}
		});
	});

	//////////////////////////////////

	function initialize_elems() {
		create_topnav_elem();
		create_mm_top_elem();
		create_mm_items(1);
		cone.Topnav.initialize();
		cone.MainMenuTop.initialize();
	}

	function check_elems(assert) {
		let mm_top = cone.main_menu_top;
		assert.strictEqual(cone.main_menu_top.vp_state, cone.viewport.state, 'vp_state is viewport.state');
		assert.ok(cone.topnav, 'cone.topnav exists');
		assert.ok(mm_top.elem, 'elem exists');

		if(mm_top.vp_state === 0) {
			assert.notStrictEqual(cone.topnav.logo.css('margin-right'), '32px', `logo margin NOT 2rem`);
			if(cone.main_menu_sidebar !== null) {
				assert.strictEqual(mm_top.elem.css('display'), 'none', 'elem hidden');
			} else {
				assert.strictEqual(mm_top.elem.css('display'), 'flex', 'elem display is flex')
			}
		} else {
			assert.strictEqual(cone.topnav.logo.css('margin-right'), '32px', `logo margin:2rem(32px)`);
			// assert.strictEqual(mm_top.elem.css('display'), 'flex', 'elem visible'); // fails because external css styling not included
		}
	}
});


// XXXXXX cone.MainMenuSidebar XXXXXX
QUnit.module('cone.MainMenuSidebar', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.MainMenuSidebar');
	});

	hooks.after( () => {
		console.log('COMPLETE: cone.MainMenuSidebar');
		console.log('-------------------------------------');
	});

	QUnit.module('constructor', hooks => {
		hooks.before( () => {
			console.log('beforeEach');
			create_sidebar_elem();
			create_mm_sidebar_elem();
			cone.SidebarMenu.initialize();
			cone.MainMenuSidebar.initialize();
		})
		QUnit.test.only('elements', assert => {
			console.log('- test: elements');
			let mm_sb = cone.main_menu_sidebar;
			assert.ok(mm_sb instanceof cone.ViewPortAware);
			assert.strictEqual(mm_sb.elem.attr('id'), 'mainmenu_sidebar');
		})

		QUnit.test.only('initial_cookie()', assert => {
			console.log('- test: initial_cookie()');
			let mm_sb = cone.main_menu_sidebar;
			assert.notOk(readCookie('sidebar menus'));

			let test_display_data = [];
			for(let elem of mm_sb.menus) {
				test_display_data.push('none');
			}
			assert.deepEqual(mm_sb.display_data, test_display_data);
		});

		QUnit.test.only('initial_cookie() with cookie', assert => {
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
		})

		QUnit.test.only('vp mobile', assert => {
			console.log('- test: mv_to_mobile called');
			cone.sidebar_menu = null;
			cone.main_menu_sidebar = null;
			cone.viewport = null;

			cone.MainMenuSidebar.prototype.change_mv_to_mobile = function() {
				this.mv_to_mobile = function() {
					assert.step( "mv_to_mobile() happened" );
				}
			}
			cone.MainMenuSidebar.mv_to_mobile = function() {
				assert.step( "mv_to_mobile() happened" );
			}

			viewport.set('mobile');
			cone.viewport = new cone.ViewPort();

			create_topnav_elem();
			cone.Topnav.initialize();
			cone.SidebarMenu.initialize();
			cone.MainMenuSidebar.initialize();
			// cone.main_menu_sidebar.change_mv_to_mobile();

			$(window).off('viewport_changed');
			let mm_sb = cone.main_menu_sidebar;
			// overwrite method
			assert.verifySteps(["mv_to_mobile() happened"]);

		})

		hooks.after( () => {
			cone.sidebar_menu = null;
			cone.main_menu_sidebar = null;
			$('#sidebar_left').remove();
			console.log('afterEach')
		})
	})


})


// XXXXXX cone.MainMenuItem XXXXXX
QUnit.module('cone.MainMenuItem', hooks => {
	hooks.before( () => {
		console.log('NOW RUNNING: cone.MainMenuItem');
	});

	hooks.after( () => {
		console.log('COMPLETE: cone.MainMenuItem');
		console.log('-------------------------------------');
	});

	QUnit.module('initial load', () => {

		for( let i=0; i <=3; i++ ) {
			QUnit.module(`Viewport ${i}`, hooks => {
				hooks.before( () => {
					console.log(`- now running: initial load Viewport ${i}`);
					viewport.set(vp_states[i]);
					cone.viewport = new cone.ViewPort();
					
					initialize_elems();
					$(window).off('viewport_changed');

					if(cone.viewport.state === 0) {
						topnav_style_to_mobile();
					} else {
						topnav_style_to_desktop();
					}
				});

				if(i === 0) {
					test('mobile creation', assert => {
						console.log('-- test: test mobile elems');
						test_mobile_elem(assert);
					});
				} else {
					test('check main_menu_items creation', assert => {
						console.log('-- test: test desktop elems');
						test_desktop_elem(assert);
					});
					test('mouseenter toggle', assert => {
						console.log('-- test: mouseenter toggle');
						check_mouseenter_toggle(assert);
					});
				}

				hooks.after( () => {
					console.log('remove elems');

					cone.topnav = null;
					cone.main_menu_top = null;
				});
			});
		}
	});

	QUnit.module('viewport changed', () => {

		QUnit.module('no sidebar', hooks => {
			hooks.before( () => {
				console.log('- now running: no sidebar | vp changed');
				viewport.set('large');
				cone.viewport = new cone.ViewPort();
				initialize_elems();
				topnav_style_to_desktop();
			});

			hooks.after( () => {
				cone.main_menu_top = null;
				cone.topnav = null;
				console.log('- done: no sidebar | vp changed')
			});

			for(let i=0; i<=3; i++) {
				QUnit.module(`Viewport ${i}`, () => {
					test('resize', assert => {
						console.log('-- test: resize: ' + i);
						viewport.set(vp_states[i]);
						$(window).trigger('resize');

						let mm_top = cone.main_menu_top;
						let item = mm_top.main_menu_items[0];
						assert.strictEqual(cone.viewport.state, item.vp_state);

						if(item.vp_state === 0) {
							topnav_style_to_mobile();
							test_mobile_elem(assert);
						} else {
							test_desktop_elem(assert);
							check_mouseenter_toggle(assert);
						}
					});
				});
			}
		});

		QUnit.module('with sidebar', hooks => {
			hooks.before( () => {
				console.log('- now running: sidebar | vp changed');
				viewport.set('large');
				cone.viewport = new cone.ViewPort();
				create_sidebar_elem();
				create_mm_sidebar_elem();
				cone.SidebarMenu.initialize();
				cone.MainMenuSidebar.initialize();
				initialize_elems();
				topnav_style_to_desktop();
			});

			hooks.after( () => {
				cone.main_menu_top = null;
				cone.topnav = null;
				cone.sidebar_menu = null;
				cone.main_menu_sidebar = null;
				$('#topnav').remove();
				$('#sidebar_left').remove();
				console.log('- done: no sidebar | vp changed')
			});

			for(let i=0; i<=3; i++) {
				QUnit.module(`Viewport ${i}`, () => {
					test('resize', assert => {
						console.log('-- test: resize: ' + i);
						viewport.set(vp_states[i]);
						$(window).trigger('resize');
						let mm_top = cone.main_menu_top;
						let item = mm_top.main_menu_items[0];
						assert.strictEqual(cone.viewport.state, item.vp_state);

						if(item.vp_state === 0) {
							topnav_style_to_mobile();
							test_mobile_elem(assert);
						} else {
							test_desktop_elem(assert);
							check_mouseenter_toggle(assert);
						}
					});
				});
			}

			test('mv_to_top cancel', assert=> {
				assert.ok(true);
				let mm_top = cone.main_menu_top;
				let item = mm_top.main_menu_items[0];
				item.mv_to_mobile(); // should return
				// check if still correct
			});
		});
	});

	//////////////////////////////////

	function initialize_elems() {
		create_topnav_elem();
		create_mm_top_elem();
		create_mm_items(1);
		cone.Topnav.initialize();
		cone.MainMenuTop.initialize();
	}

	function check_mouseenter_toggle(assert){
		let mm_top = cone.main_menu_top;

		let item = mm_top.main_menu_items[0];
		assert.strictEqual(item.children.length, 3);
		assert.ok(item.children);
		assert.ok(item.menu);
		assert.strictEqual(item.menu.css('display'), 'none');

		item.elem.trigger('mouseenter');
		assert.strictEqual(item.menu.css('display'), 'block');

		// mouseleave on elem
		item.elem.trigger('mouseleave');
		assert.strictEqual(item.menu.css('display'), 'none');

		// mouseleave on menu
		item.elem.trigger('mouseenter');
		assert.strictEqual(item.menu.css('display'), 'block');
		item.menu.trigger('mouseleave');
		assert.strictEqual(item.menu.css('display'), 'none');

		// switch from item to item
		// item.elem.trigger('mouseenter');
		// assert.strictEqual(item.menu.css('display'), 'block');
		// item.menu.trigger('mouseleave');
		// assert.strictEqual(item.menu.css('display'), 'none');
	}

	function test_mobile_elem(assert) {
		let mm_top = cone.main_menu_top;
		let item = mm_top.main_menu_items[0];
		item.menu.css('display', 'none'); // hidden via css
		assert.strictEqual(item.vp_state, 0);

		if(cone.main_menu_sidebar) {
			console.log('sidebar')
		} else {
			assert.strictEqual(item.elem.css('display'), 'flex');
			assert.strictEqual(item.menu.css('display'), 'none');
			// TODO: check if menu appended to elem
			item.elem.trigger('mouseenter');
			assert.strictEqual(item.menu.css('display'), 'none', 'elem off click'); // elem off

			// assert.strictEqual(item.menu.css('display'), 'none');
			item.arrow.trigger('click');
			assert.strictEqual(item.menu.css('display'), 'block');

			item.arrow.trigger('click');

			let done = assert.async();
			setTimeout(function() {
				assert.strictEqual(item.menu.css('display'), 'none');
				done();
			}, 500);
		}
	}

	function test_desktop_elem(assert) {
		let mm_top = cone.main_menu_top;
		let item = mm_top.main_menu_items[0];
		item.menu.hide(); // hidden via css

		assert.strictEqual(item.children.length, 3);
		assert.ok(item.children);
		assert.ok(item.menu);
	}
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
	})


	hooks.afterEach( () => {
		cone.theme_switcher = null;
		$('#switch_mode').remove();
		$('#colormode-styles').remove();
		createCookie('modeswitch', '', -1);
	})

	hooks.after( () => {
		console.log('COMPLETE: cone.ThemeSwitcher');
		console.log('-------------------------------------');
	})

	test('initial default check elems', assert => {
		console.log('- test: initial default check');
		create_elems();
		cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
		let switcher = cone.theme_switcher;

		assert.strictEqual(switcher.modes, cone.default_themes, 'modes is default themes');
		assert.strictEqual(switcher.current, switcher.modes[0], 'default mode light.css');
	})

	test('initial check cookie', assert => {
		console.log('- test: initial cookie check');
		create_elems();
		createCookie('modeswitch', cone.default_themes[1], null);

		cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
		let switcher = cone.theme_switcher;

		assert.strictEqual(switcher.modes, cone.default_themes, 'modes is default themes');
		assert.strictEqual(switcher.current, switcher.modes[1], 'current is dark.css');
	})

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

		  <li class="active node_child_1 sb-menu">
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
		</ul>
	`;

	$('#sidebar_content').append(mm_sidebar_html);
}


// mainmenu items

function create_mm_items(count) {
	let data_menu_items =
		[
			{
				"selected": false,
				"icon": "bi bi-kanban",
				"id": "child_1",
				"description": null,
				"url": "http://localhost:8081/child_1/child_1",
				"target": "http://localhost:8081/child_1/child_1",
				"title": "child_1"
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

		$('#main-menu').append(mainmenu_item_html);

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

		$('#main-menu').append(mainmenu_item_html);
}

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

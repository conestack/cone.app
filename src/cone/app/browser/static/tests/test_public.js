// isolated scrollbar tests
// all other tests in test_public.bak.js

QUnit.module('cone.ScrollBar', hooks => {
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

	QUnit.module('constructor', hooks => {
		hooks.beforeEach( () => {
			let scrollbar_test_elem = `
				<div style="width:${test_container_dim}px;
							height:200px;
							overflow:hidden;
							left:0;
							top:0;
							position:absolute;"
					id="test-container"
				>
					<div style="width:${test_content_dim}px; height:200px; position:relative;">
					</div>
				</div>
			`;
			$('body').append(scrollbar_test_elem);
		});
		hooks.afterEach( () => {
			$('#test-container').remove();
			scrollbar = null;
			delete scrollbar;
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

			scrollbar = new cone.ScrollBar( $('#test-container') );

			let done = assert.async();
			setTimeout( function() {
				scrollbar.elem.css('width', '202px');
				done();
			}, 501);

			let done2 = assert.async();
			setTimeout( function() {
				assert.verifySteps([
					'observe_container()',
					'update()',
					'update()'
				]);
				scrollbar.scrollbar_observer.unobserve(scrollbar.elem.get(0));
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
			let scrollbar_test_elem = `
				<div style="width:${test_container_dim}px;
							height:200px;
							overflow:hidden;
							left:0;
							top:0;
							position:absolute;"
					id="test-container"
				>
					<div style="width:${test_content_dim}px; height:200px; position:relative;">
					</div>
				</div>
			`;
			$('body').append(scrollbar_test_elem);
		});
		hooks.afterEach( () => {
			$('#test-container').remove();
			scrollbar = null;
			delete scrollbar;
		});

		QUnit.test('observe_container()', assert => {
			let update_origin = cone.ScrollBar.prototype.update;
			cone.ScrollBar.prototype.update = function() {
				assert.step('update()');
			}
			scrollbar = new cone.ScrollBar( $('#test-container') );

			let done = assert.async();
			setTimeout( () => {
				assert.verifySteps(['update()']);
				scrollbar.scrollbar_observer.unobserve(scrollbar.elem.get(0));
				done();
			}, 600);

			cone.ScrollBar.prototype.observe_container = update_origin;
		});

		QUnit.test('unload()', assert => {
			scrollbar = new cone.ScrollBar( $('#test-container') );
			scrollbar.scrollbar.on('click', () => {
				assert.step('scrollbar click');
			});
			scrollbar.elem.on('click', () => {
				assert.step('elem click');
			});
			scrollbar.thumb.on('click', () => {
				assert.step('thumb click');
			});

			scrollbar.unload();
			scrollbar.scrollbar.trigger('click');
			scrollbar.elem.trigger('click');
			scrollbar.thumb.trigger('click');

			assert.verifySteps([]);
		});

		QUnit.test('mouse_in_out()', assert => {
			scrollbar = new cone.ScrollBar( $('#test-container') );
			scrollbar.scrollbar.css('display', 'none');

			scrollbar.contentsize = 2;
			scrollbar.scrollsize = 1;
			scrollbar.elem.trigger('mouseenter');
			assert.strictEqual(scrollbar.scrollbar.css('display'), '');

			scrollbar.elem.trigger('mouseleave');
			let done = assert.async();
			setTimeout( () => {
				assert.strictEqual(scrollbar.scrollbar.css('display'), 'none');
				done();
			}, 1000);
		});

		QUnit.test.only('scroll_handle()', assert => {
			let set_position_origin = cone.ScrollBar.prototype.set_position;
			cone.ScrollBar.prototype.set_position = function() {
				assert.step('set_position()');
			}
			scrollbar = new cone.ScrollBar( $('#test-container') );
			scrollbar.contentsize = 1;
			scrollbar.scrollsize = 2;
			scrollbar.scroll_handle();

			scrollbar.scrollsize = test_container_dim;
			scrollbar.contentsize = test_content_dim;

			$(window).on('syntheticWheel', scrollbar._scroll);

			assert.strictEqual(scrollbar.position, 0, 'position 0 before scroll');

			let scroll_up = $.event.fix( new WheelEvent("syntheticWheel", {"deltaY": 1, "deltaMode": 0}) ),
				scroll_down = $.event.fix( new WheelEvent("syntheticWheel", {"deltaY": -1, "deltaMode": 0}) );

			$(window).trigger(scroll_up);
			assert.strictEqual(scrollbar.position, 10);

			$(window).trigger(scroll_down);
			assert.strictEqual(scrollbar.position, 0);

			assert.verifySteps([
				'set_position()',
				'set_position()'
			]);

			cone.ScrollBar.prototype.set_position = set_position_origin;
		});

	});
});

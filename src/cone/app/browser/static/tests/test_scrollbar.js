///////////////////////////////////////////////////////////////////////////////
// scrollbar test helpers
///////////////////////////////////////////////////////////////////////////////

function create_scrollbar_elem(dir) {
    if (dir === 'x') {
        container_width = 200;
        container_height = 200;
        content_width = 400;
        content_height = 200;
    } else if (dir === 'y') {
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
             id="test-container">
          <div style="width:${content_width}px;
                      height:${content_height};
                      position:relative;">
          </div>
        </div>
    `;
    $('body').append(scrollbar_test_elem);
}

function test_compile(assert) {
    assert.ok(test_scrollbar instanceof cone.ScrollBar);

    let done = assert.async();
    setTimeout(() => {
        assert.ok(test_scrollbar.content.hasClass('scroll-content'));
        assert.ok(test_scrollbar.elem.hasClass('scroll-container'));
        assert.strictEqual($('#test-container > .scrollbar').length, 1);
        assert.strictEqual(
            $('#test-container > .scrollbar > .scroll-handle').length,
            1
        );
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

///////////////////////////////////////////////////////////////////////////////
// scrollbar tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('cone.ScrollBar', hooks => {
	hooks.before( () => {
        console.log('Set up cone.ScrollBar tests');
	});
	hooks.after( () => {
        console.log('Tear down cone.ScrollBar tests');
	});

	let test_container_dim = 400,
		test_content_dim = 800;

	QUnit.module('constructor', hooks => {
        let TestScrollbar,
            test_scrollbar;

		hooks.before(assert => {
            console.log('Set up cone.ScrollBar.constructor tests');

            // add dummy scrollbar element to DOM
            create_scrollbar_elem('x');

            // dummy scrollbar class
            TestScrollbar = class extends cone.ScrollBar {
                compile() {
                    assert.step('compile()');
                }
                update() {
                    assert.step('update()');
                }
            }
		});

		hooks.after(() => {
            console.log('Tear down cone.ScrollBar.constructor tests');

            // remove dummy scrollbar fromDOM
            $('#test-container').remove();

            // unload and delete scrollbar instance
            test_scrollbar.unload();
            delete test_scrollbar;
		});

		QUnit.test('load properties', assert => {
            // create test scrollbar element
			test_scrollbar = new TestScrollbar($('#test-container'));

            // scroll container
            assert.ok(test_scrollbar.elem);
            assert.ok(test_scrollbar.elem.is('div'));

			// content
            assert.ok(test_scrollbar.content);

			// scrollbar
            assert.ok(test_scrollbar.scrollbar);
            assert.ok(test_scrollbar.scrollbar.is('div'));
            assert.ok(test_scrollbar.scrollbar.hasClass('scrollbar'));

			// thumb
            assert.ok(test_scrollbar.thumb);
            assert.ok(test_scrollbar.thumb.is('div'));
            assert.ok(test_scrollbar.thumb.hasClass('scroll-handle'));

			// position related
            assert.strictEqual(test_scrollbar.position, 0);
            assert.strictEqual(test_scrollbar.unit, 10);

            // verify private functions
            assert.ok(test_scrollbar._scroll);
            assert.ok(test_scrollbar._click_handle);
            assert.ok(test_scrollbar._drag_handle);
            assert.ok(test_scrollbar._mousehandle);

            // verify function load
            let done = assert.async();
            setTimeout(() => {
                assert.verifySteps([
                    'compile()',
                    'update()'
                ]);
                done();
            }, 50);
		});
	});

	QUnit.module('methods', () => {
		QUnit.module('observe_container()', hooks => {
			let TestScrollbar,
                test_scrollbar;

			hooks.before(assert => {
				console.log('Set up cone.ScrollBar.resizeObserver test');

                // add dummy scrollbar element to DOM
                create_scrollbar_elem('x');

				// dummy scrollbar class
                TestScrollbar = class extends cone.ScrollBar {
                    update() {
						assert.step('update()');
					}
                };
			});

			hooks.after(() => {
                console.log('Tear down cone.ScrollBar.resizeObserver test');

                // remove dummy scrollbar fromDOM
                $('#test-container').remove();

                // delete scrollbar instance
                delete test_scrollbar;
            });

			QUnit.test('resize observer', assert => {
				// create scrollbar instance
				test_scrollbar = new TestScrollbar($('#test-container'));

				// NOTE: resizeObserver requires timeouts
				// fires once on load
				let done1 = assert.async();
				setTimeout(() => {
					assert.verifySteps(['update()']);
					done1();
				}, 20);

				// change elem width after first assertion
				let done2 = assert.async();
				setTimeout( () => {
					test_scrollbar.elem.css('width', '1px');
					done2();
				}, 40);

				// assert resize call after size change
				let done3 = assert.async();
					setTimeout( () => {
						assert.verifySteps(['update()']);
						// resizeObserver needs to be disconnected
						let scroll_elem = test_scrollbar.elem.get(0);
						test_scrollbar.scrollbar_observer.unobserve(scroll_elem);
						done3();
				}, 60);
			});
		});

		QUnit.module('unload()', hooks => {
			let TestScrollbar,
                test_scrollbar;

			hooks.before(assert => {
				console.log('Set up cone.ScrollBar.unload test');

                // add dummy scrollbar element to DOM
                create_scrollbar_elem('x');

				// dummy scrollbar class
                TestScrollbar = class extends cone.ScrollBar {
                    scroll_handle() {
                        assert.step('scroll_handle()');
                    }
                    click_handle() {
                        assert.step('click_handle()');
                    }
					drag_handle() {
						assert.step('drag_handle()');
					}
					mouse_in_out() {
						assert.step('mouse_in_out()');
					}
					observe_container() {
						this.scrollbar_observer = new ResizeObserver(entries => {
							for (let entry of entries) {
								assert.step('observe_container()');
							}
						})
						this.scrollbar_observer.observe(this.elem.get(0));
					}
                };
			});

			hooks.after(() => {
                console.log('Tear down cone.ScrollBar.unload test');

                // remove dummy scrollbar fromDOM
                $('#test-container').remove();

                // delete scrollbar instance
                delete test_scrollbar;
            });

			QUnit.test('unload()', assert => {
				// create test scrollbar object
				test_scrollbar = new TestScrollbar( $('#test-container') );

				// unload scrollbar
				test_scrollbar.unload();

				// trigger events
				test_scrollbar.scrollbar.trigger('click');
				test_scrollbar.elem.trigger('mousewheel');
				test_scrollbar.thumb.trigger('mousedown');
				test_scrollbar.elem.css('width', '1px');

				// add timeout to assert ResizeObserver - required
				let done = assert.async();
				setTimeout(() => {
					assert.verifySteps([]);
					done();
				}, 50);
			});
		});

		QUnit.module('mouse_in_out()', hooks => {
			let test_scrollbar,
				fade_out_origin,
				fade_in_origin;

			hooks.before(assert => {
				console.log('Set up cone.ScrollBar.mouse_in_out tests');

                // add dummy scrollbar element to DOM
                create_scrollbar_elem('x');

				// save jQuery fadeIn, fadeOut origin
				fade_out_origin = $.fn.fadeOut;
				fade_in_origin = $.fn.fadeIn;
	
				// overwrite jQuery fadeIn, fadeOut function
				$.fn._fadeOut = $.fn.fadeOut;
				$.fn.fadeOut = function(){
					assert.step('fadeOut called');
					$.fn.hide.apply(this);
				};
				$.fn._fadeIn = $.fn.fadeIn;
				$.fn.fadeIn = function(){
					assert.step('fadeIn called');
					$.fn.show.apply(this);
				};
			});
			hooks.after(() => {
                console.log('Tear down cone.ScrollBar.mouse_in_out tests');

                // remove dummy scrollbar fromDOM
                $('#test-container').remove();

                // unload and delete scrollbar instance
                test_scrollbar.unload();
                delete test_scrollbar;

				// reset jQuery fadeOut, fadeIn
				$.fn.fadeOut = fade_out_origin;
				$.fn.fadeIn = fade_in_origin;
            });

			QUnit.test('mouse_in_out()', assert => {

				// create test scrollbar object
				test_scrollbar = new cone.ScrollBar( $('#test-container') );
				let test_sb = test_scrollbar.scrollbar;

				// hide scrollbar - initially done in css file
				test_sb.css('display', 'none');

				// set contentsize & scrollsize
				test_scrollbar.contentsize = 200;
				test_scrollbar.scrollsize = 100;

				// trigger mouseenter
				test_scrollbar.elem.trigger('mouseenter');
				assert.strictEqual(test_sb.css('display'), '');

				// trigger mouseleave
				test_scrollbar.elem.trigger('mouseleave');
				assert.strictEqual(test_sb.css('display'), 'none');

				// verify called functions
				assert.verifySteps([
					'fadeIn called',
					'fadeOut called'
				]);
			});
		});

		QUnit.module('scroll_handle()', hooks => {
			let TestScrollbar,
				test_scrollbar;

			hooks.before(assert => {
				console.log('Set up cone.ScrollBar.scroll_handle tests');

				// add dummy scrollbar element to DOM
				create_scrollbar_elem('x');

				// dummy scrollbar class
				TestScrollbar = class extends cone.ScrollBar {
					set_position() {
						assert.step('set_position()');
					}		
				}
			});
			hooks.after(() => {
				console.log('Tear down cone.ScrollBar.scroll_handle tests');

				// remove dummy scrollbar fromDOM
				$('#test-container').remove();

				// unload and delete scrollbar instance
				test_scrollbar.unload();
				delete test_scrollbar;
			});


			QUnit.test('scroll_handle()', assert => {
				// create test scrollbar element
				test_scrollbar = new TestScrollbar($('#test-container'));

				// set dimensions, execute scroll_handle - will return
				test_scrollbar.contentsize = 100;
				test_scrollbar.scrollsize = 200;
				test_scrollbar.scroll_handle();

				// set dimensions
				test_scrollbar.scrollsize = test_container_dim;
				test_scrollbar.contentsize = test_content_dim;

				// assert position is 0 before scroll
				assert.strictEqual(test_scrollbar.position, 0);

				// create synthetic wheel events
				let scroll_up = $.event.fix(new WheelEvent("mousewheel", {
						"deltaY": 1,
						"deltaMode": 0
					})),
					scroll_down = $.event.fix(new WheelEvent("mousewheel", {
						"deltaY": -1,
						"deltaMode": 0
					}));

				// trigger scroll upward
				$(test_scrollbar.elem).trigger(scroll_up);
				assert.strictEqual(test_scrollbar.position, 10);

				// trigger scroll downward
				$(test_scrollbar.elem).trigger(scroll_down);
				assert.strictEqual(test_scrollbar.position, 0);

				// verify that set_position executed
				assert.verifySteps([
					'set_position()',
					'set_position()'
				]);
			});
		});

		QUnit.module('prevent_overflow()', hooks => {
			let test_scrollbar;

			hooks.before(() => {
				console.log('Set up cone.ScrollBar.prevent_overflow tests');

				// add dummy scrollbar element to DOM
				create_scrollbar_elem('x');
			});

			hooks.after(() => {
				console.log('Tear down cone.ScrollBar.prevent_overflow tests');

				// remove dummy scrollbar fromDOM
				$('#test-container').remove();

				// unload and delete scrollbar instance
				test_scrollbar.unload();
				delete test_scrollbar;
			});

			QUnit.test('prevent_overflow()', assert => {
				// create scrollbar object
				test_scrollbar = new cone.ScrollBar($('#test-container'));
	
				// set dimensions
				test_scrollbar.contentsize = 400;
				test_scrollbar.scrollsize = 200;
				let threshold = test_scrollbar.contentsize 
								- test_scrollbar.scrollsize;

				// scroll to end
				test_scrollbar.position = 500;
				test_scrollbar.prevent_overflow();
				assert.strictEqual(test_scrollbar.position, threshold);
	
				// scroll to start
				test_scrollbar.position = -500;
				test_scrollbar.prevent_overflow();
				assert.strictEqual(test_scrollbar.position, 0);
			});
		});

		QUnit.module('set_position()', hooks => {
			let TestScrollbar,
				test_scrollbar;

			hooks.before(assert => {
				console.log('Set up cone.ScrollBar.set_position tests');

				// add dummy scrollbar element to DOM
				create_scrollbar_elem('x');

				// dummy scrollbar class
				TestScrollbar = class extends cone.ScrollBar {
					set_position() {
						assert.step('set_position()');
					}
					get_evt_data() {
						assert.step('get_evt_data()');
					}
					get_offset() {
						assert.step('get_offset()');
					}
				};
			});
			hooks.after(() => {
				console.log('Tear down cone.ScrollBar.set_position tests');

				// remove dummy scrollbar fromDOM
				$('#test-container').remove();

				// unload and delete scrollbar instance
				test_scrollbar.unload();
				delete test_scrollbar;
			});

			QUnit.test('click_handle()', assert => {
				// create new scrollbar instance
				test_scrollbar = new TestScrollbar($('#test-container'));

				// trigger click
				test_scrollbar.scrollbar.trigger('click');

				// verify function calls
				assert.verifySteps([
					'get_evt_data()',
					'get_offset()',
					'set_position()'
				]);

				// class removed after click end
				assert.notOk(test_scrollbar.thumb.hasClass('active'));
			});
		});
		
		QUnit.module('drag_handle()', hooks => {
			let TestScrollbar,
				test_scrollbar;

			hooks.before(assert => {
				console.log('Set up cone.ScrollBar.drag_handle tests');

				// add dummy scrollbar element to DOM
				create_scrollbar_elem('x');

				// dummy scrollbar class
				TestScrollbar = class extends cone.ScrollBar {
					set_position() {
						// prevent overflow
						let threshold = this.contentsize - this.scrollsize;
						if(this.position >= threshold) {
							this.position = threshold;
						} else if(this.position <= 0) {
							this.position = 0;
						}
						assert.step('set_position()');
					}
					get_evt_data(e) {
						assert.step('get_evt_data()');
						return e.pageX;
					}
					get_offset() {
						assert.step('get_offset()');
						return this.elem.offset().left;
					}
				};
			});
			hooks.after(() => {
				console.log('Tear down cone.ScrollBar.drag_handle tests');

				// remove dummy scrollbar fromDOM
				$('#test-container').remove();

				// unload and delete scrollbar instance
				test_scrollbar.unload();
				delete test_scrollbar;
			});

			QUnit.test('drag_handle()', assert => {
				// create scrollbar instance
				test_scrollbar = new TestScrollbar($('#test-container'));

				// set dimensions
				test_scrollbar.contentsize = 400;
				test_scrollbar.scrollsize = 200;

				let threshold = test_scrollbar.contentsize
								- test_scrollbar.scrollsize;

				// assertion steps - fires every time ReszeObserver is called
				let drag_steps = [
					"get_evt_data()",
					"get_offset()",
					"get_evt_data()",
					"get_offset()",
					"get_evt_data()",
					"get_offset()",
					"get_evt_data()",
					"get_offset()",
					"set_position()"			  
				];

				// create synthetic drag event //
				// val = start position, newVal = end position
				function trigger_drag(val, newVal){
					// create events
					let mousedown = new $.Event("mousedown", {
							"pageX": val,
							"pageY": 0
						}),
						mousemove = new $.Event("mousemove", {
							"pageX": newVal,
							"pageY": 0
						});

					// set variables for calculation
					let cs = test_scrollbar.contentsize,
						ss = test_scrollbar.scrollsize,
						threshold = cs - ss,
						mouse_pos = test_scrollbar.get_evt_data(mousedown)
									- test_scrollbar.get_offset(),
						thumb_position = test_scrollbar.position / (cs / ss),
						mouse_pos_on_move = test_scrollbar.get_evt_data(mousemove)
											- test_scrollbar.get_offset(),
						new_thumb_pos = thumb_position + mouse_pos_on_move - mouse_pos;

					let new_position = cs * new_thumb_pos / ss;

					// prevent overflow on end of container
					if (new_position >= threshold) {
						new_position = threshold;
					} // prevent overflow on start of container
					else if (new_position <= 0) {
						new_position = 0;
					}

					// trigger mousedown
					test_scrollbar.thumb.trigger(mousedown);
					assert.ok(test_scrollbar.thumb.hasClass('active'));

					// trigger mousemove (drag)
					$(document).trigger(mousemove);

					// actual position is the same as calculated position
					assert.strictEqual(test_scrollbar.position, new_position);
				}

				// drag to end
				trigger_drag(0, 1000);
				// assert position === threshold
				assert.strictEqual(test_scrollbar.position, threshold);
				assert.verifySteps(drag_steps);
				$(document).trigger('mouseup');

				// drag to start
				trigger_drag(threshold, -1000);
				// assert position === 0
				assert.strictEqual(test_scrollbar.position, 0);
				assert.verifySteps(drag_steps);
				$(document).trigger('mouseup');

				// drag with random number
				let newVal = 98.8;
				trigger_drag(0, newVal);
				assert.verifySteps(drag_steps);
				$(document).trigger('mouseup');
			});
		});
	});
});

QUnit.module('cone.ScrollBarX', hooks => {
	hooks.before( () => {
		console.log('Set up cone.ScrollBarX tests');
	})
	hooks.after( () => {
		console.log('Tear down cone.ScrollBarX tests');
	})

	QUnit.module('constructor', hooks => {
		let TestScrollbarX,
			test_scrollbar_x;

		hooks.before( assert => {
			console.log('Set up cone.ScrollBar.constructor tests');

            // add dummy scrollbar element to DOM
            create_scrollbar_elem('x');

            // dummy Class
            TestScrollbarX = class extends cone.ScrollBarX {
                compile() {
                    assert.step('compile()');
                }
                update() {
                    assert.step('update()');
                }
            }

			// save super class observe_container() method
			// to test if it gets called in subclass
			observe_container_origin = cone.ScrollBar.prototype.observe_container;
			// overwrite observe_container() method
			cone.ScrollBar.prototype.observe_container = function() {
				assert.step('super.observe_container()')
				this.scrollbar_observer = new ResizeObserver(entries => {
					for (let entry of entries) {
						this.update();
					}
				})
				this.scrollbar_observer.observe(this.elem.get(0));
			}
		});
		hooks.after( () => {
			console.log('Tear down cone.ScrollBarX.constructor tests');

            // remove dummy scrollbar fromDOM
            $('#test-container').remove();

            // unload and delete scrollbar instance
            test_scrollbar_x.unload();
            delete test_scrollbar_x;

			// reset observe_container() method of super class
			cone.ScrollBar.prototype.observe_container = observe_container_origin;
		});

		QUnit.test('all constructor methods called', assert => {
			// create ScrollBarX instance
			test_scrollbar_x = new TestScrollbarX($('#test-container'));

			// verify methods in constructor are called
			let done = assert.async();
			setTimeout(() => {
				assert.verifySteps([
					'compile()',
					'super.observe_container()',
					'update()'
				]);
				done();
			}, 100);
		});

		QUnit.test('load properties', assert => {
            // scroll container
            assert.ok(test_scrollbar_x.elem);
            assert.ok(test_scrollbar_x.elem.is('div'));

			// content
            assert.ok(test_scrollbar_x.content);

			// scrollbar
            assert.ok(test_scrollbar_x.scrollbar);
            assert.ok(test_scrollbar_x.scrollbar.is('div'));
            assert.ok(test_scrollbar_x.scrollbar.hasClass('scrollbar'));

			// thumb
            assert.ok(test_scrollbar_x.thumb);
            assert.ok(test_scrollbar_x.thumb.is('div'));
            assert.ok(test_scrollbar_x.thumb.hasClass('scroll-handle'));

			// position related
            assert.strictEqual(test_scrollbar_x.position, 0);
            assert.strictEqual(test_scrollbar_x.unit, 10);

            // verify private functions
            assert.ok(test_scrollbar_x._scroll);
            assert.ok(test_scrollbar_x._click_handle);
            assert.ok(test_scrollbar_x._drag_handle);
            assert.ok(test_scrollbar_x._mousehandle);
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

		QUnit.test('compile()', assert => {
			// create new instance of cone.ScrollBarX
			test_scrollbar = new cone.ScrollBarX( $('#test-container') );
			// test with helper function
			test_compile(assert);
		});

		QUnit.module('update()', hooks => {
			let TestScrollbarX,
            test_scrollbar_x;

			hooks.before(assert => {
				console.log('Set up cone.ScrollBarX.update tests');

				// add dummy scrollbar element to DOM
				create_scrollbar_elem('x');

				// dummy scrollbar class
				TestScrollbarX = class extends cone.ScrollBarX {
					set_position() {
						assert.step('set_position()');
					}
				}
			});

			hooks.after(() => {
				console.log('Tear down cone.ScrollBarX.update tests');

				// remove dummy scrollbar fromDOM
				$('#test-container').remove();

				// unload and delete scrollbar instance
				test_scrollbar_x.unload();
				delete test_scrollbar_x;
			});

			QUnit.test('update()', assert => {
				// create instance of ScrollBarX
				test_scrollbar_x = new TestScrollbarX($('#test-container'));

				// set initial dimensions and properties
				test_scrollbar_x.content.css('width', '400px');
				test_scrollbar_x.elem.css('width', '200px');
				test_scrollbar_x.contentsize = 400;
				test_scrollbar_x.scrollsize = 200;
				// calculate thumb size
				let thumbsize = test_scrollbar_x.scrollsize ** 2 / test_scrollbar_x.contentsize;

				// update
				test_scrollbar_x.update();
				assert.strictEqual(test_scrollbar_x.thumbsize, thumbsize);

				// contentsize is not actual size, update contentsize
				test_scrollbar_x.contentsize = 300;
				// update
				test_scrollbar_x.update();
				assert.strictEqual(test_scrollbar_x.contentsize, test_scrollbar_x.content.outerWidth());

				// dimension and property changed
				test_scrollbar_x.contentsize = 100;
				test_scrollbar_x.content.css('width', '100px');
				// update
				test_scrollbar_x.update();
				assert.strictEqual(test_scrollbar_x.thumbsize, test_scrollbar_x.scrollsize);

				// verify set_position() calls
				assert.verifySteps([
					'set_position()',
					'set_position()',
					'set_position()'
				]);
			});
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

QUnit.module.skip('cone.ScrollBarY', hooks => {
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

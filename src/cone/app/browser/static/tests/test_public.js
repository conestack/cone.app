
const { test } = QUnit;

var fixture = $('#qunit-fixture');

QUnit.module('cone namespace', hooks => {
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


QUnit.module( 'cone.ScrollBar', hooks => {

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
      delete test_scrollbar_x;
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
      delete test_scrollbar_y;
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
    test_elem.super

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


// function mockNewViewport(mock_state) {
//   cone.viewport = new cone.ViewPort();
//   cone.viewport.state = mock_state;
//   cone.vp_state = mock_state;
// }
// function mockViewportChange(mock_state) {
//   cone.viewport.state = mock_state;
//   cone.vp_state = mock_state;
//   let e = {state:mock_state};

//   var evt = $.Event('viewport_changed');
//   evt.state = mock_state;
//   $(window).trigger(evt);
// }

// test('fixture test', assert => {
//   assert.ok($('head').has('link:contains("style.css")'), 'stylesheet exists');
//   assert.ok(fixture, 'fixture exists');
//   fixture.append('<div id="foo"></div>');
//   assert.ok($('#foo', fixture), 'elem exists');
//   assert.ok(($('#foo', fixture).css('height') == '100px'), 'style gets applied');
// })

// test('Test cone.toggle_arrow', assert => {
//     let up = 'bi-chevron-up',
//         down = 'bi-chevron-down',
//         arrow_up = $(`<i class="dropdown-arrow ${up}" />`),
//         arrow_down = $(`<i class="dropdown-arrow ${down}" />`);
//     cone.toggle_arrow(arrow_up);
//     assert.strictEqual(arrow_up.attr('class'), `dropdown-arrow ${down}`, 'arrow class = down');
//     cone.toggle_arrow(arrow_down);
//     assert.strictEqual(arrow_down.attr('class'), `dropdown-arrow ${up}`, 'arrow class = up');
// })

// cone.Topnav
// let topnav_elem = $('#topnav');

// QUnit.module('cone.Topnav', hooks => {

//   QUnit.module('initial load');

//     function initialElemTest(viewport) {
//       test(`check elem vp: ${viewport}`, assert => {
//         mockNewViewport(viewport);
//         cone.topnav = new cone.Topnav(topnav_elem);

//         let topnav = cone.topnav;

//         //test that required elements exist
//         assert.ok(topnav.elem, '.elem exists');
//         assert.ok(topnav.logo, '.logo exists');
//         assert.ok(topnav.content, '.content exists');
//         assert.ok(topnav.toggle_button, '.toggle_button exists');

//         // assert.deepEqual(topnav.elem, topnav_elem, '.elem correct');
//         // assert.deepEqual(topnav.logo, $('#cone-logo', topnav.elem), '.logo correct');
//         // assert.deepEqual(topnav.tb_dropdowns, $('#toolbar-top>li.dropdown', topnav.elem), 'tb dropdowns correct');

//         assertVisibility(assert);

//         topnav.elem.attr('class', ''); // remove class after tests
//         delete cone.topnav;
//         delete cone.viewport;
//       })
//     }
  
//     initialElemTest(cone.VP_MOBILE);
//     initialElemTest(cone.VP_SMALL);
//     initialElemTest(cone.VP_MEDIUM);
//     initialElemTest(cone.VP_LARGE);

//     function assertVisibility(assert) {
//       let topnav = cone.topnav;
//       assert.ok(topnav.elem.is(':visible'), 'elem is visible');
//       assert.strictEqual(topnav.elem.css('display'), 'flex', 'elem display is flex');
//       assert.strictEqual(topnav.elem.outerHeight(), 64, 'elem height is 4rem (64px)');
//       assert.strictEqual(topnav.elem.outerWidth(), $('#layout').outerWidth(), 'elem width fills layout');

//       assert.ok(topnav.logo.is(':visible'), 'logo is visible');
//       let logo_img = $('img', topnav.logo);
//       let logo_title = $('span', topnav.logo);
//       assert.strictEqual(logo_img.attr('src'), '/static/images/cone-logo-cone.svg', 'correct img');
//       assert.strictEqual(logo_img.outerHeight(), 32, 'logo height is 32');
//       assert.strictEqual(logo_img.outerHeight(), 32, 'logo width is 32');

//       if(cone.viewport.state === cone.VP_MOBILE) {
//         assert.ok(topnav.elem.hasClass('mobile'), 'elem has class mobile');
//         assert.ok(topnav.content.is(':hidden'), 'content is hidden');
//         assert.ok(topnav.toggle_button.is(':visible'), 'toggle btn visible');
//         // assert.ok(logo_title.is(':hidden'), 'logo title hidden'); media query required
//       } 
//       else {
//         assert.notOk(topnav.elem.hasClass('mobile'), 'elem does not have class mobile');
//         assert.strictEqual(topnav.content.css('display'), 'contents', 'content has display contents');
//         assert.ok(topnav.toggle_button.is(':hidden'), 'toggle btn hidden');
//         assert.strictEqual(topnav.logo.css('font-size'), '24px', 'font size is 24px (1.5rem)');
//         assert.ok(logo_title.is(':visible'), 'logo title visible');
//       }
//     }

//   QUnit.module('viewport.changed()');
//     function createNewElem() {
//       delete cone.viewport;
//       delete cone.topnav;
//       mockNewViewport(cone.VP_LARGE);
//       cone.topnav = new cone.Topnav(topnav_elem);
//     }

//     test('cone.VP_MOBILE', assert => {
//       createNewElem(); // create new obj
//       mockViewportChange(cone.VP_MOBILE);
//       assert.equal(cone.topnav.vp_state, 0, 'state is cone.VP_MOBILE')
//       assertVisibility(assert);

//       const mediaQueryList = window.matchMedia('(max-width:559.9px)');

//       if (mediaQueryList.matches) {
//         assert.deepEqual(1, 1, 'FOOOOOOOOOOOOOOOOOOOOOOOOOO matches')
//       } else {
//         assert.deepEqual(1, 1, 'BAAAAAAAAAAAAAAAAAAAAAAAAAAAr dont match')
//       }


//       assert.equal(cone.topnav.content.css('display'), 'none', 'content hidden'); // fails (display contents)
//     });
    // test('cone.VP_SMALL', assert => {
    //   mockViewportChange(cone.VP_SMALL);
    //   assert.equal(cone.topnav.vp_state, 1, 'state is cone.VP_MOBILE')
    //   assertVisibility(assert);
    // })
    // test('cone.VP_MEDIUM', assert => {
    //   mockViewportChange(cone.VP_MEDIUM);
    //   assert.equal(cone.topnav.vp_state, 2, 'state is cone.VP_MOBILE')
    //   assertVisibility(assert);
    // })
    // test('cone.VP_LARGE', assert => {
    //   mockViewportChange(cone.VP_LARGE);
    //   assert.equal(cone.topnav.vp_state, 3, 'state is cone.VP_MOBILE')
    //   assertVisibility(assert);
    // })

//     function test_toggle_menu(assert) {
//       const done = assert.async();
//       assert.equal(cone.topnav.vp_state, 0, 'topnav.vp_state = 0');
//       assert.equal(cone.topnav.content.css('display'), 'none', 'content hidden'); // fails (display contents)

//       // set timeout for slideToggle
//       setTimeout(function() {
//         assert.equal(cone.topnav.content.css('display'), 'flex', 'content visible after click');
//         done();
//       }, 500 );
//     }
// })


// cone.MainMenuTop

// QUnit.skip( 'cone.MainMenuTop', hooks => {

//   QUnit.module('initial');
//   let mainmenu_elem = $('#main-menu');

//   function create_elems(viewport) {
//     cone.viewport = new cone.ViewPort();
//     mockViewportChange(viewport);
//     cone.main_menu_top = new cone.MainMenuTop(mainmenu_elem);
//   }

//   function check_elems(viewport) {
//     test(`check elem vp: ${viewport}`, assert => {
//       create_elems(viewport);
//       let mm_top = cone.main_menu_top;
//       assert.ok(cone.topnav, 'cone.topnav exists');
//       assert.ok(mm_top.elem, 'elem exists');
//       assert.ok(mm_top.main_menu_items[2], 'all three array children exist');

//       if(cone.vp_state === cone.VP_MOBILE) {
//         assert.notStrictEqual(cone.topnav.logo.css('margin-right'), '32px', `logo margin NOT 2rem`);
//         if(cone.main_menu_sidebar) {
//           assert.strictEqual(mm_top.elem.css('display'), 'none', 'elem hidden');
//         } else {
//           assert.strictEqual(mm_top.elem.css('display'), 'flex', 'elem display is flex')
//         }
//       } else {
//         assert.strictEqual(cone.topnav.logo.css('margin-right'), '32px', `logo margin:2rem(32px)`);
//         assert.strictEqual(mm_top.elem.css('display'), 'flex', 'elem visible'); // fails because external css styling not included
//       }
//     })
//   }

//   QUnit.module('initial no sidebar');
//     check_elems(cone.VP_MOBILE);
//     check_elems(cone.VP_SMALL);
//     check_elems(cone.VP_MEDIUM);
//     check_elems(cone.VP_LARGE);

//   QUnit.module('initial with sidebar');
//     let sidebar_elem = $('#sidebar_left');
//     cone.viewport = new cone.ViewPort();
//     mockViewportChange(cone.VP_LARGE);

//     cone.main_menu_sidebar = new cone.SidebarMenu(sidebar_elem);
//     check_elems(cone.VP_MOBILE);
//     check_elems(cone.VP_SMALL);
//     check_elems(cone.VP_MEDIUM);
//     check_elems(cone.VP_LARGE);
// })

/// cone.MainMenuItem ///
  // let data_menu_items = `[{
    //   "target": "#", 
    //   "description": null, 
    //   "selected": false, 
    //   "url": "#", 
    //   "id": "child_1", 
    //   "icon": "bi bi-kanban", 
    //   "title": "child_1"
    // }]`;

    // let item = $(`
    //   <li class="mainmenu-item"
    //       data-menu-items="${data_menu_items}">
    //     <a href="#">
    //       <i class="#"></i>
    //       <span class="mainmenu-title">
    //         Title
    //       </span>
    //     </a>
    //     <i class="#"></i>
    //   </li>`
    // );


// cone.MainMenuSidebar
// cone.Topnav
// cone.SidebarMenu
// cone.Navtree
// cone.ThemeSwitcher
// cone.Searchbar


// QUnit.module('cone.SidebarMenu', hooks => {
  // function create_elems(viewport) {
  //   cone.viewport = new cone.ViewPort();
  //   mockViewportChange(viewport);
  //   cone.sidebar_menu = new cone.SidebarMenu(sidebar_elem);
  // }

//   function check_elems(viewport) {
//     test(`check elem vp: ${viewport}`, assert => {
//       mockNewViewport(viewport);

//       let sidebar_elem = $('#sidebar_left'); 
//       cone.sidebar_menu = new cone.SidebarMenu(sidebar_elem);
  
//       let sidebar = cone.sidebar_menu;
//       assert.ok(sidebar.elem, 'elem exists');

//       if(viewport === cone.VP_MOBILE) {
//         assert.ok(sidebar.elem.hasClass('expanded'), 'sidebar class expanded');
//         assert.notOk(sidebar.elem.hasClass('collapsed'), 'sidebar class not collapsed');
//       } else
//       if(viewport === cone.VP_LARGE && sidebar.cookie === null) {
//         assert.ok(sidebar.elem.hasClass('expanded'), 'sidebar class expanded');
//         assert.notOk(sidebar.elem.hasClass('collapsed'), 'sidebar class not collapsed');
//       } else
//       if(sidebar.cookie === null) {
//         assert.ok(sidebar.elem.hasClass('collapsed'), 'sidebar class collapsed');
//         assert.notOk(sidebar.elem.hasClass('expanded'), 'sidebar class not expanded');
//       } 
//     })
//   }

//   QUnit.module('initial load');
//     check_elems(cone.VP_MOBILE);
//     check_elems(cone.VP_SMALL);
//     check_elems(cone.VP_MEDIUM);
//     check_elems(cone.VP_LARGE);

//   QUnit.skip('test Sidebar', assert => {
//     cone.viewport = new cone.ViewPort();
//     mockViewportChange(cone.VP_LARGE);


//     if(sidebar.cookie === null) {
//         assert.strictEqual(sidebar.collapsed, false, 'collapsed is null');
//         assert.strictEqual(sidebar.cookie, null, 'cookie is null');
//     } else {
//         assert.notStrictEqual(sidebar.collapsed, null, 'collapsed is not null');
//         assert.notStrictEqual(sidebar.cookie, null, 'cookie is not null');
//     }

//     // toggle button test
//     sidebar.toggle_menu();

//     assert.notStrictEqual(sidebar.collapsed, null, 'collapsed after click not null');
//     assert.notStrictEqual(sidebar.cookie, null, 'cookie after click not null');
//     let st = sidebar.collapsed;

//     sidebar.toggle_menu();
//     assert.notStrictEqual(sidebar.collapsed, st, 'collapsed diff after 2. click');
//   })
// })


/* modeswitch */
/* QUnit.test('test modeswitch', assert => {
    let modeswitch = new cone.ThemeSwitcher($('#topnav'), cone.default_themes);
    assert.deepEqual($('#switch_mode'), modeswitch.elem, 'elem set');
    assert.deepEqual(modeswitch.link, $('head #colormode-styles'), 'link set');
    assert.deepEqual(modeswitch.modes, ['/static/light.css','/static/dark.css'], 'modes set');
    assert.strictEqual(modeswitch.state, false, 'state false');
    // modeswitch.switch_checkbox();
    // assert.strictEqual(modeswitch.state, true, 'state true');

    // debug!! -> how do stylesheets get loaded?
}) */

/* searchbar */
/* QUnit.test('test searchbar', assert => {
    let fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = '<div id="cone-searchbar"></div>';
    let searchbar = new cone.Searchbar();
    assert.deepEqual(searchbar.elem, $('#cone-searchbar'), 'elem set');
    assert.deepEqual(searchbar.search_text, $('#livesearch-input', '#cone-searchbar'), 'text set');
    assert.deepEqual(searchbar.search_group, $('#livesearch-group', '#cone-searchbar'), 'group set');
    assert.deepEqual(searchbar.dd, $('#cone-livesearch-dropdown', '#cone-searchbar'), 'dropdown set');

    // window resize
}) */
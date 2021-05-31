
// const { connect } = require[("puppeteer")];
// const {setup} = require('qunit-dom');

const { test } = QUnit;

var fixture = $('#qunit-fixture');
// cone.VP_MOBILE = 0;
// cone.VP_SMALL = 1;
// cone.VP_MEDIUM = 2;
// cone.VP_LARGE = 3;

test('test test', assert => {
 assert.ok(true, 'test okay');
})

QUnit.module('cone namespace');

test('test cone elems', assert => {
  // viewport
  assert.ok(cone.viewport instanceof cone.ViewPort);
  assert.strictEqual(cone.VP_MOBILE, 0, 'cone.VP_MOBILE is 0');
  assert.strictEqual(cone.VP_SMALL, 1, 'cone.VP_SMALL is 1');
  assert.strictEqual(cone.VP_MEDIUM, 2, 'cone.VP_MEDIUM is 2');
  assert.strictEqual(cone.VP_LARGE, 3, 'cone.VP_LARGE is 3');

  // theme 
  assert.strictEqual(cone.theme_switcher, null);
  assert.deepEqual(cone.default_themes, ['/static/light.css', '/static/dark.css']);

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
})

QUnit.module( 'cone.ScrollBar', hooks => {
  let test_scrollbar,
      test_scrollbar_hidden,
      test_container_width = 400,
      test_content_width = 800,
      test_thumbsize;

  hooks.before( () => {
    let test_id = 'test-container';
    let scrollbar_test_elem = `
      <div style="width:${test_container_width}px; height:200px; left:100px; top:100px; overflow:hidden;" id="${test_id}">
        <div style="width:${test_content_width}px; height:200px; position:relative;">
        </div>
      </div>
    `;

    $('body').append(scrollbar_test_elem);
    test_scrollbar = new cone.ScrollBarX($('#test-container'));
  });

  hooks.afterEach( () => {
    console.log('module teardown');
    test_scrollbar.position = 0;
    test_scrollbar.scrollsize = 400;
    test_scrollbar.contentsize = 800;
    test_scrollbar.elem.css('width', '400px');
    test_scrollbar.content.css('width', '800px');
    test_scrollbar.thumbsize = test_scrollbar.scrollsize ** 2 / test_scrollbar.contentsize;
    test_scrollbar.thumb.css('width', test_scrollbar.thumbsize);

  })

  function test_compile(test_elem, assert) {
    assert.strictEqual(test_elem.position, 0, 'position 0');
    assert.strictEqual(test_elem.unit, 10, 'unit is 10px');

    test_elem.compile();

    assert.ok(test_elem.scrollbar.hasClass('scrollbar'), 'scrollbar hasClass scrollbar');
    assert.ok(test_elem.elem.hasClass('scroll-container'), 'elem hasClass scroll-container');
    assert.ok(test_elem.content.hasClass('scroll-content'), 'content hasClass scroll-content');

    assert.ok(test_elem.elem.children('div').length == 2, 'elem has two children');
    assert.ok(test_elem.thumb.parents('.scrollbar').length == 1, 'scrollbar has thumb');

    // assert.ok(test_elem.scrollbar.is(':hidden'), 'scrollbar hidden'); // hidden via css file
  }

  //QUnit.module('visible');
    test('compile()', assert => {
      test_compile(test_scrollbar, assert);
      assert.ok(test_scrollbar.scrollbar.parents("#test-container").length == 1, 'container has scrollbar');
      assert.ok(test_scrollbar.content.parents("#test-container").length == 1, 'container has content');
    })

    test('update() fixed dim', assert => {
      test_container_width = 300;
      test_thumbsize = test_container_width ** 2 / test_content_width;

      test_scrollbar.elem.css('width', `${test_container_width}px`);
      test_scrollbar.update();

      assert.strictEqual(test_scrollbar.scrollsize, test_container_width, 'scrollbar size is container size');
      assert.strictEqual(test_scrollbar.thumbsize, test_thumbsize, 'thumbsize correct');
    });

  //QUnit.module('random dimension update()');
    // test with random numbers
    test('random dimensions update()', assert => {
      for(let i=0; i<10; i++) {
        test_scrollbar.position = 0;
        test_container_width = Math.floor(Math.random() * 1000);
        test_content_width = 1000;
        test_thumbsize = test_container_width ** 2 / test_content_width;

        test_scrollbar.elem.css('width', `${test_container_width}px`);
        test_scrollbar.content.css('width', `${test_content_width}px`);

        test_scrollbar.update();
  
        assert.strictEqual(test_scrollbar.scrollsize, test_container_width, `scrollsize ${test_container_width}`);
        assert.strictEqual(test_scrollbar.thumbsize, test_thumbsize, 'thumbsize correct');
      }
    })

    QUnit.test('mouse_in_out()', assert => {
      // scrollbar is hidden via css on start
      test_scrollbar.scrollbar.hide();
      assert.ok(test_scrollbar.scrollbar.is(':hidden'), 'scrollbar hidden on load');

      test_scrollbar.elem.trigger('mouseenter');
      var done = assert.async();
      console.log(test_scrollbar.scrollbar.css('display'))
      $(function (){
        assert.ok(test_scrollbar.scrollbar.is(':visible'), 'scrollbar visible on mouseenter');
        done();
      })
      // works in karma but not qunit in browser?? 
      // buggy, fix
    })



    test('scroll_handle()', assert => {
      assert.ok(true);

      // set val as number of scroll ticks
      function sim_scroll(val, dir){
        let delta = dir === 'pos' ? 1:-1;
        for(let i=0; i<val; i++){
          var syntheticEvent = new WheelEvent("syntheticWheel", {"deltaY": delta, "deltaMode": 0});
          let synthetic_scroll = $.event.fix(syntheticEvent || window.syntheticEvent);
          $(window).trigger(synthetic_scroll);
        }
      }
      $(window).on('syntheticWheel', test_scrollbar._scroll);

      assert.strictEqual(test_scrollbar.position, 0, 'position 0 before scroll');

      let threshold = test_scrollbar.contentsize - test_scrollbar.scrollsize;

      // for(let i=1; i<=threshold/10; i++) {
      //   sim_scroll(1, 'pos');
      //   assert.strictEqual(test_scrollbar.position, i*10, test_scrollbar.position)
      // }

      /* scroll to right end */
      sim_scroll(500, 'pos');
      assert.strictEqual(test_scrollbar.position, threshold, 'stop on container end');

      /* scroll to left end */
      sim_scroll(500, 'neg');
      assert.strictEqual(test_scrollbar.position, 0, 'stop on container start');

      /* scroll to middle */
      sim_scroll( (test_scrollbar.scrollsize / 20), 'pos');
      let result_middle = Math.ceil( test_scrollbar.scrollsize/20 ) * 10;
      assert.strictEqual(test_scrollbar.position, result_middle, 'scroll to middle');
    })






  // QUnit.module('hidden');  
  
  //   test('compile', assert => {
  //     let scrollbar_test_elem_hidden = `
  //       <div style="width:400px; height:200px; left:100px; top:100px; overflow:hidden; display:none;" id="test-container-hidden">
  //         <div style="position:relative; width:1000px">
  //         </div>
  //       </div>
  //     `;
  //     $('body').append(scrollbar_test_elem_hidden);

  //     test_scrollbar_hidden = new cone.ScrollBarX($('#test-container-hidden'));
  //     test_compile(test_scrollbar_hidden, assert);
  //     console.log(test_scrollbar_hidden.content.outerWidth())

  //     test_scrollbar_hidden.elem.show();
  //     assert.ok(test_scrollbar_hidden.elem.is(':visible'), 'elem visible');
  //     assert.ok(test_scrollbar_hidden.content.is(':visible'), 'content visible');
  //     console.log(test_scrollbar_hidden.elem.outerWidth())
  //     console.log(test_scrollbar_hidden.content.outerWidth())
  //     console.log(test_scrollbar_hidden.contentsize)
  //   });

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
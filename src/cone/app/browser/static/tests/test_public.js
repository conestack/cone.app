// do we need this? -L

// const { connect } = require("puppeteer")
// const {setup} = require('qunit-dom')
// const { connect } = require("puppeteer");

const { test } = QUnit;

var fixture = $('#qunit-fixture');
cone.VP_MOBILE = 0;
cone.VP_SMALL = 1;
cone.VP_MEDIUM = 2;
cone.VP_LARGE = 3;

test('fixture test', assert => {
  assert.ok($('head').has('link:contains("style.css")'), 'stylesheet exists');
  assert.ok(fixture, 'fixture exists');
  fixture.append('<div id="foo"></div>');
  assert.ok($('#foo', fixture), 'elem exists');
  assert.ok(($('#foo', fixture).css('height') == '100px'), 'style gets applied');
})

test('Test cone.toggle_arrow', assert => {
    let up = 'bi-chevron-up',
        down = 'bi-chevron-down',
        arrow_up = $(`<i class="dropdown-arrow ${up}" />`),
        arrow_down = $(`<i class="dropdown-arrow ${down}" />`);
    cone.toggle_arrow(arrow_up);
    assert.strictEqual(arrow_up.attr('class'), `dropdown-arrow ${down}`, 'arrow class = down');
    cone.toggle_arrow(arrow_down);
    assert.strictEqual(arrow_down.attr('class'), `dropdown-arrow ${up}`, 'arrow class = up');
})

// cone.Topnav
let topnav_elem = $('#topnav');

QUnit.module('cone.Topnav', hooks => {

  function check_elems(viewport) {
    test(`check elems intial vp: ${viewport}`, assert => {
      cone.viewport = new cone.ViewPort();
      cone.viewport.state = viewport;
      cone.topnav = new cone.Topnav(topnav_elem);

      let topnav = cone.topnav;
      assert.ok(topnav.elem, '.elem exists');
      assert.deepEqual(topnav.elem, topnav_elem, '.elem correct');
      assert.deepEqual(topnav.logo, $('#cone-logo', topnav.elem), '.logo correct');
      assert.deepEqual(topnav.tb_dropdowns, $('#toolbar-top>li.dropdown', topnav.elem), 'tb dropdowns correct');
  
      assert.ok(topnav.elem.is(':visible'), 'elem is visible');
      assert.strictEqual(topnav.elem.css('display'), 'flex', 'display is flex');
      assert.strictEqual(topnav.elem.outerHeight(), 64, 'height is 4rem (64px)');
      assert.strictEqual(topnav.elem.outerWidth(), $('#layout').outerWidth(), 'elem width fills layout');

      // visibility
      assert.ok(topnav.logo.is(':visible'), 'logo is visible');
      let logo_img = $('img', topnav.logo);
      let logo_title = $('span', topnav.logo);
      assert.strictEqual(logo_img.attr('src'), '/static/images/cone-logo-cone.svg', 'correct img');
      assert.strictEqual(logo_img.outerHeight(), 32, 'logo height is 32');
      assert.strictEqual(logo_img.outerHeight(), 32, 'logo width is 32');

      if(viewport === cone.VP_MOBILE) {
        assert.ok(topnav.elem.hasClass('mobile'), 'elem has class mobile');
        assert.ok(topnav.content.is(':hidden'), 'content is hidden');
        assert.ok(topnav.toggle_button.is(':visible'), 'toggle btn visible');
        // assert.ok(logo_title.is(':hidden'), 'logo title hidden'); media query required
      } 
      else {
        assert.notOk(topnav.elem.hasClass('mobile'), 'elem does not have class mobile');
        assert.strictEqual(topnav.content.css('display'), 'contents', 'content has display contents');
        assert.ok(topnav.toggle_button.is(':hidden'), 'toggle btn hidden');
        assert.strictEqual(topnav.logo.css('font-size'), '24px', 'font size is 24px (1.5rem)');
        assert.ok(logo_title.is(':visible'), 'logo title visible');
      }
    })
  }

  check_elems(cone.VP_MOBILE);
  check_elems(cone.VP_SMALL);
  check_elems(cone.VP_MEDIUM);
  check_elems(cone.VP_LARGE);
  
  QUnit.module('mobile functions');
    cone.viewport = new cone.ViewPort();
    cone.viewport.state = viewport;
    cone.topnav = new cone.Topnav(topnav_elem);
    let topnav = cone.topnav;
    test('toggle_menu()', assert => {
      topnav.toggle_button.trigger('click');
      assert.ok(topnav.content.is(':visible'))
    })
})


// cone.MainMenuTop
QUnit.module( 'cone.MainMenuTop', hooks => {

  hooks.beforeEach(function() {
    let topnav_elem = $('#topnav');
    cone.topnav = new cone.Topnav(topnav_elem);
    let mm_top_elem = $('#main-menu');
    cone.main_menu_top = new cone.MainMenuTop(mm_top_elem);
    console.log(cone.main_menu_top)

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
  });

  test('Test elems', assert => {
    assert.ok(cone.topnav, 'cone.topnav exists');
    assert.ok(cone.main_menu_top.elem, 'elem exists')
    console.log(cone.main_menu_top.main_menu_items[0])
    //assert.deepEqual(cone.main_menu_top.main_menu_items[0])


  });

  QUnit.skip('test VP', assert => {
    cone.VP_MOBILE = 0;
    cone.VP_SMALL = 1;
    cone.VP_MEDIUM = 2;
    cone.VP_LARGE = 3;
    cone.viewport = new cone.ViewPort();

    cone.viewport.state = cone.VP_MOBILE;
    cone.main_menu_top = new cone.MainMenuTop(elem);
    let mmt = cone.main_menu_top;
    assert.deepEqual(elem, mmt.elem, 'elem is correct');
    assert.strictEqual(elem.attr('id'), mmt.elem.attr('id'), 'Id correct');
    //assert.ok($(mmt.main_menu_items[0]).hasClass('mainmenu-item'), 'item has correct class');
    console.log($(mmt.main_menu_items[0]));

    // VP TESTS //
    // -------- //

    // initial (mobile)
    cone.vp_state = cone.VP_MOBILE;
    assert.strictEqual(cone.topnav.logo.css('margin-right'), 'auto', 'margin is auto on mobile');

    function testViewport(mock_state) {
      cone.viewport.state = mock_state;
      cone.vp_state = mock_state;
      let e = {state:mock_state}; // mock event state
      mmt.viewport_changed(e);

      // fails
      // need to include css files
      if(cone.vp_state === cone.VP_MOBILE) {
        assert.strictEqual(cone.topnav.logo.css('margin-right'), 'auto', `VP${cone.vp_state} logo margin:auto`);
        if(cone.main_menu_sidebar) {
          assert.strictEqual(mmt.elem.css('display'), 'none', 'elem hidden');
        } 
      } else {
        assert.strictEqual(cone.topnav.logo.css('margin-right'), '2rem', `VP${cone.vp_state} logo margin:2rem`);
        assert.strictEqual(mmt.elem.css('display'), 'flex', 'elem visible'); // fails because external css styling not included
      }
    }

    // without sidebar mainmenu
    testViewport(cone.VP_SMALL);
    testViewport(cone.VP_MEDIUM);
    testViewport(cone.VP_LARGE);
    testViewport(cone.VP_MOBILE);

    // with sidebar mainmenu
    cone.main_menu_sidebar = true;
    testViewport(cone.VP_SMALL);
    testViewport(cone.VP_MEDIUM);
    testViewport(cone.VP_LARGE);
    testViewport(cone.VP_MOBILE);
  })

});

QUnit.module.skip( 'cone.MainMenuTopOld', hooks => {

  test('Test cone.MainMenuTop', assert => {
    let fixture = $('#qunit-fixture');
    assert.ok(fixture, 'fixture exists');
    let testdiv = $('<div class="bleh"><div/>');
    fixture.append(testdiv);
    assert.ok(fixture.attr('id') == "qunit-fixture", 'fixture has correct id');
    assert.ok($(testdiv, fixture), 'bleh exists');

    let topnav_elem = $(
      `<div id="topnav">
        <div id="cone-logo"></div>
        <div id="topnav-content"></div>
      </div>`
    );
    cone.topnav = new cone.Topnav(topnav_elem);
    let elem = $(`
      <div id="main-menu">
      </div>`
    );
    let mainmenu = $(`<ul id="mainmenu"></ul>`);
    let data_menu_items = `[{
      "target": "#", 
      "description": null, 
      "selected": false, 
      "url": "#", 
      "id": "child_1", 
      "icon": "bi bi-kanban", 
      "title": "child_1"
    }]`;
    let item = $(`
      <li class="mainmenu-item"
          data-menu-items="${data_menu_items}">
        <a href="#">
          <i class="#"></i>
          <span class="mainmenu-title">
            Title
          </span>
        </a>
        <i class="#"></i>
      </li>`
    );
    mainmenu.append(item);
    elem.append(mainmenu);

    cone.VP_MOBILE = 0;
    cone.VP_SMALL = 1;
    cone.VP_MEDIUM = 2;
    cone.VP_LARGE = 3;
    cone.viewport = new cone.ViewPort();

    cone.viewport.state = cone.VP_MOBILE;
    cone.main_menu_top = new cone.MainMenuTop(elem);
    let mmt = cone.main_menu_top;
    assert.deepEqual(elem, mmt.elem, 'elem is correct');
    assert.strictEqual(elem.attr('id'), mmt.elem.attr('id'), 'Id correct');
    //assert.ok($(mmt.main_menu_items[0]).hasClass('mainmenu-item'), 'item has correct class');
    console.log($(mmt.main_menu_items[0]));

    // VP TESTS //
    // -------- //

    // initial (mobile)
    cone.vp_state = cone.VP_MOBILE;
    assert.strictEqual(cone.topnav.logo.css('margin-right'), 'auto', 'margin is auto on mobile');

    function testViewport(mock_state) {
      cone.viewport.state = mock_state;
      cone.vp_state = mock_state;
      let e = {state:mock_state}; // mock event state
      mmt.viewport_changed(e);

      // fails
      // need to include css files
      if(cone.vp_state === cone.VP_MOBILE) {
        assert.strictEqual(cone.topnav.logo.css('margin-right'), 'auto', `VP${cone.vp_state} logo margin:auto`);
        if(cone.main_menu_sidebar) {
          assert.strictEqual(mmt.elem.css('display'), 'none', 'elem hidden');
        } 
      } else {
        assert.strictEqual(cone.topnav.logo.css('margin-right'), '2rem', `VP${cone.vp_state} logo margin:2rem`);
        assert.strictEqual(mmt.elem.css('display'), 'flex', 'elem visible'); // fails because css styling not included
      }
    }

    // without sidebar mainmenu
    testViewport(cone.VP_SMALL);
    testViewport(cone.VP_MEDIUM);
    testViewport(cone.VP_LARGE);
    testViewport(cone.VP_MOBILE);

    // with sidebar mainmenu
    cone.main_menu_sidebar = true;
    testViewport(cone.VP_SMALL);
    testViewport(cone.VP_MEDIUM);
    testViewport(cone.VP_LARGE);
    testViewport(cone.VP_MOBILE);
  })

  QUnit.skip('Test cone.MainMenuItem', assert => {
    let data_menu_items = [{
      "url": "http://localhost:8081/child_1/child_1", 
      "title": "child_1", 
      "target": "http://localhost:8081/child_1/child_1", 
      "selected": false, 
      "id": "child_1", 
      "description": null, 
      "icon": "bi bi-kanban"
    }];
    let elem = $(`
      <li class="mainmenu-item menu" data-menu-items="${data_menu_items}">
        <a href="#">
          <i class="#"><i/>
          <span class="mainmenu-title">
            Title
          </span>
        </a>
        <i class="dropdown-arrow bi bi-chevron-down">
      </li>
    `);
    let menu = $(`
      <div class="cone-mainmenu-dropdown">
        <ul class="mainmenu-dropdown">
          <li class="">
            <a href="http://localhost:8081/child_1/child_1">
              <i class="bi bi-kanban"></i>
              <span>
                child_1
              </span>
            </a>
          </li>
        </ul>
      </div>
    `);
    let main_menu_item = new cone.MainMenuItem(elem);
    assert.deepEqual(main_menu_item.menu, menu, 'elem has class');
    //assert.deepEqual(main_menu_item.menu, menu, 'menu is menu')
  });
});


// cone.MainMenuSidebar
// cone.Topnav
// cone.SidebarMenu
// cone.Navtree
// cone.ThemeSwitcher
// cone.Searchbar


// cone.ScrollBar

QUnit.module( 'cone.ScrollBar', hooks => {
  test('Test elem load', assert => {
    let ctx = $('<div id="test"> <div></div> </div>');
    let scrolltest = new cone.ScrollBar(ctx);
    assert.strictEqual(ctx.attr('id'), scrolltest.elem.attr('id'), 'id is id');
    assert.deepEqual(ctx, scrolltest.elem, 'elem is context');
    assert.strictEqual(scrolltest.scrollbar.attr('class'), 'scrollbar', 'correct class');
  });
});
// QUnit.test('test Scrollbar', assert => {
//   var fixture = document.getElementById('qunit-fixture');
//   fixture.innerHTML = '<div id="test"> <div></div> </div>';
//   let ctx = $('#test');
//   let scbar = $('<div class="scrollbar"></div>');
//   let the_scrollbar = new cone.ScrollBar(ctx);
//   let ctn = $('>', the_scrollbar.container);
//   assert.deepEqual(the_scrollbar.container, ctx, 'Container is ctx');
//   assert.deepEqual(the_scrollbar.content, ctn, 'Content is ctn');
//   // assert.deepEqual(the_scrollbar.scrollbar, scbar, 'scrollbar is scbar');
//   let thk = '6px';
//   assert.strictEqual(the_scrollbar.thickness, thk, 'thickness is thickness');
// })


/* sidebar */
/* QUnit.test('test Sidebar', assert => {
    //var fixture = document.getElementById('qunit-fixture');

    let sidebar = new cone.SidebarMenu();

    assert.deepEqual(sidebar.elem, $('#sidebar_left'), 'sidebar set');
    assert.deepEqual(sidebar.content, $('#sidebar_content'), 'content set');
    assert.deepEqual(sidebar.toggle_btn, $('#sidebar-toggle-btn'), 'toggle btn set');
    assert.deepEqual(sidebar.toggle_arrow, $('i', sidebar.toggle_btn), 'arrow set');
    if(sidebar.cookie === null) {
        assert.strictEqual(sidebar.state, null, 'state is null');
        assert.strictEqual(sidebar.cookie, null, 'cookie is null');
    } else {
        assert.notStrictEqual(sidebar.state, null, 'state is not null');
        assert.notStrictEqual(sidebar.cookie, null, 'cookie is not null');
    }

    // toggle button test
    sidebar.toggle_menu();

    assert.notStrictEqual(sidebar.state, null, 'state after click not null');
    assert.notStrictEqual(sidebar.cookie, null, 'cookie after click not null');
    let st = sidebar.state;

    sidebar.toggle_menu();
    assert.notStrictEqual(sidebar.state, st, 'state diff after 2. click');

    // find a way to fake window width for resize testing
})
 */
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
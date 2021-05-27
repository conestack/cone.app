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

function mockViewport(mock_state) {
  cone.viewport.state = mock_state;
  cone.vp_state = mock_state;
  let e = {state:mock_state}; // mock event state
  return e;
}

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

  function assertVisibility(assert) {
    let topnav = cone.topnav;
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

    if(cone.viewport.state === cone.VP_MOBILE) {
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
  }

  QUnit.module('initial');
    function check_elems(viewport) {
      test(`check elem vp: ${viewport}`, assert => {
        cone.viewport = new cone.ViewPort();
        cone.viewport.state = viewport;
        cone.topnav = new cone.Topnav(topnav_elem);

        let topnav = cone.topnav;
        assert.ok(topnav.elem, '.elem exists');
        assert.deepEqual(topnav.elem, topnav_elem, '.elem correct');
        assert.deepEqual(topnav.logo, $('#cone-logo', topnav.elem), '.logo correct');
        assert.deepEqual(topnav.tb_dropdowns, $('#toolbar-top>li.dropdown', topnav.elem), 'tb dropdowns correct');

        assertVisibility(assert);
      })
    }
    check_elems(cone.VP_MOBILE);
    check_elems(cone.VP_SMALL);
    check_elems(cone.VP_MEDIUM);
    check_elems(cone.VP_LARGE);

  QUnit.module('viewport.changed()');
    test('cone.VP_MOBILE', assert => {
      mockViewport(cone.VP_MOBILE);
      assertVisibility(assert);
    });
    test('cone.VP_SMALL', assert => {
      mockViewport(cone.VP_SMALL);
      assertVisibility(assert);
    })
    test('cone.VP_MEDIUM', assert => {
      mockViewport(cone.VP_MEDIUM);
      assertVisibility(assert);
    })
    test('cone.VP_LARGE', assert => {
      mockViewport(cone.VP_LARGE);
      assertVisibility(assert);
    })

  QUnit.module('mobile functions');
    QUnit.skip( "toggle_menu()", assert => {
      mockViewport(cone.VP_MOBILE);
      const done = assert.async();
      assert.ok(cone.topnav.elem.hasClass('mobile'), 'has class mobile')
      assert.equal(cone.topnav.content.css('display'), 'none', 'content hidden'); // fails (display contents)

      // set timeout for slideToggle
      setTimeout(function() {
        assert.equal(cone.topnav.content.css('display'), 'flex', 'content visible after click');
        done();
      }, 500 );
    });
})


// cone.MainMenuTop

QUnit.skip( 'cone.MainMenuTop', hooks => {

  QUnit.module('initial');
  let mainmenu_elem = $('#main-menu');

  function create_elems(viewport) {
    cone.viewport = new cone.ViewPort();
    mockViewport(viewport);
    cone.main_menu_top = new cone.MainMenuTop(mainmenu_elem);
  }

  function check_elems(viewport) {
    test(`check elem vp: ${viewport}`, assert => {
      create_elems(viewport);
      let mm_top = cone.main_menu_top;
      assert.ok(cone.topnav, 'cone.topnav exists');
      assert.ok(mm_top.elem, 'elem exists');
      assert.ok(mm_top.main_menu_items[2], 'all three array children exist');

      if(cone.vp_state === cone.VP_MOBILE) {
        assert.notStrictEqual(cone.topnav.logo.css('margin-right'), '32px', `logo margin NOT 2rem`);
        if(cone.main_menu_sidebar) {
          assert.strictEqual(mm_top.elem.css('display'), 'none', 'elem hidden');
        } else {
          assert.strictEqual(mm_top.elem.css('display'), 'flex', 'elem display is flex')
        }
      } else {
        assert.strictEqual(cone.topnav.logo.css('margin-right'), '32px', `logo margin:2rem(32px)`);
        assert.strictEqual(mm_top.elem.css('display'), 'flex', 'elem visible'); // fails because external css styling not included
      }
    })
  }

  QUnit.module('initial no sidebar');
    check_elems(cone.VP_MOBILE);
    check_elems(cone.VP_SMALL);
    check_elems(cone.VP_MEDIUM);
    check_elems(cone.VP_LARGE);

  QUnit.module('initial with sidebar');
    let sidebar_elem = $('#sidebar_left');
    cone.viewport = new cone.ViewPort();
    mockViewport(cone.VP_LARGE);

    cone.main_menu_sidebar = new cone.SidebarMenu(sidebar_elem);
    check_elems(cone.VP_MOBILE);
    check_elems(cone.VP_SMALL);
    check_elems(cone.VP_MEDIUM);
    check_elems(cone.VP_LARGE);
})

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


QUnit.module( 'cone.ScrollBar', hooks => {
  test('Test elem load', assert => {
    let ctx = $('<div id="test"> <div></div> </div>');
    let scrolltest = new cone.ScrollBar(ctx);
    assert.strictEqual(ctx.attr('id'), scrolltest.elem.attr('id'), 'id is id');
    assert.deepEqual(ctx, scrolltest.elem, 'elem is context');
    assert.strictEqual(scrolltest.scrollbar.attr('class'), 'scrollbar', 'correct class');
    // assert.strictEqual(scrolltest.scrollbar.thickness, '6px', 'thickness is thickness');
  });
});

QUnit.module('cone.SidebarMenu', hooks => {
  // function create_elems(viewport) {
  //   cone.viewport = new cone.ViewPort();
  //   mockViewport(viewport);
  //   cone.sidebar_menu = new cone.SidebarMenu(sidebar_elem);
  // }

  function check_elems(viewport) {
    test(`check elem vp: ${viewport}`, assert => {
      cone.viewport = new cone.ViewPort();
      cone.viewport.state = viewport;

      let sidebar_elem = $('#sidebar_left'); 
      cone.sidebar_menu = new cone.SidebarMenu(sidebar_elem);
  
      let sidebar = cone.sidebar_menu;
      assert.ok(sidebar.elem, 'elem exists');

      if(viewport === cone.VP_MOBILE) {
        assert.ok(sidebar.elem.hasClass('expanded'), 'sidebar class expanded');
        assert.notOk(sidebar.elem.hasClass('collapsed'), 'sidebar class not collapsed');
      } else
      if(viewport === cone.VP_LARGE && sidebar.cookie === null) {
        assert.ok(sidebar.elem.hasClass('expanded'), 'sidebar class expanded');
        assert.notOk(sidebar.elem.hasClass('collapsed'), 'sidebar class not collapsed');
      } else
      if(sidebar.cookie === null) {
        assert.ok(sidebar.elem.hasClass('collapsed'), 'sidebar class collapsed');
        assert.notOk(sidebar.elem.hasClass('expanded'), 'sidebar class not expanded');
      } 
    })
  }

  QUnit.module('initial load');
    check_elems(cone.VP_MOBILE);
    check_elems(cone.VP_SMALL);
    check_elems(cone.VP_MEDIUM);
    check_elems(cone.VP_LARGE);

  QUnit.skip('test Sidebar', assert => {
    cone.viewport = new cone.ViewPort();
    mockViewport(cone.VP_LARGE);


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
})


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
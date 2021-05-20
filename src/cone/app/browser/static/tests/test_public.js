// do we need this? -L

// const { connect } = require("puppeteer")
// const {setup} = require('qunit-dom')
// const { connect } = require("puppeteer");

QUnit.test('hello world', assert => {
    assert.strictEqual(1, 1, '1 is 1')
})

QUnit.test('Test cone.toggle_arrow', assert => {
    let up = 'bi-chevron-up',
        down = 'bi-chevron-down',
        arrow_up = $(`<i class="dropdown-arrow ${up}" />`),
        arrow_down = $(`<i class="dropdown-arrow ${down}" />`);
    cone.toggle_arrow(arrow_up);
    assert.strictEqual(arrow_up.attr('class'), `dropdown-arrow ${down}`, 'arrow class = down');
    cone.toggle_arrow(arrow_down);
    assert.strictEqual(arrow_down.attr('class'), `dropdown-arrow ${up}`, 'arrow class = up');
})

// cone.ViewPort -> viewport simulation in karma?
// cone.ViewPortAware -> viewport simulation in karma?
// cone.Content

// cone.MainMenuItem
QUnit.test('Test cone.MainMenuItem', assert => {
    let data_menu_items = [{"url": "http://localhost:8081/child_1/child_1", "title": "child_1", "target": "http://localhost:8081/child_1/child_1", "selected": false, "id": "child_1", "description": null, "icon": "bi bi-kanban"}];

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
})

// cone.MainMenuTop
// cone.MainMenuSidebar
// cone.Topnav
// cone.SidebarMenu
// cone.Navtree
// cone.ThemeSwitcher
// cone.Searchbar


/* scrollbar */
// QUnit.test('test Scrollbar', assert => {
//     var fixture = document.getElementById('qunit-fixture');
//     fixture.innerHTML = '<div id="test"> <div></div> </div>';
//     let ctx = $('#test');
//     let scbar = $('<div class="scrollbar"></div>');
//     let the_scrollbar = new cone.ScrollBar(ctx);
//     let ctn = $('>', the_scrollbar.container);
//     assert.deepEqual(the_scrollbar.container, ctx, 'Container is ctx');
//     assert.deepEqual(the_scrollbar.content, ctn, 'Content is ctn');
//     // assert.deepEqual(the_scrollbar.scrollbar, scbar, 'scrollbar is scbar');
//     let thk = '6px';
//     assert.strictEqual(the_scrollbar.thickness, thk, 'thickness is thickness');
//     fixture.innerHTML = '';
// })


/* topnav */
/* QUnit.test('test Topnav', assert => {
    var fixture = document.getElementById('qunit-fixture');
    fixture.innerHTML = `
    <div id="topnav"> 
        <div id="cone-logo">
            <a>
                <div class="logo"></div>
            </a>
        </div>
        <div id="topnav-content">
            <div id="mobile-menu-toggle">
                <i class="bi bi-list"></i>
            </div>
            <div id="toolbar-top"></div>
            <div id="personaltools"></div>
        </div>
    </div>
    `;

    let topnav = new cone.Topnav();

    let cnt = $('#topnav-content');
    console.log(topnav.elem);
    assert.deepEqual(topnav.elem, $('#topnav'), 'elem is ok');
    assert.deepEqual(topnav.content, cnt, 'content is cnt');
    assert.deepEqual(topnav.toggle_button, $('#mobile-menu-toggle'), 'toggle btn is ok');

    assert.deepEqual(topnav.logo, $('#cone-logo'), 'logo is ok');

    assert.deepEqual(topnav.tb_dropdowns, $('#toolbar-top>li.dropdown'), 'dropdowns ok');
    assert.deepEqual(topnav.pt, $('#personaltools'), 'pt ok');
    assert.deepEqual(topnav.user, $('#user'), 'user ok');
}) */

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
///////////////////////////////////////////////////////////////////////////////
// Viewport helpers
///////////////////////////////////////////////////////////////////////////////

export function set_vp(state) {
    /* viewport states are set in karma.conf.js via karma-viewport extension */
    viewport.set(state);
    // trigger resize
    $(window).trigger('resize');
}

///////////////////////////////////////////////////////////////////////////////
// SidebarMenu helpers
///////////////////////////////////////////////////////////////////////////////

export function create_sidebar_elem() {
    // create dummy sidebar element
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
    // append dummy element to DOM
    $('body').append(sidebar_html);
}

///////////////////////////////////////////////////////////////////////////////
// Topnav test helpers
///////////////////////////////////////////////////////////////////////////////

export function create_topnav_elem() {
    // create html element
    let topnav_html = `
        <div id="topnav"
             style="
               box-sizing: border-box;
               height:4rem;
               display:flex;
               flex-direction:row;
               align-items: center;
               width: 100%;
               padding-left: .75rem;">
          <div id="cone-logo"
               style="
                 font-size:1.5rem;
                 font-family: Arial;
                 margin-right: auto;
                 white-space: nowrap;
                 width: 32px;
                 height: 32px;">
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
    // append element to DOM
    $('body').append(topnav_html);
}

export function topnav_style_to_mobile(topnav) {
    // mock required css styling for mobile viewport

    topnav.elem.css({
        'padding': '1rem',
        'height': '4rem',
    });

    topnav.logo.css('margin-right', 'auto');
    $('span', topnav.logo).css('display', 'none');

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

export function topnav_style_to_desktop(topnav) {
    // mock required css styling for desktop viewport (states 1, 2, 3)

    topnav.elem.css({
        'padding': '0',
        'padding-left': '.75rem'
    });

    topnav.logo.css('margin-right', 'auto');
    $('span', topnav.logo).css('display', 'inline-block');

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

///////////////////////////////////////////////////////////////////////////////
// MainMenuTop test helpers
///////////////////////////////////////////////////////////////////////////////

export function create_mm_top_elem() {
    // create and append mainmenu DOM element
    let mainmenu_html = `
        <div id="main-menu"
             style="
               display:flex;
               flex-direction:row;
               flex-wrap:nowrap;
               align-items: center;
               height: 100%;
               margin-right: auto;
               padding-top: .5rem;">
          <ul id="mainmenu"
              style="
                display: inline-flex;
                flex-wrap: nowrap;
                height: 100%;
                margin-bottom: 0;
                padding: 0;">
          </ul>
        </div>
    `;

    $('#topnav-content').append(mainmenu_html);
}

export function mm_top_style_to_desktop() {
    // manually set css as set in style.css
    $('.mainmenu-item').css({
        'white-space': 'nowrap',
        'padding': '0 10px'
    });
}

export function mm_top_style_to_mobile() {
    // manually set mobile css as set in style.css
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

///////////////////////////////////////////////////////////////////////////////
// cone.MainMenuItem test helpers
///////////////////////////////////////////////////////////////////////////////

export function create_mm_items(count) {
    // create data menu items array
    let data_menu_items =
        [
            {
                "selected": true,
                "icon": "bi bi-kanban",
                "id": "child_1",
                "description": null,
                "url": "http://localhost:8081/child_1/child_1",
                "target": "http://localhost:8081/child_1/child_1",
                "title": ""
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

    // create number of dummy item elements
    for (let i=1; i <=count; i++) {
        let mainmenu_item_html = `
            <li class="mainmenu-item node-child_${i} menu"
                style="
                  display: flex;
                  align-items: center;
                  height: 100%;
                "
                id="elem${count}">
              <a>
                <i class="bi bi-heart"></i>
                <span class="mainmenu-title">
                </span>
              </a>
              <i class="dropdown-arrow bi bi-chevron-down"></i>
            </li>
        `;

        // append item element to mainmenu DOM
        $('#mainmenu').append(mainmenu_item_html);

        // set item menu-items data
        $(`#elem${count}`).data('menu-items', data_menu_items);
    }
}

export function create_empty_item() {
    // create empty dummy item
    let mainmenu_item_html = `
        <li class="mainmenu-item"
            style="
            display: flex;
            align-items: center;
            height: 100%;">
          <a>
            <i class="bi bi-heart"></i>
            <span class="mainmenu-title">
            </span>
          </a>
        </li>
    `;

    // append empty dummy item to mainmenu DOM
    $('#mainmenu').append(mainmenu_item_html);
}

///////////////////////////////////////////////////////////////////////////////
// Searchbar test helper
///////////////////////////////////////////////////////////////////////////////

export function create_searchbar_elem() {
    // create dummy searchber element
    let searchbar_html = `
        <div id="cone-searchbar">
          <div id="cone-searchbar-wrapper"
               class="dropdown-toggle"
               role="button"
               data-bs-toggle="dropdown">
            <div class="input-group" id="livesearch-group">
              <div id="livesearch-input">
                <input type="text"
                       class="form-control">
                </input>
              </div>
              <div class="input-group-append">
                <button type="submit" id="searchbar-button">
                  <i class="bi-search"></i>
                </button>
              </div>
            </div>
          </div>
          <ul class="dropdown-menu" id="cone-livesearch-dropdown">
            <li class="dropdown-title">
              Search Results
            </li>
            <div id="cone-livesearch-results">
              <li>
                <span>Example Livesearch Result</span>
              </li>
            </div>
          </ul>
        </div>
    `;
    // append dummy element to DOM
    $('body').append(searchbar_html);
}

///////////////////////////////////////////////////////////////////////////////
// ThemeSwitcher test helpers
///////////////////////////////////////////////////////////////////////////////

export function create_theme_switcher_elem(mode) {
    let modeswitch_html = `
        <li class="form-check form-switch">
          <input class="form-check-input" id="switch_mode" type="checkbox">
          <label class="form-check-label" for="flexSwitchCheckDefault">
            Toggle dark mode
          </label>
        </li>
    `;
    let head_current = `
        <link id="colormode-styles"
              rel="stylesheet"
              href=${mode}>`;
    $('body').append(modeswitch_html);
    $('head').append(head_current);
}

///////////////////////////////////////////////////////////////////////////////
// cone.MainMenuSidebar test helpers
///////////////////////////////////////////////////////////////////////////////

export function create_mm_sidebar_elem() {
    let mm_sidebar_html = `
        <ul id="mainmenu_sidebar">
          <li class="sidebar-heading" id="mainmenu-sb-heading">
            <span>
              Main Menu
            </span>
          </li>

          <li class="active node-child_1">
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

          <li class="node-child_3 sb-menu">
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

///////////////////////////////////////////////////////////////////////////////
// cone.Navtree helpers
///////////////////////////////////////////////////////////////////////////////

export function create_navtree_elem() {
  let navtree_html = `
  <ul id="navtree">
    <li class="sidebar-heading" id="navtree-heading">
      <span>
        Navigation
      </span>
      <i class="dropdown-arrow bi bi-chevron-down"></i>
    </li>

    <div id="navtree-content">

      <li class="active navtreelevel_1">
        <a href="#">
          <i class="bi bi-heart"></i>
          <span>Title</span>
        </a>
        <ul>
          <li class="navtreelevel_2">
            <a href="#">
              <i class="bi bi-heart"></i>
              <span>Title</span>
            </a>
          </li>
        </ul>
      </li>

      <li class="active navtreelevel_1">
        <a href="#">
          <i class="bi bi-heart"></i>
          <span>Title</span>
        </a>
        <ul>
          <li class="navtreelevel_2">
            <a href="#">
              <i class="bi bi-heart"></i>
              <span>Title</span>
            </a>
          </li>
        </ul>
      </li>
    </div>
  </ul>
  `;

  $('#sidebar_content').append(navtree_html);
}

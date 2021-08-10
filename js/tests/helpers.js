import $ from 'jquery';

///////////////////////////////////////////////////////////////////////////////
// jQuery overrides
///////////////////////////////////////////////////////////////////////////////

$.fn._slideToggle = $.fn.slideToggle;
$.fn.slideToggle = function(){
    if(this.css('display') !== 'none') {
        $.fn.hide.apply(this);
    } else {
        $.fn.show.apply(this);
    }
};

$.fn._slideUp = $.fn.slideUp;
$.fn.slideUp = function(){
    $.fn.hide.apply(this);
};

$.fn._fadeToggle = $.fn.fadeToggle;
$.fn.fadeToggle = function(){
    if(this.css('display') !== 'none') {
        $.fn.hide.apply(this);
    } else {
        $.fn.show.apply(this);
    }
};

$.fn._fadeOut = $.fn.fadeOut;
$.fn.fadeOut = function(){
    $.fn.hide.apply(this);
};

$.fn._fadeIn = $.fn.fadeIn;
$.fn.fadeIn = function(){
    $.fn.show.apply(this);
};

///////////////////////////////////////////////////////////////////////////////
// create layout element
///////////////////////////////////////////////////////////////////////////////

export function create_layout_elem() {
  let layout_html = $(`
    <div id="layout" style="height:100vh; width:100vw">
      <div id="wrapper"></div>
    </div>
  `);
  $('body').append(layout_html);
}

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
    if ($('#layout').length === 0) {
      create_layout_elem();
    }
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
    $('#wrapper').append(sidebar_html);
}

///////////////////////////////////////////////////////////////////////////////
// Topnav test helpers
///////////////////////////////////////////////////////////////////////////////

export function create_topnav_elem() {
    if ($('#layout').length === 0) {
      create_layout_elem();
    }

    // create html element
    let topnav_html = `
        <div id="topnav">
          <div id="cone-logo">
            <a>
              <img class="logo"
                   src="../../src/cone/app/browser/static/images/cone-logo-cone.svg">
              <span>
                Cone
              </span>
            </a>
          </div>

          <div id="topnav-content">
          </div>

          <div id="mobile-menu-toggle">
            <i class="bi bi-list"></i>
          </div>
        </div>
    `;
    // append element to DOM
    $('#layout').prepend(topnav_html);
}

// create dummy toolbar dropdowns element
export function create_toolbar_elem() {

  let tb_dropdown_elem = $(`
      <ul id="toolbar-top">

      <li class="dropdown" id="language">
        <img class="dropdown-toggle"
            role="button"
            data-bs-toggle="dropdown"
            src="../../src/cone/app/browser/static/images/flags/gb.svg"
            height="15em">
        <ul class="dropdown-menu dropdown-menu-end">
          <li class="toolbar-title">Language</li>
          <li>
            <a href="#">
              <img src="/static/images/flags/fr.svg" height="15em">
              <span>FR</span>
            </a>
            </li>
          <li>
            <a href="#">
              <img src="/static/images/flags/de.svg" height="15em">
              <span>DE</span>
            </a>
          </li>
          <li>
            <a href="#">
              <img src="/static/images/flags/at.svg" height="15em">
              <span>AT</span>
            </a>
          </li>
        </ul>
      </li>

      <li class="dropdown" id="notifications">
        <i class="dropdown-toggle bi bi-bell-fill"
           role="button"
           data-bs-toggle="dropdown"></i>
        <ul class="dropdown-menu dropdown-menu-end">
          <li class="toolbar-title">
            Notifications
          </li>
          <div id="toolbar_actions">
            <span id="noti_sort_date">
              <i class="bi bi-clock-history"></i>
              <i class="arrow-small bi bi-arrow-up"></i>
              <span class="tb-tooltip">Sort by date</span>
            </span>
            <span id="noti_sort_priority">
              <i class="bi bi-exclamation-circle"></i>
              <i class="arrow-small bi bi-arrow-up"></i>
              <span class="tb-tooltip">Sort by priority</span>
            </span>
            <span id="noti_mark_read">
              <i class="bi bi-eye-slash"></i>
              <span class="tb-tooltip">Mark all as read</span>
            </span>
          </div>
        </ul>
      </li>

      <li class="dropdown" id="settings">
        <i class="dropdown-toggle bi bi-gear-fill" role="button" data-bs-toggle="dropdown"></i>
        <ul class="dropdown-menu">
          <li class="toolbar-title">Settings</li>
          <li class="form-check form-switch">
            <input class="form-check-input" id="switch_mode" type="checkbox">
            <label class="form-check-label" for="flexSwitchCheckDefault">Toggle dark mode</label>
          </li>
          <li>
            <a href="#">Preferences</a>
          </li>
        </ul>
      </li>

    </ul>
  `);
  // append dummy element to DOM 
  $('#topnav-content').append(tb_dropdown_elem);
}

// create dummy notification element
export function create_noti_elem(date, priority, id) {
  let noti_elem;

  if(priority) {
    noti_elem = $(`
      <li class="unread notification priority ${priority}"
          data-timestamp="${date}">
        <div class="user-img">
          <img src="#">
        </div>

        <div class="msg">
          <a href="#">
            <p class="message">
              Example test Noti
            </p>
            <p class="message-info">
              Notification Information
            </p>
            <p class="timestamp">
              Timestamp
            </p>
          </a>
        </div>
        <i class="bi bi-x-circle"></i>
      </li>
    `);
  } else {
    noti_elem = $(`
      <li class="unread notification"
          data-timestamp="${date}">
        <div class="user-img">
          <img src="#">
        </div>

        <div class="msg">
          <a href="#">
            <p class="message">
              Example test Noti
            </p>
            <p class="message-info">
              Notification Information
            </p>
            <p class="timestamp">
              Timestamp
            </p>
          </a>
        </div>
      </li>
    `);
  }

  if(id) {
    noti_elem.attr('id', id);
  }

  $('#notifications > ul').append(noti_elem);
}

// create dummy personaltools element
export function create_pt_elem() {
  let personaltools = $(`
    <div class="dropdown" id="personaltools">
      <div id="pt-wrapper" class="dropdown-toggle" role="button" data-bs-toggle="dropdown">
        <div class="profile-image">
          <!-- <img src=""> -->
          <i class="bi bi-person bi-md"></i> 
        </div>

        <div class="user-specs">
          <span class="user-account-name"
                tal:content="context.user">
            Admin
          </span>
          <span class="user-account-position">
            position
          </span>
        </div>
        <i class="dropdown-arrow bi bi-chevron-down"></i>
      </div>

      <div class="dropdown-menu dropdown-menu-end" id="user">
        <ul class="list-unstyled">
          <tal:li repeat="item context.items">
            <tal:action replace="structure item" />
          </tal:li>
        </ul>
      </div>
    </div>
  `);
  // append dummy element to DOM 
  $('#topnav-content').append(personaltools);
}

///////////////////////////////////////////////////////////////////////////////
// MainMenuTop test helpers
///////////////////////////////////////////////////////////////////////////////

export function create_mm_top_elem() {
    // create and append mainmenu DOM element
    let mainmenu_html = `
        <div id="main-menu">
          <ul id="mainmenu">
          </ul>
        </div>
    `;

    $('#topnav-content').append(mainmenu_html);
}

///////////////////////////////////////////////////////////////////////////////
// cone.MainMenuItem test helpers
///////////////////////////////////////////////////////////////////////////////

export function create_mm_items(count) {
    // create data menu items array
    let data_menu_items =
        [
            {
                "selected": false,
                "icon": "bi bi-kanban",
                "id": "child_1",
                "description": null,
                "url": "#",
                "target": "#",
                "title": "child_1"
            },
            {
                "selected": false, 
                "icon": "bi bi-kanban", "id": "child_2",
                "description": null,
                "url": "#",
                "target": "#",
                "title": "child_2"
            },
            {
                "selected": false,
                "icon":
                "bi bi-kanban",
                "id": "child_3",
                "description": null,
                "url": "#",
                "target": "#",
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
                id="elem${i}">
              <a>
                <i class="bi bi-heart"></i>
                <span class="mainmenu-title">
                  Example Item
                </span>
              </a>
              <i class="dropdown-arrow bi bi-chevron-down"></i>
            </li>
        `;

        // append item element to mainmenu DOM
        $('#mainmenu').append(mainmenu_item_html);

        // set item menu-items data
        $(`#elem${i}`).data('menu-items', data_menu_items);
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

export function create_searchbar_elem(elem) {
    if ($('#layout').length === 0) {
      create_layout_elem();
    }
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
            <ul id="cone-livesearch-results">
              <li id="livesearch-result-header">
              </li>
            </ul>
          </ul>
        </div>
    `;
    // append dummy element to DOM
    if(elem) {
      $(elem).append(searchbar_html);
    } else {
      $('#layout').append(searchbar_html);
    }
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
                <span>Title</span>
            </a>
          </li>

          <li class="node-child_2 sb-menu">
            <a href="#">
              <i class="bi bi-heart"></i>
                <span>Title</span>
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
                <span>Title</span>
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

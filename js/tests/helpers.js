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
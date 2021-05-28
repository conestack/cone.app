TODO
====

JS TESTING REQUIREMENTS
-----------------------

Karma: https://karma-runner.github.io/6.3/intro/installation.html
Istanbul: https://istanbul.js.org/
Puppeteer: https://pptr.dev/

install in project directory:
  - karma: browser/chrome
    - chrome launcher needed - also launches chromium/chromium headless
    - set qunit test files
  - istanbul
  - puppeteer
OR 
  - cypress: https://www.cypress.io/


issues
------
[ ] - chromium produces console warning: "cone.js:5281 [Violation] Added non-passive event listener 
      to a scroll-blocking 'mousewheel' event. Consider marking event handler as 'passive' to make 
      the page more responsive. See https://www.chromestatus.com/feature/5745543795965952"
[~] - scrollbar: fix all the bugs. *******
    [X] - fix bug when thumb is positioned right side on resize
    [X] - well fix that again
    [~] - simplify and cleanup scrollbar code - WIP
    [ ] - performance needs drastic improvement
    [X] - rename and reduce scrollbar elements

    [X] - fix scroll event
    [ ] - fix click event
    [ ] - fix drag event


general
-------

[X] - layout.mainmenu_fluid obsolete, remove
[X] - mainmenu_empty_title obsolete, remove
[X] - toolbar_top tile, add
[ ] - navtree -> insert markup (tehut.eu)
[X] - mainmenu -> navtree
[X] - old layout - migrate to bs5 (grid system)
[X] - rewrite topnav, searchbar and mobile menu 
[X] - fix breadcrumb display

javascript
----------

[X] - cone.ThemeSwitcher to change light/dark mode (public.js), added
[X] - searchbar better supports mobile - moved to dropdown on < 380px
[?] - update deprecated javascript in private.js
[X] - now supports screen dimensions from 330px and up - new layout
[X] - implement popper.js
[X] - hamburger menu: main menu instead of sidebar / [X] - rename to mobile menu
[X] - searchbar and mainmenu classes obsolete, remove
[X] - debug main menu
[X] - debug searchbar
[X] - add Main Menu Class
[ ] - simplify - cleanup - correct public.js
      [X] - reduce jquery DOM elements - less is better! -> use in object instead (this.x)
      [X] - make sure to have context with DOM elements to improve performance
      [ ] - bootstrap dropdowns: read documentation and adjust closing toggle on cone.view_mobile
      [X] - descend from ID
[X] - add custom scrollbar
[X] - modeswitch cookie
[X] - sidebar cookie
[?] - dropdown cookie sidebar
[X] - public.js cleanup:
    [X] - add initial function to every ViewPortAware Class
        [X] - sidebar_left
        [X] - topnav
        [X] - navtree
        [X] - mainmenu_sidebar
        [X] - mainmenu_top
[X] - fix searchbar display on resize
[X] - rename toggle_arrow element to toggl_arrow_elem f clarity
[X] - remove initial viewport_changed(null)
[ ] - disconnect scrollbar.observer ?

styles
------

[X] - sidebar_left js (public.js), added
[X] - topnav styles, fixed
[X] - logo styles, added
[X] - #searchbar-button-sm obsolete, removed
[X] - sidebar hover icon colour, fixed
[X] - rename 'dropdown-menu-dark' in layout.pt to 'cone-dropdown-menu'
[X] - implement default user image styles
[X] - optimize searchbar styles
[X] - mobile menu: full width
[X] - topnav wrapper padding - remove
[X] - implement bs5 in old layout:
      [X] - add basic support for md&lg screen sizes;
      [X] - add support for sm screen size
[X] - fix breadcrumb display in pathbar.pt
[X] - remove mainmenu in sidebar - move to topbar
[X] - add navtree in sidebar - display md on hover:
      - current branch: first level & sublevels
      - non-current branch: first level
      - add toggle button [ ]
      - style navtree [X]
      - fix bugs [X]
      - implement mobile version [~]
      - simplify and declutter scss [ ]
[X] - added mobile-menu.scss and navtree.scss
[X] - ".list-true" and ".arrow-none" obsolete, removed -> now uses bootstrap icon,
      opens menu on arrow click in mobile while preserving clickable main link
[X] - removed '.dropdown' class entirely
[X] - rewrote basic structure to be more flexible

icons
-----

[X] - bootstrap icon font 1.3.0
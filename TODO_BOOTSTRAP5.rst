TODO
====

[ ] - layout.mainmenu_fluid obsolete, remove
[ ] - mainmenu_empty_title obsolete, remove
[X] - toolbar_top tile, add
[ ] - navtree -> insert markup (tehut.eu)
[~] - mainmenu -> navtree
[~] - old layout - migrate to bs5 (grid system)
[~] - rewrite topnav, searchbar and mobile menu 

javascript
----------

[X] - cone.ThemeSwitcher to change light/dark mode (public.js), added
[X] - searchbar better supports mobile - moved to dropdown on < 380px
[ ] - update deprecated javascript in private.js
[X] - now supports screen dimensions from 330px and up - new layout
[X] - implement popper.js
[~] - hamburger menu: main menu instead of sidebar / [X] - rename to mobile menu
[X] - change searchbar script to class; add cases for resize;
      [X] - if there is not enough space for searchbar, collapse searchbar 
         -> expand on click, fade out other elements
      [X] + if there is not enough space for mainmenu texts, collapse elements to icons
      [X] + if there is not enough space for either mainmenu icons or searchbar, 
        move content to mobile menu
[~] - debug main menu
[X] - add Main Menu Class

styles
------

[X] - sidebar_left js (public.js), added
[X] - topnav styles, fixed
[X] - logo styles, added
[X] - #searchbar-button-sm obsolete, removed
[X] - sidebar hover icon colour, fixed
[X] - rename 'dropdown-menu-dark' in layout.pt to 'dropdown-menu-custom'
[X] - implement default user image styles
[X] - optimize searchbar styles
[X] - mobile menu: full width
[X] - topnav wrapper padding - remove
[ ] - implement bs5 in old layout:
      [X] - add basic support for md&lg screen sizes;
      [~] - add support for sm screen size
[ ] - fix breadcrumb display in pathbar.pt
[X] - remove mainmenu in sidebar - move to topbar
[~] - add navtree in sidebar - display md on hover:
      - current branch: first level & sublevels
      - non-current branch: first level
    - add toggle button

icons
-----

[X] - bootstrap icon font 1.3.0
/* globals get exported to be accessed by other modules */

import { SidebarMenu } from "../src/sidebar_menu.js";

export const cone = {
    // viewport state is defined by window width
    viewportState: null
}

// dummy mainmenu sidebar to test import
export let main_menu_sidebar = {
    collapse: function() {
        console.log('collapse');
    },
    expand: function() {
        console.log('expand');
    }
}

export let sidebar_menu = SidebarMenu.initialize();

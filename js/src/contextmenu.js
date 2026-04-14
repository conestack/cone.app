import $ from 'jquery';

export class ContextMenuDropdown {
    static initialize() {
        $(document).on('show.bs.dropdown', '#contextmenu .dropdown', function () {
            $(this).find('.dropdown-menu').removeClass('dropdown-menu-end');
        });
        $(document).on('shown.bs.dropdown', '#contextmenu .dropdown', function () {
            const menu = $(this).find('.dropdown-menu')[0];
            const rect = menu.getBoundingClientRect();
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            if (rect.right > viewportWidth) {
                menu.classList.add('dropdown-menu-end');
                const toggle = $(this).find('[data-bs-toggle="dropdown"]')[0];
                const instance = bootstrap.Dropdown.getOrCreateInstance(toggle);
                if (instance._popper) {
                    instance._popper.update();
                }
            }
        });
    }
}

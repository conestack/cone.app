import $ from 'jquery'

export class Topnav extends cone.ViewPortAware {

    static initialize(context) {
        let elem = $('#topnav', context);
        if (!elem.length) {
            return;
        }
        if(cone.topnav !== null) {
            cone.topnav.unload();
        }
        cone.topnav = new cone.Topnav(elem);
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.content = $('#topnav-content', elem);
        this.toggle_button = $('#mobile-menu-toggle', elem);
        this.logo = $('#cone-logo', elem);
        this.tb_dropdowns = $('#toolbar-top>li.dropdown', elem);
        this._toggle_menu_handle = this.toggle_menu.bind(this);
        this.toggle_button.on('click', this._toggle_menu_handle);

        if (this.vp_state === cone.VP_MOBILE) {
            this.content.hide();
            this.elem.addClass('mobile');
            this.tb_dropdowns.off().on('show.bs.dropdown', () => {
                this.content.hide();
            });
        }

        // tmp
        this.pt = $('#personaltools');
        this.user =  $('#user');
        this.pt_handle();
        // end tmp
    }

    unload() {
        super.unload();
        this.toggle_button.off('click', this._toggle_menu_handle);
        this.tb_dropdowns.off('show.bs.dropdown');
    }

    toggle_menu() {
        this.content.slideToggle('fast');
        // slideToggle overrides display flex with block, we need flex
        if (this.content.css('display') === 'block') {
            this.content.css('display', 'flex');
        }
    }

    viewport_changed(e) {
        super.viewport_changed(e);
        if (this.vp_state === cone.VP_MOBILE) {
            this.content.hide();
            this.elem.addClass('mobile');
            // hide menu on toolbar click
            this.tb_dropdowns.off().on('show.bs.dropdown', () => {
                this.content.hide();
            });
        } else {
            this.content.show();
            this.elem.removeClass('mobile');
            this.tb_dropdowns.off();
        }

        // tmp
        this.pt_handle();
        // end tmp
    }

    pt_handle() {
        // tmp
        if (this.vp_state === cone.VP_MOBILE) {
            this.pt.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                this.user.stop(true, true).slideDown('fast');
                cone.toggle_arrow($('i.dropdown-arrow', '#personaltools'));
            });
            this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                this.user.stop(true, true).slideUp('fast');
                cone.toggle_arrow($('i.dropdown-arrow', '#personaltools'));
            });
        } else {
            this.pt.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                this.user.show();
            });
            this.pt.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                this.user.hide();
            });
        }
    }
}
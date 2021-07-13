import $ from 'jquery'

export class Navtree extends cone.ViewPortAware {

    static initialize(context) {
        let elem = $('#navtree', context);
        if (!elem.length) {
            return;
        }
        if (cone.navtree !== null) {
            cone.navtree.unload();
        }
        cone.navtree = new cone.Navtree(elem);
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.content = $('#navtree-content', elem);
        this.heading = $('#navtree-heading', elem);
        this.toggle_elems = $('li.navtreelevel_1', elem);

        if (this.vp_state === cone.VP_MOBILE) {
            this.mv_to_mobile();
        }

        this._mouseenter_handle = this.align_width.bind(this);
        this.toggle_elems.on('mouseenter', this._mouseenter_handle);
        this._restore = this.restore_width.bind(this);
        this.toggle_elems.on('mouseleave', this._restore); //restore original size

        this.scrollbar_handle();
    }

    unload() {
        super.unload();
        this.heading.off('click');
        this.toggle_elems.off('mouseenter', this._mouseenter_handle)
                         .off('mouseleave', this._restore);
    }

    mv_to_mobile() {
        this.elem.detach().appendTo(cone.topnav.content).addClass('mobile');
        this.content.hide();
        this.heading.off('click').on('click', () => {
            this.content.slideToggle('fast');
        });
    }

    viewport_changed(e) {
        super.viewport_changed(e);
        if (this.vp_state === cone.VP_MOBILE) {
            this.mv_to_mobile();
        } else {
            this.elem.detach().appendTo(cone.sidebar_menu.content).removeClass('mobile');
            this.heading.off('click');
            this.content.show();
        }
    }

    align_width(evt) {
        let target = $(evt.currentTarget);
        target.addClass('hover');
        if (target.outerWidth() > $('ul', target).outerWidth()) {
            $('ul', target).css('width', target.outerWidth());
        } else {
            target.css('width', $('ul', target).outerWidth());
        }
    }

    restore_width(evt) {
        $(evt.currentTarget).css('width', 'auto');
        $(evt.currentTarget).removeClass('hover');
    }

    scrollbar_handle(){
        $(window)
        .on('dragstart', () => {
            this.toggle_elems.off('mouseenter', this._mouseenter_handle);
        })
        .on('dragend', () => {
            this.toggle_elems.on('mouseenter', this._mouseenter_handle);
        });
    }
}
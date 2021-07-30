import $ from 'jquery'

export class ScrollBar {

    constructor(elem) {
        // scroll container
        this.elem = elem;
        // content to scroll
        this.content = $('>', this.elem);
        this.scrollbar = $('<div class="scrollbar" />');
        this.thumb = $('<div class="scroll-handle" />');

        this.position = 0;
        this.unit = 10;

        this.compile();
        this.observe_container();

        this._scroll = this.scroll_handle.bind(this);
        this.elem.on('mousewheel wheel', this._scroll);

        this._click_handle = this.click_handle.bind(this);
        this.scrollbar.on('click', this._click_handle);

        this._drag_handle = this.drag_handle.bind(this);
        this.thumb.on('mousedown', this._drag_handle);

        this._mousehandle = this.mouse_in_out.bind(this);
        this.elem.on('mouseenter mouseleave', this._mousehandle);
    }

    observe_container() {
        this.scrollbar_observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                this.update();
            }
        })
        this.scrollbar_observer.observe(this.elem.get(0));
    }

    /* istanbul ignore next */
    compile() {
        // abstract, implemented in subclass
        throw 'Abstract ScrollBar does not implement compile()';
    }

    /* istanbul ignore next */
    update() {
        // abstract, implemented in subclass
        throw 'Abstract ScrollBar does not implement update()';
    }

    unload() {
        this.scrollbar.off('click', this._click_handle);
        this.elem.off('mousewheel wheel', this._scroll);
        this.elem.off('mouseenter mouseleave', this._mousehandle);
        this.thumb.off('mousedown', this._drag_handle);
        this.scrollbar_observer.unobserve(this.elem.get(0));
    }

    mouse_in_out(e) {
        /* istanbul ignore else */
        if(this.contentsize > this.scrollsize) {
            if(e.type == 'mouseenter') {
                this.scrollbar.fadeIn();
            } else {
                this.scrollbar.fadeOut();
            }
        }
    }

    scroll_handle(e) {
        if(this.contentsize <= this.scrollsize) {
            return;
        }
        let evt = e.originalEvent;
        /* istanbul ignore else */
        if (typeof evt.deltaY === 'number') {
            // down
            if(evt.deltaY > 0) {
                this.position += this.unit;
            }
            // up
            /* istanbul ignore else */
            else if(evt.deltaY < 0) {
                this.position -= this.unit;
            }
        }
        this.set_position();
    }

    prevent_overflow() {
        let threshold = this.contentsize - this.scrollsize;
        if(this.position >= threshold) {
            this.position = threshold;
        } /* istanbul ignore else */
        else if(this.position <= 0) {
            this.position = 0;
        }
    }

    click_handle(e) {
        e.preventDefault(); // prevent text selection
        this.thumb.addClass('active');
        let evt_data = this.get_evt_data(e),
            new_thumb_pos = evt_data - this.get_offset() - this.thumbsize / 2;
        this.position = this.contentsize * new_thumb_pos / this.scrollsize;
        this.set_position();
        this.thumb.removeClass('active');
    }

    drag_handle(e) {
        e.preventDefault();
        var evt = $.Event('dragstart');
        $(window).trigger(evt);

        let _on_move = on_move.bind(this),
            _on_up = on_up.bind(this),
            mouse_pos = this.get_evt_data(e) - this.get_offset(),
            thumb_position = this.position / (this.contentsize / this.scrollsize);
        this.thumb.addClass('active');

        this.elem.off('mouseenter mouseleave', this._mousehandle);

        $(document)
            .on('mousemove', _on_move)
            .on('mouseup', _on_up);

        function on_move(e) {
            let mouse_pos_on_move = this.get_evt_data(e) - this.get_offset(),
                new_thumb_pos = thumb_position + mouse_pos_on_move - mouse_pos;
            this.position = this.contentsize * new_thumb_pos / this.scrollsize;
            this.set_position();
        }
        function on_up() {
            var evt = $.Event('dragend');
            $(window).trigger(evt);
            $(document)
                .off('mousemove', _on_move)
                .off('mouseup', _on_up);
            this.thumb.removeClass('active');
            this.elem.on('mouseenter mouseleave', this._mousehandle);
        }
    }
}

export class ScrollBarX extends ScrollBar {

    constructor(elem) {
        super(elem);
    }

    compile() {
        this.content.addClass('scroll-content');
        this.elem
            .addClass('scroll-container')
            .prepend(this.scrollbar);
        this.scrollbar.append(this.thumb);
        this.thumb.css('height', '6px');
        this.scrollbar.css('height', '6px');

        this.scrollsize = this.elem.outerWidth();
        this.contentsize = this.content.outerWidth();

        this.scrollbar.css('width', this.scrollsize);
        this.thumbsize = this.scrollsize / (this.contentsize / this.scrollsize);
        this.thumb.css('width', this.thumbsize);
    }

    update() {
        this.scrollsize = this.elem.outerWidth();
        this.scrollbar.css('width', this.scrollsize);

        if(this.content.outerWidth() !== this.contentsize) {
            this.contentsize = this.content.outerWidth();
        }
        if(this.contentsize <= this.scrollsize) {
            this.thumbsize = this.scrollsize;
        } else {
            this.thumbsize = Math.pow(this.scrollsize, 2) / this.contentsize;
        }

        this.thumb.css('width', this.thumbsize);
        this.set_position();
    }

    set_position() {
        this.prevent_overflow();
        let thumb_pos = this.position / (this.contentsize / this.scrollsize);
        this.content.css('right', this.position + 'px');
        this.thumb.css('left', thumb_pos + 'px');
    }

    get_evt_data(e) {
        return e.pageX;
    }

    get_offset() {
        return this.elem.offset().left;
    }
};

export class ScrollBarY extends ScrollBar {

    constructor(elem) {
        super(elem);
    }

    compile() {
        this.content.addClass('scroll-content');
        this.elem
            .addClass('scroll-container')
            .prepend(this.scrollbar);
        this.scrollbar.append(this.thumb);
        this.thumb.css('width', '6px');
        this.scrollbar.css('width', '6px');
        this.scrollbar.css('right', '0px');

        this.scrollsize = this.elem.outerHeight();
        this.contentsize = this.content.outerHeight();

        this.scrollbar.css('height', this.scrollsize);
        this.thumbsize = this.scrollsize / (this.contentsize / this.scrollsize);
        this.thumb.css('height', this.thumbsize);
    }

    update() {
        this.scrollsize = this.elem.outerHeight();
        this.scrollbar.css('height', this.scrollsize);

        if(this.content.outerHeight() !== this.contentsize) {
            this.contentsize = this.content.outerHeight();
        }
        if(this.contentsize <= this.scrollsize) {
            this.thumbsize = this.scrollsize;
        } else {
            this.thumbsize = Math.pow(this.scrollsize, 2) / this.contentsize;
        }

        this.thumb.css('height', this.thumbsize);
        this.set_position();
    }

    set_position() {
        this.prevent_overflow();
        let thumb_pos = this.position / (this.contentsize / this.scrollsize);
        this.content.css('bottom', this.position + 'px');
        this.thumb.css('top', thumb_pos + 'px');
    }

    get_evt_data(e) {
        return e.pageY;
    }

    get_offset() {
        return this.elem.offset().top;
    }
}

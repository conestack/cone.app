import $ from 'jquery';

export class Scrollbar {

    static initialize(context) {
        $('.scrollable-x', context).each(function() {
            new ScrollbarX($(this));
        });
        $('.scrollable-y', context).each(function() {
            new ScrollbarY($(this));
        });
    }

    constructor(elem) {
        // scroll container
        this.elem = elem;
        // content to scroll
        this.content = $('.scrollable-content', this.elem).addClass('scroll-content');
        this.scrollbar = $('<div class="scrollbar" />').css('position', 'absolute');
        this.thumb = $('<div class="scroll-handle" />').appendTo(this.scrollbar);
        this.elem
            .addClass('scroll-container')
            .prepend(this.scrollbar);

        this.position = 0;
        this.unit = 50;

        this.compile();

        this._scroll = this.scroll_handle.bind(this);
        this.elem.on('mousewheel wheel', this._scroll);

        this._click_handle = this.click_handle.bind(this);
        this.scrollbar.on('click', this._click_handle);

        this._drag_handle = this.drag_handle.bind(this);
        this.thumb.on('mousedown', this._drag_handle);

        this._mousehandle = this.mouse_in_out.bind(this);
        this.elem.on('mouseenter mouseleave', this._mousehandle);
    }

    compile() {
        // abstract, implemented in subclass
        throw 'Abstract Scrollbar does not implement compile()';
    }

    update() {
        // abstract, implemented in subclass
        throw 'Abstract Scrollbar does not implement update()';
    }

    unload() {
        this.scrollbar.off('click', this._click_handle);
        this.elem.off('mousewheel wheel', this._scroll);
        this.elem.off('mouseenter mouseleave', this._mousehandle);
        this.thumb.off('mousedown', this._drag_handle);
    }

    mouse_in_out(e) {
        e.preventDefault();
        e.stopPropagation();

        const container = this.elem.get(0);
        const is_inside_container = $(container).has(e.target).length > 0 || $(container).is(e.target);

        if (is_inside_container && this.contentsize > this.scrollsize) {
            if (e.type === 'mouseenter') {
                this.scrollbar.fadeIn();
            } else if (e.type === 'mouseleave') {
                if (e.relatedTarget !== this.elem.get(0)) {
                    this.scrollbar.fadeOut();
                }
            }
        }
    }

    scroll_handle(e) {
        if(this.contentsize <= this.scrollsize) {
            return;
        }
        let evt = e.originalEvent;
        if (typeof evt.deltaY === 'number') {
            // down
            if(evt.deltaY > 0) {
                this.position += this.unit;
            }
            // up
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
        } else if(this.position <= 0) {
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

export class ScrollbarX extends Scrollbar {

    constructor(elem) {
        console.log('XXX')
        super(elem);
    }

    compile() {
        this.thumb.css('height', '6px');
        this.scrollbar.css('height', '6px');

        this.scrollsize = this.elem.outerWidth();
        this.contentsize = this.content.outerWidth();

        this.scrollbar.css('width', this.scrollsize);
        this.thumbsize = this.scrollsize / (this.contentsize / this.scrollsize);
        this.thumb.css('width', this.thumbsize);

        this.update();
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
        console.log('E')
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

export class ScrollbarY extends Scrollbar {

    constructor(elem) {
        super(elem);
    }

    compile() {
        this.thumb.css('width', '6px');
        this.scrollbar.css('width', '6px');
        this.scrollbar.css('right', '0px');

        this.scrollsize = this.elem.outerHeight();
        this.contentsize = this.content.outerHeight();

        this.scrollbar.css('height', this.scrollsize);
        this.thumbsize = this.scrollsize / (this.contentsize / this.scrollsize);
        this.thumb.css('height', this.thumbsize);

        this.update();
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
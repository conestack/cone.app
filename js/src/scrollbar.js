import $ from 'jquery';
import ts from 'treibstoff';

export class Scrollbar extends ts.Events {

    static initialize(context) {
        $('.scrollable-x', context).each(function() {
            new ScrollbarX($(this));
        });
        $('.scrollable-y', context).each(function() {
            new ScrollbarY($(this));
        });
    }

    constructor(elem) {
        super();

        this.elem = elem;
        this.elem.data('scrollbar', this);

        // scrollable content
        this.content = $('.scrollable-content', this.elem);

        this.position = 0;
        this.unit = 50;
        this.disabled = null;
        
        this.on_scroll = this.on_scroll.bind(this);
        this.on_click = this.on_click.bind(this);
        this.on_drag = this.on_drag.bind(this);
        this.on_hover = this.on_hover.bind(this);
        this.on_resize = this.on_resize.bind(this);

        ts.ajax.attach(this, this.elem);

        this.compile();
        this.bind();
        ts.clock.schedule_frame(() => this.update());
    }

    bind() {
        this.disabled = false;
        this.elem.on('mousewheel wheel', this.on_scroll);
        this.scrollbar.on('click', this.on_click);
        this.thumb.on('mousedown', this.on_drag);
        this.elem.on('mouseenter mouseleave', this.on_hover);
        $(window).on('resize', this.on_resize);
    }

    disable() {
        this.disabled = true;
        this.elem.off('mousewheel wheel', this.on_scroll);
        this.scrollbar.off('click', this.on_click);
        this.thumb.off('mousedown', this.on_drag);
        this.elem.off('mouseenter mouseleave', this.on_hover);
        $(window).off('resize', this.on_resize);
    }

    destroy() {
        $(window).off('resize', this.on_resize);
    }

    compile() {
        ts.compile_template(this, `
        <div class="scrollbar" t-elem="scrollbar">
          <div class="scroll-handle" t-elem="thumb">
          </div>
        </div>
        `, this.elem);
    }

    update() {
        // abstract, implemented in subclass
        throw 'Abstract Scrollbar does not implement update()';
    }

    update(attr) {
        this.scrollbar.css(attr, this.scrollsize);
        if(this.contentsize <= this.scrollsize) {
            this.thumbsize = this.scrollsize;
        } else {
            this.thumbsize = Math.pow(this.scrollsize, 2) / this.contentsize;
        }
        this.thumb.css(attr, this.thumbsize);
        this.set_position();
    }

    reset() {
        this.position = 0;
        this.set_position();
    }

    unload() {
        this.scrollbar.off('click', this.on_click);
        this.elem.off('mousewheel wheel', this.on_scroll);
        this.elem.off('mouseenter mouseleave', this.on_hover);
        this.thumb.off('mousedown', this.on_drag);
    }

    on_hover(e) {
        e.preventDefault();
        e.stopPropagation();

        const container = this.elem.get(0);
        const is_inside_container = $(container).has(e.target).length > 0 || $(container).is(e.target);

        if (is_inside_container && this.contentsize > this.scrollsize) {
            if (e.type === 'mouseenter') {
                this.scrollbar.stop(true, true).fadeIn();
            } else if (e.type === 'mouseleave') {
                if (e.relatedTarget !== this.elem.get(0)) {
                    this.scrollbar.stop(true, true).fadeOut();
                }
            }
        }
    }

    on_scroll(e) {
        if (this.contentsize <= this.scrollsize) {
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

    on_click(e) {
        e.preventDefault(); // prevent text selection
        this.thumb.addClass('active');
        let evt_data = this.get_evt_data(e),
            new_thumb_pos = evt_data - this.offset - this.thumbsize / 2;
        this.position = this.contentsize * new_thumb_pos / this.scrollsize;
        this.set_position();
        this.thumb.removeClass('active');
    }

    on_drag(e) {
        e.preventDefault();
        var evt = $.Event('dragstart');
        $(window).trigger(evt);

        function on_move(e) {
            let mouse_pos_on_move = this.get_evt_data(e) - this.offset,
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
            this.elem.on('mouseenter mouseleave', this.on_hover);
        }

        let _on_move = on_move.bind(this),
            _on_up = on_up.bind(this),
            mouse_pos = this.get_evt_data(e) - this.offset,
            thumb_position = this.position / (this.contentsize / this.scrollsize);
        this.thumb.addClass('active');

        this.elem.off('mouseenter mouseleave', this.on_hover);

        $(document)
            .on('mousemove', _on_move)
            .on('mouseup', _on_up);
    }
}

export class ScrollbarX extends Scrollbar {

    get offset() {
        return this.elem.offset().left;
    }

    get contentsize() {
        return this.content.outerWidth();
    }

    get scrollsize() {
        return this.elem.outerWidth();
    }

    compile() {
        super.compile();
        this.thumb.css('height', '6px');
        this.scrollbar
            .css('height', '6px')
            .css('width', this.scrollsize);
        this.thumbsize = this.scrollsize / (this.contentsize / this.scrollsize);
        this.thumb.css('width', this.thumbsize);
    }

    update() {
        super.update('width');
    }

    on_resize() {
        this.update();
    }

    set_position() {
        this.prevent_overflow();
        let thumb_pos = this.position / (this.contentsize / this.scrollsize);
        this.content.css('right', this.position + 'px');
        this.thumb.css('left', thumb_pos + 'px');
        this.trigger('on_position');
    }

    get_evt_data(e) {
        return e.pageX;
    }
};

export class ScrollbarY extends Scrollbar {

    get offset() {
        return this.elem.offset().top;
    }

    get contentsize() {
        return this.content.outerHeight();
    }

    get scrollsize() {
        return this.elem.outerHeight();
    }

    compile() {
        super.compile();
        this.thumb.css('width', '6px');
        this.scrollbar
            .css('width', '6px')
            .css('top', '0px')
            .css('height', this.scrollsize);
        this.thumbsize = this.scrollsize / (this.contentsize / this.scrollsize);
        this.thumb.css('height', this.thumbsize);
    }

    update() {
        super.update('height');
    }

    on_resize() {
        this.update();
    }

    set_position() {
        this.prevent_overflow();
        let thumb_pos = this.position / (this.contentsize / this.scrollsize);
        this.content.css('bottom', this.position + 'px');
        this.thumb.css('top', thumb_pos + 'px');
        this.trigger('on_position');
    }

    get_evt_data(e) {
        return e.pageY;
    }
}
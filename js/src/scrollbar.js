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
        this.content = ts.query_elem('.scrollable-content', elem);

        this.on_scroll = this.on_scroll.bind(this);
        this.on_click = this.on_click.bind(this);
        this.on_drag = this.on_drag.bind(this);
        this.on_hover = this.on_hover.bind(this);
        this.on_resize = this.on_resize.bind(this);

        this.compile();
        this.position = 0;
        this.scroll_step = 50;
        new ts.Property(this, 'disabled', false);

        ts.ajax.attach(this, this.elem);
        ts.clock.schedule_frame(() => this.render());
    }

    get position() {
        return this._position || 0;
    }

    set position(position) {
        this._position = this.safe_position(position);
        this.update();
        this.trigger('on_position', this._position);
    }

    get pointer_events() {
        return this.elem.css('pointer-events') === 'all';
    }

    set pointer_events(value) {
        this.elem.css('pointer-events', value ? 'all' : 'none');
    }

    bind() {
        this.pointer_events = true;
        this.elem.css('pointer-events', 'all');
        this.elem.on('mousewheel wheel', this.on_scroll);
        this.scrollbar.on('click', this.on_click);
        this.thumb.on('mousedown', this.on_drag);
        this.elem.on('mouseenter mouseleave', this.on_hover);
        $(window).on('resize', this.on_resize);
    }

    unbind() {
        this.elem.off('mousewheel wheel', this.on_scroll);
        this.scrollbar.off('click', this.on_click);
        this.thumb.off('mousedown', this.on_drag);
        this.elem.off('mouseenter mouseleave', this.on_hover);
        $(window).off('resize', this.on_resize);
    }

    destroy() {
        this.unbind();
    }

    compile() {
        ts.compile_template(this, `
        <div class="scrollbar" t-elem="scrollbar">
          <div class="scroll-handle" t-elem="thumb">
          </div>
        </div>
        `, this.elem);
    }

    render(attr) {
        this.scrollbar.css(attr, this.scrollsize);
        if(this.contentsize <= this.scrollsize) {
            this.thumbsize = this.scrollsize;
        } else {
            this.thumbsize = Math.pow(this.scrollsize, 2) / this.contentsize;
        }
        this.thumb.css(attr, this.thumbsize);
        this.update();
    }

    safe_position(position) {
        const max_pos = this.contentsize - this.scrollsize;
        if (position >= max_pos) {
            position = max_pos;
        } else if (position <= 0) {
            position = 0;
        }
        return position;
    }

    on_disabled(value) {
        if (value) {
            this.unbind();
        } else {
            this.bind();
        }
    }

    on_resize() {
        this.render();
    }

    on_hover(e) {
        e.preventDefault();
        e.stopPropagation();
        const elem = this.elem;
        if (
            (elem.has(e.target).length > 0 || elem.is(e.target)) &&
            this.contentsize > this.scrollsize
        ) {
            if (e.type === 'mouseenter') {
                this.scrollbar.stop(true, true).fadeIn();
            } else if (e.type === 'mouseleave' && e.relatedTarget !== elem.get(0)) {
                this.scrollbar.stop(true, true).fadeOut();
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
                this.position += this.scroll_step;
            }
            // up
            else if(evt.deltaY < 0) {
                this.position -= this.scroll_step;
            }
        }
    }

    on_click(e) {
        e.preventDefault(); // prevent text selection
        this.thumb.addClass('active');
        let position = this.pos_from_evt(e),
            thumb_pos = position - this.offset - this.thumbsize / 2;
        this.position = this.contentsize * thumb_pos / this.scrollsize;
        this.thumb.removeClass('active');
    }

    on_drag(e) {
        e.preventDefault();
        var evt = $.Event('dragstart');
        $(window).trigger(evt);

        function on_move(e) {
            let mouse_pos_on_move = this.pos_from_evt(e) - this.offset,
                new_thumb_pos = thumb_position + mouse_pos_on_move - mouse_pos;
            this.position = this.contentsize * new_thumb_pos / this.scrollsize;
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
            mouse_pos = this.pos_from_evt(e) - this.offset,
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

    render() {
        super.render('width');
    }

    update() {
        let thumb_pos = this.position / (this.contentsize / this.scrollsize);
        this.content.css('right', this.position + 'px');
        this.thumb.css('left', thumb_pos + 'px');
    }

    pos_from_evt(e) {
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

    render() {
        super.render('height');
    }

    update() {
        let thumb_pos = this.position / (this.contentsize / this.scrollsize);
        this.content.css('bottom', this.position + 'px');
        this.thumb.css('top', thumb_pos + 'px');
    }

    pos_from_evt(e) {
        return e.pageY;
    }
}

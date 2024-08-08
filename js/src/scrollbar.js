import $ from 'jquery';
import ts from 'treibstoff';

export class Scrollbar extends ts.Motion {

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
        if (this.elem.data('scrollbar')) {
            console.warn('cone.app: Only one Scrollbar can be bound to each element.');
            return;
        }
        this.elem.data('scrollbar', this);
        this.content = ts.query_elem('> .scrollable-content', elem);

        this.on_scroll = this.on_scroll.bind(this);
        this.on_click = this.on_click.bind(this);
        this.on_hover = this.on_hover.bind(this);
        this.on_resize = this.on_resize.bind(this);

        this.compile();
        this.position = 0;
        this.scroll_step = 50;
        new ts.Property(this, 'disabled', false);

        ts.ajax.attach(this, this.elem);
        ts.clock.schedule_frame(() => this.render());

        const is_mobile = $(window).width() <= 768; // bs5 small/medium breakpoint
        new ts.Property(this, 'is_mobile', is_mobile);
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

    on_is_mobile(val) {
        if (val && this.contentsize > this.scrollsize) {
            this.scrollbar.stop(true, true).show();
            this.elem.off('mouseenter mouseleave', this.on_hover);
        } else {
            this.scrollbar.stop(true, true).hide();
            this.elem.on('mouseenter mouseleave', this.on_hover);
        }
    }

    bind() {
        this.pointer_events = true;
        this.elem.on('mousewheel wheel', this.on_scroll);
        this.scrollbar.on('click', this.on_click);
        this.set_scope(this.thumb, $(document), this.elem);
        $(window).on('resize', this.on_resize);
    }

    unbind() {
        this.elem.off('mousewheel wheel', this.on_scroll);
        this.elem.off('mouseenter mouseleave', this.on_hover);
        this.scrollbar.off('click', this.on_click);
        $(this.thumb).off('mousedown', this._down_handle);
        $(window).off('resize', this.on_resize);
    }

    destroy() {
        this.unbind();
        this.scrollbar.remove();
        this.elem.data('scrollbar', null);
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
        if (this.contentsize <= this.scrollsize) {
            this.thumbsize = this.scrollsize;
        } else {
            this.thumbsize = Math.pow(this.scrollsize, 2) / this.contentsize;
        }
        this.thumb.css(attr, this.thumbsize);
        this.update();
    }

    safe_position(position) {
        if (this.contentsize <= this.scrollsize) {
            // "safe" position will be a negative value if content smaller than scrollsize
            return position;
        }
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
        this.is_mobile = $(window).width() <= 768; // bs5 small/medium breakpoint
        this.render();
    }

    on_hover(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        const elem = this.elem;
        if (
            (elem.has(evt.target).length > 0 || elem.is(evt.target)) &&
            this.contentsize > this.scrollsize
        ) {
            if (evt.type === 'mouseenter') {
                this.scrollbar.stop(true, true).fadeIn();
            } else if (
                evt.type === 'mouseleave' &&
                evt.relatedTarget !== elem.get(0)
            ) {
                this.scrollbar.stop(true, true).fadeOut();
            }
        }
    }

    on_scroll(evt) {
        if (this.contentsize <= this.scrollsize) {
            return;
        }
        let evt_ = evt.originalEvent;
        if (typeof evt_.deltaY === 'number') {
            if (evt_.deltaY > 0) { // down
                this.position += this.scroll_step;
            } else if (evt_.deltaY < 0) { // up
                this.position -= this.scroll_step;
            }
        }
    }

    on_click(evt) {
        evt.preventDefault(); // prevent text selection
        this.thumb.addClass('active');
        let position = this.pos_from_evt(evt),
            thumb_pos = position - this.offset - this.thumbsize / 2;
        this.position = this.contentsize * thumb_pos / this.scrollsize;
        this.thumb.removeClass('active');
    }

    touchstart(evt) {
        const touch = evt.originalEvent.touches[0];
        this._touch_start_y = touch.pageY;
        this._start_position = this.position;
    }

    touchmove(evt) {
        if (this.contentsize <= this.scrollsize) {
            return;
        }
        const touch = evt.originalEvent.touches[0];
        const deltaY = touch.pageY - this._touch_start_y;
        this.position = this._start_position - deltaY;
    }

    touchend(evt) {
        delete this._touch_start_y;
        delete this._start_position;
    }

    down(evt) {
        this._mouse_pos = this.pos_from_evt(evt) - this.offset;
        this._thumb_pos = this.position / (this.contentsize / this.scrollsize);
        this.elem.off('mouseenter mouseleave', this.on_hover);
        this.thumb.addClass('active');
    }

    move(evt) {
        let mouse_pos = this.pos_from_evt(evt) - this.offset,
            thumb_pos = this._thumb_pos + mouse_pos - this._mouse_pos;
        this.position = this.contentsize * thumb_pos / this.scrollsize;
    }

    up(evt) {
        delete this._mouse_pos;
        delete this._thumb_pos;
        this.elem.on('mouseenter mouseleave', this.on_hover);
        this.thumb.removeClass('active');
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

import $ from 'jquery';
import ts from 'treibstoff';

/**
 * Class representing a generic scrollbar.
 * @extends ts.Motion
 */
export class Scrollbar extends ts.Motion {

    /**
     * Initializes all scrollable elements in the given context.
     * @param {Element} context
     */
    static initialize(context) {
        $('.scrollable-x', context).each(function() {
            new ScrollbarX($(this));
        });
        $('.scrollable-y', context).each(function() {
            new ScrollbarY($(this));
        });
    }

    /**
     * Creates an instance of a Scrollbar.
     * @param {jQuery} elem
     */
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
        this.scroll_step = 50; // Scroll step in pixels
        new ts.Property(this, 'disabled', false);

        ts.ajax.attach(this, this.elem);
        ts.clock.schedule_frame(() => this.render());

        const is_mobile = $(window).width() <= 768; // bs5 small/medium breakpoint
        new ts.Property(this, 'is_mobile', is_mobile);
    }

    /**
     * Gets the current scroll position.
     * @returns {number}
     */
    get position() {
        return this._position || 0;
    }

    /**
     * Sets the scroll position and triggers position update.
     * @param {number} position
     */
    set position(position) {
        this._position = this.safe_position(position);
        this.update();
        this.trigger('on_position', this._position);
    }

    /**
     * Gets the pointer events status.
     * @returns {boolean} Whether pointer events are enabled.
     */
    get pointer_events() {
        return this.elem.css('pointer-events') === 'all';
    }

    /**
     * Sets the pointer events status.
     * @param {boolean} value Whether to enable pointer events.
     */
    set pointer_events(value) {
        this.elem.css('pointer-events', value ? 'all' : 'none');
    }

    /**
     * Handles fading in and out of the scrollbar based on activity.
     */
    fade_timer() {
        if (!this.scrollbar.is(':visible')) {
            this.scrollbar.fadeIn('fast');
        }
        if (this.fade_out_timeout) {
            clearTimeout(this.fade_out_timeout);
        }
        this.fade_out_timeout = setTimeout(() => {
            this.scrollbar.fadeOut('slow');
        }, 700);
    }

    /**
     * Handles changes in the mobile state.
     * @param {boolean} val
     */
    on_is_mobile(val) {
        if (val && this.contentsize > this.scrollsize) {
            this.scrollbar.stop(true, true).show();
            this.elem.off('mouseenter mouseleave', this.on_hover);
        } else {
            this.scrollbar.stop(true, true).hide();
            this.elem.on('mouseenter mouseleave', this.on_hover);
        }
    }

    /**
     * Binds events to the scrollbar.
     */
    bind() {
        this.pointer_events = true;
        this.elem.on('mousewheel wheel', this.on_scroll);
        this.scrollbar.on('click', this.on_click);
        this.set_scope(this.thumb, $(document), this.elem);
        $(window).on('resize', this.on_resize);
    }

    /**
     * Unbinds events from the scrollbar.
     */
    unbind() {
        this.elem.off('mousewheel wheel', this.on_scroll);
        this.elem.off('mouseenter mouseleave', this.on_hover);
        this.scrollbar.off('click', this.on_click);
        $(this.thumb).off('mousedown', this._down_handle);
        $(window).off('resize', this.on_resize);
    }

    /**
     * Destroys the scrollbar instance and cleans up.
     */
    destroy() {
        this.unbind();
        this.scrollbar.remove();
        this.elem.data('scrollbar', null);
    }

    /**
     * Compiles the scrollbar template.
     */
    compile() {
        ts.compile_template(this, `
        <div class="scrollbar" t-elem="scrollbar">
          <div class="scroll-handle" t-elem="thumb">
          </div>
        </div>
        `, this.elem);
    }

    /**
     * Renders the scrollbar and updates its dimensions.
     * @param {string} [attr] Attribute to update ('width' or 'height').
     */
    render(attr) {
        this.scrollbar.css(attr, this.scrollsize);
        if (this.contentsize <= this.scrollsize) {
            this.thumbsize = this.scrollsize;
        } else {
            this.thumbsize = Math.pow(this.scrollsize, 2) / this.contentsize;
        }
        this.thumb.css(attr, this.thumbsize);
        this.update();
        // ensure correct scroll position when outside of safe bounds
        this.position = this.safe_position(this.position);
    }

    /**
     * Validates and returns a safe scroll position.
     * @param {number} position The desired scroll position.
     * @returns {number} A safe scroll position within bounds.
     * @throws Will throw an error if position is not a number.
     */
    safe_position(position) {
        if (typeof position !== 'number') {
            throw new Error(`Scrollbar position must be a Number, position is: "${position}".`);
        }
        if (this.contentsize <= this.scrollsize) {
            // reset position
            return 0;
        }
        const max_pos = this.contentsize - this.scrollsize;
        if (position >= max_pos) {
            position = max_pos;
        } else if (position <= 0) {
            position = 0;
        }
        return position;
    }

    /**
     * Handles the state of the scrollbar when disabled.
     * @param {boolean} value
     */
    on_disabled(value) {
        if (value) {
            this.unbind();
        } else {
            this.bind();
        }
    }

    /**
     * Handles window resize events to adjust the scrollbar.
     */
    on_resize() {
        this.is_mobile = $(window).width() <= 768; // bs5 small/medium breakpoint
        this.position = this.safe_position(this.position);
        this.render();
    }

    /**
     * Handles hover events to show/hide the scrollbar.
     * @param {Event} evt
     */
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

    /**
     * Handles scroll events to adjust the scrollbar position.
     * @param {Event} evt
     */
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

    /**
     * Handles click events on the scrollbar.
     * @param {Event} evt
     */
    on_click(evt) {
        evt.preventDefault(); // prevent text selection
        this.thumb.addClass('active');
        let position = this.pos_from_evt(evt),
            thumb_pos = position - this.offset - this.thumbsize / 2;
        this.position = this.contentsize * thumb_pos / this.scrollsize;
        this.thumb.removeClass('active');
    }

    /**
     * Handles touch start events.
     * @param {Event} evt
     */
    touchstart(evt) {
        const touch = evt.originalEvent.touches[0];
        this._touch_pos = this.pos_from_evt(touch);
        this._start_position = this.position;
    }

    /**
     * Handles touch move events.
     * @param {Event} evt
     */
    touchmove(evt) {
        if (this.contentsize <= this.scrollsize) {
            return;
        }
        const touch = evt.originalEvent.touches[0];
        const delta = this.pos_from_evt(touch) - this._touch_pos;
        this.position = this._start_position - delta;
        this.fade_timer();
    }

    /**
     * Handles touch end events.
     * @param {Event}
     */
    touchend(evt) {
        delete this._touch_pos;
        delete this._start_position;
    }

    /**
     * Handles mouse down events on the scrollbar thumb.
     * @param {Event} evt
     */
    down(evt) {
        this._mouse_pos = this.pos_from_evt(evt) - this.offset;
        this._thumb_pos = this.position / (this.contentsize / this.scrollsize);
        this.elem.off('mouseenter mouseleave', this.on_hover);
        this.thumb.addClass('active');
    }

    /**
     * Handles mouse move events while dragging the scrollbar thumb.
     * @param {Event} evt
     */
    move(evt) {
        let mouse_pos = this.pos_from_evt(evt) - this.offset,
            thumb_pos = this._thumb_pos + mouse_pos - this._mouse_pos;
        this.position = this.contentsize * thumb_pos / this.scrollsize;
    }

    /**
     * Handles mouse up events to finalize scrollbar movement.
     * @param {Event} evt
     */
    up(evt) {
        delete this._mouse_pos;
        delete this._thumb_pos;
        this.elem.on('mouseenter mouseleave', this.on_hover);
        this.thumb.removeClass('active');
    }
}

/**
 * Class representing a horizontal scrollbar.
 * @extends Scrollbar
 */
export class ScrollbarX extends Scrollbar {

    /**
     * Gets the horizontal offset of the scrollbar element.
     * @returns {number}
     */
    get offset() {
        return this.elem.offset().left;
    }

    /**
     * Gets the total width of the content.
     * @returns {number}
     */
    get contentsize() {
        return this.content.outerWidth();
    }

    /**
     * Gets the scrollable container width.
     * @returns {number}
     */
    get scrollsize() {
        const padding_r = parseFloat(this.elem.css('padding-right'));
        const padding_l = parseFloat(this.elem.css('padding-left'));
        return this.elem.outerWidth() - padding_l - padding_r;
    }

    /**
     * Compiles the scrollbar template and styles for horizontal scrollbar.
     */
    compile() {
        super.compile();
        this.thumb.css('height', '6px');
        this.scrollbar
            .css('height', '6px')
            .css('width', this.scrollsize);
        this.thumbsize = this.scrollsize / (this.contentsize / this.scrollsize);
        this.thumb.css('width', this.thumbsize);
    }

    /**
     * Renders the scrollbar and updates its width.
     */
    render() {
        super.render('width');
    }

    /**
     * Updates the content position based on the current scrollbar position.
     */
    update() {
        let thumb_pos = this.position / (this.contentsize / this.scrollsize);
        this.content.css('right', this.position + 'px');
        this.thumb.css('left', thumb_pos + 'px');
    }

    /**
     * Gets the x-coordinate from the mouse event.
     * @param {Event} e
     * @returns {number}
     */
    pos_from_evt(e) {
        return e.pageX;
    }
}

/**
 * Class representing a vertical scrollbar.
 * @extends Scrollbar
 */
export class ScrollbarY extends Scrollbar {

    /**
     * Gets the vertical offset of the scrollbar element.
     * @returns {number}
     */
    get offset() {
        return this.elem.offset().top;
    }

    /**
     * Gets the total height of the content.
     * @returns {number}
     */
    get contentsize() {
        return this.content.outerHeight();
    }

    /**
     * Gets the scrollable container height.
     * @returns {number}
     */
    get scrollsize() {
        const padding_t = parseFloat(this.elem.css('padding-top'));
        const padding_b = parseFloat(this.elem.css('padding-bottom'));
        return this.elem.outerHeight() - padding_t - padding_b;
    }

    /**
     * Compiles the scrollbar template and styles for vertical scrollbar.
     */
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

    /**
     * Renders the scrollbar and updates its height.
     */
    render() {
        super.render('height');
    }

    /**
     * Updates the content position based on the current scrollbar position.
     */
    update() {
        let thumb_pos = this.position / (this.contentsize / this.scrollsize);
        this.content.css('bottom', this.position + 'px');
        this.thumb.css('top', thumb_pos + 'px');
    }

    /**
     * Gets the y-coordinate from the mouse event.
     * @param {Event} e
     * @returns {number}
     */
    pos_from_evt(e) {
        return e.pageY;
    }
}

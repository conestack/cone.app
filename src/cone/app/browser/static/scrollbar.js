/*
 * scrollbar
 */

// ensure namespace
if (window.cone === undefined) cone = {};

(function($) {

    cone.ScrollBar = class {

        constructor(elem) {
            // scroll container
            this.elem = elem;
            // content to scroll
            this.content = $('>', this.elem);
            this.scrollbar = $('<div class="scrollbar" />');
            this.thumb = $('<div class="scroll-handle" />');
            this.thickness = '6px';

            this.compile();

            this.position = 0;
            this.thumb_pos = 0;
            this.thumb_dim = 0;
            this.thumb_end = 0;
            this.factor = 0;
            this.space_between = 0;

            this.unit = 10;
            this.scrollbar_unit = 0;

            this._handle = this.update.bind(this); // bind this required! - why?
            $(this._handle); // jquery required! - why?

            const scrollbar_observer = new ResizeObserver(entries => {
                for(let entry of entries) {
                    console.log(this._handle);
                    $(this._handle);
                }
            });
            scrollbar_observer.observe(this.elem.get(0));

            this._scroll = this.scroll_handle.bind(this);
            this.elem.off().on('mousewheel wheel', this._scroll);

            this._drag_start = this.drag_start.bind(this);
            this.scrollbar.off().on('mousedown', this._drag_start);

            this._mousehandle = this.mouse_in_out.bind(this);
            this.elem.off('mouseenter mouseleave', this._mousehandle)
                     .on('mouseenter mouseleave', this._mousehandle);
        }

        compile() {
            // abstract, implemented in subclass
        }

        update() {
            // abstract, implemented in subclass
        }

        drag_start() {
            // abstract, implemented in subclass
        }

        unload() {
            this.scrollbar.off();
            this.elem.off();
        }

        mouse_in_out(e) {
            if(cone.dragging || this.content_dim <= this.container_dim) {
                return;
            } else {
                if(e.type == 'mouseenter') {
                    this.scrollbar.fadeIn();
                } else {
                    this.scrollbar.fadeOut();
                }
            }
        }

        scroll_handle(e) {
            if(this.content_dim < this.container_dim) {
                return;
            }
            if (typeof e.originalEvent.wheelDelta == 'number' || typeof e.originalEvent.deltaY == 'number') {

                // scroll event data
                if(e.originalEvent.wheelDelta < 0 || e.originalEvent.deltaY > 0) { // down
                    this.position -= this.unit;
                    this.thumb_pos += this.scrollbar_unit;

                    if(this.thumb_pos >= this.container_dim - this.thumb_dim) { // stop scrolling on end
                        this.thumb_pos = this.container_dim - this.thumb_dim;
                        this.position = this.container_dim - this.content_dim;
                    }
                };

                if(e.originalEvent.wheelDelta > 0 || e.originalEvent.deltaY < 0) { // up
                    this.position += this.unit;
                    this.thumb_pos -= this.scrollbar_unit;

                    if(this.position > 0) { // stop scrolling on start
                        this.position = 0;
                        this.thumb_pos = 0;
                    }
                }
            }
            this.set_position();
        }
    }

    cone.ScrollBarX = class extends cone.ScrollBar {

        constructor(elem) {
            super(elem);
            this.container_dim = this.elem.outerWidth(true);
            this.content_dim = this.content.outerWidth(true);
            this.offset = this.elem.offset().left;
        }

        compile() {
            this.content.addClass('scroll-content');
            this.elem.addClass('scroll-container');
            this.elem.prepend(this.scrollbar);
            this.scrollbar.append(this.thumb);
            this.thumb.css('height', this.thickness);
            this.scrollbar.css('height', this.thickness);
        }

        update() {
            this.content_dim = this.content.outerWidth(true);
            this.container_dim = this.elem.outerWidth(true);
            this.factor = this.content_dim / this.container_dim;
            this.thumb_dim = this.container_dim / this.factor;
            this.thumb_end = this.thumb.offset().left + this.thumb_dim;
            this.container_end = this.elem.offset().left + this.container_dim;

            this.scrollbar.css('width', this.container_dim);
            this.thumb.css('width', this.thumb_dim);

            this.scrollbar_unit = this.container_dim / (this.content_dim / this.unit);
            this.space_between = this.container_dim - this.thumb_dim;
        }

        set_position() {
            this.content.css('left', this.position + 'px');
            this.thumb.css('left', this.thumb_pos + 'px');
        }

        drag_start(evt) {
            evt.preventDefault(); // prevent text selection
            this.thumb.addClass('active');

            let mouse_pos = evt.pageX - this.offset,
                thumb_diff = this.container_dim - this.thumb_dim,
                new_thumb_pos = 0;

            // case click
            if(mouse_pos < this.thumb_pos || mouse_pos > (this.thumb_pos + this.thumb_dim)) {
                if(mouse_pos < this.thumb_pos) {
                    if(mouse_pos <= this.thumb_pos / 2) {
                        new_thumb_pos = 0;
                    } else {
                        new_thumb_pos = mouse_pos- this.thumb_dim / 2;
                    }
                } else if(mouse_pos > this.thumb_pos + this.thumb_dim){
                    if(mouse_pos > this.space_between + this.thumb_dim / 2) {
                        new_thumb_pos = thumb_diff;
                    } else {
                        new_thumb_pos = mouse_pos - this.thumb_dim / 2;
                    }
                }
                this.thumb.css('left', new_thumb_pos);
                this.content.css('left', - (new_thumb_pos * this.factor));
                this.thumb_pos = new_thumb_pos;
            // case drag
            } else {
                cone.dragging = true;
                $(document).on('mousemove', onMouseMove.bind(this));

                function onMouseMove(evt) {
                    let mouse_pos_on_move = evt.pageX - this.offset;
                    let diff = mouse_pos_on_move - mouse_pos;
                    new_thumb_pos = this.thumb_pos + diff;
                    if(new_thumb_pos <= 0) {
                        new_thumb_pos = 0;
                    } else if (new_thumb_pos >= thumb_diff) {
                        new_thumb_pos = thumb_diff;
                    }
                    this.thumb.css('left', new_thumb_pos);
                    this.content.css('left', - (new_thumb_pos * this.factor));
                }

                $(document).on('mouseup', onMouseUp.bind(this));
                function onMouseUp() {
                    cone.dragging = false;
                    $(document).off('mousemove mouseup');
                    this.thumb.removeClass('active');
                    this.thumb_pos = new_thumb_pos;
                }
            }


        }
    };

    cone.ScrollBarY = class extends cone.ScrollBar {

        constructor(elem) {
            super(elem);
            this.container_dim = this.elem.outerHeight(true);
            this.content_dim = (this.content.length) ? this.content.outerHeight(true) : 0;
            this.offset = this.elem.offset().top;
        }

        compile() {
            this.content.addClass('scroll-content');
            this.elem.addClass('scroll-container');
            this.elem.prepend(this.scrollbar);
            this.scrollbar.append(this.thumb);
            this.thumb.css('width', this.thickness);
            this.scrollbar.css('width', this.thickness);
        }

        update() {
            this.content_dim = this.content.outerHeight(true);
            this.container_dim = this.elem.outerHeight(true);
            this.factor = this.content_dim / this.container_dim;
            this.thumb_dim = this.container_dim / this.factor;
            this.thumb_end = this.thumb.offset().top + this.thumb_dim;
            this.container_end = this.elem.offset().top + this.container_dim;

            this.scrollbar.css('height', this.container_dim);
            this.thumb.css('height', this.thumb_dim);

            this.scrollbar_unit = this.container_dim / (this.content_dim / this.unit);
            this.space_between = this.container_dim - this.thumb_dim;
        }

        set_position() {
            this.content.css('top', this.position + 'px');
            this.thumb.css('top', this.thumb_pos + 'px');
        }

        drag_start(evt) {
            // prevent text selection
            evt.preventDefault();
            this.thumb.addClass('active');

            let mouse_pos = evt.pageY - this.offset,
                thumb_diff = this.container_dim - this.thumb_dim,
                new_thumb_pos = 0;

            // case click
            if (mouse_pos < this.thumb_pos || mouse_pos > (this.thumb_pos + this.thumb_dim)) {
                if (mouse_pos < this.thumb_pos) {
                    if (mouse_pos <= this.thumb_pos / 2) {
                        new_thumb_pos = 0;
                    } else {
                        new_thumb_pos = mouse_pos- this.thumb_dim / 2;
                    }
                } else if (mouse_pos > this.thumb_pos + this.thumb_dim){
                    if (mouse_pos > this.space_between + this.thumb_dim / 2) {
                        new_thumb_pos = thumb_diff;
                    } else {
                        new_thumb_pos = mouse_pos - this.thumb_dim / 2;
                    }
                }
                this.thumb.css('top', new_thumb_pos);
                this.content.css('top', - (new_thumb_pos * this.factor));
                this.thumb_pos = new_thumb_pos;
            // case drag
            } else {
                cone.dragging = true;
                $(document).on(
                    'mousemove',
                    onMouseMove.bind(this)
                ).on('mouseup', onMouseUp.bind(this));

                function onMouseMove(evt) {
                    let mouse_pos_on_move = evt.pageY - this.offset;
                    let diff = mouse_pos_on_move - mouse_pos;
                    new_thumb_pos = this.thumb_pos + diff;
                    if(new_thumb_pos <= 0) {
                        new_thumb_pos = 0;
                    } else if (new_thumb_pos >= thumb_diff) {
                        new_thumb_pos = thumb_diff;
                    }
                    this.thumb.css('top', new_thumb_pos);
                    this.content.css('top', - (new_thumb_pos * this.factor));
                }

                function onMouseUp() {
                    cone.dragging = false;
                    $(document).off('mousemove mouseup');
                    this.thumb.removeClass('active');
                    this.thumb_pos = new_thumb_pos;
                }
            }
        }
    }

})(jQuery);

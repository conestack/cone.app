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

            // wait for elements to load properly
            setTimeout(this.compile.bind(this), 100);

            this.position = 0;
            this.thumb_position = 0;

            this.unit = 10;

            const scrollbar_observer = new ResizeObserver(entries => {
                for(let entry of entries) {
                    // why does it fire twice?
                    // => timeout?
                    this.update();
                }
            });
            scrollbar_observer.observe(this.elem.get(0));

            this._scroll = this.scroll_handle.bind(this);
            this.elem.off().on('mousewheel wheel', this._scroll);

            // this._drag_start = this.drag_start.bind(this);
            // this.scrollbar.off().on('mousedown', this._drag_start);

            // this._mousehandle = this.mouse_in_out.bind(this);
            // this.elem.off('mouseenter mouseleave', this._mousehandle)
            //          .on('mouseenter mouseleave', this._mousehandle);
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
            if(cone.dragging || this.contentsize <= this.scrollsize) {
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
            // return if same size
            if(this.contentsize <= this.scrollsize) {
                return;
            }

            if (typeof e.originalEvent.wheelDelta == 'number' || typeof e.originalEvent.deltaY == 'number') {

                let scrollbar_unit = this.scrollsize / (this.contentsize / this.unit);

                // down
                if(e.originalEvent.wheelDelta < 0 || e.originalEvent.deltaY > 0) {
                    this.position -= this.unit;
                    this.thumb_position += scrollbar_unit;

                    // stop scrolling on end
                    let thumb_size = this.scrollsize / (this.contentsize / this.scrollsize);
                    if(this.thumb_position >= this.scrollsize - thumb_size) {
                        this.thumb_position = this.scrollsize - thumb_size;
                        this.position = this.scrollsize - this.contentsize;
                    }
                };

                // up
                if(e.originalEvent.wheelDelta > 0 || e.originalEvent.deltaY < 0) {
                    this.position += this.unit;
                    this.thumb_position -= scrollbar_unit;

                    // stop scrolling on start
                    if(this.position > 0) {
                        this.position = 0;
                        this.thumb_position = 0;
                    }
                }
            }
            this.set_position();
        }
    }

    cone.ScrollBarX = class extends cone.ScrollBar {

        constructor(elem) {
            super(elem);
            this.scrollsize = this.elem.outerWidth(true);
            this.contentsize = this.content.outerWidth(true);
            this.elem = elem;
            // this.offset = this.elem.offset().left;
        }

        compile() {
            console.log('scrollbarX.compile()');
            this.content.addClass('scroll-content');
            this.elem.addClass('scroll-container')
                     .prepend(this.scrollbar);
            this.scrollbar.append(this.thumb);
            this.thumb.css('height', '6px');
            this.scrollbar.css('height', '6px');

            // this.scrollsize = this.elem.outerWidth();
            // this.contentsize = this.content.outerWidth();
            // 
            // this.scrollbar.css('width', this.scrollsize);
            // //this.thumb.css('width', this.thumbsize);
// 
            //tmp
            this.scrollbar.show();

        }

        update() {
            console.log('scrollbarX.update()');

            // handle switching to mobile and back, reset - WIP
            if(this.scrollbar.is(':hidden')) {
                this.position = 0;
                this.thumb_pos = 0;
                console.log('hidden');
                return;
            }

            this.contentsize = this.content.outerWidth();
            this.scrollsize = this.elem.outerWidth();

            this.scrollbar.css('width', this.scrollsize);
            let thumb_size = this.scrollsize / (this.contentsize / this.scrollsize);
            this.thumb.css('width', thumb_size);

            // prevent overflow of thumb - WIP
            let thumb_right_edge = this.thumb.offset().left + this.thumb.outerWidth();
            let elem_right_edge = this.elem.offset().left + this.elem.outerWidth();
            if( thumb_right_edge >= elem_right_edge ) {
                    let newpos = this.elem.outerWidth() - this.thumb.outerWidth();
                    this.thumb.css('left', newpos);
                    this.content.css('left', -newpos);
            }
        }

        set_position() {
            this.content.css('left', this.position + 'px');
            this.thumb.css('left', this.thumb_position + 'px');
        }

        drag_start(evt) {
            evt.preventDefault(); // prevent text selection
            this.thumb.addClass('active');

            let mouse_pos = evt.pageX - this.elem.offset().left,
                thumb_diff = this.scrollsize - this.thumbsize,
                new_thumb_pos = 0;

            // case click
            if(mouse_pos < this.thumb_position || mouse_pos > (this.thumb_position + this.thumbsize)) {
                if(mouse_pos < this.thumb_position) {
                    if(mouse_pos <= this.thumb_position / 2) {
                        new_thumb_pos = 0;
                    } else {
                        new_thumb_pos = mouse_pos- this.thumbsize / 2;
                    }
                } else if(mouse_pos > this.thumb_position + this.thumbsize){
                    if(mouse_pos > (this.scrollsize - this.thumbsize) + this.thumbsize / 2) {
                        new_thumb_pos = thumb_diff;
                    } else {
                        new_thumb_pos = mouse_pos - this.thumbsize / 2;
                    }
                }
                this.thumb.css('left', new_thumb_pos);
                this.content.css('left', - (new_thumb_pos * this.factor));
                this.thumb_position = new_thumb_pos;
            // case drag
            } else {
                cone.dragging = true;
                $(document).on('mousemove', onMouseMove.bind(this));

                function onMouseMove(evt) {
                    let mouse_pos_on_move = evt.pageX - this.elem.offset().left;
                    let diff = mouse_pos_on_move - mouse_pos;
                    new_thumb_pos = this.thumb_position + diff;
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
                    this.thumb_position = new_thumb_pos;
                }
            }


        }
    };

    cone.ScrollBarY = class extends cone.ScrollBar {

        constructor(elem) {
            super(elem);
            this.scrollsize = this.elem.outerHeight(true);
            this.contentsize = (this.content.length) ? this.content.outerHeight(true) : 0;
            // this.offset = this.elem.offset().top;
        }

        compile() {
            console.log('scrollbarY.compile()');
            this.content.addClass('scroll-content');
            this.elem.addClass('scroll-container')
                     .prepend(this.scrollbar);
            this.scrollbar.append(this.thumb);
            this.thumb.css('width', '6px');
            this.scrollbar.css('width', '6px');
        }

        update() {
            console.log('scrollbarY.update()');
            this.contentsize = this.content.outerHeight(true);
            this.scrollsize = this.elem.outerHeight(true);
            this.factor = this.contentsize / this.scrollsize;
            this.thumbsize = this.scrollsize / this.factor;
            this.scrollbar.css('height', this.scrollsize);
            this.thumb.css('height', this.thumbsize);
        }

        set_position() {
            this.content.css('top', this.position + 'px');
            this.thumb.css('top', this.thumb_position + 'px');
        }

        drag_start(evt) {
            // prevent text selection
            evt.preventDefault();
            this.thumb.addClass('active');

            let mouse_pos = evt.pageY - this.elem.offset().top,
                thumb_diff = this.scrollsize - this.thumbsize,
                new_thumb_pos = 0;

            // case click
            if (mouse_pos < this.thumb_position || mouse_pos > (this.thumb_position + this.thumbsize)) {
                if (mouse_pos < this.thumb_position) {
                    if (mouse_pos <= this.thumb_position / 2) {
                        new_thumb_pos = 0;
                    } else {
                        new_thumb_pos = mouse_pos- this.thumbsize / 2;
                    }
                } else if (mouse_pos > this.thumb_position + this.thumbsize){
                    if (mouse_pos > (this.scrollsize - this.thumbsize) + this.thumbsize / 2) {
                        new_thumb_pos = thumb_diff;
                    } else {
                        new_thumb_pos = mouse_pos - this.thumbsize / 2;
                    }
                }
                this.thumb.css('top', new_thumb_pos);
                this.content.css('top', - (new_thumb_pos * this.factor));
                this.thumb_position = new_thumb_pos;
            // case drag
            } else {
                cone.dragging = true;
                $(document).on(
                    'mousemove',
                    onMouseMove.bind(this)
                ).on('mouseup', onMouseUp.bind(this));

                function onMouseMove(evt) {
                    let mouse_pos_on_move = evt.pageY - this.elem.offset().top;
                    let diff = mouse_pos_on_move - mouse_pos;
                    new_thumb_pos = this.thumb_position + diff;
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
                    this.thumb_position = new_thumb_pos;
                }
            }
        }
    }

}
)(jQuery);

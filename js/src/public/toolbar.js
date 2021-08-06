import $ from 'jquery'
import {
    ViewPortAware,
    VP_MOBILE
} from './viewport.js';
import {layout} from './layout.js';
import {time_delta_str} from './utils.js';

export class Toolbar extends ViewPortAware {

    static initialize(context) {
        let elem = $('#toolbar-top', context);
        /* istanbul ignore if */
        if (!elem.length) {
            return;
        } else {
            layout.toolbar = new Toolbar(elem);
        }
        return layout.toolbar;
    }

    constructor(elem) {
        super();
        this.elem = elem;
        this.dropdowns = $('li.dropdown', this.elem);
        this.mark_read_btn = $('#noti_mark_read', this.elem);
        this.sort_priority_btn = $('#noti_sort_priority', this.elem);
        this.sort_date_btn =$('#noti_sort_date', this.elem);

        this._mark = this.mark_as_read.bind(this);
        this.mark_read_btn.off().on('click', this._mark);

        this._sort_p = this.sort_priority.bind(this);
        this.sort_priority_btn.off().on('click', this._sort_p);

        this._sort_d = this.sort_date.bind(this);
        this.sort_date_btn.on('click',this._sort_d);

        $('i.bi-x-circle').on('click', function(e) {
            e.stopPropagation();
            $(this).parent('li').hide();
        })
        
        this.handle_dd();
        this.viewport_changed();
        this.set_noti_time();
    }

    handle_dd() {
        for(let item of this.dropdowns){
            let elem = $(item);
            let icon = $('i', elem);
            if (icon.length === 0) {
                icon = $('img', elem);
            }
            let menu = $('ul', elem);

            icon.off('show.bs.dropdown').on('show.bs.dropdown', () => {
                menu.css('display', 'flex');
            });
            icon.off('hide.bs.dropdown').on('hide.bs.dropdown', () => {
                menu.css('display', 'none');
            });
        }
    }

    viewport_changed(e){
        if (e) {
            super.viewport_changed(e);
        }

        if(this.vp_state === VP_MOBILE){
             // hide menu on toolbar click
             this.dropdowns.off().on('show.bs.dropdown', () => {
                layout.topnav.content.hide();
            });
        } else {
            this.dropdowns.off();
        }
    }

    mark_as_read(e) {
        e.stopPropagation();
        $('li.notification').removeClass('unread').addClass('read');
    }

    sort_priority(e) {
        e.stopPropagation();

        let arrow = $('.arrow-small', this.sort_priority_btn);
        if (arrow.hasClass('bi-arrow-up')) {
            arrow.removeClass('bi-arrow-up').addClass('bi-arrow-down');
            sort_descend();
        } else if (arrow.hasClass('bi-arrow-down')) {
            arrow.removeClass('bi-arrow-down').addClass('bi-arrow-up');
            sort_ascend();
        }

        function sort_descend() {
            for (let item of $('li.notification', '#notifications')){
                let elem = $(item);

                if (elem.hasClass('high')){
                    elem.css('order', '0');
                } else if (elem.hasClass('medium')) {
                    elem.css('order', '1');
                } else if (elem.hasClass('low')) {
                    elem.css('order', '2');
                } else {
                    elem.css('order', '3');
                }
            }
        }

        function sort_ascend() {
            for (let item of $('li.notification', '#notifications')){
                let elem = $(item);

                if (elem.hasClass('high')){
                    elem.css('order', '3');
                } else if (elem.hasClass('medium')) {
                    elem.css('order', '2');
                } else if (elem.hasClass('low')) {
                    elem.css('order', '1');
                } else {
                    elem.css('order', '0');
                }
            }
        }
    }

    set_noti_time() {
        for (let item of $('li.notification', '#notifications')) {
            let elem = $(item);

            let time_stamp = new Date(elem.data('timestamp'));
            let time_display = time_delta_str(time_stamp);

            $('p.timestamp', elem).text(time_display);
        }
    }

    sort_date(e) {
        e.stopPropagation();

        let msgs = [];
        for (let item of $('li.notification', '#notifications')) {
            let elem = $(item);
            let timestamp = new Date(elem.data('timestamp'));
            msgs.push({element: elem, timestamp: timestamp});
        }

        let arrow = $('.arrow-small', this.sort_date_btn);
        if (arrow.hasClass('bi-arrow-up')) {
            arrow.removeClass('bi-arrow-up').addClass('bi-arrow-down');
            msgs.sort(function(a,b){
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
        } else if (arrow.hasClass('bi-arrow-down')) {
            arrow.removeClass('bi-arrow-down').addClass('bi-arrow-up');
            msgs.sort(function(a,b){
                return new Date(a.timestamp) - new Date(b.timestamp);
            });
        }

        for(let i in msgs) {
            let msg = msgs[i];
            msg.element.css('order', i);
        }
    }
}
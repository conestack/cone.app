import $ from 'jquery';
import {layout} from '../src/layout.js';
import {Toolbar} from '../src/toolbar.js';
import {Topnav} from '../src/topnav.js';
import {
    create_layout_elem,
    create_noti_elem,
    create_toolbar_elem,
    create_topnav_elem,
    set_vp
} from './helpers.js';

QUnit.module('toolbar', () => {

    QUnit.module('constructor', hooks=> {

        hooks.beforeEach(() => {
            create_layout_elem();
            create_topnav_elem();
            create_toolbar_elem();
            let date = 'August 06, 2021 09:00:00';
            create_noti_elem(date, 'high', 'elem1');
        });

        hooks.afterEach(() => {
            $('#layout').remove();
        });

        QUnit.test('true', assert => {
            Topnav.initialize();
            Toolbar.initialize();
            let tb = layout.toolbar;

            assert.ok(tb.elem.is('ul#toolbar-top'));
            assert.ok(tb.dropdowns.is('li.dropdown'));
            assert.ok(tb.mark_read_btn.is('span#noti_mark_read'));
            assert.ok(tb.sort_priority_btn.is('span#noti_sort_priority'));
            assert.ok(tb.sort_date_btn.is('span#noti_sort_date'));
            assert.ok(tb._mark);
            assert.ok(tb._sort_p);
            assert.ok(tb._sort_d);

            // trigger close
            $('i.bi-x-circle', '#elem1').trigger('click');
            assert.strictEqual($('#elem1').css('display'), 'none');
        });
    });

    QUnit.module('methods', hooks => {

        hooks.beforeEach(() => {
            create_layout_elem();
            create_topnav_elem();
            create_toolbar_elem();
        });

        hooks.afterEach(() => {
            $('#layout').remove();
        });

        QUnit.test('viewport_changed()', assert => {
            // initialize
            Topnav.initialize();
            Toolbar.initialize();
    
            // set viewport mobile
            set_vp('mobile');
    
            // toggle mobile menu
            layout.topnav.toggle_button.trigger('click');
            assert.strictEqual(layout.topnav.content.css('display'), 'flex');
            // trigger bootstrap dropdown
            layout.toolbar.dropdowns.trigger('show.bs.dropdown');
            assert.strictEqual(layout.topnav.content.css('display'), 'none');
    
            // set viewport desktop
            set_vp('large');
    
            assert.strictEqual(layout.topnav.content.css('display'), 'contents');
            // trigger bootstrap dropdown
            layout.toolbar.dropdowns.trigger('show.bs.dropdown');
            assert.strictEqual(layout.topnav.content.css('display'), 'contents');
        });
    
        QUnit.test('mark_as_read', assert => {
            let date = 'August 06, 2021 09:00:00';
            create_noti_elem(date, '', '1');
            create_noti_elem(date, '', '2');
            
            // initialize
            Topnav.initialize();
            Toolbar.initialize();

            assert.ok($('li.notification.unread').length > 0);
            $('#noti_mark_read').trigger('click');
            assert.strictEqual($('li.unread').length, 0);
        });
    
        QUnit.test('handle_dropdown', assert => {
            // initialize
            Topnav.initialize();
            Toolbar.initialize();
    
            $('#notifications > i').trigger('click');
            assert.strictEqual($('#notifications > ul').css('display'), 'flex');
    
            $('#notifications > i').trigger('click');
            assert.strictEqual($('#notifications > ul').css('display'), 'none');
        });

        QUnit.test('sort_priority', assert => {
            let date1 = 'August 06, 2021 09:00:00',
                date2 = 'August 05, 2021 10:24:00',
                date3 = 'August 04, 2021 10:24:00',
                date4 = 'August 03, 2021 10:24:00';

            create_noti_elem(date2, 'high');
            create_noti_elem(date4, 'medium');
            create_noti_elem(date3, 'low');
            create_noti_elem(date1);

            // initialize
            Topnav.initialize();
            Toolbar.initialize();

            $('#noti_sort_priority').trigger('click');
            assert.ok(
                $('i.arrow-small', '#noti_sort_priority')
                .hasClass('bi-arrow-down')
            );

            for (let item of $('li.notification', '#notifications')){
                let elem = $(item);
                if (elem.hasClass('high')){
                    assert.strictEqual(elem.css('order'), '0');
                } else if (elem.hasClass('medium')){
                    assert.strictEqual(elem.css('order'), '1');
                } else if (elem.hasClass('low')){
                    assert.strictEqual(elem.css('order'), '2');
                } else {
                    assert.strictEqual(elem.css('order'), '3');
                }
            }

            $('#noti_sort_priority').trigger('click');
            assert.ok(
                $('i.arrow-small', '#noti_sort_priority')
                .hasClass('bi-arrow-up')
            );

            for (let item of $('li.notification', '#notifications')){
                let elem = $(item);
                if (elem.hasClass('high')){
                    assert.strictEqual(elem.css('order'), '3');
                } else if (elem.hasClass('medium')){
                    assert.strictEqual(elem.css('order'), '2');
                } else if (elem.hasClass('low')){
                    assert.strictEqual(elem.css('order'), '1');
                } else {
                    assert.strictEqual(elem.css('order'), '0');
                }
            }
        });

        QUnit.test('sort_date', assert => {
            let date0 = 'August 06, 2021 09:00:00',
                date1 = 'August 05, 2021 10:24:00',
                date2 = 'August 04, 2021 10:24:00',
                date3 = 'August 03, 2021 10:24:00';

            create_noti_elem(date1, '', '1');
            create_noti_elem(date2, '', '2');
            create_noti_elem(date3, '', '3');
            create_noti_elem(date0, '', '0');

            // initialize
            Topnav.initialize();
            Toolbar.initialize();

            $('#noti_sort_date').trigger('click');

            let notis = $('li.notification');

            for (let i=0; i<4; i++) {
                let elem = notis[i];
                assert.strictEqual($(elem).attr('id'), $(elem).css('order'));
            }

            $('#noti_sort_date').trigger('click');

            for (let i=0; i<4; i++) {
                let elem = $(`#${i}`);
                let id = i;
                let order = 3 - i;

                assert.strictEqual(elem.attr('id'), `${id}`);
                assert.strictEqual(elem.css('order'), `${order}`);
            }
        });
    });
});

import $ from 'jquery';
import {time_delta_str} from '../src/public/utils.js';


QUnit.module('time_delta_str', () => {
    QUnit.test('years', assert => {
        let date1 = new Date('August 05, 2018 10:00:00'),
            date2 = new Date('August 05, 2019 10:00:00'),
            date3 = new Date('August 05, 2020 10:00:00'),
            end = new Date('August 05, 2021 10:00:00');

        assert.strictEqual(time_delta_str(date1, end), 'a long time ago');
        assert.strictEqual(time_delta_str(date2, end), '2 years ago');
        assert.strictEqual(time_delta_str(date3, end), 'a year ago');
    });

    QUnit.test('months', assert => {
        let date1 = new Date('July 05, 2021 10:00:00'),
            date2 = new Date('February 05, 2021 10:00:00'),
            end = new Date('August 05, 2021 10:00:00');

        assert.strictEqual(time_delta_str(date1, end), 'a month ago');
        assert.strictEqual(time_delta_str(date2, end), '6 months ago');
    });

    QUnit.test('days', assert => {
        let date1 = new Date('August 04, 2021 10:00:00'),
            date2 = new Date('August 01, 2021 10:00:00'),
            end = new Date('August 05, 2021 10:00:00');

        assert.strictEqual(time_delta_str(date1, end), 'a day ago');
        assert.strictEqual(time_delta_str(date2, end), '4 days ago');
    });

    QUnit.test('hours', assert => {
        let date1 = new Date('August 05, 2021 09:00:00'),
            date2 = new Date('August 05, 2021 00:00:00'),
            end = new Date('August 05, 2021 10:00:00');

        assert.strictEqual(time_delta_str(date1, end), 'an hour ago');
        assert.strictEqual(time_delta_str(date2, end), '10 hours ago');
    });

    QUnit.test('minutes', assert => {
        let date1 = new Date('August 05, 2021 09:59:00'),
            date2 = new Date('August 05, 2021 09:01:00'),
            end = new Date('August 05, 2021 10:00:00');

        assert.strictEqual(time_delta_str(date1, end), 'a minute ago');
        assert.strictEqual(time_delta_str(date2, end), '59 minutes ago');
    });

    QUnit.test('seconds', assert => {
        let date1 = new Date('August 05, 2021 09:59:55'),
            end = new Date('August 05, 2021 10:00:00');

        assert.strictEqual(time_delta_str(date1, end), 'just now');
    });
});
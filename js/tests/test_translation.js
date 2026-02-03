import $ from 'jquery';
import {Translation} from '../src/translation.js';

QUnit.module('cone.app.translation', hooks => {

    let container;

    hooks.beforeEach(() => {
        container = $('<div />').appendTo('body');
    });

    hooks.afterEach(() => {
        container.remove();
    });

    function create_translation_fixture() {
        return $(`
            <div class="translation-wrapper">
                <div class="invalid-feedback" style="display: none;">
                    Error message
                </div>
                <ul class="translation-nav nav nav-tabs">
                    <li class="nav-item">
                        <a class="nav-link active" href="#lang-en">English</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#lang-de">German</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#lang-fr">French</a>
                    </li>
                </ul>
                <div class="translation-fields" style="display: none;">
                    <div id="lang-en">
                        <input type="text" name="title_en" value="Hello" />
                    </div>
                    <div id="lang-de" style="display: none;">
                        <input type="text" name="title_de" value="Hallo" />
                    </div>
                    <div id="lang-fr" style="display: none;">
                        <input type="text" name="title_fr" value="Bonjour" />
                    </div>
                </div>
            </div>
        `).appendTo(container);
    }

    QUnit.test('Translation.initialize creates instances', assert => {
        create_translation_fixture();

        Translation.initialize(container);

        let nav = container.find('.translation-nav');
        let link = nav.find('li > a').first();
        let events = $._data(link.get(0), 'events');
        assert.ok(events && events.click, 'click event bound to nav links');
    });

    QUnit.test('Translation constructor shows invalid-feedback', assert => {
        create_translation_fixture();

        let nav = container.find('.translation-nav');
        new Translation(nav);

        let feedback = container.find('.invalid-feedback');
        assert.strictEqual(feedback.css('display'), 'block',
            'invalid-feedback is visible');
    });

    QUnit.test('Translation constructor shows fields element', assert => {
        create_translation_fixture();

        let nav = container.find('.translation-nav');
        new Translation(nav);

        let fields = container.find('.translation-fields');
        assert.strictEqual(fields.css('display'), 'block',
            'fields element is visible');
    });

    QUnit.test('Translation constructor triggers active tab', assert => {
        create_translation_fixture();

        let nav = container.find('.translation-nav');
        new Translation(nav);

        let en_field = container.find('#lang-en');
        assert.notStrictEqual(en_field.css('display'), 'none',
            'active language field is shown');
    });

    QUnit.test('Translation constructor triggers error tab first', assert => {
        let fixture = $(`
            <div class="translation-wrapper">
                <ul class="translation-nav nav nav-tabs">
                    <li class="nav-item">
                        <a class="nav-link active" href="#lang-en">English</a>
                    </li>
                    <li class="nav-item error">
                        <a class="nav-link" href="#lang-de">German</a>
                    </li>
                </ul>
                <div class="translation-fields" style="display: none;">
                    <div id="lang-en">English content</div>
                    <div id="lang-de" style="display: none;">German content</div>
                </div>
            </div>
        `).appendTo(container);

        let nav = fixture.find('.translation-nav');
        new Translation(nav);

        let de_link = nav.find('li.error > a');
        assert.true(de_link.hasClass('active'), 'error tab link is active');
    });

    QUnit.test('Translation show_lang_handle switches language', assert => {
        create_translation_fixture();

        let nav = container.find('.translation-nav');
        new Translation(nav);

        // Click on German tab
        let de_link = nav.find('a[href="#lang-de"]');
        de_link.trigger('click');

        assert.true(de_link.hasClass('active'), 'German tab is active');
        assert.false(nav.find('a[href="#lang-en"]').hasClass('active'),
            'English tab is no longer active');

        let de_field = container.find('#lang-de');
        let en_field = container.find('#lang-en');

        assert.notStrictEqual(de_field.css('display'), 'none',
            'German field is visible');
        assert.strictEqual(en_field.css('display'), 'none',
            'English field is hidden');
    });

    QUnit.test('Translation show_lang_handle prevents default', assert => {
        create_translation_fixture();

        let nav = container.find('.translation-nav');
        new Translation(nav);

        let link = nav.find('a').first();
        let evt = new $.Event('click');
        link.trigger(evt);

        assert.true(evt.isDefaultPrevented(), 'default prevented');
    });

    QUnit.test('Translation handles multiple instances', assert => {
        // Create two translation widgets
        create_translation_fixture();
        create_translation_fixture();

        Translation.initialize(container);

        let navs = container.find('.translation-nav');
        assert.strictEqual(navs.length, 2, 'two nav elements found');

        navs.each(function() {
            let link = $(this).find('li > a').first();
            let events = $._data(link.get(0), 'events');
            assert.ok(events && events.click, 'each nav has click handlers');
        });
    });

    QUnit.test('Translation show_lang_handle hides all fields first', assert => {
        create_translation_fixture();

        let nav = container.find('.translation-nav');
        let translation = new Translation(nav);

        // Make all fields visible manually
        container.find('.translation-fields').children().show();

        // Switch to French
        nav.find('a[href="#lang-fr"]').trigger('click');

        let en_field = container.find('#lang-en');
        let de_field = container.find('#lang-de');
        let fr_field = container.find('#lang-fr');

        assert.strictEqual(en_field.css('display'), 'none', 'English hidden');
        assert.strictEqual(de_field.css('display'), 'none', 'German hidden');
        assert.notStrictEqual(fr_field.css('display'), 'none', 'French visible');
    });

    QUnit.test('Translation removes active class from all links', assert => {
        create_translation_fixture();

        let nav = container.find('.translation-nav');
        new Translation(nav);

        // Manually add active to multiple links
        nav.find('li > a').addClass('active');

        // Trigger click on one
        nav.find('a[href="#lang-de"]').trigger('click');

        let active_links = nav.find('li > a.active');
        assert.strictEqual(active_links.length, 1, 'only one active link');
        assert.strictEqual(active_links.attr('href'), '#lang-de',
            'correct link is active');
    });
});

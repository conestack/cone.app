import {
    default_themes,
    ThemeSwitcher
} from '../src/public/theme.js';
import {create_theme_switcher_elem} from './helpers.js';
import {create_cookie} from '../src/public/utils.js';
import {layout} from '../src/public/layout.js';

///////////////////////////////////////////////////////////////////////////////
// ThemeSwitcher tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('ThemeSwitcher', hooks => {

    // dummy head styles
    let head_styles = `
        <link href="http://localhost:8081/static/light.css"
              rel="stylesheet"
              type="text/css"
              media="all">
        <link href="http://localhost:8081/static/dark.css"
              rel="stylesheet"
              type="text/css"
              media="all">
    `;

    hooks.before(() => {
        // append dummy head styles to DOM
        $('head').append(head_styles);
    });

    hooks.beforeEach(() => {
        // create dummy DOM element
        create_theme_switcher_elem();
    });

    hooks.afterEach(() => {
        // remove dummy elements from DOM
        $('#layout').remove();
        $('li.form-check').remove();
        $('#switch_mode').remove();
        $('#colormode-styles').remove();

        // delete dummy cookie
        create_cookie('modeswitch', '', -1);
    });

    hooks.after(() => {
        // remove dummy head styles from head
        $(head_styles).remove();
    });

    QUnit.test('initial default check elems', assert => {
        // initialize ThemeSwitcher instance
        ThemeSwitcher.initialize();

        // modes are default themes
        assert.strictEqual(layout.theme_switcher.modes, default_themes);
        // defaut mode is light.css
        assert.strictEqual(layout.theme_switcher.current, layout.theme_switcher.modes[0]);
    });

    QUnit.test('initial check cookie', assert => {
        // create dummy cookie for dark mode
        create_cookie('modeswitch', default_themes[1], null);

        // initialize ThemeSwitcher instance
        ThemeSwitcher.initialize();

        // theme switcher current is dark.css
        assert.strictEqual(layout.theme_switcher.current, layout.theme_switcher.modes[1]);
    });

    QUnit.test('switch_theme()', assert => {
        // initialize ThemeSwitcher instance
        ThemeSwitcher.initialize();

        // defaut mode is light.css
        assert.strictEqual(layout.theme_switcher.current, layout.theme_switcher.modes[0]);

        // trigger click on theme switcher element
        layout.theme_switcher.elem.trigger('click');
        // current is dark.css after click
        assert.strictEqual(layout.theme_switcher.current, layout.theme_switcher.modes[1]);
        // link href is dark.css in head
        assert.strictEqual(layout.theme_switcher.link.attr('href'), layout.theme_switcher.modes[1]);

        // trigger click on theme switcher element
        layout.theme_switcher.elem.trigger('click');
        // current is light.css after click
        assert.strictEqual(layout.theme_switcher.current, layout.theme_switcher.modes[0]);
        // link href is light.css in head
        assert.strictEqual(layout.theme_switcher.link.attr('href'), layout.theme_switcher.modes[0]);
    });
});
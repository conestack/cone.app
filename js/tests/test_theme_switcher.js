import {ThemeSwitcher} from '../src/theme_switcher.js';

///////////////////////////////////////////////////////////////////////////////
// cone.ThemeSwitcher test helpers
///////////////////////////////////////////////////////////////////////////////

function create_theme_switcher_elem(mode) {
    let modeswitch_html = `
        <li class="form-check form-switch">
          <input class="form-check-input" id="switch_mode" type="checkbox">
          <label class="form-check-label" for="flexSwitchCheckDefault">
            Toggle dark mode
          </label>
        </li>
    `;
    let head_current = `
        <link id="colormode-styles"
              rel="stylesheet"
              href=${mode}>`;
    $('body').append(modeswitch_html);
    $('head').append(head_current);
}

///////////////////////////////////////////////////////////////////////////////
// cone.ThemeSwitcher tests
///////////////////////////////////////////////////////////////////////////////

QUnit.module('cone.ThemeSwitcher', hooks => {
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
        console.log('Set up cone.ThemeSwitcher tests');

        // append dummy head styles to DOM
        $('head').append(head_styles);
    });

    hooks.beforeEach(() => {
        // create dummy DOM element
        create_theme_switcher_elem();
    });

    hooks.afterEach(() => {
        // unset theme switcher
        cone.theme_switcher = null;

        // remove dummy elements from DOM
        $('#switch_mode').remove();
        $('#colormode-styles').remove();

        // delete dummy cookie
        createCookie('modeswitch', '', -1);
    });

    hooks.after(() => {
        console.log('Tear down cone.ThemeSwitcher tests');

        // remove dummy head styles from head
        $(head_styles).remove();
    });

    QUnit.test('initial default check elems', assert => {
        // initialize ThemeSwitcher instance
        cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
        let switcher = cone.theme_switcher;

        // modes are default themes
        assert.strictEqual(switcher.modes, cone.default_themes);
        // defaut mode is light.css
        assert.strictEqual(switcher.current, switcher.modes[0]);
    });

    QUnit.test('initial check cookie', assert => {
        // create dummy cookie for dark mode
        createCookie('modeswitch', cone.default_themes[1], null);

        // initialize ThemeSwitcher instance
        cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
        let switcher = cone.theme_switcher;

        // theme switcher current is dark.css
        assert.strictEqual(switcher.current, switcher.modes[1]);
    });

    QUnit.test('switch_theme()', assert => {
        // initialize ThemeSwitcher instance
        cone.ThemeSwitcher.initialize($('body'), cone.default_themes);
        let switcher = cone.theme_switcher;

        // defaut mode is light.css
        assert.strictEqual(switcher.current, switcher.modes[0]);

        // trigger click on theme switcher element
        switcher.elem.trigger('click');
        // current is dark.css after click
        assert.strictEqual(switcher.current, switcher.modes[1]);
        // link href is dark.css in head
        assert.strictEqual(switcher.link.attr('href'), switcher.modes[1]);

        // trigger click on theme switcher element
        switcher.elem.trigger('click');
        // current is light.css after click
        assert.strictEqual(switcher.current, switcher.modes[0]);
        // link href is light.css in head
        assert.strictEqual(switcher.link.attr('href'), switcher.modes[0]);
    });
});
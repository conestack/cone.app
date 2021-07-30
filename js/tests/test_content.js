import {Content} from '../src/content.js';

QUnit.module('Content', hooks => {
    let test_content;

    hooks.before(() => {
    });

    hooks.afterEach(() => {
        // unset instance
        test_content = null;
        // remove dummy content element from DOM
        $('#page-content-wrapper').remove();
    });

    QUnit.test('content', assert => {
        // append dummy content html to DOM
        let content_html = `
            <div id="page-content-wrapper">
              <div id="page-content">
              </div>
            </div>
        `;
        $('body').append(content_html);

        // dummy class
        test_content = Content.initialize();

        assert.notStrictEqual(test_content, null);
    });

    QUnit.test('content null', assert => {
        // dummy class
        test_content = Content.initialize();

        assert.strictEqual(test_content, null);
    });
});

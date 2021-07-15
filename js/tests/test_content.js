import {Content} from '../src/content.js';

QUnit.module('Content', hooks => {
    let test_content;

    hooks.before(() => {
        console.log('Set up Content tests');

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
    });

    hooks.after(() => {
        console.log('Tear down Content tests');

        // unset instance
        test_content = null;
        // remove dummy content element from DOM
        $('#page-content-wrapper').remove();
    });

    QUnit.test('content', assert => {
        assert.ok(true);
    });
});
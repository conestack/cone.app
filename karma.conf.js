process.env.CHROME_BIN = '/usr/bin/chromium';

let cone_app_static = '../src/cone/app/browser/static';
let bdajax_static = '../devsrc/bdajax/src/bdajax/resources';

// files to include in test run
let files = [
    `${cone_app_static}/jquery-3.5.1.js`,
    `${cone_app_static}/jquery-migrate-3.3.2.js`,
    `${cone_app_static}/popper/popper.js`,
    `${cone_app_static}/bootstrap/js/bootstrap.js`,
    `${cone_app_static}/typeahead/typeahead.bundle.js`,
    `${cone_app_static}/cookie_functions.js`,
    `${bdajax_static}/overlay.js`,
    `${bdajax_static}/bdajax.js`,
    `${bdajax_static}/bdajax_bs3.js`,
    `${cone_app_static}/scrollbar.js`,
    `${cone_app_static}/public.js`,
    `${cone_app_static}/tests/test_public.js`,
];

// files to include for test coverage
let preprocessors = {};
preprocessors[`${cone_app_static}/public.js`] = 'coverage';

module.exports = function(config) {
    config.set({
        basePath: 'karma',
        frameworks: ['qunit'],
        files: files,
        browsers: ['ChromeHeadless'],
        singlerun: true,
        reporters: ['progress', 'coverage'],
        preprocessors: preprocessors
    });
};

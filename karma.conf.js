// chromium binary
process.env.CHROME_BIN = '/usr/bin/chromium';

// relative resource paths
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
preprocessors[`${cone_app_static}/scrollbar.js`] = 'coverage';
preprocessors[`${cone_app_static}/public.js`] = 'coverage';

// viewport configuration
let viewport_breakpoints = [{
    name: "mobile",
    size: {
        width: 559,
        height: 600
    }
}, {
    name: "small",
    size: {
        width: 561,
        height: 1024
    }
}, {
    name: "medium",
    size: {
        width: 1000,
        height: 900
    }
}, {
    name: "large",
    size: {
        width: 1600,
        height: 1024
    }
}];

module.exports = function(config) {
    config.set({
        basePath: 'karma',
        frameworks: ['qunit', 'viewport'],
        // Viewport configuration
        viewport: {
            breakpoints: viewport_breakpoints
        },
        files: files,
        browsers: ['ChromeHeadless'],
        singlerun: true,
        reporters: ['progress', 'coverage'],
        preprocessors: preprocessors
    });
};

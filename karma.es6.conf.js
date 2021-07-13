// chromium binary
process.env.CHROME_BIN = '/usr/bin/chromium';

// karma config
module.exports = function(config) {
    config.set({
        basePath: 'karma',
        frameworks: [
            'qunit',
            'viewport'
        ],
        files: [{
            pattern: '../node_modules/jquery/src/**/*.js',
            type: 'module',
            included: false
        }, {
            pattern: '../js/src/searchbar.js',
            type: 'module',
            included: false
        }, 
        {
            pattern: '../js/src/viewport.js',
            type: 'module',
            included: false
        },
        {
            pattern: '../js/src/viewport_states.js',
            type: 'module',
            included: false
        },
        {
            pattern: '../js/tests/test_searchbar.js',
            type: 'module'
        }],
        browsers: [
            'ChromeHeadless'
        ],
        viewport: {
            breakpoints: [
            {
                name: "mobile",
                size: {
                width: 400,
                height: 480
                }
            },
            {
                name: "small",
                size: {
                width: 768,
                height: 1024
                }
            },
            {
                name: "medium",
                size: {
                width: 1000,
                height: 900
                }
            },
            {
                name: "large",
                size: {
                width: 1440,
                height: 900
                }
            }
            ]
        },
        singlerun: true,
        reporters: [
            'progress',
            'coverage'
        ],
        preprocessors: {
            '../js/src/*.js': [
                'coverage',
                'module-resolver'
            ]
        },
        moduleResolverPreprocessor: {
            addExtension: 'js',
            customResolver: null,
            ecmaVersion: 6,
            aliases: {
                jquery: '../node_modules/jquery/src/jquery.js'
            }
        }
    });
};
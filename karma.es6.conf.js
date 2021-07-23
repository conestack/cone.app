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
        files: [
        // css
        {   
            pattern: '../src/cone/app/browser/static/light.css', included: true
        },
        {   
            pattern: '../src/cone/app/browser/static/dark.css', included: true
        },
        {   
            pattern: '../src/cone/app/browser/static/style.css', included: true
        },
        // js    
        {
            pattern: '../node_modules/jquery/src/**/*.js',
            type: 'module',
            included: false
        }, {
            pattern: '../js/src/*.js',
            type: 'module',
            included: false
        },
        // tests
        {
            pattern: '../js/tests/test_mobile_nav.js',
            type: 'module'
        },
        // helpers
        {
            pattern: '../js/tests/helpers.js',
            type: 'module',
            included: false
        }, 
        {
            pattern: '../js/tests/karma_viewport_states.js',
            type: 'module',
            included: false
        }, 
        {
            pattern: '../js/tests/cone.test.js',
            type: 'module',
            included: false
        }, 
       ],
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
            ],
            '../js/tests/*.js': [
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
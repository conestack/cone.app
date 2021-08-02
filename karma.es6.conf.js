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
        // bootstrap
        {   
            pattern: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css', 
            included: true
        },
        {   
            pattern: '../src/cone/app/browser/static/bootstrap/js/bootstrap.bundle.min.js', 
            included: true
        },
        {   
            pattern: 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css', 
            included: true
        },
        // css
        {   
            pattern: '../src/cone/app/browser/static/light.css', included: true
        },
        {   
            pattern: '../src/cone/app/browser/static/style.css', included: true
        },
        // js    
        {
            pattern: '../node_modules/jquery/src/**/*.js',
            type: 'module',
            included: true
        }, {
            pattern: '../js/src/public/*.js',
            type: 'module',
            included: false
        },
        // tests
        {
            pattern: '../js/tests/test_*.js',
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
        }
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
            '../js/src/public/*.js': [
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
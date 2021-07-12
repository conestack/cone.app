// chromium binary
process.env.CHROME_BIN = '/usr/bin/chromium';

// karma config
module.exports = function(config) {
    config.set({
        basePath: 'karma',
        frameworks: [
            'qunit'
        ],
        files: [{
            pattern: '../node_modules/jquery/src/**/*.js',
            type: 'module',
            included: false
        }, {
            pattern: '../js/src/*.js',
            type: 'module',
            included: false
        }, {
            pattern: '../js/tests/test_*.js',
            type: 'module'
        }],
        browsers: [
            'ChromeHeadless'
        ],
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
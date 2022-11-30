process.env.CHROME_BIN = '/usr/bin/chromium';

const node_modules = '../../node_modules';

const jquery_files = [{
    pattern: `${node_modules}/jquery/src/**/*.js`,
    type: 'module',
    included: true
}];

const treibstoff_files = [{
    pattern: `${node_modules}/treibstoff/src/**/*.js`,
    type: 'module',
    included: true
}];

const test_files = [{
    pattern: '../src/*.js',
    type: 'module',
    included: false
}, {
    pattern: '../tests/test_*.js',
    type: 'module'
}];

const files = [].concat(
    jquery_files,
    treibstoff_files,
    test_files
)

let preprocessors = {};
preprocessors[`${node_modules}/treibstoff/src/**/*.js`] = ['module-resolver'];
preprocessors['../src/*.js'] = ['coverage', 'module-resolver'];
preprocessors['../tests/*.js'] = ['coverage', 'module-resolver'];

// karma config
module.exports = function(config) {
    config.set({
        basePath: 'karma',
        singleRun: true,
        frameworks: [
            'qunit'
        ],
        files: files,
        browsers: [
            'ChromeHeadless'
        ],
        singlerun: true,
        reporters: [
            'progress',
            'coverage'
        ],
        preprocessors: preprocessors,
        moduleResolverPreprocessor: {
            addExtension: 'js',
            customResolver: null,
            ecmaVersion: 6,
            aliases: {
                jquery: `${node_modules}/jquery/src/jquery.js`,
                treibstoff: `${node_modules}/treibstoff/src/treibstoff.js`
            }
        }
    });
};

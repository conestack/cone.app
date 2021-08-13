process.env.CHROME_BIN = '/usr/bin/chromium';

const node_modules = '../node_modules';
const cone_static = '../src/cone/app/browser/static';

const jquery_files = [{
    pattern: `${node_modules}/jquery/src/**/*.js`,
    type: 'module',
    included: true
}];

const bootstrap_files = [{
    pattern: `${cone_static}/bootstrap/css/bootstrap.min.css`,
    included: true
}, {
    pattern: `${cone_static}/bootstrap-icons/fonts/*`,
    included: false,
    served: true
}, {
    pattern: `${cone_static}/bootstrap-icons/bootstrap-icons.css`,
    included: true
}, {
    pattern: `${cone_static}/bootstrap/js/bootstrap.bundle.min.js`,
    included: true
}];

const treibstoff_files = [{
    pattern: `${node_modules}/treibstoff/src/**/*.js`,
    type: 'module',
    included: true
}];

const cone_files = [{
    pattern: `${cone_static}/images/*`,
    included: false,
    served: true
}, {
    pattern: `${cone_static}/style.css`,
    included: true
}, {
    pattern: `${cone_static}/light.css`,
    included: true
}, {
    pattern: `${cone_static}/dark.css`,
    included: true
}];

const test_files = [{
    pattern: '../js/src/*.js',
    type: 'module',
    included: false
}, {
    pattern: '../js/tests/test_*.js',
    type: 'module'
}, {
    pattern: '../js/tests/helpers.js',
    type: 'module',
    included: false
}];

const files = [].concat(
    jquery_files,
    bootstrap_files,
    treibstoff_files,
    cone_files,
    test_files
)

const viewport = {
    breakpoints: [{
        name: "mobile",
        size: {
            width: 400,
            height: 480
        }
    }, {
        name: "small",
        size: {
            width: 768,
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
            width: 1440,
            height: 900
        }
    }]
};

let preprocessors = {};
preprocessors[`${node_modules}/treibstoff/src/**/*.js`] = ['module-resolver'];
preprocessors['../js/src/*.js'] = ['coverage', 'module-resolver'];
preprocessors['../js/tests/*.js'] = ['coverage', 'module-resolver'];


// karma config
module.exports = function(config) {
    config.set({
        basePath: 'karma',
        frameworks: [
            'qunit',
            'viewport'
        ],
        files: files,
        browsers: [
            'ChromeHeadless'
        ],
        viewport: viewport,
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

import {importMapsPlugin} from '@web/dev-server-import-maps';
import {defaultReporter, summaryReporter} from '@web/test-runner'

export default {
    nodeResolve: true,
    testFramework: {
        path: './node_modules/web-test-runner-qunit/dist/autorun.js',
        config: {
            noglobals: false
        }
    },
    files: [
        'js/tests/**/test_*.js'
    ],
    reporters: [defaultReporter(), summaryReporter({flatten: true})],
    coverageConfig: {
        include: ['**/js/src/**/*.js'],
        exclude: ['**/node_modules/**', '**/sources/treibstoff/**']
    },
    plugins: [
        importMapsPlugin({
            inject: {
                importMap: {
                    imports: {
                        'treibstoff': './sources/treibstoff/src/treibstoff.js',
                        'jquery': './node_modules/jquery/dist-module/jquery.module.js',
                        'bootstrap': './node_modules/bootstrap/dist/js/bootstrap.bundle.js',
                    },
                },
            },
        }),
    ],
}

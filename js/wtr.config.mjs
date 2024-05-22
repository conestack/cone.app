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
    plugins: [
        importMapsPlugin({
            inject: {
                importMap: {
                    imports: {
                        'jquery': './node_modules/jquery/src/jquery.js',
                        'treibstoff': './sources/treibstoff/src/treibstoff.js',
                    },
                },
            },
        }),
    ],
}

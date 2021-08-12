import cleanup from 'rollup-plugin-cleanup';
import {terser} from 'rollup-plugin-terser';

const outro = `
if (window.cone === undefined) {
    window.cone = {};
}
Object.assign(window.cone, exports);
`;

export default args => {
    let conf = {
        input: 'js/src/bundles/protected.js',
        plugins: [
            cleanup()
        ],
        output: [{
            file: 'src/cone/app/browser/static/cone.protected.js',
            format: 'iife',
            outro: outro,
            globals: {
                jquery: 'jQuery',
                treibstoff: 'treibstoff'
            },
            interop: 'default'
        }],
        external: [
            'jquery',
            'treibstoff'
        ]
    };
    if (args.configDebug !== true) {
        conf.output.push({
            file: 'src/cone/app/browser/static/cone.protected.min.js',
            format: 'iife',
            plugins: [
                terser()
            ],
            outro: outro,
            globals: {
                jquery: 'jQuery',
                treibstoff: 'treibstoff'
            },
            interop: 'default'
        });
    }
    return conf;
};

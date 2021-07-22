import {terser} from 'rollup-plugin-terser';

const outro = `var old_ts = window.ts;
exports.noConflict = function() {
    window.ts = old_ts;
    return this;
}
window.ts = exports;`;

export default {
    input: 'js/src/cone.js',
    output: [{
        file: 'cone-bundle/cone.bundle.js',
        format: 'iife',
        name: 'ts',
        outro: outro,
        globals: {
            jquery: 'jQuery'
        },
        interop: 'default'
    }, {
        file: 'cone-bundle/cone.bundle.min.js',
        format: 'iife',
        name: 'cone',
        plugins: [
            terser()
        ],
        outro: outro,
        globals: {
            jquery: 'jQuery'
        },
        interop: 'default'
    }],
    external: [
        'jquery'
    ],
};

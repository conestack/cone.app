import {terser} from 'rollup-plugin-terser';

const outro = `var old_cone = window.cone;
exports.noConflict = function() {
    window.cone = old_cone;
    return this;
}
window.cone = exports;`;

export default {
    input: 'js/src/public/bundle.js',
    output: [{
        file: 'src/cone/app/browser/static/cone.public.bundle.js',
        format: 'iife',
        name: 'cone',
        outro: outro,
        globals: {
            jquery: 'jQuery'
        },
        interop: 'default'
    }, {
        file: 'src/cone/app/browser/static/cone.public.bundle.min.js',
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

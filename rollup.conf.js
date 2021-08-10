import {terser} from 'rollup-plugin-terser';

const outro = `
window.cone = exports;
`;

export default {
    input: 'js/src/protected/bundle.js',
    output: [{
        file: 'src/cone/app/browser/static/cone.protected.bundle.js',
        format: 'iife',
        name: 'cone',
        outro: outro,
        globals: {
            jquery: 'jQuery',
            treibstoff: 'treibstoff'
        },
        interop: 'default'
    }, {
        file: 'src/cone/app/browser/static/cone.protected.bundle.min.js',
        format: 'iife',
        name: 'cone',
        plugins: [
            terser()
        ],
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
    ],
};

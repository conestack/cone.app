import {terser} from 'rollup-plugin-terser';

const intro = `
if (window.cone === undefined) {
    window.cone = {};
}
`

const outro = `
Object.assign(window.cone, exports);
`;

export default {
    input: 'js/src/protected/bundle.js',
    output: [{
        file: 'src/cone/app/browser/static/cone.protected.bundle.js',
        format: 'iife',
        name: 'cone_protected',
        intro: intro,
        outro: outro,
        globals: {
            jquery: 'jQuery',
            treibstoff: 'treibstoff'
        },
        interop: 'default'
    }, {
        file: 'src/cone/app/browser/static/cone.protected.bundle.min.js',
        format: 'iife',
        name: 'cone_protected',
        plugins: [
            terser()
        ],
        intro: intro,
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

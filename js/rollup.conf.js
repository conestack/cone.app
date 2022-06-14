import cleanup from 'rollup-plugin-cleanup';
import {terser} from 'rollup-plugin-terser';

const out_dir = 'src/cone/app/browser/static/cone';

const default_outro = `
window.cone = window.cone || {};
Object.assign(window.cone, exports);
`

const protected_outro = default_outro + `
window.createCookie = createCookie;
window.readCookie = readCookie;
`;

const protected_globals = {
    jquery: 'jQuery',
    treibstoff: 'treibstoff'
};

const public_globals = {
    jquery: 'jQuery',
    treibstoff: 'treibstoff',
    Bloodhound: 'Bloodhound'
};

const create_bundle = function(name, globals, outro, debug) {
    let conf = {
        input: `js/src/bundles/${name}.js`,
        plugins: [cleanup()],
        output: [{
            name: `cone_${name}`,
            file: `${out_dir}/cone.app.${name}.js`,
            format: 'iife',
            outro: outro,
            globals: globals,
            interop: 'default'
        }],
        external: [
            'jquery',
            'treibstoff'
        ]
    };
    if (debug !== true) {
        conf.output.push({
            name: `cone_${name}`,
            file: `${out_dir}/cone.app.${name}.min.js`,
            format: 'iife',
            plugins: [terser()],
            outro: outro,
            globals: globals,
            interop: 'default'
        });
    }
    return conf;
}

export default args => {
    let debug = args.configDebug;
    return [
        create_bundle('public', public_globals, default_outro, debug),
        create_bundle('protected', protected_globals, protected_outro, debug)
    ];
};

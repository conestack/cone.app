import cleanup from 'rollup-plugin-cleanup';
import terser from '@rollup/plugin-terser';

const out_dir = 'src/cone/app/browser/static/cone';

const outro = `
window.createCookie = createCookie;
window.readCookie = readCookie;
`;

const globals = {
    jquery: 'jQuery',
    treibstoff: 'treibstoff'
};

export default args => {
    let conf = {
        input: `js/src/bundle.js`,
        plugins: [cleanup()],
        output: [{
            file: `${out_dir}/cone.app.js`,
            name: 'cone',
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
    if (args.configDebug !== true) {
        conf.output.push({
            file: `${out_dir}/cone.app.min.js`,
            name: 'cone',
            format: 'iife',
            plugins: [terser()],
            outro: outro,
            globals: globals,
            interop: 'default'
        });
    }
    return conf;
};

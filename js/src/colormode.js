import ts from 'treibstoff';

export class ColorMode {

    static get media_query() {
        return window.matchMedia('(prefers-color-scheme: dark)');
    }

    static get stored_theme() {
        return localStorage.getItem('cone-app-color-theme');
    }

    static set stored_theme(theme) {
        localStorage.setItem('cone-app-color-theme', theme);
    }

    static get preferred_theme() {
        if (this.stored_theme) {
            return this.stored_theme;
        }
        return this.media_query.matches ? 'dark' : 'light';
    }

    static watch(handle) {
        this.media_query.addEventListener('change', handle);
    }

    static set_theme(theme) {
        const elem = document.documentElement;
        if (theme === 'auto' && this.media_query.matches) {
            elem.setAttribute('data-bs-theme', 'dark');
        } else {
            elem.setAttribute('data-bs-theme', theme);
        }
    }

    constructor() {
        this.bind();
        ColorMode.set_theme(ColorMode.preferred_theme);
    }

    bind() {
        ColorMode.watch(() => {
            const stored_theme = this.stored_theme;
            if (stored_theme !== 'light' || stored_theme !== 'dark') {
                ColorMode.set_theme(ColorMode.preferred_theme);
            }
        });
    }
}

export class ColorToggler extends ts.ChangeListener {

    static initialize(context) {
        const elem = ts.query_elem('#colortoggle-switch', context);
        if (!elem) {
            return;
        }
        new ColorToggler(elem);
    }

    constructor(elem) {
        super({elem: elem});
        this.update();
        ColorMode.watch(() => {
            this.update();
        });
    }

    update() {
        const preferred_theme = ColorMode.preferred_theme;
        const elem = this.elem;
        const checked = elem.is(':checked');
        if (preferred_theme === 'dark' && !checked) {
            elem.prop('checked', true);
        } else if (preferred_theme === 'light' && checked) {
            elem.prop('checked', false);
        }
    }

    on_change() {
        const theme = this.elem.is(':checked') ? 'dark' : 'light';
        ColorMode.set_theme(theme);
        ColorMode.stored_theme = theme;
    }
}

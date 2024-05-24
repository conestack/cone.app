import ts from 'treibstoff';

export class Colormode extends ts.ChangeListener {

    static set_theme(theme, elem) {
        if (theme === 'auto' && this.match_media.matches) {
            elem.get(0).setAttribute('data-bs-theme', 'dark');
        } else {
            elem.get(0).setAttribute('data-bs-theme', theme);
        }
    }

    static get match_media() {
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
        return this.match_media.matches ? 'dark' : 'light';
    }

    constructor() {
        super({elem: $(document.documentElement)});
        this.bind();
        this.constructor.set_theme(this.constructor.preferred_theme, this.elem);
    }

    bind() {
        const stored_theme = this.stored_theme;
        this.constructor.match_media.addEventListener('change', () => {
            if (stored_theme !== 'light' || stored_theme !== 'dark') {
                this.constructor.set_theme(this.constructor.preferred_theme, this.elem);
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
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            this.update();
        });
    }

    update() {
        const preferred_theme = Colormode.preferred_theme;
        if (preferred_theme === 'dark' && !this.elem.is(':checked')) {
            this.elem.get(0).checked = true;
        } else if (preferred_theme == 'light' && this.elem.is(':checked')) {
            this.elem.get(0).checked = false;
        }
    }

    on_change() {
        const document_elem = $(document.documentElement);
        const theme = this.elem.is(':checked') ? 'dark' : 'light';
        Colormode.set_theme(theme, document_elem);
        Colormode.stored_theme = theme;
    }
}
import ts from 'treibstoff';

export class Colormode extends ts.ChangeListener {

    static initialize(context) {
        const elem = ts.query_elem('#colortoggle-switch', context);
        if (!elem) {
            return;
        }
        new Colormode(elem);
    }

    constructor(elem) {
        super({elem: elem});
        this.bind();
        this.set_theme(this.preferred_theme);
    }

    get match_media() {
        return window.matchMedia('(prefers-color-scheme: dark)');
    }

    get stored_theme() {
        return localStorage.getItem('cone-app-color-theme');
    }

    set stored_theme(theme) {
        localStorage.setItem('cone-app-color-theme', theme);
    }

    get preferred_theme() {
        if (this.stored_theme) {
            return this.stored_theme;
        }
        return this.match_media.matches ? 'dark' : 'light';
    }

    bind() {
        const stored_theme = this.stored_theme;
        this.match_media.addEventListener('change', () => {
            if (stored_theme !== 'light' || stored_theme !== 'dark') {
                this.set_theme(this.preferred_theme);
            }
        });
    }

    set_theme(theme) {
        const document_elem = document.documentElement;
        if (theme === 'auto' && this.match_media.matches) {
            document_elem.setAttribute('data-bs-theme', 'dark');
            this.elem.trigger('click');
        } else {
            document_elem.setAttribute('data-bs-theme', theme);
        }
        this.stored_theme = theme;
        if (theme === 'dark' && !this.elem.is(':checked')) {
            this.elem.trigger('click');
        }
    }

    on_change() {
        const theme = this.elem.is(':checked') ? 'dark' : 'light';
        this.set_theme(theme);
    }
}

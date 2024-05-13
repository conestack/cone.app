export class Colormode {

    static initialize(context) {
        new Colormode(context);
    }

    constructor(context) {
        this.elem = $('#colortoggle-switch', context);
        this.compile();

        this.set_theme(this.preferred_theme);

        this.elem.on('change', (c) => {
            if (this.elem.is(':checked')) {
                this.set_theme('dark')
            } else {
                this.set_theme('light')
            }
        })
    }

    get stored_theme() {
        return localStorage.getItem('bootstrap-theme') || null;
    }

    get preferred_theme() {
        if (this.stored_theme) {
            return this.stored_theme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    compile() {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (this.stored_theme !== 'light' || this.stored_theme !== 'dark') {
              this.set_theme(this.preferred_theme);
            }
        });
    }

    set_theme(theme) {
        if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.setAttribute('data-bs-theme', 'dark');
          this.elem.trigger('click');
        } else {
          document.documentElement.setAttribute('data-bs-theme', theme);
        }
        localStorage.setItem('bootstrap-theme', theme);

        if (theme === 'dark' && !this.elem.is(':checked')) {
            this.elem.trigger('click');
        }
    }
};
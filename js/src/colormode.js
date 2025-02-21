import ts from 'treibstoff';

/**
 * Class to manage color modes (light and dark themes).
 */
export class ColorMode {
    
    /**
     * The media query for the user's preferred color scheme.
     * @returns {MediaQueryList}
     */
    static get media_query() {
        return window.matchMedia('(prefers-color-scheme: dark)');
    }

    /**
     * The stored theme from local storage.
     * @returns {string | null}
     */
    static get stored_theme() {
        return localStorage.getItem('cone-app-color-theme');
    }

    /**
     * @param {string} theme The theme to store in local storage.
     */
    static set stored_theme(theme) {
        localStorage.setItem('cone-app-color-theme', theme);
    }

    /**
     * The user's preferred theme ('dark' or 'light').
     * @returns {string}
     */
    static get preferred_theme() {
        if (this.stored_theme) {
            return this.stored_theme;
        }
        return this.media_query.matches ? 'dark' : 'light';
    }

    /**
     * Adds an event listener to watch for changes in the media query.
     * @param {function} handle The callback function to handle changes.
     */
    static watch(handle) {
        this.media_query.addEventListener('change', handle);
    }

    /**
     * Sets the current theme on the document.
     * @param {string} theme The theme to set ('dark', 'light', or 'auto').
     */
    static set_theme(theme) {
        const elem = document.documentElement;
        if (theme === 'auto' && this.media_query.matches) {
            // Set to dark if 'auto' and dark mode is preferred
            elem.setAttribute('data-bs-theme', 'dark');
        } else {
            elem.setAttribute('data-bs-theme', theme);
        }
    }

    /**
     * Initializes the ColorMode instance and sets the preferred theme.
     */
    constructor() {
        this.bind();
        ColorMode.set_theme(ColorMode.preferred_theme);
    }

    /**
     * Binds the change event listener to update the theme.
     */
    bind() {
        ColorMode.watch(this.callback);
    }

    static callback() {
        const stored_theme = this.stored_theme;
        if (stored_theme !== 'light' && stored_theme !== 'dark') {
            ColorMode.set_theme(ColorMode.preferred_theme);
        }
    }

    static destroy() {
        this.media_query.removeEventListener('change', this.callback);
        document.documentElement.removeAttribute('data-bs-theme');
    }
}

/**
 * Class to toggle the color theme based on user input (visible as a Switch).
 */
export class ColorToggler extends ts.ChangeListener {

    /**
     * Initializes the ColorToggler and binds the toggle switch.
     * @param {Element} context
     */
    static initialize(context) {
        const elem = ts.query_elem('#colortoggle-switch', context);
        if (!elem) {
            return;
        }
        new ColorToggler(elem);
    }

    /**
     * @param {Element} elem The toggle switch element.
     */
    constructor(elem) {
        super({ elem: elem });
        this.update();
        ColorMode.watch(() => {
            this.update();
        });
        ts.ajax.attach(this, elem);
    }

    /**
     * Updates the toggle switch state based on the preferred theme.
     */
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

    /**
     * Handles changes when the toggle is switched.
     */
    on_change() {
        const theme = this.elem.is(':checked') ? 'dark' : 'light';
        ColorMode.set_theme(theme);
        ColorMode.stored_theme = theme;
    }

    destroy() {
        super.destroy();
    }
}
